import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { AuthService } from "@/server/services/auth-service";
import { SpotifyService } from "@/server/services/spotify-service";
import { LlmClient } from "@/server/services/llm-client";
import { cookies } from "next/headers";

// next/headers 모킹
vi.mock("next/headers", () => {
  return {
    cookies: vi.fn(),
  };
});

// 서비스 모킹
vi.mock("@/server/services/auth-service");
vi.mock("@/server/services/spotify-service");
vi.mock("@/server/services/llm-client");

import { Mock } from "vitest";

describe("POST /api/curate Route Handler", () => {
  let mockGetSession: Mock;
  let mockGetRecentlyPlayedTracks: Mock;
  let mockSearchTracks: Mock;
  let mockCurate: Mock;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockGetSession = vi.fn();
    mockGetRecentlyPlayedTracks = vi.fn();
    mockSearchTracks = vi.fn();
    mockCurate = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(cookies).mockResolvedValue({} as any);

    // AuthService 인스턴스 모킹
    vi.mocked(AuthService).mockImplementation(() => {
      return {
        getSession: mockGetSession,
      } as unknown as AuthService;
    });

    // SpotifyService 인스턴스 모킹
    vi.mocked(SpotifyService).mockImplementation(() => {
      return {
        getRecentlyPlayedTracks: mockGetRecentlyPlayedTracks,
        searchTracks: mockSearchTracks,
      } as unknown as SpotifyService;
    });

    // LlmClient 인스턴스 모킹
    vi.mocked(LlmClient).mockImplementation(() => {
      return {
        curate: mockCurate,
      } as unknown as LlmClient;
    });
  });

  it("should return 401 when no active session is found", async () => {
    mockGetSession.mockReturnValue(null); // 세션 없음

    const req = new Request("http://localhost/api/curate", {
      method: "POST",
      body: JSON.stringify({ userPrompt: "happy vibes" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("unauthorized");
  });

  it("should successfully curate and return playlist when session is active", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    const mockTracks = [
      { id: "1", uri: "spotify:track:1", title: "Song 1", artistName: "Artist 1" }
    ];
    mockGetRecentlyPlayedTracks.mockResolvedValue(mockTracks);

    const mockPlaylist = {
      title: "Happy Playlist",
      description: "A very happy playlist for you",
      tracks: [
        { title: "Happy Song 1", artistName: "Artist A" }
      ]
    };
    mockCurate.mockResolvedValue(mockPlaylist);

    const mockMappedPlaylist = {
      title: "Happy Playlist",
      description: "A very happy playlist for you",
      tracks: [
        { id: "mapped-1", uri: "spotify:track:mapped-1", title: "Happy Song 1", artistName: "Artist A" }
      ]
    };
    mockSearchTracks.mockResolvedValue(mockMappedPlaylist);

    const req = new Request("http://localhost/api/curate", {
      method: "POST",
      body: JSON.stringify({ userPrompt: "happy vibes" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.title).toBe("Happy Playlist");
    expect(data.tracks).toHaveLength(1);
    expect(data.tracks[0].title).toBe("Happy Song 1");
    expect(data.tracks[0].uri).toBe("spotify:track:mapped-1");

    expect(mockGetRecentlyPlayedTracks).toHaveBeenCalledTimes(1);
    expect(mockCurate).toHaveBeenCalledWith("happy vibes", mockTracks);
    expect(mockSearchTracks).toHaveBeenCalledWith(expect.anything(), mockPlaylist);
  });

  it("should proceed curation with empty tracks list if Spotify recently played fetch fails", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    mockGetRecentlyPlayedTracks.mockRejectedValue(new Error("Spotify rate limit or timeout"));

    const mockPlaylist = {
      title: "Fallback Playlist",
      description: "Default fallback suggestions",
      tracks: []
    };
    mockCurate.mockResolvedValue(mockPlaylist);

    const mockMappedPlaylist = {
      title: "Fallback Playlist",
      description: "Default fallback suggestions",
      tracks: []
    };
    mockSearchTracks.mockResolvedValue(mockMappedPlaylist);

    const req = new Request("http://localhost/api/curate", {
      method: "POST",
      body: JSON.stringify({ userPrompt: "moody lofi" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.title).toBe("Fallback Playlist");
    expect(mockCurate).toHaveBeenCalledWith("moody lofi", []); // 빈 배열로 LLM Client 호출 확인
    expect(mockSearchTracks).toHaveBeenCalledWith(expect.anything(), mockPlaylist);
  });
});
