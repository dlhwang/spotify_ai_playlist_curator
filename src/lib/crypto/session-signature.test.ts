import { describe, it, expect } from "vitest";
import { signSession, verifySession, SessionPayload } from "./session-signature";

describe("session-signature", () => {
  const mockPayload: SessionPayload = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresAt: Date.now() + 3600 * 1000
  };
  const secret = "test-secret-key-must-be-long-enough";

  it("should successfully sign and verify a session payload", () => {
    const signed = signSession(mockPayload, secret);
    expect(signed).toContain(".");

    const verified = verifySession(signed, secret);
    expect(verified).not.toBeNull();
    expect(verified?.accessToken).toBe(mockPayload.accessToken);
    expect(verified?.refreshToken).toBe(mockPayload.refreshToken);
    expect(verified?.expiresAt).toBe(mockPayload.expiresAt);
  });

  it("should return null if the signature is invalid", () => {
    const signed = signSession(mockPayload, secret);
    const tampered = signed + "tamper";

    const verified = verifySession(tampered, secret);
    expect(verified).toBeNull();
  });

  it("should return null if the payload data is tampered", () => {
    const signed = signSession(mockPayload, secret);
    const parts = signed.split(".");
    const tamperedData = parts[0].replace("mock-access-token", "hacked-token");
    const tampered = `${tamperedData}.${parts[1]}`;

    const verified = verifySession(tampered, secret);
    expect(verified).toBeNull();
  });

  it("should return null if verified with a different secret", () => {
    const signed = signSession(mockPayload, secret);
    const verified = verifySession(signed, "different-secret-key");
    expect(verified).toBeNull();
  });

  it("should return null for malformed tokens", () => {
    expect(verifySession("no-dots-in-token", secret)).toBeNull();
    expect(verifySession("one.two.three-dots", secret)).toBeNull();
  });
});
