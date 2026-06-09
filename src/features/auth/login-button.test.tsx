import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginButton } from "./login-button";

describe("LoginButton", () => {
  let locationSpy: {
    href: string;
    assign: ReturnType<typeof vi.fn>;
    replace: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock window.location using Object.defineProperty to satisfy TypeScript
    const mockLocation = new URL("http://localhost:3000");
    locationSpy = {
      href: mockLocation.href,
      assign: vi.fn(),
      replace: vi.fn(),
    };

    Object.defineProperty(window, "location", {
      writable: true,
      value: locationSpy,
    });
  });

  it("should render correctly with Spotify icon", () => {
    render(<LoginButton />);
    const button = screen.getByTestId("spotify-login-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Spotify로 연결하기");
  });

  it("should redirect to spotify login endpoint when clicked", () => {
    render(<LoginButton />);
    const button = screen.getByTestId("spotify-login-button");

    fireEvent.click(button);
    expect(window.location.href).toBe("/api/spotify/login");
  });
});
