import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";
import { SpotifyService } from "@/server/services/spotify-service";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authService = new AuthService();
    const spotifyService = new SpotifyService(authService);

    // 1. Session verification
    const session = authService.getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2. Parse body data
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const { name, description, trackUris } = body;
    if (!name || !trackUris || !Array.isArray(trackUris)) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    // 3. Save curation into Spotify account
    const userId = await spotifyService.getCurrentUserId(cookieStore);
    const playlistId = await spotifyService.createPlaylist(cookieStore, userId, name, description);
    await spotifyService.addTracksToPlaylist(cookieStore, playlistId, trackUris);

    return NextResponse.json({ playlistId });
  } catch (error) {
    console.error("Failed to create and populate playlist in API handler:", error);
    return NextResponse.json({ error: "playlist_creation_failed" }, { status: 500 });
  }
}
