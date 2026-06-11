import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@/lib/testing/render";
import { HomePage } from "./home-page";

describe("HomePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the MVP start actions when not authenticated", () => {
    render(<HomePage isAuthenticated={false} />);

    expect(
      screen.getByRole("heading", {
        name: /말하는 대로 흐르는 오늘의 BGM/
      })
    ).toBeInTheDocument();
    expect(screen.getByTestId("home-connect-spotify-button")).toBeInTheDocument();
    expect(screen.getByTestId("home-preview-flow-button")).toBeInTheDocument();
  });

  it("renders the connected status and profile card when authenticated", async () => {
    const mockProfile = {
      id: "test-user-id",
      displayName: "Test User Name",
      email: "test@example.com",
      imageUrl: "https://example.com/avatar.jpg",
      product: "premium"
    };

    const mockResponse = {
      ok: true,
      json: async () => mockProfile,
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as unknown as Response);

    render(<HomePage isAuthenticated={true} />);

    // Initially or after loading, connected status should be in the document
    expect(screen.getByTestId("home-status-connected")).toBeInTheDocument();
    expect(screen.getByTestId("home-disconnect-spotify-button")).toBeInTheDocument();
    expect(screen.queryByTestId("home-connect-spotify-button")).toBeNull();

    // Verify profile is fetched and rendered
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/spotify/profile");
      expect(screen.getByText("Test User Name")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByAltText("Test User Name")).toBeInTheDocument();
    });
  });

  it("shows streamed curation progress while waiting for the final playlist", async () => {
    const mockProfile = {
      id: "test-user-id",
      displayName: "Test User Name",
      email: "test@example.com",
      product: "free"
    };

    const encoder = new TextEncoder();
    const curationStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({
          type: "progress",
          stage: "specExtraction",
          message: "프롬프트를 3가지 SPEC으로 나누고 있어요.",
          detail: "장르/감성, 장소/상황, 아티스트/곡 단서를 분리합니다.",
          progress: 24,
        }) + "\n"));
        controller.enqueue(encoder.encode(JSON.stringify({
          type: "progress",
          stage: "candidateSearch",
          message: "실존 트랙 후보를 Spotify에서 찾고 있어요.",
          progress: 52,
        }) + "\n"));
        await new Promise((resolve) => setTimeout(resolve, 20));
        controller.enqueue(encoder.encode(JSON.stringify({
          type: "result",
          progress: 100,
          data: {
            title: "Progress Mix",
            description: "진행 상황을 보여준 뒤 완성된 플레이리스트",
            tracks: [
              { id: "track-1", uri: "spotify:track:1", title: "Track One", artistName: "Artist One" },
            ],
          },
        }) + "\n"));
        controller.close();
      },
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/spotify/profile") {
        return {
          ok: true,
          json: async () => mockProfile,
        } as unknown as Response;
      }

      if (input === "/api/curate") {
        expect(init?.headers).toMatchObject({
          Accept: "application/x-ndjson",
        });

        return new Response(curationStream, {
          status: 200,
          headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
        });
      }

      throw new Error(`Unexpected fetch call: ${String(input)}`);
    });

    render(<HomePage isAuthenticated={true} />);

    fireEvent.click(screen.getByRole("button", { name: /플레이리스트 생성/ }));

    await waitFor(() => {
      expect(screen.getByTestId("curation-progress-panel")).toBeInTheDocument();
      expect(screen.getByText("프롬프트를 3가지 SPEC으로 나누고 있어요.")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Progress Mix")).toBeInTheDocument();
      expect(screen.getByText("Track One")).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/curate", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        userPrompt: "퇴근길에 들을 수 있는 차분하지만 리듬감 있는 playlist",
        streamProgress: true,
      }),
    }));
  });
});
