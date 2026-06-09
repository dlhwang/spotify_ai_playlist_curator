import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/lib/testing/render";
import { HomePage } from "./home-page";

describe("HomePage", () => {
  it("renders the MVP start actions when not authenticated", () => {
    render(<HomePage isAuthenticated={false} />);

    expect(
      screen.getByRole("heading", {
        name: /지금 분위기에 맞는 Spotify playlist를 바로 만듭니다/
      })
    ).toBeInTheDocument();
    expect(screen.getByTestId("home-connect-spotify-button")).toBeInTheDocument();
    expect(screen.getByTestId("home-preview-flow-button")).toBeInTheDocument();
  });

  it("renders the connected status when authenticated", () => {
    render(<HomePage isAuthenticated={true} />);

    expect(screen.getByTestId("home-status-connected")).toBeInTheDocument();
    expect(screen.getByTestId("home-disconnect-spotify-button")).toBeInTheDocument();
    expect(screen.queryByTestId("home-connect-spotify-button")).toBeNull();
  });
});
