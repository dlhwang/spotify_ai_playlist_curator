import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";
import { SpotifyService, SpotifyHttpError } from "@/server/services/spotify-service";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authService = new AuthService();
    const spotifyService = new SpotifyService(authService);

    const tracks = await spotifyService.getRecentlyPlayedTracks(cookieStore);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Failed to retrieve recently played tracks in API route handler:", error);

    // NFR-002: Expose minimized simple error code to client
    if (error instanceof SpotifyHttpError) {
      return NextResponse.json(
        { error: "spotify_api_error" },
        { status: error.status === 408 ? 504 : 502 }
      );
    }

    return NextResponse.json(
      { error: "spotify_api_error" },
      { status: 500 }
    );
  }
}
