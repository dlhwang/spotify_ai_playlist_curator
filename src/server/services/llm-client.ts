import { Track } from "@/domain/track";
import {
  ArtistDepthTarget,
  CandidateCoverageEvaluation,
  CurationConstraints,
  CurationSpecs,
  CuratedPlaylist,
  CuratedTrack,
  ProceduralCurationResult,
  SearchQueryRound,
  createFallbackPlaylist,
} from "@/domain/curation";
import { MappedTrack } from "@/domain/search";

export interface RawLlmResponse {
  playlistTitle: string;
  playlistDescription: string;
  recommendedTracks: Array<{
    title: string;
    artistName: string;
  }>;
}

interface RawProceduralCurationResponse {
  playlistTitle: string;
  playlistDescription: string;
  targetDurationMinutes?: number;
  tracks: Array<Partial<MappedTrack> & { reason?: string }>;
  artistDepthNotes?: ProceduralCurationResult["artistDepthNotes"];
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
      return await this.callLlmWithTimeoutAndParse(fullPrompt, 20000);
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

  async extractCurationSpecs(userPrompt: string, recentTracks: Track[]): Promise<CurationSpecs> {
    if (this.mockMode) {
      return this.getMockSpecs(userPrompt, recentTracks);
    }

    const prompt = `You are a music intent analyst.
Split the user's prompt into three curation specs:
1. genreMoodSpec: genre, mood, tempo, energy, era, vocal/instrumental preference
2. placeContextSpec: place, activity, listening context
3. artistTitleSpec: explicit artists, similar artists, track titles, avoid list
Return raw JSON only in this schema:
{
  "genreMoodSpec": {"mustHave":[],"niceToHave":[],"avoid":[],"confidence":0.0},
  "placeContextSpec": {"mustHave":[],"niceToHave":[],"avoid":[],"confidence":0.0},
  "artistTitleSpec": {"artists":[],"similarArtists":[],"titles":[],"avoid":[],"confidence":0.0},
  "constraints": {
    "mode": "open",
    "allowedArtists": [],
    "allowedArtistAliases": {},
    "lineupConstraint": "soft"
  }
}
If the prompt is for a festival lineup, set constraints.mode to "lineup", extract every lineup artist into allowedArtists, and set lineupConstraint to "strict".
User prompt: "${userPrompt}"
Recently played tracks:
${this.formatRecentTracks(recentTracks)}`;

    try {
      const parsed = await this.callLlmJson<CurationSpecs>(prompt, 10000);
      return this.applyInferredLineupConstraints(this.normalizeSpecs(parsed), userPrompt);
    } catch (error) {
      console.warn("Failed to extract curation specs. Falling back to inferred specs.", error);
      return this.getMockSpecs(userPrompt, recentTracks);
    }
  }

  async createSearchPlan(specs: CurationSpecs, recentTracks: Track[]): Promise<SearchQueryRound[]> {
    if (this.isStrictLineupMode(specs)) {
      return this.createLineupSearchPlan(specs);
    }

    if (this.mockMode) {
      return this.getMockSearchPlan(specs, recentTracks);
    }

    const prompt = `You are a Spotify Search API planner.
Create query rounds for Spotify Search API using only these filters when useful:
album, artist, track, year, isrc, genre.
Respect that /search limit is max 10 per query. Return raw JSON only:
{
  "rounds": [
    {"round":"genreMood","queries":["..."],"limitPerQuery":10,"offsets":[0]},
    {"round":"placeContext","queries":["..."],"limitPerQuery":10,"offsets":[0]},
    {"round":"artistTitle","queries":["..."],"limitPerQuery":10,"offsets":[0]}
  ]
}
Specs:
${JSON.stringify(specs)}
Recently played tracks:
${this.formatRecentTracks(recentTracks)}`;

    try {
      const parsed = await this.callLlmJson<{ rounds: SearchQueryRound[] }>(prompt, 10000);
      return this.normalizeSearchPlan(parsed.rounds, specs, recentTracks);
    } catch (error) {
      console.warn("Failed to create search plan. Falling back to deterministic plan.", error);
      return this.getMockSearchPlan(specs, recentTracks);
    }
  }

  async evaluateCandidateCoverage(
    specs: CurationSpecs,
    candidates: MappedTrack[]
  ): Promise<CandidateCoverageEvaluation> {
    const deterministic = this.getDeterministicCoverage(specs, candidates);
    if (this.mockMode) {
      return deterministic;
    }

    const prompt = `You are evaluating Spotify track candidates for a procedural RAG curation.
Find artist depth targets that need more tracks. Same artist target minimum is 3 tracks when feasible.
Return raw JSON only:
{
  "artistDepthTargets": [
    {"artistName":"Artist Name","requestedMinimum":3,"queries":["artist:\\"Artist Name\\""]}
  ],
  "missingSpecs": ["short note"]
}
Specs:
${JSON.stringify(specs)}
Candidates:
${JSON.stringify(candidates.slice(0, 120))}`;

    try {
      const parsed = await this.callLlmJson<CandidateCoverageEvaluation>(prompt, 10000);
      return {
        artistDepthTargets: this.normalizeArtistDepthTargets(parsed.artistDepthTargets),
        missingSpecs: Array.isArray(parsed.missingSpecs) ? parsed.missingSpecs.filter(Boolean) : [],
      };
    } catch (error) {
      console.warn("Failed to evaluate candidate coverage. Using deterministic coverage.", error);
      return deterministic;
    }
  }

  async curateWithExpandedCandidates(
    userPrompt: string,
    specs: CurationSpecs,
    candidates: MappedTrack[],
    recentTracks: Track[]
  ): Promise<ProceduralCurationResult> {
    const fallbackCandidates = candidates.length > 0
      ? this.selectCandidateTracks(candidates)
      : this.recentTracksToMappedTracks(recentTracks);

    if (this.mockMode) {
      return {
        title: this.isChillPrompt(userPrompt) ? "Procedural Midnight Flow" : "Procedural Energy Flow",
        description: "장르/감성, 장소, 아티스트 SPEC을 기준으로 Spotify 후보군에서 선별한 절차형 RAG 플레이리스트입니다.",
        targetDurationMinutes: 150,
        tracks: fallbackCandidates,
        artistDepthNotes: this.buildArtistDepthNotes(fallbackCandidates),
      };
    }

    const prompt = `You are a final Spotify playlist curator.
Use only tracks from the provided candidates. Prefer a long 2-3 hour playlist when enough candidates exist.
When an artist appears, include at least 3 tracks if candidates allow it.
If fewer than 3 suitable candidate tracks exist for an artist, include what exists and explain why.
Return raw JSON only:
{
  "playlistTitle":"title",
  "playlistDescription":"description",
  "targetDurationMinutes":150,
  "tracks":[{"id":"spotify id","uri":"spotify:track:id","title":"title","artistName":"artist","reason":"why"}],
  "artistDepthNotes":[{"artistName":"artist","requestedMinimum":3,"selectedCount":2,"reason":"why"}]
}
User prompt: "${userPrompt}"
Specs:
${JSON.stringify(specs)}
Candidate tracks:
${JSON.stringify(candidates.slice(0, 150))}`;

    try {
      const parsed = await this.callLlmJson<RawProceduralCurationResponse>(prompt, 20000);
      const tracks = this.resolveLlmSelectedTracks(parsed.tracks, candidates);

      if (tracks.length === 0) {
        return {
          title: "AI Curated Playlist",
          description: "LLM 최종 선별 결과가 후보군과 매칭되지 않아 검색 후보 기반으로 구성한 플레이리스트입니다.",
          targetDurationMinutes: 120,
          tracks: fallbackCandidates,
          artistDepthNotes: this.buildArtistDepthNotes(fallbackCandidates),
        };
      }

      return {
        title: parsed.playlistTitle || "AI Curated Playlist",
        description: parsed.playlistDescription || "Spotify 후보군 기반 AI 큐레이션입니다.",
        targetDurationMinutes: parsed.targetDurationMinutes,
        tracks,
        artistDepthNotes: Array.isArray(parsed.artistDepthNotes)
          ? parsed.artistDepthNotes
          : this.buildArtistDepthNotes(tracks),
      };
    } catch (error) {
      console.warn("Final procedural curation failed. Falling back to candidate tracks.", error);
      return {
        title: "AI Curated Playlist",
        description: "AI 큐레이션 처리에 일시적인 오류가 발생하여 검색 후보군을 기반으로 구성한 플레이리스트입니다.",
        targetDurationMinutes: 120,
        tracks: fallbackCandidates,
        artistDepthNotes: this.buildArtistDepthNotes(fallbackCandidates),
      };
    }
  }

  /**
   * 설정된 LLM Provider(환경 변수)에 따라 API를 호출하고 10초 타임아웃 처리와 JSON 파싱을 수행합니다.
   * 지원 프로바이더: gemini (기본값), openai, openrouter (및 OpenAI 호환 API)
   */
  private async callLlmWithTimeoutAndParse(prompt: string, timeoutMs: number): Promise<CuratedPlaylist> {
    const parsed = await this.callLlmJson<RawLlmResponse>(prompt, timeoutMs);

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
  }

  private async callLlmJson<T>(prompt: string, timeoutMs: number): Promise<T> {
    const provider = process.env.LLM_PROVIDER || "gemini";
    const model = process.env.LLM_MODEL || (provider === "gemini" ? "gemini-2.5-flash" : provider === "openai" ? "gpt-4o-mini" : "google/gemini-2.5-flash");
    const defaultBaseUrl = provider === "openai" ? "https://api.openai.com/v1" : provider === "openrouter" ? "https://openrouter.ai/api/v1" : "";
    const baseUrl = process.env.LLM_API_BASE_URL || defaultBaseUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let url = "";
      let options: RequestInit = {};

      if (provider === "gemini") {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        options = {
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
        };
      } else {
        // OpenAI or OpenRouter (OpenAI 호환 규격)
        url = `${baseUrl}/chat/completions`;
        options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          }),
          signal: controller.signal,
        };
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`LLM API HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let rawText = "";

      if (provider === "gemini") {
        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        // OpenAI 포맷 응답 파싱
        rawText = data.choices?.[0]?.message?.content;
      }

      if (!rawText) {
        throw new SyntaxError("Empty content received from LLM API");
      }

      return JSON.parse(rawText.trim()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("LLM API request timed out (10s limit)");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private normalizeSpecs(value: CurationSpecs): CurationSpecs {
    return {
      genreMoodSpec: this.normalizeSpec(value?.genreMoodSpec),
      placeContextSpec: this.normalizeSpec(value?.placeContextSpec),
      artistTitleSpec: {
        artists: this.normalizeStringArray(value?.artistTitleSpec?.artists),
        similarArtists: this.normalizeStringArray(value?.artistTitleSpec?.similarArtists),
        titles: this.normalizeStringArray(value?.artistTitleSpec?.titles),
        avoid: this.normalizeStringArray(value?.artistTitleSpec?.avoid),
        confidence: this.normalizeConfidence(value?.artistTitleSpec?.confidence),
      },
      constraints: this.normalizeConstraints(value?.constraints),
    };
  }

  private normalizeConstraints(value: CurationConstraints | undefined): CurationConstraints | undefined {
    if (!value) {
      return undefined;
    }

    const allowedArtists = this.normalizeStringArray(value.allowedArtists);
    const aliases = Object.entries(value.allowedArtistAliases || {}).reduce<Record<string, string[]>>(
      (acc, [artistName, artistAliases]) => {
        const normalizedArtistName = String(artistName || "").trim();
        if (!normalizedArtistName) {
          return acc;
        }
        acc[normalizedArtistName] = this.normalizeStringArray(artistAliases);
        return acc;
      },
      {}
    );

    return {
      mode: value.mode === "lineup" ? "lineup" : "open",
      allowedArtists,
      allowedArtistAliases: aliases,
      lineupConstraint: value.lineupConstraint === "strict" ? "strict" : "soft",
    };
  }

  private normalizeSpec(value: CurationSpecs["genreMoodSpec"]): CurationSpecs["genreMoodSpec"] {
    return {
      mustHave: this.normalizeStringArray(value?.mustHave),
      niceToHave: this.normalizeStringArray(value?.niceToHave),
      avoid: this.normalizeStringArray(value?.avoid),
      confidence: this.normalizeConfidence(value?.confidence),
    };
  }

  private normalizeSearchPlan(
    rounds: SearchQueryRound[] | undefined,
    specs: CurationSpecs,
    recentTracks: Track[]
  ): SearchQueryRound[] {
    const normalized = Array.isArray(rounds)
      ? rounds.map((round) => ({
          round: round.round,
          queries: this.normalizeStringArray(round.queries).slice(0, 6),
          limitPerQuery: Math.min(Math.max(Number(round.limitPerQuery) || 10, 1), 10),
          offsets: Array.isArray(round.offsets) ? round.offsets.slice(0, 3) : [0],
        })).filter((round) => round.queries.length > 0)
      : [];

    return normalized.length > 0 ? normalized : this.getMockSearchPlan(specs, recentTracks);
  }

  private normalizeArtistDepthTargets(targets: ArtistDepthTarget[] | undefined): ArtistDepthTarget[] {
    if (!Array.isArray(targets)) {
      return [];
    }

    return targets
      .map((target) => ({
        artistName: String(target.artistName || "").trim(),
        requestedMinimum: Math.max(Number(target.requestedMinimum) || 3, 1),
        queries: this.normalizeStringArray(target.queries).slice(0, 3),
      }))
      .filter((target) => target.artistName.length > 0)
      .map((target) => ({
        ...target,
        queries: target.queries.length > 0 ? target.queries : [`artist:"${target.artistName}"`],
      }));
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
  }

  private normalizeConfidence(value: unknown): number {
    const confidence = Number(value);
    if (Number.isNaN(confidence)) {
      return 0.5;
    }
    return Math.min(Math.max(confidence, 0), 1);
  }

  private getMockSpecs(userPrompt: string, recentTracks: Track[]): CurationSpecs {
    const lowerPrompt = userPrompt.toLowerCase();
    const recentArtists = recentTracks.map((track) => track.artistName).filter(Boolean).slice(0, 3);

    return this.applyInferredLineupConstraints({
      genreMoodSpec: {
        mustHave: this.isChillPrompt(userPrompt) ? ["chill", "lo-fi", "soft rhythm"] : ["upbeat", "pop", "high energy"],
        niceToHave: lowerPrompt.includes("drive") || lowerPrompt.includes("퇴근") ? ["night drive", "steady tempo"] : ["catchy hooks"],
        avoid: [],
        confidence: 0.78,
      },
      placeContextSpec: {
        mustHave: lowerPrompt.includes("drive") || lowerPrompt.includes("퇴근") ? ["commute", "driving"] : ["daily listening"],
        niceToHave: ["not too distracting"],
        avoid: [],
        confidence: 0.7,
      },
      artistTitleSpec: {
        artists: recentArtists,
        similarArtists: this.isChillPrompt(userPrompt) ? ["beabadoobee", "Jeremy Zucker"] : ["BTS", "Dua Lipa"],
        titles: [],
        avoid: [],
        confidence: recentArtists.length > 0 ? 0.72 : 0.5,
      },
    }, userPrompt);
  }

  private getMockSearchPlan(specs: CurationSpecs, recentTracks: Track[]): SearchQueryRound[] {
    if (this.isStrictLineupMode(specs)) {
      return this.createLineupSearchPlan(specs);
    }

    const genreQueries = [
      ...specs.genreMoodSpec.mustHave,
      ...specs.genreMoodSpec.niceToHave,
    ].slice(0, 4);
    const placeQueries = [
      ...specs.placeContextSpec.mustHave,
      ...specs.placeContextSpec.niceToHave,
    ].slice(0, 4);
    const artistQueries = [
      ...specs.artistTitleSpec.artists,
      ...specs.artistTitleSpec.similarArtists,
      ...recentTracks.map((track) => track.artistName),
    ].filter(Boolean).slice(0, 5);

    return [
      {
        round: "genreMood",
        queries: genreQueries.length > 0 ? genreQueries : ["pop mood playlist"],
        limitPerQuery: 10,
        offsets: [0],
      },
      {
        round: "placeContext",
        queries: placeQueries.length > 0 ? placeQueries : ["daily listening playlist"],
        limitPerQuery: 10,
        offsets: [0],
      },
      {
        round: "artistTitle",
        queries: artistQueries.map((artist) => `artist:"${artist}"`),
        limitPerQuery: 10,
        offsets: [0],
      },
    ];
  }

  private getDeterministicCoverage(
    specs: CurationSpecs,
    candidates: MappedTrack[]
  ): CandidateCoverageEvaluation {
    const artistCounts = new Map<string, number>();
    for (const candidate of candidates) {
      artistCounts.set(candidate.artistName, (artistCounts.get(candidate.artistName) || 0) + 1);
    }

    const explicitArtists = this.isStrictLineupMode(specs)
      ? new Set(specs.constraints?.allowedArtists || [])
      : new Set([
          ...specs.artistTitleSpec.artists,
          ...candidates.map((candidate) => candidate.artistName),
        ].filter(Boolean));

    const artistDepthTargets = Array.from(explicitArtists)
      .filter((artistName) => (artistCounts.get(artistName) || 0) < 3)
      .slice(0, 8)
      .map((artistName) => ({
        artistName,
        requestedMinimum: 3,
        queries: [`artist:"${artistName}"`],
      }));

    return {
      artistDepthTargets,
      missingSpecs: candidates.length === 0 ? ["No Spotify candidates collected"] : [],
    };
  }

  private resolveLlmSelectedTracks(
    rawTracks: RawProceduralCurationResponse["tracks"] | undefined,
    candidates: MappedTrack[]
  ): MappedTrack[] {
    if (!Array.isArray(rawTracks)) {
      return [];
    }

    const byId = new Map(candidates.map((track) => [track.id, track]));
    const byUri = new Map(candidates.map((track) => [track.uri, track]));
    const selected: MappedTrack[] = [];
    const seen = new Set<string>();

    for (const rawTrack of rawTracks) {
      const match = (rawTrack.id && byId.get(rawTrack.id)) || (rawTrack.uri && byUri.get(rawTrack.uri));
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        selected.push(match);
      }
    }

    return selected;
  }

  private selectCandidateTracks(candidates: MappedTrack[]): MappedTrack[] {
    const selected: MappedTrack[] = [];
    const artistCounts = new Map<string, number>();

    for (const candidate of candidates) {
      const count = artistCounts.get(candidate.artistName) || 0;
      if (count < 3 || selected.length < 30) {
        selected.push(candidate);
        artistCounts.set(candidate.artistName, count + 1);
      }
      if (selected.length >= 45) {
        break;
      }
    }

    return selected;
  }

  private recentTracksToMappedTracks(recentTracks: Track[]): MappedTrack[] {
    return recentTracks.slice(0, 30).map((track) => ({
      id: track.id,
      uri: track.uri,
      title: track.title,
      artistName: track.artistName,
    }));
  }

  private buildArtistDepthNotes(tracks: MappedTrack[]): ProceduralCurationResult["artistDepthNotes"] {
    const artistCounts = new Map<string, number>();
    for (const track of tracks) {
      artistCounts.set(track.artistName, (artistCounts.get(track.artistName) || 0) + 1);
    }

    return Array.from(artistCounts.entries())
      .filter(([, count]) => count < 3)
      .map(([artistName, selectedCount]) => ({
        artistName,
        requestedMinimum: 3,
        selectedCount,
        reason: "Spotify 후보군에서 중복 제거 후 확보 가능한 곡 수가 3곡 미만입니다.",
      }));
  }

  private formatRecentTracks(recentTracks: Track[]): string {
    return recentTracks.length > 0
      ? recentTracks.map((track) => `- ${track.title} by ${track.artistName}`).join("\n")
      : "(None)";
  }

  private isChillPrompt(userPrompt: string): boolean {
    const lowerPrompt = userPrompt.toLowerCase();
    const chillKeywords = ["chill", "relax", "sad", "차분", "감성", "슬픈", "우울", "휴식", "자장가"];
    return chillKeywords.some((key) => lowerPrompt.includes(key));
  }

  private applyInferredLineupConstraints(specs: CurationSpecs, userPrompt: string): CurationSpecs {
    const inferred = this.inferLineupConstraints(userPrompt);
    if (!inferred) {
      return specs;
    }

    const existingAllowedArtists = specs.constraints?.mode === "lineup"
      ? specs.constraints.allowedArtists
      : [];
    const allowedArtists = Array.from(new Set([
      ...existingAllowedArtists,
      ...inferred.allowedArtists,
    ]));

    return {
      ...specs,
      artistTitleSpec: {
        ...specs.artistTitleSpec,
        artists: Array.from(new Set([
          ...specs.artistTitleSpec.artists,
          ...allowedArtists,
        ])),
        confidence: Math.max(specs.artistTitleSpec.confidence, 0.9),
      },
      constraints: {
        mode: "lineup",
        allowedArtists,
        allowedArtistAliases: {
          ...(specs.constraints?.allowedArtistAliases || {}),
          ...(inferred.allowedArtistAliases || {}),
        },
        lineupConstraint: "strict",
      },
    };
  }

  private inferLineupConstraints(userPrompt: string): CurationConstraints | undefined {
    const hasLineupSignal = /페스티벌|라인업|예습|행사명|펜타포트/i.test(userPrompt);
    if (!hasLineupSignal) {
      return undefined;
    }

    const allowedArtists = this.extractLineupArtists(userPrompt);
    if (allowedArtists.length === 0) {
      return undefined;
    }

    return {
      mode: "lineup",
      allowedArtists,
      allowedArtistAliases: {},
      lineupConstraint: "strict",
    };
  }

  private extractLineupArtists(userPrompt: string): string[] {
    const lines = userPrompt
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const artists: string[] = [];
    let inLineupBlock = false;

    for (const line of lines) {
      if (/^\[(해외|국내)\s*\/\s*주요\s*라인업\]/.test(line)) {
        inLineupBlock = true;
        continue;
      }

      if (/^내\s*취향\s*반영/.test(line)) {
        inLineupBlock = false;
        continue;
      }

      if (!inLineupBlock || line.startsWith("[") || line.endsWith(":")) {
        continue;
      }

      if (line.length > 80 || /목표|행사|기간|장소|목적/.test(line)) {
        continue;
      }

      artists.push(line);
    }

    return Array.from(new Set(artists));
  }

  private isStrictLineupMode(specs: CurationSpecs): boolean {
    return specs.constraints?.mode === "lineup"
      && specs.constraints.lineupConstraint === "strict"
      && (specs.constraints.allowedArtists?.length || 0) > 0;
  }

  private createLineupSearchPlan(specs: CurationSpecs): SearchQueryRound[] {
    const allowedArtists = specs.constraints?.allowedArtists || [];
    const artistQueries = allowedArtists.map((artistName) => `artist:"${artistName}"`);

    return artistQueries.length > 0
      ? [{
          round: "artistTitle",
          queries: artistQueries,
          limitPerQuery: 10,
          offsets: [0],
        }]
      : [];
  }

  /**
   * Mock 모드일 때 정적 플레이리스트 2종 중 적절한 데이터를 반환합니다.
   */
  private getMockCuration(userPrompt: string): CuratedPlaylist {
    const isChill = this.isChillPrompt(userPrompt);

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
