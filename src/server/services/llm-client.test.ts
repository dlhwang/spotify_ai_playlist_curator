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
  });
});
