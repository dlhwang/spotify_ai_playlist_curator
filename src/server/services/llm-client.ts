import { Track } from "@/domain/track";
import { CuratedPlaylist, CuratedTrack, createFallbackPlaylist } from "@/domain/curation";

export interface RawLlmResponse {
  playlistTitle: string;
  playlistDescription: string;
  recommendedTracks: Array<{
    title: string;
    artistName: string;
  }>;
}

export class LlmClient {
  private apiKey: string | undefined;
  private mockMode: boolean;

  constructor(apiKey?: string, mockMode?: boolean) {
    this.apiKey = apiKey;
    // LLM_API_KEY가 없거나 MOCK_LLM=true 환경 변수가 활성화되었을 때 Mock 모드로 동작
    this.mockMode = mockMode ?? (!apiKey || process.env.MOCK_LLM === "true");
  }

  /**
   * 사용자의 분위기 자연어 프롬프트와 최근 재생 트랙 목록을 기반으로 플레이리스트 추천을 생성합니다.
   * 타임아웃 10초 및 파싱 실패 시 1회 재시도, 최종 실패 시 최근 재생 곡 기반 폴백 지원.
   */
  async curate(userPrompt: string, recentTracks: Track[]): Promise<CuratedPlaylist> {
    if (this.mockMode) {
      return this.getMockCuration(userPrompt);
    }

    const systemPrompt = `You are a professional music curator.
Based on the user's current mood/prompt and recently played tracks, generate a curated playlist.
You must response strictly in the following JSON format:
{
  "playlistTitle": "Recommended playlist title",
  "playlistDescription": "Detailed explanation of the mood and why these songs are curated",
  "recommendedTracks": [
    {
      "title": "Song Title",
      "artistName": "Artist Name"
    }
  ]
}
Do NOT wrap the response in Markdown block (like \`\`\`json) and do not provide any extra conversational text. Return only raw JSON.`;

    const userPromptContent = `User Mood/Prompt: "${userPrompt}"
Recently Played Tracks:
${recentTracks.length > 0 ? recentTracks.map((t) => `- ${t.title} by ${t.artistName}`).join("\n") : "(None)"}

Please recommend 10 to 15 matching tracks with their titles and artists.`;

    const fullPrompt = `${systemPrompt}\n\n${userPromptContent}`;

    try {
      // 1차 시도
      return await this.callLlmWithTimeoutAndParse(fullPrompt, 10000);
    } catch (error) {
      // JSON 파싱 에러(SyntaxError)가 발생하면 1회 즉각 재요청
      const isParsingError = error instanceof SyntaxError;
      if (isParsingError) {
        console.warn("LLM response JSON parse failed. Retrying 1 time...", error);
        try {
          const retryPrompt = `${fullPrompt}\n\n--- WARNING: Your previous response was invalid JSON. Please return valid raw JSON only.`;
          return await this.callLlmWithTimeoutAndParse(retryPrompt, 10000);
        } catch (retryError) {
          console.error("LLM retry also failed. Falling back to default playlist.", retryError);
          return createFallbackPlaylist(recentTracks);
        }
      }

      // 타임아웃, 네트워크 오류 등 기타 오류 발생 시 바로 폴백 플레이리스트 반환
      console.error("LLM API call failed. Falling back to default playlist.", error);
      return createFallbackPlaylist(recentTracks);
    }
  }

  /**
   * Gemini API를 호출하고 10초 타임아웃 처리와 JSON 파싱을 수행합니다.
   */
  private async callLlmWithTimeoutAndParse(prompt: string, timeoutMs: number): Promise<CuratedPlaylist> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`LLM API HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new SyntaxError("Empty content received from LLM API");
      }

      const parsed: RawLlmResponse = JSON.parse(rawText.trim());
      
      // 스키마 정합성 검증
      if (!parsed.playlistTitle || !parsed.playlistDescription || !Array.isArray(parsed.recommendedTracks)) {
        throw new SyntaxError("LLM response missing required schema fields");
      }

      const tracks: CuratedTrack[] = parsed.recommendedTracks.map((item) => ({
        title: item.title || "Unknown Title",
        artistName: item.artistName || "Unknown Artist",
      }));

      return {
        title: parsed.playlistTitle,
        description: parsed.playlistDescription,
        tracks,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("LLM API request timed out (10s limit)");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Mock 모드일 때 정적 플레이리스트 2종 중 적절한 데이터를 반환합니다.
   */
  private getMockCuration(userPrompt: string): CuratedPlaylist {
    const lowerPrompt = userPrompt.toLowerCase();
    const chillKeywords = ["chill", "relax", "sad", "차분", "감성", "슬픈", "우울", "휴식", "자장가"];
    const isChill = chillKeywords.some((key) => lowerPrompt.includes(key));

    if (isChill) {
      return {
        title: "Midnight Chill & Lofi",
        description: "차분하고 편안한 분위기의 음악으로 깊은 밤의 감성을 더해 줄 릴랙스 플레이리스트입니다.",
        tracks: [
          { title: "Stay", artistName: "The Kid LAROI, Justin Bieber" },
          { title: "Coffee", artistName: "beabadoobee" },
          { title: "Comethru", artistName: "Jeremy Zucker" },
          { title: "Ocean Eyes", artistName: "Billie Eilish" },
          { title: "Thinking Out Loud", artistName: "Ed Sheeran" },
          { title: "Peaches", artistName: "Justin Bieber" },
          { title: "Night Loop", artistName: "Lofi Fruits Music" },
          { title: "At My Worst", artistName: "Pink Sweat$" },
        ],
      };
    }

    return {
      title: "Energy Boost Mix",
      description: "신나는 음악과 강력한 비트로 하루의 활력을 충전해 줄 플레이리스트입니다.",
      tracks: [
        { title: "Dynamite", artistName: "BTS" },
        { title: "Levitating", artistName: "Dua Lipa" },
        { title: "Blinding Lights", artistName: "The Weeknd" },
        { title: "Uptown Funk", artistName: "Mark Ronson ft. Bruno Mars" },
        { title: "Shake It Off", artistName: "Taylor Swift" },
        { title: "Can't Stop the Feeling!", artistName: "Justin Timberlake" },
        { title: "Closer", artistName: "The Chainsmokers" },
        { title: "Don't Start Now", artistName: "Dua Lipa" },
      ],
    };
  }
}
