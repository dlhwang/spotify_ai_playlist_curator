import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";

export async function GET() {
  try {
    const authService = new AuthService();
    const cookieStore = await cookies();
    
    // Clear the session cookie
    authService.clearSession(cookieStore);
  } catch (error) {
    console.error("Logout failed:", error);
  }

  const baseUrl = process.env.SPOTIFY_REDIRECT_URI
    ? new URL(process.env.SPOTIFY_REDIRECT_URI).origin
    : "http://localhost:3000";

  return NextResponse.redirect(new URL("/", baseUrl));
}
