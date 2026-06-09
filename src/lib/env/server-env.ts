const REQUIRED_SERVER_ENV_KEYS = [
  "SPOTIFY_CLIENT_ID",
  "SPOTIFY_CLIENT_SECRET",
  "SPOTIFY_REDIRECT_URI",
  "SESSION_SECRET"
] as const;

export type ServerEnvKey = (typeof REQUIRED_SERVER_ENV_KEYS)[number] | "LLM_API_KEY";

export type ServerEnvValidationResult =
  | {
      ok: true;
      missing: [];
    }
  | {
      ok: false;
      missing: ServerEnvKey[];
};

type ServerEnvSource = Partial<Record<string, string | undefined>>;

export function validateServerEnv(
  source: ServerEnvSource
): ServerEnvValidationResult {
  const missing = REQUIRED_SERVER_ENV_KEYS.filter((key) => !source[key]);

  if (missing.length > 0) {
    return {
      ok: false,
      missing
    };
  }

  return {
    ok: true,
    missing: []
  };
}

export function getRequiredServerEnv(
  key: ServerEnvKey,
  source: ServerEnvSource = process.env
) {
  const value = source[key];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }

  return value;
}
