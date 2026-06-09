import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService, CookieStore } from "./auth-service";
import { SessionPayload } from "@/lib/crypto/session-signature";

describe("AuthService", () => {
  const mockEnv = {
    SPOTIFY_CLIENT_ID: "client-id",
    SPOTIFY_CLIENT_SECRET: "client-secret",
    SPOTIFY_REDIRECT_URI: "http://localhost:3000/callback",
    SESSION_SECRET: "session-secret-must-be-long-enough-for-hmac",
  };

  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockEnv);
    vi.restoreAllMocks();
  });

  describe("getAuthorizationUrl", () => {
    it("should generate authorize URL containing client_id, state and redirect_uri", () => {
      const state = "random-state";
      const urlString = service.getAuthorizationUrl(state);
      const url = new URL(urlString);

      expect(url.origin).toBe("https://accounts.spotify.com");
      expect(url.pathname).toBe("/authorize");
      expect(url.searchParams.get("client_id")).toBe(mockEnv.SPOTIFY_CLIENT_ID);
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("redirect_uri")).toBe(mockEnv.SPOTIFY_REDIRECT_URI);
      expect(url.searchParams.get("state")).toBe(state);
      expect(url.searchParams.get("scope")).toContain("playlist-modify-public");
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("should fetch token and return SessionPayload", async () => {
      const mockFetchResponse = {
        ok: true,
        json: async () => ({
          access_token: "access-123",
          refresh_token: "refresh-123",
          expires_in: 3600,
        }),
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockFetchResponse as unknown as Response);

      const payload = await service.exchangeCodeForTokens("code-123");

      expect(fetchSpy).toHaveBeenCalledWith("https://accounts.spotify.com/api/token", expect.any(Object));
      expect(payload.accessToken).toBe("access-123");
      expect(payload.refreshToken).toBe("refresh-123");
      expect(payload.expiresAt).toBeGreaterThan(Date.now());
    });

    it("should throw error if fetch failed", async () => {
      const mockFetchResponse = {
        ok: false,
        status: 400,
        text: async () => "invalid_grant",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockFetchResponse as unknown as Response);

      await expect(service.exchangeCodeForTokens("bad-code")).rejects.toThrow(
        "Spotify token exchange failed"
      );
    });
  });

  describe("refreshSession", () => {
    it("should call token endpoint with refresh_token and update session", async () => {
      const mockFetchResponse = {
        ok: true,
        json: async () => ({
          access_token: "new-access-123",
          refresh_token: "new-refresh-123",
          expires_in: 3600,
        }),
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockFetchResponse as unknown as Response);

      const payload = await service.refreshSession("old-refresh-123");

      expect(fetchSpy).toHaveBeenCalledWith("https://accounts.spotify.com/api/token", expect.any(Object));
      expect(payload.accessToken).toBe("new-access-123");
      expect(payload.refreshToken).toBe("new-refresh-123");
    });

    it("should reuse old refresh_token if new one is not returned", async () => {
      const mockFetchResponse = {
        ok: true,
        json: async () => ({
          access_token: "new-access-123",
          expires_in: 3600,
        }),
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockFetchResponse as unknown as Response);

      const payload = await service.refreshSession("old-refresh-123");
      expect(payload.accessToken).toBe("new-access-123");
      expect(payload.refreshToken).toBe("old-refresh-123");
    });
  });

  describe("cookie session storage operations", () => {
    let mockCookies: Record<string, string> = {};
        const mockCookieStore: CookieStore = {
      get: (name) => (mockCookies[name] ? { value: mockCookies[name] } : undefined),
      set: (name, value) => {
        mockCookies[name] = value;
      },
      delete: (name) => {
        delete mockCookies[name];
      },
    };

    beforeEach(() => {
      mockCookies = {};
    });

    it("should save, get and delete session payload", () => {
      const session: SessionPayload = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: Date.now() + 3600 * 1000,
      };

      service.setSession(mockCookieStore, session);
      expect(mockCookies["spotify_session"]).toBeDefined();

      const retrieved = service.getSession(mockCookieStore);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.accessToken).toBe(session.accessToken);

      service.clearSession(mockCookieStore);
      expect(mockCookies["spotify_session"]).toBeUndefined();
      expect(service.getSession(mockCookieStore)).toBeNull();
    });
  });
});
