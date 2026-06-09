# U-002 Business Rules

## BR-001: State 검증

- OAuth login 시작 시 state를 반드시 생성한다.
- state는 별도 HttpOnly cookie에 저장한다.
- callback의 query state와 cookie state가 일치해야 한다.
- state가 없거나 불일치하면 token 교환을 시도하지 않는다.

## BR-002: Token 비노출

- access token과 refresh token은 client JSON 응답에 포함하지 않는다.
- UI가 확인할 수 있는 값은 인증 여부와 대표 오류 상태뿐이다.
- token 값은 server-only module과 HttpOnly cookie 처리 경계 안에 머문다.

## BR-003: Session Cookie

- session cookie 이름은 `spotify_auth_session`으로 둔다.
- cookie는 HttpOnly로 설정한다.
- production에서는 Secure를 적용한다.
- SameSite는 OAuth redirect 호환성을 고려해 `lax`를 기본으로 둔다.
- payload에는 access token, refresh token, expiresAt을 포함한다.
- payload는 최소한 서명되어야 하며, 가능한 경우 암호화 가능한 구조로 둔다.

## BR-004: State Cookie

- state cookie 이름은 `spotify_oauth_state`로 둔다.
- state cookie는 HttpOnly로 설정한다.
- state cookie는 callback 성공 또는 실패 후 제거한다.
- state cookie의 수명은 짧게 둔다.

## BR-005: Refresh Contract

- `AuthService`는 access token refresh contract를 가진다.
- token이 만료되었거나 refresh threshold 안에 있으면 refresh를 시도한다.
- refresh 성공 시 session cookie를 갱신한다.
- refresh 실패 시 session을 제거하고 재로그인을 요구한다.
- 실제 Spotify data adapter의 API 호출 전 refresh 사용 방식은 U-003에서
  이어받는다.

## BR-006: Callback Error Handling

- Spotify가 `error` query를 반환하면 token 교환을 시도하지 않는다.
- 대표 오류 코드는 홈 query parameter로 전달한다.
- 오류 query는 민감 정보를 담지 않는다.
- 사용자가 다시 시도할 수 있도록 UI가 처리 가능한 오류 코드만 전달한다.

## BR-007: Auth Session Response

- `/api/spotify/auth/session`은 token 값을 반환하지 않는다.
- 인증됨 상태에서는 `{ authenticated: true }`를 반환한다.
- 인증되지 않음 상태에서는 `{ authenticated: false }`를 반환한다.
- 손상된 session cookie는 제거 대상으로 본다.

## 대표 오류 코드

| Code | Meaning | Retry |
| --- | --- | --- |
| AUTH_FAILED | OAuth callback 실패 또는 Spotify error | Yes |
| AUTH_STATE_MISMATCH | state 검증 실패 | Yes |
| AUTH_REQUIRED | session 없음 또는 refresh 실패 | Yes |
| AUTH_SESSION_INVALID | session payload 손상 | Yes |
| TOKEN_EXCHANGE_FAILED | code-token 교환 실패 | Yes |

## Validation Rules

- login route는 필요한 server env가 없으면 redirect 대신 server error를
  반환할 수 있다.
- callback route는 `code`와 `error`가 모두 없으면 `AUTH_FAILED`로 처리한다.
- `state`는 빈 문자열이면 유효하지 않다.
- `expiresAt`은 Unix epoch milliseconds로 저장한다.
