import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = getBaseUrl();
  const cookieStore = await cookies();
  const authService = new AuthService();

  // 1. Spotify Callback Error Check
  if (error) {
    console.error("Spotify OAuth error callback received:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", baseUrl));
  }

  // 2. CSRF State Validation
  const savedState = cookieStore.get("spotify_auth_state")?.value;

  // Clear state cookie immediately after validation check (NFR-003)
  cookieStore.delete("spotify_auth_state");

  if (!state || !savedState || state !== savedState) {
    console.error("CSRF state mismatch. Received state:", state, "Saved state:", savedState);
    return NextResponse.redirect(new URL("/?error=state_mismatch", baseUrl));
  }

  if (!code) {
    console.error("Missing authorization code in Spotify OAuth callback");
    return NextResponse.redirect(new URL("/?error=missing_code", baseUrl));
  }

  try {
    // 3. Token Exchange
    const sessionPayload = await authService.exchangeCodeForTokens(code);

    // 4. Save Session to Cookie (HMAC Signed)
    authService.setSession(cookieStore, sessionPayload);

    return NextResponse.redirect(new URL("/", baseUrl));
  } catch (err) {
    console.error("Token exchange failed during callback:", err);
    return NextResponse.redirect(new URL("/?error=auth_failed", baseUrl));
  }
}

function getBaseUrl() {
  return process.env.SPOTIFY_REDIRECT_URI
    ? new URL(process.env.SPOTIFY_REDIRECT_URI).origin
    : "http://localhost:3000";
}
