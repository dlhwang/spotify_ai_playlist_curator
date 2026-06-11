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
      expect(screen.getByDisplayValue("Progress Mix")).toBeInTheDocument();
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

  it("allows user to edit title & description and save with modified metadata", async () => {
    const mockProfile = { id: "user", displayName: "Name", email: "a@a.com", product: "premium" };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/spotify/profile") {
        return { ok: true, json: async () => mockProfile } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    });

    render(<HomePage isAuthenticated={true} />);

    // Load test 3 tracks data
    fireEvent.click(screen.getByRole("button", { name: "테스트용 3곡 로드" }));

    // Verify title and description are in the inputs
    const titleInput = screen.getByTestId("playlist-title-input") as HTMLInputElement;
    const descInput = screen.getByTestId("playlist-description-input") as HTMLTextAreaElement;

    expect(titleInput.value).toBe("Neon Evening Reset");
    expect(descInput.value).toContain("하루를 내려놓는 부드러운 비트");

    // Edit inputs
    fireEvent.change(titleInput, { target: { value: "My Customized Title" } });
    fireEvent.change(descInput, { target: { value: "My customized description text" } });

    // Mock save endpoint
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/spotify/playlists") {
        return {
          ok: true,
          json: async () => ({ playlistId: "new-playlist-123" }),
        } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    });

    // Save playlist
    fireEvent.click(screen.getByRole("button", { name: "이 플레이리스트를 내 Spotify에 저장" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/spotify/playlists", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "My Customized Title",
          description: "My customized description text",
          trackUris: [
            "spotify:track:5HCyWkgU61j21yUjVmw2aV",
            "spotify:track:4t9n2v1VM7V0IF5U5fbg61",
            "spotify:track:18uw3e2j22wALnCjL8bHsi",
          ],
        }),
      }));
      expect(screen.getByText("🎉 Spotify 계정에 저장 완료!")).toBeInTheDocument();
    });
  });

  it("calls AI metadata recommendation API and updates the inputs on button click", async () => {
    const mockProfile = { id: "user", displayName: "Name", email: "a@a.com", product: "premium" };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/spotify/profile") {
        return { ok: true, json: async () => mockProfile } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    });

    render(<HomePage isAuthenticated={true} />);

    // Load test data
    fireEvent.click(screen.getByRole("button", { name: "테스트용 3곡 로드" }));

    // Mock recommend endpoint
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/curate/recommend-metadata") {
        return {
          ok: true,
          json: async () => ({
            title: "AI Recommended Title",
            description: "AI Recommended Description text",
          }),
        } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    });

    // Trigger AI recommendation
    fireEvent.click(screen.getByTestId("ai-recommend-metadata-button"));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/curate/recommend-metadata", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userPrompt: "퇴근길에 들을 수 있는 차분하지만 리듬감 있는 playlist",
          tracks: [
            { title: "Stay", artistName: "The Kid LAROI, Justin Bieber" },
            { title: "Coffee", artistName: "beabadoobee" },
            { title: "Comethru", artistName: "Jeremy Zucker" },
          ],
        }),
      }));

      const titleInput = screen.getByTestId("playlist-title-input") as HTMLInputElement;
      const descInput = screen.getByTestId("playlist-description-input") as HTMLTextAreaElement;

      expect(titleInput.value).toBe("AI Recommended Title");
      expect(descInput.value).toBe("AI Recommended Description text");
    });
  });
});
