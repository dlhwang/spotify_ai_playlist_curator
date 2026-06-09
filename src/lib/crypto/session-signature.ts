import crypto from "crypto";

export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // UNIX timestamp in milliseconds
}

/**
 * Signs the session payload using HMAC-SHA256 and returns a token in format "data.signature".
 */
export function signSession(payload: SessionPayload, secret: string): string {
  const data = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies the signed session token and returns the decoded payload, or null if invalid/tampered.
 */
export function verifySession(
  signedSession: string,
  secret: string
): SessionPayload | null {
  try {
    const parts = signedSession.split(".");
    if (parts.length !== 2) {
      return null;
    }
    const [data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    return JSON.parse(data) as SessionPayload;
  } catch {
    return null;
  }
}
