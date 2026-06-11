import { AuthService, CookieStore } from "./auth-service";
import { Track } from "@/domain/track";
import { SearchCurationResult, MappedTrack, RawSpotifySearchResponse } from "@/domain/search";
import { ArtistDepthTarget, SearchQueryRound } from "@/domain/curation";


export interface SpotifyUserProfile {
  id: string;
  displayName: string;
  email: string;
  imageUrl?: string;
  product: string;
}


export class SpotifyHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "SpotifyHttpError";
  }
}

export interface RawSpotifyArtist {
  name: string;
}

export interface RawSpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists?: RawSpotifyArtist[];
}

export interface RawSpotifyPlayHistory {
  track: RawSpotifyTrack;
  played_at: string;
}

export class SpotifyService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Retrieves recently played tracks, filters out duplicates, and returns domain model Tracks.
   * Features: 5-second timeout, 1 automatic token refresh retry on 401, empty list support.
   */
  async getRecentlyPlayedTracks(
    cookieStore: CookieStore,
    limit: number = 20
  ): Promise<Track[]> {
    const session = this.authService.getSession(cookieStore);
    if (!session) {
      throw new Error("No active Spotify session found");
    }

    try {
      const rawTracks = await this.fetchRecentlyPlayedWithTimeout(
        session.accessToken,
        limit
      );
      return this.toDomainTracks(rawTracks);
    } catch (error) {
      const isHttpError = error instanceof SpotifyHttpError;
      
      // Handle automatic retry on 401 Unauthorized
      if (isHttpError && error.status === 401 && session.refreshToken) {
        try {
          const updatedSession = await this.authService.refreshSession(
            session.refreshToken
          );
          
          // Set updated session to cookie store
          this.authService.setSession(cookieStore, updatedSession);

          // Retry the request once with new token
          const rawTracks = await this.fetchRecentlyPlayedWithTimeout(
            updatedSession.accessToken,
            limit
          );
          return this.toDomainTracks(rawTracks);
        } catch (refreshError) {
          // Clear session on refresh failure to prevent infinite redirection
          this.authService.clearSession(cookieStore);
          throw refreshError;
        }
      }

      throw error;
    }
  }

  private async fetchRecentlyPlayedWithTimeout(
    accessToken: string,
    limit: number
  ): Promise<RawSpotifyPlayHistory[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new SpotifyHttpError(
          `Spotify API error: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return (data.items as RawSpotifyPlayHistory[]) || [];
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new SpotifyHttpError(
          "Spotify API request timed out (5s limit)",
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Maps raw items to domain models, performing deduplication keeping the most recent.
   */
  private toDomainTracks(items: RawSpotifyPlayHistory[]): Track[] {
    const seen = new Set<string>();
    const tracks: Track[] = [];

    for (const item of items) {
      const rawTrack = item.track;
      if (!rawTrack || !rawTrack.id) {
        continue;
      }

      if (!seen.has(rawTrack.id)) {
        seen.add(rawTrack.id);

        // Option C: Minimum payload extraction
        tracks.push({
          id: rawTrack.id,
          uri: rawTrack.uri,
          title: rawTrack.name,
          artistName: rawTrack.artists?.[0]?.name || "Unknown Artist",
        });
      }
    }

    return tracks;
  }

  /**
   * AI Curation 추천 목록을 입력받아 Spotify Search API로 병렬 검색하여 MappedTrack 리스트로 매핑한다.
   * 자격 증명(Client ID/Secret)이 없거나 MOCK_SPOTIFY=true일 경우 가짜 트랙 매핑(Mock Search)을 수행한다.
   * 401 Unauthorized 에러 감지 시 1회 백엔드 내부 토큰 갱신 및 재시도를 처리한다.
   */
  async searchTracks(
    cookieStore: CookieStore,
    curation: { title: string; description: string; tracks: Array<{ title: string; artistName: string }> }
  ): Promise<SearchCurationResult> {
    const hasCredentials = !!process.env.SPOTIFY_CLIENT_ID && !!process.env.SPOTIFY_CLIENT_SECRET;
    const isMockMode = !hasCredentials || process.env.MOCK_SPOTIFY === "true";

    if (isMockMode) {
      const mappedTracks: MappedTrack[] = curation.tracks.map((track, index) => {
        // 간단한 모크 해시 생성
        const hash = Buffer.from(`${track.title}-${track.artistName}`).toString("hex").substring(0, 10);
        return {
          id: `mock-${hash}-${index}`,
          uri: `spotify:track:mock-${hash}-${index}`,
          title: track.title,
          artistName: track.artistName,
        };
      });
      return {
        title: curation.title,
        description: curation.description,
        tracks: mappedTracks,
      };
    }

    const session = this.authService.getSession(cookieStore);
    if (!session) {
      throw new Error("No active Spotify session found");
    }

    try {
      const tracks = await this.searchAllTracksParallel(session.accessToken, curation.tracks);
      return {
        title: curation.title,
        description: curation.description,
        tracks,
      };
    } catch (error) {
      const isHttpError = error instanceof SpotifyHttpError;

      // Handle automatic retry on 401 Unauthorized
      if (isHttpError && error.status === 401 && session.refreshToken) {
        try {
          const updatedSession = await this.authService.refreshSession(
            session.refreshToken
          );

          // Set updated session to cookie store
          this.authService.setSession(cookieStore, updatedSession);

          // Retry once with new token
          const tracks = await this.searchAllTracksParallel(updatedSession.accessToken, curation.tracks);
          return {
            title: curation.title,
            description: curation.description,
            tracks,
          };
        } catch (refreshError) {
          // Clear session on refresh failure
          this.authService.clearSession(cookieStore);
          throw refreshError;
        }
      }

      throw error;
    }
  }

  async searchTracksByQueryRounds(
    cookieStore: CookieStore,
    rounds: SearchQueryRound[]
  ): Promise<MappedTrack[]> {
    const hasCredentials = !!process.env.SPOTIFY_CLIENT_ID && !!process.env.SPOTIFY_CLIENT_SECRET;
    const isMockMode = !hasCredentials || process.env.MOCK_SPOTIFY === "true";

    if (isMockMode) {
      return this.createMockTracksFromRounds(rounds);
    }

    const session = this.authService.getSession(cookieStore);
    if (!session) {
      throw new Error("No active Spotify session found");
    }

    try {
      return await this.searchRoundsWithToken(session.accessToken, rounds);
    } catch (error) {
      const isHttpError = error instanceof SpotifyHttpError;
      if (isHttpError && error.status === 401 && session.refreshToken) {
        try {
          const updatedSession = await this.authService.refreshSession(session.refreshToken);
          this.authService.setSession(cookieStore, updatedSession);
          return await this.searchRoundsWithToken(updatedSession.accessToken, rounds);
        } catch (refreshError) {
          this.authService.clearSession(cookieStore);
          throw refreshError;
        }
      }
      throw error;
    }
  }

  async expandArtistDepthCandidates(
    cookieStore: CookieStore,
    targets: ArtistDepthTarget[]
  ): Promise<MappedTrack[]> {
    const rounds: SearchQueryRound[] = targets.map((target) => ({
      round: "artistDepth",
      queries: target.queries.length > 0 ? target.queries : [`artist:"${target.artistName}"`],
      limitPerQuery: Math.min(Math.max(target.requestedMinimum, 1), 10),
      offsets: [0],
    }));

    return this.searchTracksByQueryRounds(cookieStore, rounds);
  }

  private async searchAllTracksParallel(
    accessToken: string,
    tracksToSearch: Array<{ title: string; artistName: string }>
  ): Promise<MappedTrack[]> {
    const searchPromises = tracksToSearch.map((track) =>
      this.searchSingleTrackWithTimeout(accessToken, track.title, track.artistName)
        .catch((err) => {
          console.warn(`Failed to search track "${track.title}" by "${track.artistName}":`, err);

          // 401 에러라면 스킵하지 않고 에러를 전파하여 상위에서 토큰 리프레시가 작동하게 함
          if (err instanceof SpotifyHttpError && err.status === 401) {
            throw err;
          }
          return null; // 일반 검색 에러는 스킵 처리
        })
    );

    const results = await Promise.all(searchPromises);
    const mappedTracks = results.filter((t): t is MappedTrack => t !== null);

    if (mappedTracks.length === 0) {
      throw new Error("Curation Mapping Failure: No tracks could be mapped to Spotify URIs");
    }

    return mappedTracks;
  }

  private async searchRoundsWithToken(
    accessToken: string,
    rounds: SearchQueryRound[]
  ): Promise<MappedTrack[]> {
    const searchTasks: Array<Promise<MappedTrack[]>> = [];

    for (const round of rounds) {
      const limit = Math.min(Math.max(round.limitPerQuery || 10, 1), 10);
      const offsets = Array.isArray(round.offsets) && round.offsets.length > 0 ? round.offsets : [0];

      for (const query of round.queries) {
        for (const offset of offsets.slice(0, 3)) {
          searchTasks.push(
            this.executeSearchFetchMany(accessToken, query, limit, offset)
              .catch((err) => {
                console.warn(`Failed to search RAG query "${query}" at offset ${offset}:`, err);
                if (err instanceof SpotifyHttpError && err.status === 401) {
                  throw err;
                }
                return [];
              })
          );
        }
      }
    }

    const nestedResults = await Promise.all(searchTasks);
    return this.deduplicateMappedTracks(nestedResults.flat());
  }

  private async executeSearchFetchMany(
    accessToken: string,
    query: string,
    limit: number,
    offset: number
  ): Promise<MappedTrack[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const safeLimit = Math.min(Math.max(limit, 1), 10);
      const safeOffset = Math.min(Math.max(offset, 0), 1000);
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${safeLimit}&offset=${safeOffset}`;
      console.log(`[Spotify API Request] GET /v1/search?q=${query}&limit=${safeLimit}&offset=${safeOffset}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new SpotifyHttpError(
          `Spotify API error: ${response.statusText}`,
          response.status
        );
      }

      const data: RawSpotifySearchResponse = await response.json();
      return (data.tracks?.items || []).map((item) => ({
        id: item.id,
        uri: item.uri,
        title: item.name,
        artistName: item.artists?.[0]?.name || "Unknown Artist",
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new SpotifyHttpError(
          "Spotify Search API request timed out (5s limit)",
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private deduplicateMappedTracks(tracks: MappedTrack[]): MappedTrack[] {
    const seen = new Set<string>();
    const deduplicated: MappedTrack[] = [];

    for (const track of tracks) {
      const key = track.id || track.uri;
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      deduplicated.push(track);
    }

    return deduplicated;
  }

  private createMockTracksFromRounds(rounds: SearchQueryRound[]): MappedTrack[] {
    const tracks: MappedTrack[] = [];

    for (const round of rounds) {
      for (const query of round.queries) {
        const cleanQuery = query.replace(/artist:|track:|genre:|"/g, "").trim() || "Mock Query";
        const artistName = this.toTitleCase(cleanQuery.split(/\s+/).slice(0, 2).join(" ")) || "Mock Artist";
        const count = Math.min(Math.max(round.limitPerQuery || 3, 3), 5);

        for (let index = 0; index < count; index += 1) {
          const hash = `${index}-${Buffer.from(`${round.round}-${query}`).toString("hex").substring(0, 10)}`;
          tracks.push({
            id: `mock-rag-${hash}`,
            uri: `spotify:track:mock-rag-${hash}`,
            title: `${this.toTitleCase(cleanQuery)} ${index + 1}`,
            artistName,
          });
        }
      }
    }

    return this.deduplicateMappedTracks(tracks);
  }

  private toTitleCase(value: string): string {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private async searchSingleTrackWithTimeout(
    accessToken: string,
    title: string,
    artistName: string
  ): Promise<MappedTrack | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    try {
      // 1. 쿼리 정제 (따옴표 제거)
      const cleanTitle = title.replace(/"/g, "").trim();
      const cleanArtist = artistName.replace(/"/g, "").trim();

      // 2. 1차 시도: 엄격한 필터 쿼리 (track:"..." artist:"...")
      const strictQuery = `track:"${cleanTitle}" artist:"${cleanArtist}"`;
      let track = await this.executeSearchFetch(accessToken, strictQuery, controller.signal);

      // 3. 2차 시도: 1차 실패 시, 괄호 내용 정제 후 재시도
      // 예: "RODEO (Radio Edit)" -> "RODEO"
      if (!track) {
        const regexBrackets = /\s*[\(\[][^\)\]]*[\)\]]\s*/g;
        const strippedTitle = cleanTitle.replace(regexBrackets, "").trim();
        const strippedArtist = cleanArtist.replace(regexBrackets, "").trim();

        if (strippedTitle !== cleanTitle || strippedArtist !== cleanArtist) {
          const strippedQuery = `track:"${strippedTitle}" artist:"${strippedArtist}"`;
          track = await this.executeSearchFetch(accessToken, strippedQuery, controller.signal);
        }
      }

      // 4. 3차 시도: 여전히 실패 시, 필터 없는 느슨한 키워드 검색
      if (!track) {
        const looseQuery = `${cleanTitle} ${cleanArtist}`;
        track = await this.executeSearchFetch(accessToken, looseQuery, controller.signal);
      }

      return track;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new SpotifyHttpError(
          "Spotify Search API request timed out (5s limit)",
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeSearchFetch(
    accessToken: string,
    query: string,
    signal: AbortSignal
  ): Promise<MappedTrack | null> {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
    console.log(`[Spotify API Request] GET /v1/search?q=${query}`);

    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new SpotifyHttpError(
        `Spotify API error: ${response.statusText}`,
        response.status
      );
    }

    const data: RawSpotifySearchResponse = await response.json();
    const item = data.tracks?.items?.[0];

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      uri: item.uri,
      title: item.name,
      artistName: item.artists?.[0]?.name || "Unknown Artist",
    };
  }

  /**
   * Retrieves the current user's profile to get their user ID.
   */
  async getCurrentUserId(cookieStore: CookieStore): Promise<string> {
    const hasCredentials = !!process.env.SPOTIFY_CLIENT_ID && !!process.env.SPOTIFY_CLIENT_SECRET;
    const isMockMode = !hasCredentials || process.env.MOCK_SPOTIFY === "true";

    if (isMockMode) {
      return "mock-user-id";
    }

    const session = this.authService.getSession(cookieStore);
    if (!session) {
      throw new Error("No active Spotify session found");
    }

    const fetchProfile = async (token: string) => {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new SpotifyHttpError(`Spotify API error: ${response.statusText}`, response.status);
      }
      const data = await response.json();
      return data.id as string;
    };

    try {
      return await fetchProfile(session.accessToken);
    } catch (error) {
      const isHttpError = error instanceof SpotifyHttpError;
      if (isHttpError && error.status === 401 && session.refreshToken) {
        const updatedSession = await this.authService.refreshSession(session.refreshToken);
        this.authService.setSession(cookieStore, updatedSession);
        return await fetchProfile(updatedSession.accessToken);
      }
      throw error;
    }
  }

  /**
   * Retrieves the current user's full profile details.
   */
  async getCurrentUserProfile(cookieStore: CookieStore): Promise<SpotifyUserProfile> {
    const hasCredentials = !!process.env.SPOTIFY_CLIENT_ID && !!process.env.SPOTIFY_CLIENT_SECRET;
    const isMockMode = !hasCredentials || process.env.MOCK_SPOTIFY === "true";

    if (isMockMode) {
      return {
        id: "mock-user-id",
        displayName: "Mock User",
        email: "mock@example.com",
        imageUrl: undefined,
        product: "premium"
      };
    }

    const session = this.authService.getSession(cookieStore);
    if (!session) {
      throw new Error("No active Spotify session found");
    }

    const fetchProfile = async (token: string): Promise<SpotifyUserProfile> => {
      const url = "https://api.spotify.com/v1/me";
      const headers = {
        Authorization: `Bearer ${token}`
      };

      console.log(`[Spotify API Request] GET ${url}`);

      const response = await fetch(url, {
        headers
      });
      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch (_) {
          // ignore
        }
        console.error(`Failed to fetch user profile. Status: ${response.status}, Body: ${errorBody}`);
        throw new SpotifyHttpError(`Spotify API error: ${response.statusText}`, response.status);
      }
      const data = await response.json();
      return {
        id: data.id as string,
        displayName: data.display_name || (data.id as string),
        email: data.email || "",
        imageUrl: data.images?.[0]?.url as string | undefined,
        product: data.product || "free"
      };
    };

    try {
      return await fetchProfile(session.accessToken);
    } catch (error) {
      const isHttpError = error instanceof SpotifyHttpError;
      if (isHttpError && error.status === 401 && session.refreshToken) {
        const updatedSession = await this.authService.refreshSession(session.refreshToken);
        this.authService.setSession(cookieStore, updatedSession);
        return await fetchProfile(updatedSession.accessToken);
      }
      throw error;
    }
  }

  /**
   * Creates a new playlist for the user.
   */
  async createPlaylist(cookieStore: CookieStore, userId: string, name: string, description: string): Promise<string> {
    const hasCredentials = !!process.env.SPOTIFY_CLIENT_ID && !!process.env.SPOTIFY_CLIENT_SECRET;
    const isMockMode = !hasCredentials || process.env.MOCK_SPOTIFY === "true";

    if (isMockMode) {
      return "mock-playlist-id";
    }

    const session = this.authService.getSession(cookieStore);
    if (!session) {
      throw new Error("No active Spotify session found");
    }

    const fetchCreate = async (token: string) => {
      const url = "https://api.spotify.com/v1/me/playlists";
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      const requestBody = { name, description, public: false };

      console.log(`[Spotify API Request] POST ${url} (Name: "${name}")`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch (_) {
          // ignore
        }
        console.error(`Failed to create playlist. Status: ${response.status}, Body: ${errorBody}`);
        throw new SpotifyHttpError(`Spotify API error: ${response.statusText}`, response.status);
      }
      const data = await response.json();
      return data.id as string;
    };

    try {
      return await fetchCreate(session.accessToken);
    } catch (error) {
      const isHttpError = error instanceof SpotifyHttpError;
      if (isHttpError && error.status === 401 && session.refreshToken) {
        const updatedSession = await this.authService.refreshSession(session.refreshToken);
        this.authService.setSession(cookieStore, updatedSession);
        return await fetchCreate(updatedSession.accessToken);
      }
      throw error;
    }
  }

  /**
   * Adds tracks to a playlist.
   */
  async addTracksToPlaylist(cookieStore: CookieStore, playlistId: string, trackUris: string[]): Promise<void> {
    if (trackUris.length === 0) return;
    const hasCredentials = !!process.env.SPOTIFY_CLIENT_ID && !!process.env.SPOTIFY_CLIENT_SECRET;
    const isMockMode = !hasCredentials || process.env.MOCK_SPOTIFY === "true";

    if (isMockMode) {
      console.log(`[Mock] Added ${trackUris.length} tracks to playlist ${playlistId}`);
      return;
    }

    const session = this.authService.getSession(cookieStore);
    if (!session) {
      throw new Error("No active Spotify session found");
    }

    const fetchAdd = async (token: string) => {
      const url = `https://api.spotify.com/v1/playlists/${playlistId}/items`;
      const headers = {

        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      const requestBody = { uris: trackUris };

      console.log(`[Spotify API Request] POST ${url} (Added ${trackUris.length} tracks)`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch (_) {
          // ignore
        }
        console.error(`Failed to add tracks to playlist. Status: ${response.status}, Body: ${errorBody}`);
        throw new SpotifyHttpError(`Spotify API error: ${response.statusText}`, response.status);
      }
    };

    try {
      await fetchAdd(session.accessToken);
    } catch (error) {
      const isHttpError = error instanceof SpotifyHttpError;
      if (isHttpError && error.status === 401 && session.refreshToken) {
        const updatedSession = await this.authService.refreshSession(session.refreshToken);
        this.authService.setSession(cookieStore, updatedSession);
        await fetchAdd(updatedSession.accessToken);
      }
      throw error;
    }
  }
}

