import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { AuthService } from "@/server/services/auth-service";
import { LlmClient } from "@/server/services/llm-client";
import { cookies } from "next/headers";
import { Mock } from "vitest";

vi.mock("next/headers", () => {
  return {
    cookies: vi.fn(),
  };
});

vi.mock("@/server/services/auth-service");
vi.mock("@/server/services/llm-client");

describe("POST /api/curate/recommend-metadata Route Handler", () => {
  let mockGetSession: Mock;
  let mockRecommendPlaylistMetadata: Mock;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockGetSession = vi.fn();
    mockRecommendPlaylistMetadata = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(cookies).mockResolvedValue({} as any);

    vi.mocked(AuthService).mockImplementation(() => {
      return {
        getSession: mockGetSession,
      } as unknown as AuthService;
    });

    vi.mocked(LlmClient).mockImplementation(() => {
      return {
        recommendPlaylistMetadata: mockRecommendPlaylistMetadata,
      } as unknown as LlmClient;
    });
  });

  it("should return 401 when no active session is found", async () => {
    mockGetSession.mockReturnValue(null);

    const req = new Request("http://localhost/api/curate/recommend-metadata", {
      method: "POST",
      body: JSON.stringify({
        userPrompt: "night mood lofi",
        tracks: [{ title: "Song 1", artistName: "Artist A" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("unauthorized");
  });

  it("should return 400 when userPrompt is missing or tracks is not array", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    const req = new Request("http://localhost/api/curate/recommend-metadata", {
      method: "POST",
      body: JSON.stringify({
        tracks: [{ title: "Song 1", artistName: "Artist A" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("bad_request");
  });

  it("should return 200 with recommended title and description on valid request", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    const mockResponse = {
      title: "Recommended Title",
      description: "Recommended Description",
    };
    mockRecommendPlaylistMetadata.mockResolvedValue(mockResponse);

    const req = new Request("http://localhost/api/curate/recommend-metadata", {
      method: "POST",
      body: JSON.stringify({
        userPrompt: "night drive lofi",
        tracks: [{ title: "Song A", artistName: "Artist A" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.title).toBe("Recommended Title");
    expect(data.description).toBe("Recommended Description");

    expect(mockRecommendPlaylistMetadata).toHaveBeenCalledWith(
      "night drive lofi",
      [{ title: "Song A", artistName: "Artist A" }]
    );
  });

  it("should return 500 when recommendation method fails", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    mockRecommendPlaylistMetadata.mockRejectedValue(new Error("LLM failure"));

    const req = new Request("http://localhost/api/curate/recommend-metadata", {
      method: "POST",
      body: JSON.stringify({
        userPrompt: "night drive lofi",
        tracks: [{ title: "Song A", artistName: "Artist A" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe("recommendation_failed");
  });
});
