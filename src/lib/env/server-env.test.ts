import { describe, expect, it } from "vitest";
import { getRequiredServerEnv, validateServerEnv } from "./server-env";

describe("server-env", () => {
  it("reports missing required server variables", () => {
    const result = validateServerEnv({});

    expect(result).toEqual({
      ok: false,
      missing: [
        "SPOTIFY_CLIENT_ID",
        "SPOTIFY_CLIENT_SECRET",
        "SPOTIFY_REDIRECT_URI",
        "SESSION_SECRET"
      ]
    });
  });

  it("accepts all required server variables", () => {
    const result = validateServerEnv({
      SPOTIFY_CLIENT_ID: "client",
      SPOTIFY_CLIENT_SECRET: "secret",
      SPOTIFY_REDIRECT_URI: "http://localhost:3000/api/spotify/auth/callback",
      SESSION_SECRET: "session"
    });

    expect(result).toEqual({
      ok: true,
      missing: []
    });
  });

  it("throws when a required server variable is absent", () => {
    expect(() => getRequiredServerEnv("SESSION_SECRET", {})).toThrow(
      "Missing required server environment variable: SESSION_SECRET"
    );
  });
});
