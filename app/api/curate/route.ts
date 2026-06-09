import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";
import { SpotifyService } from "@/server/services/spotify-service";
import { LlmClient } from "@/server/services/llm-client";
import { Track } from "@/domain/track";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authService = new AuthService();
    const spotifyService = new SpotifyService(authService);

    // 1. 세션 쿠키 검증
    const session = authService.getSession(cookieStore);
    if (!session) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    // 2. 바디 데이터 파싱
    let userPrompt = "";
    try {
      const body = await request.json();
      userPrompt = body.userPrompt || "";
    } catch (e) {
      console.warn("Failed to parse request body JSON, using empty prompt instead", e);
      userPrompt = "";
    }

    // 3. Spotify 최근 재생 트랙 조회 (실패 시 빈 리스트로 복원력을 유지하여 무중단 큐레이션 수행)
    let recentTracks: Track[] = [];
    try {
      recentTracks = await spotifyService.getRecentlyPlayedTracks(cookieStore);
    } catch (spotifyError) {
      console.warn("Failed to get recently played tracks, proceeding curation with empty tracks", spotifyError);
      recentTracks = [];
    }

    // 4. Curation API Key 설정 및 LlmClient 실행
    const apiKey = process.env.LLM_API_KEY;
    const llmClient = new LlmClient(apiKey);

    const playlist = await llmClient.curate(userPrompt, recentTracks);

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Curation handler failed unexpectedly:", error);
    return NextResponse.json(
      { error: "curation_failed" },
      { status: 500 }
    );
  }
}
