import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { AuthService } from "@/server/services/auth-service";

export async function GET() {
  try {
    const authService = new AuthService();
    const state = crypto.randomBytes(16).toString("hex");

    const cookieStore = await cookies();
    
    // Store OAuth state in a temporary cookie for CSRF validation
    cookieStore.set("spotify_auth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes in seconds
      path: "/",
    });

    const authUrl = authService.getAuthorizationUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Spotify login redirect initiated failed:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", getBaseUrl()));
  }
}

function getBaseUrl() {
  return process.env.SPOTIFY_REDIRECT_URI
    ? new URL(process.env.SPOTIFY_REDIRECT_URI).origin
    : "http://localhost:3000";
}
