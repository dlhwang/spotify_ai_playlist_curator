import { SessionPayload, signSession, verifySession } from "@/lib/crypto/session-signature";
import { getRequiredServerEnv } from "@/lib/env/server-env";

export interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none" | boolean;
      secure?: boolean;
      path?: string;
      maxAge?: number;
    }
  ): void;
  delete(name: string): void;
}

export class AuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private sessionSecret: string;

  constructor(envSource: Record<string, string | undefined> = process.env) {
    this.clientId = getRequiredServerEnv("SPOTIFY_CLIENT_ID", envSource);
    this.clientSecret = getRequiredServerEnv("SPOTIFY_CLIENT_SECRET", envSource);
    this.redirectUri = getRequiredServerEnv("SPOTIFY_REDIRECT_URI", envSource);
    this.sessionSecret = getRequiredServerEnv("SESSION_SECRET", envSource);
  }

  /**
   * Generates Spotify OAuth Authorization URL.
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      "user-read-private",
      "user-read-email",
      "playlist-modify-public",
      "playlist-modify-private",
      "user-read-recently-played"
    ].join(" ");

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: scopes,
      state: state
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Exchanges Authorization Code for Access & Refresh Tokens.
   */
  async exchangeCodeForTokens(code: string): Promise<SessionPayload> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spotify token exchange failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };
  }

  /**
   * Refreshes the Access Token using Refresh Token.
   */
  async refreshSession(refreshToken: string): Promise<SessionPayload> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spotify token refresh failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Reuse existing refresh token if not returned
      expiresAt: Date.now() + data.expires_in * 1000
    };
  }

  /**
   * Retrieves and verifies the session from cookie store.
   */
  getSession(cookieStore: CookieStore): SessionPayload | null {
    const cookie = cookieStore.get("spotify_session");
    if (!cookie) {
      return null;
    }
    return verifySession(cookie.value, this.sessionSecret);
  }

  /**
   * Serializes, signs and sets the session to cookie store.
   */
  setSession(cookieStore: CookieStore, payload: SessionPayload): void {
    const signedValue = signSession(payload, this.sessionSecret);
    cookieStore.set("spotify_session", signedValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 14 * 24 * 3600 // 14 days in seconds
    });
  }

  /**
   * Clears the session from cookie store.
   */
  clearSession(cookieStore: CookieStore): void {
    cookieStore.delete("spotify_session");
  }
}
