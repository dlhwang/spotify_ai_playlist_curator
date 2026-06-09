import { AuthService, CookieStore } from "./auth-service";
import { Track } from "@/domain/track";
import { SearchCurationResult, MappedTrack, RawSpotifySearchResponse } from "@/domain/search";


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

  private async searchSingleTrackWithTimeout(
    accessToken: string,
    title: string,
    artistName: string
  ): Promise<MappedTrack | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    try {
      const query = `track:"${title}" artist:"${artistName}"`;
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
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
}

