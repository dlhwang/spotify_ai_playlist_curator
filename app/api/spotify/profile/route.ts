import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";
import { SpotifyService } from "@/server/services/spotify-service";

export async function GET(request: Request) {
  try {
    console.log(`[API Request] GET /api/spotify/profile`);

    const cookieStore = await cookies();


    const authService = new AuthService();
    const spotifyService = new SpotifyService(authService);

    // 1. Session verification
    const session = authService.getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2. Fetch full user profile
    const profile = await spotifyService.getCurrentUserProfile(cookieStore);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to fetch user profile in API handler:", error);
    return NextResponse.json({ error: "failed_to_fetch_profile" }, { status: 500 });
  }
}

