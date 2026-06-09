# U-002 Domain Entities

<!-- markdownlint-disable MD024 -->

## AuthSession

```ts
type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  tokenType: "Bearer";
};
```

### Notes

- server-only 영역에서만 사용한다.
- client 응답으로 직렬화하지 않는다.
- cookie payload로 저장할 때 서명 또는 암호화 가능한 wrapper를 사용한다.

## SpotifyTokenSet

```ts
type SpotifyTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  tokenType: "Bearer";
};
```

### Notes

- Spotify token endpoint 응답을 애플리케이션 내부 형식으로 변환한 값이다.
- `expiresIn`은 seconds 기준이며 `AuthSession.expiresAt` 계산에 사용한다.

## OAuthState

```ts
type OAuthState = {
  value: string;
  createdAt: number;
};
```

### Notes

- login 시작 시 생성한다.
- callback 검증 후 제거한다.
- 짧은 수명을 가진다.

## AuthSessionStatus

```ts
type AuthSessionStatus =
  | {
      authenticated: true;
    }
  | {
      authenticated: false;
      error?: AuthErrorCode;
    };
```

### Notes

- client로 반환 가능한 인증 상태 모델이다.
- token 값을 포함하지 않는다.

## AuthErrorCode

```ts
type AuthErrorCode =
  | "AUTH_FAILED"
  | "AUTH_STATE_MISMATCH"
  | "AUTH_REQUIRED"
  | "AUTH_SESSION_INVALID"
  | "TOKEN_EXCHANGE_FAILED";
```

## AuthService Contract

```ts
interface AuthService {
  buildLoginRedirect(): Promise<Response>;
  handleCallback(input: OAuthCallbackInput): Promise<Response>;
  readSessionStatus(): Promise<AuthSessionStatus>;
  readServerSession(): Promise<AuthSession | null>;
  refreshSession(session: AuthSession): Promise<AuthSession>;
  clearSession(): Promise<void>;
}
```

## OAuthCallbackInput

```ts
type OAuthCallbackInput = {
  code?: string;
  state?: string;
  error?: string;
};
```

## Cookie Names

| Cookie | Purpose | Client Visible |
| --- | --- | --- |
| `spotify_oauth_state` | callback state 검증 | No |
| `spotify_auth_session` | token session payload | No |

## Entity Relationships

```text
OAuthState
  -> validates OAuthCallbackInput.state
SpotifyTokenSet
  -> creates AuthSession
AuthSession
  -> produces AuthSessionStatus without token values
AuthErrorCode
  -> query parameter and session status error
```
