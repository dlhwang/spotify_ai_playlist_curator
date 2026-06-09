import { AuthService, CookieStore } from "./auth-service";
import { Track } from "@/domain/track";

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
}
