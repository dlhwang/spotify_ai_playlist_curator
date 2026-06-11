import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LlmClient } from "./llm-client";
import { Track } from "@/domain/track";

describe("LlmClient", () => {
  const mockRecentTracks: Track[] = [
    { id: "track-1", uri: "spotify:track:track-1", title: "Recent Song", artistName: "Recent Artist" }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // 환경 변수 원상 복구
    delete process.env.MOCK_LLM;
  });

  describe("Mock Mode", () => {
    it("should return energetic playlist when mockMode is true and prompt has no chill keywords", async () => {
      const client = new LlmClient(undefined, true);
      const result = await client.curate("Need some workout vibes", mockRecentTracks);

      expect(result.title).toBe("Energy Boost Mix");
      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.tracks[0].title).toBe("Dynamite");
    });

    it("should return chill playlist when mockMode is true and prompt has chill keywords", async () => {
      const client = new LlmClient(undefined, true);
      const result = await client.curate("give me a relax night and chill lofi", mockRecentTracks);

      expect(result.title).toBe("Midnight Chill & Lofi");
      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.tracks[0].title).toBe("Stay");
    });

    it("should fallback to mock mode if apiKey is empty and no explicit mockMode parameter is passed", async () => {
      const client = new LlmClient(); // no api key, no mock parameter
      const result = await client.curate("Some random prompt", mockRecentTracks);

      expect(result.title).toBe("Energy Boost Mix");
    });

    it("should extract three-axis curation specs in mock procedural mode", async () => {
      const client = new LlmClient(undefined, true);

      const specs = await client.extractCurationSpecs("퇴근길 드라이브에 어울리는 차분한 음악", mockRecentTracks);

      expect(specs.genreMoodSpec.mustHave).toContain("chill");
      expect(specs.placeContextSpec.mustHave).toContain("commute");
      expect(specs.artistTitleSpec.artists).toContain("Recent Artist");
    });

    it("should create search rounds from curation specs in mock procedural mode", async () => {
      const client = new LlmClient(undefined, true);
      const specs = await client.extractCurationSpecs("night drive chill", mockRecentTracks);

      const rounds = await client.createSearchPlan(specs, mockRecentTracks);

      expect(rounds.map((round) => round.round)).toEqual(["genreMood", "placeContext", "artistTitle"]);
      expect(rounds[0].limitPerQuery).toBe(10);
      expect(rounds[2].queries.some((query) => query.includes("Recent Artist"))).toBe(true);
    });

    it("should extract lineup constraints and prefer artist searches for festival prompts", async () => {
      const client = new LlmClient(undefined, true);
      const specs = await client.extractCurationSpecs(`2026 인천 펜타포트 락 페스티벌 예습 playlist

[해외 / 주요 라인업]

Khruangbin
Massive Attack

[국내 / 주요 라인업]

쏜애플
실리카겔

내 취향 반영:
어둡고 밀도 있는 밴드 사운드`, []);

      expect(specs.constraints?.mode).toBe("lineup");
      expect(specs.constraints?.lineupConstraint).toBe("strict");
      expect(specs.constraints?.allowedArtists).toEqual([
        "Khruangbin",
        "Massive Attack",
        "쏜애플",
        "실리카겔",
      ]);

      const rounds = await client.createSearchPlan(specs, []);

      expect(rounds).toHaveLength(1);
      expect(rounds[0].round).toBe("artistTitle");
      expect(rounds[0].queries).toEqual([
        'artist:"Khruangbin"',
        'artist:"Massive Attack"',
        'artist:"쏜애플"',
        'artist:"실리카겔"',
      ]);
    });

    it("should request artist depth for artists with fewer than three candidates", async () => {
      const client = new LlmClient(undefined, true);
      const specs = await client.extractCurationSpecs("recent artist mood", mockRecentTracks);

      const coverage = await client.evaluateCandidateCoverage(specs, [
        { id: "1", uri: "spotify:track:1", title: "Song 1", artistName: "Recent Artist" },
      ]);

      expect(coverage.artistDepthTargets[0].artistName).toBe("Recent Artist");
      expect(coverage.artistDepthTargets[0].requestedMinimum).toBe(3);
    });

    it("should request artist depth only for allowed lineup artists in strict lineup mode", async () => {
      const client = new LlmClient(undefined, true);
      const specs = await client.extractCurationSpecs(`페스티벌 라인업 예습

[국내 / 주요 라인업]

쏜애플
실리카겔

내 취향 반영:
몽환적인 밴드 사운드`, []);

      const coverage = await client.evaluateCandidateCoverage(specs, [
        { id: "allowed", uri: "spotify:track:allowed", title: "Allowed", artistName: "쏜애플" },
        { id: "outside", uri: "spotify:track:outside", title: "Outside", artistName: "Outside Artist" },
      ]);

      expect(coverage.artistDepthTargets.map((target) => target.artistName)).toEqual(["쏜애플", "실리카겔"]);
    });

    it("should curate from expanded Spotify candidates in mock procedural mode", async () => {
      const client = new LlmClient(undefined, true);
      const specs = await client.extractCurationSpecs("night drive chill", mockRecentTracks);
      const candidates = [
        { id: "1", uri: "spotify:track:1", title: "Song 1", artistName: "Artist A" },
        { id: "2", uri: "spotify:track:2", title: "Song 2", artistName: "Artist A" },
        { id: "3", uri: "spotify:track:3", title: "Song 3", artistName: "Artist A" },
      ];

      const result = await client.curateWithExpandedCandidates("night drive chill", specs, candidates, mockRecentTracks);

      expect(result.title).toBe("Procedural Midnight Flow");
      expect(result.tracks).toHaveLength(3);
      expect(result.tracks[0].uri).toBe("spotify:track:1");
    });
  });

  describe("Live Mode with API Key", () => {
    describe("OpenAI / OpenRouter Compatible Provider Mode", () => {
      let originalProvider: string | undefined;
      let originalModel: string | undefined;
      let originalApiBaseUrl: string | undefined;

      beforeEach(() => {
        originalProvider = process.env.LLM_PROVIDER;
        originalModel = process.env.LLM_MODEL;
        originalApiBaseUrl = process.env.LLM_API_BASE_URL;
      });

      afterEach(() => {
        if (originalProvider === undefined) {
          delete process.env.LLM_PROVIDER;
        } else {
          process.env.LLM_PROVIDER = originalProvider;
        }
        if (originalModel === undefined) {
          delete process.env.LLM_MODEL;
        } else {
          process.env.LLM_MODEL = originalModel;
        }
        if (originalApiBaseUrl === undefined) {
          delete process.env.LLM_API_BASE_URL;
        } else {
          process.env.LLM_API_BASE_URL = originalApiBaseUrl;
        }
      });

      it("should call OpenAI compatible API and parse JSON successfully when provider is openai", async () => {
        process.env.LLM_PROVIDER = "openai";
        process.env.LLM_MODEL = "gpt-4o-mini";
        
        const client = new LlmClient("openai-key", false);
        const mockLlmOutput = {
          playlistTitle: "OpenAI Mix",
          playlistDescription: "Curated by OpenAI model",
          recommendedTracks: [
            { title: "OpenAI Track 1", artistName: "OpenAI Artist 1" }
          ]
        };

        const mockResponse = {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify(mockLlmOutput)
              }
            }]
          })
        };

        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as unknown as Response);

        const result = await client.curate("OpenAI test prompt", mockRecentTracks);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        
        const [calledUrl, calledInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
        expect(calledUrl).toBe("https://api.openai.com/v1/chat/completions");
        expect(calledInit.headers).toEqual(
          expect.objectContaining({
            Authorization: "Bearer openai-key",
            "Content-Type": "application/json",
          })
        );
        expect(JSON.parse(calledInit.body as string).model).toBe("gpt-4o-mini");

        expect(result.title).toBe("OpenAI Mix");
        expect(result.tracks).toHaveLength(1);
        expect(result.tracks[0].title).toBe("OpenAI Track 1");
      });

      it("should call OpenRouter API when provider is openrouter", async () => {
        process.env.LLM_PROVIDER = "openrouter";
        delete process.env.LLM_MODEL; // let it use default

        const client = new LlmClient("openrouter-key", false);
        const mockLlmOutput = {
          playlistTitle: "OpenRouter Mix",
          playlistDescription: "Curated by OpenRouter",
          recommendedTracks: []
        };

        const mockResponse = {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify(mockLlmOutput)
              }
            }]
          })
        };

        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as unknown as Response);

        const result = await client.curate("OpenRouter prompt", mockRecentTracks);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        
        const [calledUrl, calledInit] = fetchSpy.mock.calls[0] as [string, RequestInit];
        expect(calledUrl).toBe("https://openrouter.ai/api/v1/chat/completions");
        expect(JSON.parse(calledInit.body as string).model).toBe("google/gemini-2.5-flash");

        expect(result.title).toBe("OpenRouter Mix");
      });
    });

    it("should call real API and parse JSON response successfully", async () => {
      const client = new LlmClient("valid-api-key", false);
      const mockLlmOutput = {
        playlistTitle: "Awesome Indie Mix",
        playlistDescription: "Best indie track curator suggestion",
        recommendedTracks: [
          { title: "Indie Song 1", artistName: "Indie Band 1" },
          { title: "Indie Song 2", artistName: "Indie Band 2" }
        ]
      };

      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockLlmOutput) }]
            }
          }]
        })
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as unknown as Response);

      const result = await client.curate("Indie music please", mockRecentTracks);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.title).toBe("Awesome Indie Mix");
      expect(result.description).toBe("Best indie track curator suggestion");
      expect(result.tracks).toHaveLength(2);
      expect(result.tracks[0].title).toBe("Indie Song 1");
    });

    it("should parse final procedural curation and keep only candidate tracks", async () => {
      const client = new LlmClient("valid-api-key", false);
      const specs = await new LlmClient(undefined, true).extractCurationSpecs("night drive", mockRecentTracks);
      const candidates = [
        { id: "keep-1", uri: "spotify:track:keep-1", title: "Keep One", artistName: "Artist A" },
        { id: "keep-2", uri: "spotify:track:keep-2", title: "Keep Two", artistName: "Artist A" },
      ];
      const mockLlmOutput = {
        playlistTitle: "Candidate Mix",
        playlistDescription: "Only candidate tracks",
        targetDurationMinutes: 150,
        tracks: [
          { id: "keep-1", uri: "spotify:track:keep-1", title: "Keep One", artistName: "Artist A" },
          { id: "outside", uri: "spotify:track:outside", title: "Outside", artistName: "Artist B" },
        ],
      };

      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockLlmOutput) }]
            }
          }]
        })
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as unknown as Response);

      const result = await client.curateWithExpandedCandidates("night drive", specs, candidates, mockRecentTracks);

      expect(result.title).toBe("Candidate Mix");
      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].id).toBe("keep-1");
    });

    it("should retry once on JSON parsing error, and succeed if the second response is valid", async () => {
      const client = new LlmClient("valid-api-key", false);
      const mockLlmOutput = {
        playlistTitle: "Recovered Mix",
        playlistDescription: "Recovered from JSON parsing issue",
        recommendedTracks: [
          { title: "Good Song", artistName: "Good Artist" }
        ]
      };

      const firstBadResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: "This is not valid JSON string!" }]
            }
          }]
        })
      };

      const secondGoodResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockLlmOutput) }]
            }
          }]
        })
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(firstBadResponse as unknown as Response)
        .mockResolvedValueOnce(secondGoodResponse as unknown as Response);

      const result = await client.curate("Any prompt", mockRecentTracks);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.title).toBe("Recovered Mix");
      expect(result.tracks[0].title).toBe("Good Song");
    });

    it("should fallback to default playlist if retry also fails with parsing error", async () => {
      const client = new LlmClient("valid-api-key", false);

      const badResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: "{invalid-json-structure}" }]
            }
          }]
        })
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(badResponse as unknown as Response);

      const result = await client.curate("Any prompt", mockRecentTracks);

      expect(fetchSpy).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(result.title).toBe("AI Curated Playlist"); // fallback playlist title
      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].title).toBe("Recent Song");
    });

    it("should fallback to default playlist immediately on network/HTTP error", async () => {
      const client = new LlmClient("valid-api-key", false);

      const errorResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error"
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(errorResponse as unknown as Response);

      const result = await client.curate("Any prompt", mockRecentTracks);

      expect(fetchSpy).toHaveBeenCalledTimes(1); // falls back immediately without retry for HTTP errors
      expect(result.title).toBe("AI Curated Playlist");
      expect(result.tracks[0].title).toBe("Recent Song");
    });

    it("should fallback to default playlist on Abort timeout signal", async () => {
      const client = new LlmClient("valid-api-key", false);

      vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
        // 인위적으로 AbortError 발생
        if (init?.signal?.aborted) {
          return Promise.reject(new DOMException("The user aborted a request.", "AbortError"));

    it("should retry once on JSON parsing error, and succeed if the second response is valid", async () => {
      const client = new LlmClient("valid-api-key", false);
      const mockLlmOutput = {
        playlistTitle: "Recovered Mix",
        playlistDescription: "Recovered from JSON parsing issue",
        recommendedTracks: [
          { title: "Good Song", artistName: "Good Artist" }
        ]
      };

      const firstBadResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: "This is not valid JSON string!" }]
            }
          }]
        })
      };

      const secondGoodResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockLlmOutput) }]
            }
          }]
        })
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(firstBadResponse as unknown as Response)
        .mockResolvedValueOnce(secondGoodResponse as unknown as Response);

      const result = await client.curate("Any prompt", mockRecentTracks);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.title).toBe("Recovered Mix");
      expect(result.tracks[0].title).toBe("Good Song");
    });

    it("should fallback to default playlist if retry also fails with parsing error", async () => {
      const client = new LlmClient("valid-api-key", false);

      const badResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: "{invalid-json-structure}" }]
            }
          }]
        })
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(badResponse as unknown as Response);

      const result = await client.curate("Any prompt", mockRecentTracks);

      expect(fetchSpy).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(result.title).toBe("AI Curated Playlist"); // fallback playlist title
      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].title).toBe("Recent Song");
    });

    it("should fallback to default playlist immediately on network/HTTP error", async () => {
      const client = new LlmClient("valid-api-key", false);

      const errorResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error"
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(errorResponse as unknown as Response);

      const result = await client.curate("Any prompt", mockRecentTracks);

      expect(fetchSpy).toHaveBeenCalledTimes(1); // falls back immediately without retry for HTTP errors
      expect(result.title).toBe("AI Curated Playlist");
      expect(result.tracks[0].title).toBe("Recent Song");
    });

    it("should fallback to default playlist on Abort timeout signal", async () => {
      const client = new LlmClient("valid-api-key", false);

      vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
        // 인위적으로 AbortError 발생
        if (init?.signal?.aborted) {
          return Promise.reject(new DOMException("The user aborted a request.", "AbortError"));
        }
        const err = new DOMException("The user aborted a request.", "AbortError");
        return Promise.reject(err);
      });

      const result = await client.curate("Any prompt", mockRecentTracks);

      expect(result.title).toBe("AI Curated Playlist");
    });
        }
        const err = new DOMException("The user aborted a request.", "AbortError");
        return Promise.reject(err);
      });

      const result = await client.curate("Any prompt", mockRecentTracks);

      expect(result.title).toBe("AI Curated Playlist");
    });
  });

  describe("recommendPlaylistMetadata", () => {
    const mockTracks = [
      { title: "Song A", artistName: "Artist A" },
      { title: "Song B", artistName: "Artist B" },
    ];

    it("should return mock metadata in mock mode for chill prompt", async () => {
      const client = new LlmClient(undefined, true);
      const result = await client.recommendPlaylistMetadata("밤에 듣는 차분한 음악", mockTracks);
      expect(result.title).toBe("차분한 밤의 선율");
      expect(result.description).toContain("차분하고 평온한 무드");
      expect(result.description).toContain("Artist A");
    });

    it("should return mock metadata in mock mode for upbeat prompt", async () => {
      const client = new LlmClient(undefined, true);
      const result = await client.recommendPlaylistMetadata("신나는 운동 음악", mockTracks);
      expect(result.title).toBe("에너지 부스트 믹스");
      expect(result.description).toContain("활력과 비트");
    });

    it("should call real API and parse metadata response successfully in live mode", async () => {
      const client = new LlmClient("valid-api-key", false);
      const mockLlmOutput = {
        title: "Recommended Title",
        description: "Recommended description content",
      };

      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockLlmOutput) }]
            }
          }]
        })
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as unknown as Response);

      const result = await client.recommendPlaylistMetadata("Some prompt", mockTracks);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.title).toBe("Recommended Title");
      expect(result.description).toBe("Recommended description content");
    });

    it("should fallback to mock metadata on LLM failure in live mode", async () => {
      const client = new LlmClient("valid-api-key", false);
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error"
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(errorResponse as unknown as Response);

      const result = await client.recommendPlaylistMetadata("밤에 듣는 차분한 음악", mockTracks);

      expect(result.title).toBe("차분한 밤의 선율");
    });
  });
});
