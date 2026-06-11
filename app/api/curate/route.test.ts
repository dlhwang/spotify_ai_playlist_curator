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
  let mockSearchTracksByQueryRounds: Mock;
  let mockExpandArtistDepthCandidates: Mock;
  let mockExtractCurationSpecs: Mock;
  let mockCreateSearchPlan: Mock;
  let mockEvaluateCandidateCoverage: Mock;
  let mockCurateWithExpandedCandidates: Mock;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockGetSession = vi.fn();
    mockGetRecentlyPlayedTracks = vi.fn();
    mockSearchTracksByQueryRounds = vi.fn();
    mockExpandArtistDepthCandidates = vi.fn();
    mockExtractCurationSpecs = vi.fn();
    mockCreateSearchPlan = vi.fn();
    mockEvaluateCandidateCoverage = vi.fn();
    mockCurateWithExpandedCandidates = vi.fn();

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
        searchTracksByQueryRounds: mockSearchTracksByQueryRounds,
        expandArtistDepthCandidates: mockExpandArtistDepthCandidates,
      } as unknown as SpotifyService;
    });

    // LlmClient 인스턴스 모킹
    vi.mocked(LlmClient).mockImplementation(() => {
      return {
        extractCurationSpecs: mockExtractCurationSpecs,
        createSearchPlan: mockCreateSearchPlan,
        evaluateCandidateCoverage: mockEvaluateCandidateCoverage,
        curateWithExpandedCandidates: mockCurateWithExpandedCandidates,
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

    const mockSpecs = {
      genreMoodSpec: { mustHave: ["happy"], niceToHave: [], avoid: [], confidence: 0.9 },
      placeContextSpec: { mustHave: ["walk"], niceToHave: [], avoid: [], confidence: 0.7 },
      artistTitleSpec: { artists: [], similarArtists: [], titles: [], avoid: [], confidence: 0.5 },
    };
    const mockSearchPlan = [
      { round: "genreMood", queries: ["happy pop"], limitPerQuery: 10, offsets: [0] }
    ];
    const mockCandidates = [
      { id: "mapped-1", uri: "spotify:track:mapped-1", title: "Happy Song 1", artistName: "Artist A" }
    ];
    const mockCoverage = {
      artistDepthTargets: [{ artistName: "Artist A", requestedMinimum: 3, queries: ['artist:"Artist A"'] }],
      missingSpecs: [],
    };
    const mockExpandedCandidates = [
      { id: "mapped-2", uri: "spotify:track:mapped-2", title: "Happy Song 2", artistName: "Artist A" }
    ];
    const mockFinalPlaylist = {
      title: "Happy Playlist",
      description: "A very happy playlist for you",
      tracks: [
        { id: "mapped-1", uri: "spotify:track:mapped-1", title: "Happy Song 1", artistName: "Artist A" }
      ]
    };

    mockExtractCurationSpecs.mockResolvedValue(mockSpecs);
    mockCreateSearchPlan.mockResolvedValue(mockSearchPlan);
    mockSearchTracksByQueryRounds.mockResolvedValue(mockCandidates);
    mockEvaluateCandidateCoverage.mockResolvedValue(mockCoverage);
    mockExpandArtistDepthCandidates.mockResolvedValue(mockExpandedCandidates);
    mockCurateWithExpandedCandidates.mockResolvedValue(mockFinalPlaylist);

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
    expect(mockExtractCurationSpecs).toHaveBeenCalledWith("happy vibes", mockTracks);
    expect(mockCreateSearchPlan).toHaveBeenCalledWith(mockSpecs, mockTracks);
    expect(mockSearchTracksByQueryRounds).toHaveBeenCalledWith(expect.anything(), mockSearchPlan);
    expect(mockEvaluateCandidateCoverage).toHaveBeenCalledWith(mockSpecs, mockCandidates);
    expect(mockExpandArtistDepthCandidates).toHaveBeenCalledWith(expect.anything(), mockCoverage.artistDepthTargets);
    expect(mockCurateWithExpandedCandidates).toHaveBeenCalledWith(
      "happy vibes",
      mockSpecs,
      [...mockCandidates, ...mockExpandedCandidates],
      mockTracks
    );
  });

  it("should proceed curation with empty tracks list if Spotify recently played fetch fails", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    mockGetRecentlyPlayedTracks.mockRejectedValue(new Error("Spotify rate limit or timeout"));

    const mockSpecs = {
      genreMoodSpec: { mustHave: ["lofi"], niceToHave: [], avoid: [], confidence: 0.9 },
      placeContextSpec: { mustHave: ["night"], niceToHave: [], avoid: [], confidence: 0.7 },
      artistTitleSpec: { artists: [], similarArtists: [], titles: [], avoid: [], confidence: 0.5 },
    };
    const mockSearchPlan = [
      { round: "genreMood", queries: ["lofi"], limitPerQuery: 10, offsets: [0] }
    ];
    const mockFinalPlaylist = {
      title: "Fallback Playlist",
      description: "Default fallback suggestions",
      tracks: []
    };

    mockExtractCurationSpecs.mockResolvedValue(mockSpecs);
    mockCreateSearchPlan.mockResolvedValue(mockSearchPlan);
    mockSearchTracksByQueryRounds.mockResolvedValue([{ id: "lofi-1", uri: "spotify:track:lofi-1", title: "Lofi 1", artistName: "Artist" }]);
    mockEvaluateCandidateCoverage.mockResolvedValue({ artistDepthTargets: [], missingSpecs: [] });
    mockExpandArtistDepthCandidates.mockResolvedValue([]);
    mockCurateWithExpandedCandidates.mockResolvedValue(mockFinalPlaylist);

    const req = new Request("http://localhost/api/curate", {
      method: "POST",
      body: JSON.stringify({ userPrompt: "moody lofi" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.title).toBe("Fallback Playlist");
    expect(mockExtractCurationSpecs).toHaveBeenCalledWith("moody lofi", []);
    expect(mockCreateSearchPlan).toHaveBeenCalledWith(mockSpecs, []);
  });

  it("should fallback to recent tracks when procedural RAG fails", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    const mockTracks = [
      { id: "recent-1", uri: "spotify:track:recent-1", title: "Recent Song", artistName: "Recent Artist" }
    ];
    mockGetRecentlyPlayedTracks.mockResolvedValue(mockTracks);
    mockExtractCurationSpecs.mockRejectedValue(new Error("LLM unavailable"));

    const req = new Request("http://localhost/api/curate", {
      method: "POST",
      body: JSON.stringify({ userPrompt: "any vibe" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.title).toBe("AI Curated Playlist");
    expect(data.tracks).toHaveLength(1);
    expect(data.tracks[0].uri).toBe("spotify:track:recent-1");
  });

  it("should validate and repair lineup constrained curation before returning", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    mockGetRecentlyPlayedTracks.mockResolvedValue([]);

    const mockSpecs = {
      genreMoodSpec: { mustHave: ["dark"], niceToHave: [], avoid: [], confidence: 0.9 },
      placeContextSpec: { mustHave: ["festival"], niceToHave: [], avoid: [], confidence: 0.8 },
      artistTitleSpec: { artists: ["쏜애플", "실리카겔"], similarArtists: [], titles: [], avoid: [], confidence: 0.95 },
      constraints: {
        mode: "lineup",
        allowedArtists: ["쏜애플", "실리카겔"],
        allowedArtistAliases: {},
        lineupConstraint: "strict",
      },
    };
    const mockSearchPlan = [
      { round: "artistTitle", queries: ['artist:"쏜애플"', 'artist:"실리카겔"'], limitPerQuery: 10, offsets: [0] }
    ];
    const mockCandidates = [
      { id: "allowed-1", uri: "spotify:track:allowed-1", title: "Allowed One", artistName: "쏜애플" },
      { id: "outside-1", uri: "spotify:track:outside-1", title: "Outside One", artistName: "Outside Artist" },
    ];
    const mockExpandedCandidates = [
      { id: "allowed-2", uri: "spotify:track:allowed-2", title: "Allowed Two", artistName: "쏜애플" },
      { id: "outside-2", uri: "spotify:track:outside-2", title: "Outside Two", artistName: "Outside Artist" },
    ];
    const mockFinalPlaylist = {
      title: "Pentaport Prep",
      description: "Lineup constrained mix",
      tracks: [
        { id: "allowed-1", uri: "spotify:track:allowed-1", title: "Allowed One", artistName: "쏜애플" },
        { id: "outside-2", uri: "spotify:track:outside-2", title: "Outside Two", artistName: "Outside Artist" },
      ],
    };

    mockExtractCurationSpecs.mockResolvedValue(mockSpecs);
    mockCreateSearchPlan.mockResolvedValue(mockSearchPlan);
    mockSearchTracksByQueryRounds.mockResolvedValue(mockCandidates);
    mockEvaluateCandidateCoverage.mockResolvedValue({
      artistDepthTargets: [
        { artistName: "쏜애플", requestedMinimum: 3, queries: ['artist:"쏜애플"'] },
        { artistName: "Outside Artist", requestedMinimum: 3, queries: ['artist:"Outside Artist"'] },
      ],
      missingSpecs: [],
    });
    mockExpandArtistDepthCandidates.mockResolvedValue(mockExpandedCandidates);
    mockCurateWithExpandedCandidates.mockResolvedValue(mockFinalPlaylist);

    const req = new Request("http://localhost/api/curate", {
      method: "POST",
      body: JSON.stringify({ userPrompt: "펜타포트 라인업 예습" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tracks).toEqual([
      { id: "allowed-1", uri: "spotify:track:allowed-1", title: "Allowed One", artistName: "쏜애플" },
    ]);
    expect(data.validation.passed).toBe(true);
    expect(data.validation.hardConstraintViolations).toEqual([
      expect.objectContaining({
        type: "artist_not_allowed",
        artistName: "Outside Artist",
      }),
    ]);
    expect(mockEvaluateCandidateCoverage).toHaveBeenCalledWith(mockSpecs, [
      { id: "allowed-1", uri: "spotify:track:allowed-1", title: "Allowed One", artistName: "쏜애플" },
    ]);
    expect(mockExpandArtistDepthCandidates).toHaveBeenCalledWith(expect.anything(), [
      { artistName: "쏜애플", requestedMinimum: 3, queries: ['artist:"쏜애플"'] },
    ]);
    expect(mockCurateWithExpandedCandidates).toHaveBeenCalledWith(
      "펜타포트 라인업 예습",
      mockSpecs,
      [
        { id: "allowed-1", uri: "spotify:track:allowed-1", title: "Allowed One", artistName: "쏜애플" },
        { id: "allowed-2", uri: "spotify:track:allowed-2", title: "Allowed Two", artistName: "쏜애플" },
      ],
      []
    );
  });

  it("should stream progress events and final playlist when requested", async () => {
    mockGetSession.mockReturnValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: Date.now() + 3600000,
    });

    const mockTracks = [
      { id: "1", uri: "spotify:track:1", title: "Song 1", artistName: "Artist 1" }
    ];
    const mockSpecs = {
      genreMoodSpec: { mustHave: ["night"], niceToHave: [], avoid: [], confidence: 0.9 },
      placeContextSpec: { mustHave: ["drive"], niceToHave: [], avoid: [], confidence: 0.7 },
      artistTitleSpec: { artists: [], similarArtists: [], titles: [], avoid: [], confidence: 0.5 },
    };
    const mockSearchPlan = [
      { round: "genreMood", queries: ["night drive"], limitPerQuery: 10, offsets: [0] }
    ];
    const mockCandidates = [
      { id: "mapped-1", uri: "spotify:track:mapped-1", title: "Night Song", artistName: "Artist A" }
    ];
    const mockFinalPlaylist = {
      title: "Night Drive Mix",
      description: "A streamed curation result",
      tracks: mockCandidates
    };

    mockGetRecentlyPlayedTracks.mockResolvedValue(mockTracks);
    mockExtractCurationSpecs.mockResolvedValue(mockSpecs);
    mockCreateSearchPlan.mockResolvedValue(mockSearchPlan);
    mockSearchTracksByQueryRounds.mockResolvedValue(mockCandidates);
    mockEvaluateCandidateCoverage.mockResolvedValue({ artistDepthTargets: [], missingSpecs: [] });
    mockExpandArtistDepthCandidates.mockResolvedValue([]);
    mockCurateWithExpandedCandidates.mockResolvedValue(mockFinalPlaylist);

    const req = new Request("http://localhost/api/curate", {
      method: "POST",
      headers: {
        Accept: "application/x-ndjson",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userPrompt: "night drive", streamProgress: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");

    const events = (await res.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(events.some((event) => event.type === "progress" && event.stage === "specExtraction")).toBe(true);
    expect(events.some((event) => event.type === "progress" && event.stage === "candidateSearch")).toBe(true);
    expect(events.at(-1)).toMatchObject({
      type: "result",
      progress: 100,
      data: {
        title: "Night Drive Mix",
      },
    });
  });
});
