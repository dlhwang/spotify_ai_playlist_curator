# U-002 Business Logic Model

<!-- markdownlint-disable MD024 -->

## 범위

U-002는 Spotify OAuth 인증 시작, callback 처리, HttpOnly cookie 기반 session,
인증 상태 조회를 담당한다. Spotify 사용자 데이터 조회, playlist 생성,
큐레이션 도메인은 후속 단위에서 처리한다.

## 주요 흐름

## Flow F-001: OAuth Login Start

### Input

- 사용자의 로그인 시작 요청
- 서버 환경 변수:
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_REDIRECT_URI`
  - `SESSION_SECRET`

### Process

1. 서버가 random `state` 값을 생성한다.
2. `state`를 별도 HttpOnly cookie에 저장한다.
3. Spotify authorization URL을 생성한다.
4. 필요한 scope를 URL에 포함한다.
5. 사용자를 Spotify authorization URL로 redirect한다.

### Output

- Spotify authorization URL redirect
- `spotify_oauth_state` HttpOnly cookie

## Flow F-002: OAuth Callback Success

### Input

- Spotify callback query:
  - `code`
  - `state`
- `spotify_oauth_state` cookie

### Process

1. callback query의 `state`와 cookie의 state를 비교한다.
2. state가 없거나 일치하지 않으면 인증 실패로 처리한다.
3. authorization `code`를 Spotify token endpoint로 교환한다.
4. access token, refresh token, expiresAt을 session payload로 만든다.
5. session payload를 서명 또는 암호화 가능한 형태로 HttpOnly cookie에 저장한다.
6. 일회성 state cookie를 제거한다.
7. 홈으로 redirect한다.

### Output

- `spotify_auth_session` HttpOnly cookie
- 홈 redirect

## Flow F-003: OAuth Callback Failure

### Input

- Spotify callback query:
  - `error`
  - optional `state`

### Process

1. Spotify가 반환한 `error`를 대표 오류 코드로 변환한다.
2. 가능한 경우 state cookie를 제거한다.
3. 홈으로 redirect하면서 query parameter에 오류 코드를 포함한다.

### Output

- 홈 redirect 예: `/?authError=AUTH_FAILED`

## Flow F-004: Session Read

### Input

- `spotify_auth_session` HttpOnly cookie

### Process

1. cookie가 없으면 unauthenticated 상태를 반환한다.
2. cookie payload 서명 또는 무결성을 검증한다.
3. payload가 손상되었거나 만료 기준을 충족하지 못하면 unauthenticated 상태를
   반환한다.
4. 유효하면 token 값은 숨기고 인증 상태와 expiresAt만 내부적으로 사용한다.

### Output

- Client response:
  - `authenticated: true | false`
  - token 값 없음

## Flow F-005: Token Refresh Contract

### Input

- `AuthSession`
- 현재 시간

### Process

1. access token 만료 시각이 충분히 남았으면 기존 session을 유지한다.
2. 만료되었거나 refresh threshold 안에 있으면 refresh token으로 갱신한다.
3. 갱신 성공 시 새 session payload를 cookie에 저장한다.
4. 갱신 실패 시 session을 제거하고 재로그인이 필요한 오류로 처리한다.

### Output

- 갱신된 `AuthSession`
- 또는 `AUTH_REQUIRED` / `AUTH_FAILED`

## Scope 후보

MVP에 필요한 scope는 Functional Design 기준으로 다음을 후보로 둔다.

- `user-read-recently-played`
- `playlist-modify-private`
- `playlist-modify-public`

최종 scope 문자열은 Code Generation에서 상수로 정의하되, public playlist 생성
여부는 후속 UI와 정책에서 제한 가능해야 한다.
