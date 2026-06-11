import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";
import { LlmClient } from "@/server/services/llm-client";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authService = new AuthService();

    // 1. 세션 쿠키 검증
    const session = authService.getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2. 바디 데이터 파싱 및 검증
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const { userPrompt, tracks } = body;
    if (!userPrompt || typeof userPrompt !== "string" || !tracks || !Array.isArray(tracks)) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    // 3. LLM 추천 받아 리턴
    const apiKey = process.env.LLM_API_KEY;
    const llmClient = new LlmClient(apiKey);
    const recommended = await llmClient.recommendPlaylistMetadata(userPrompt, tracks);

    return NextResponse.json(recommended);
  } catch (error) {
    console.error("Failed to recommend playlist metadata in API handler:", error);
    return NextResponse.json({ error: "recommendation_failed" }, { status: 500 });
  }
}
