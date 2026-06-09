import { describe, it, expect, vi, beforeEach } from "vitest";
import { SpotifyService, SpotifyHttpError, RawSpotifyPlayHistory } from "./spotify-service";
import { AuthService, CookieStore } from "./auth-service";

describe("SpotifyService", () => {
  const mockEnv = {
    SPOTIFY_CLIENT_ID: "client-id",
    SPOTIFY_CLIENT_SECRET: "client-secret",
    SPOTIFY_REDIRECT_URI: "http://localhost:3000/callback",
    SESSION_SECRET: "session-secret-must-be-long-enough-for-hmac",
  };

  let authService: AuthService;
  let spotifyService: SpotifyService;
  let mockCookieStore: CookieStore;
  let mockCookies: Record<string, string>;

  beforeEach(() => {
    authService = new AuthService(mockEnv);
    spotifyService = new SpotifyService(authService);
    vi.restoreAllMocks();

    mockCookies = {};
    mockCookieStore = {
      get: (name) => (mockCookies[name] ? { value: mockCookies[name] } : undefined),
      set: (name, value) => {
        mockCookies[name] = value;
      },
      delete: (name) => {
        delete mockCookies[name];
      },
    };

    // Set an active session
    authService.setSession(mockCookieStore, {
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: Date.now() + 3600 * 1000,
    });
  });

  describe("getRecentlyPlayedTracks", () => {
    it("should successfully fetch and deduplicate tracks", async () => {
      const mockRawItems: RawSpotifyPlayHistory[] = [
        {
          track: {
            id: "track-1",
            name: "Song One",
            uri: "spotify:track:track-1",
            artists: [{ name: "Artist A" }],
          },
          played_at: "2026-06-09T08:00:00Z",
        },
        {
          track: {
            id: "track-1", // duplicate
            name: "Song One",
            uri: "spotify:track:track-1",
            artists: [{ name: "Artist A" }],
          },
          played_at: "2026-06-09T07:50:00Z",
        },
        {
          track: {
            id: "track-2",
            name: "Song Two",
            uri: "spotify:track:track-2",
            artists: [{ name: "Artist B" }],
          },
          played_at: "2026-06-09T07:45:00Z",
        },
      ];

      const mockResponse = {
        ok: true,
        json: async () => ({ items: mockRawItems }),
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as unknown as Response);

      const tracks = await spotifyService.getRecentlyPlayedTracks(mockCookieStore);

      expect(tracks).toHaveLength(2);
      expect(tracks[0].id).toBe("track-1");
      expect(tracks[1].id).toBe("track-2");
      expect(tracks[0].artistName).toBe("Artist A");
    });

    it("should return empty list when no tracks have been played", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ items: [] }),
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as unknown as Response);

      const tracks = await spotifyService.getRecentlyPlayedTracks(mockCookieStore);
      expect(tracks).toHaveLength(0);
    });

    it("should retry with refreshed token once when Spotify returns 401", async () => {
      // 1st request returns 401
      const response401 = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      };

      // 2nd request (retry) returns success
      const mockRawItems: RawSpotifyPlayHistory[] = [
        {
          track: {
            id: "track-retry",
            name: "Retry Track",
            uri: "spotify:track:track-retry",
            artists: [{ name: "Artist Retry" }],
          },
          played_at: "2026-06-09T08:00:00Z",
        },
      ];
      const responseSuccess = {
        ok: true,
        json: async () => ({ items: mockRawItems }),
      };

      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(response401 as unknown as Response)
        .mockResolvedValueOnce(responseSuccess as unknown as Response);

      // Spy on refreshSession
      const refreshSpy = vi.spyOn(authService, "refreshSession").mockResolvedValue({
        accessToken: "new-access",
        refreshToken: "old-refresh",
        expiresAt: Date.now() + 3600 * 1000,
      });

      const tracks = await spotifyService.getRecentlyPlayedTracks(mockCookieStore);

      expect(refreshSpy).toHaveBeenCalledWith("old-refresh");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(tracks).toHaveLength(1);
      expect(tracks[0].id).toBe("track-retry");
      
      // Verify cookie was updated with new token
      const session = authService.getSession(mockCookieStore);
      expect(session?.accessToken).toBe("new-access");
    });

    it("should clear session and throw error if refresh fails after 401", async () => {
      const response401 = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(response401 as unknown as Response);
      vi.spyOn(authService, "refreshSession").mockRejectedValue(new Error("Refresh failed"));

      await expect(
        spotifyService.getRecentlyPlayedTracks(mockCookieStore)
      ).rejects.toThrow("Refresh failed");

      // Session should be cleared
      expect(authService.getSession(mockCookieStore)).toBeNull();
    });

    it("should throw SpotifyHttpError on timeout abort signal", async () => {
      const abortError = new Error("The user aborted a request.");
      abortError.name = "AbortError";

      vi.spyOn(globalThis, "fetch").mockRejectedValue(abortError);

      await expect(
        spotifyService.getRecentlyPlayedTracks(mockCookieStore)
      ).rejects.toThrow(SpotifyHttpError);

      try {
        await spotifyService.getRecentlyPlayedTracks(mockCookieStore);
      } catch (err) {
        expect(err).toBeInstanceOf(SpotifyHttpError);
        expect((err as SpotifyHttpError).status).toBe(408);
      }
    });

    it("should propagate error immediately if not 401", async () => {
      const response403 = {
        ok: false,
        status: 403,
        statusText: "Forbidden",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(response403 as unknown as Response);
      const refreshSpy = vi.spyOn(authService, "refreshSession");

      await expect(
        spotifyService.getRecentlyPlayedTracks(mockCookieStore)
      ).rejects.toThrow(SpotifyHttpError);

      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });
});
