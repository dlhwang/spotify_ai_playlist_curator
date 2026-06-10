import { screen, waitFor } from "@testing-library/react";
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
        name: /분위기 맞춤형 AI 플레이리스트/
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
});
