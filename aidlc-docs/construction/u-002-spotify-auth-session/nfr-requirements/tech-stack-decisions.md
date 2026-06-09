# U-002 기술 스택 결정

<!-- markdownlint-disable MD013 -->

## 결정 요약

| Area | Decision | Rationale |
| --- | --- | --- |
| Session Storage | HttpOnly Cookie (Signed) | 브라우저 JS 접근을 차단하여 XSS를 방지하고 서버에서 서명을 통해 위변조를 검증함 |
| Session Protection | HMAC-SHA256 Signature | MVP의 개발 속도와 보안 수준을 절충하기 위해 복잡한 양방향 암호화 대신 서명 검증만 적용함 |
| Session Life Cycle | Long-lived Session with Auto-Refresh | Spotify Refresh Token의 수명에 맞추어 세션 쿠키 수명을 길게(예: 14일) 유지하고 내부 Route Handler가 API 호출 시 자동 갱신함 |
| CSRF Protection | State Parameter & Temporary Cookie | OAuth 로그인 요청 시 생성한 무작위 State를 HttpOnly 쿠키와 Spotify 요청에 사용해 Callback 단계에서 위변조 확인 |
| Error Observability | Simple Query Error Code & Server-side Log | 브라우저 리다이렉트 시에는 간소화된 코드만 반환해 보안 정보를 숨기고, 서버 로그에는 Spotify 상세 원인 기록 |
| Testing Strategy | Vitest Mocking / Service Mock | Spotify Token API의 원격 의존성을 줄여 Credential 없이도 개발/CI 테스트가 원활하게 하도록 모킹 레이어 구현 |

## Test Strategy

### U-002 필수 검증 대상

- **OAuth URL Generation**: Client ID와 Scope, Redirect URI가 정상 결합되고 올바른 State가 쿼리에 포함되는지 검증.
- **State Validation**: Callback 요청 시 state 매칭 성공/실패 시나리오 검증, 검증 후 임시 쿠키가 삭제되는지 확인.
- **Session Signature Verification**: 유효하지 않은 서명을 가진 세션 쿠키 요청 시 인증 거부 및 세션 파기 여부 검증.
- **Token Refresh Behavior**: 세션 만료 임박 시 Refresh Token 호출을 트리거하고 새 쿠키를 정상 응답 헤더(`Set-Cookie`)에 반영하는지 검증.
- **Error Redirects**: Token Exchange 실패 등 예외 상황 발생 시 정의된 에러 파라미터와 함께 홈(`/`)으로 리다이렉트되는지 검증.

## Directory Strategy

```text
src/
  features/
    auth/                  # Spotify 로그인 버튼, 인증 상태 UI component
  server/
    auth/                  # OAuth Callback, Token Refresh 등 Route Handler
    services/
      auth-service.ts      # Token Exchange 및 Refresh, Cookie Sign/Verify 구현
  lib/
    crypto/                # HMAC 서명/검증 유틸리티
```

- `src/features/auth`: 인증 관련 프론트엔드 UI 컴포넌트
- `src/server/auth`: API Route Handler (`/api/spotify/login`, `/api/spotify/callback`, `/api/spotify/refresh`)
- `src/server/services/auth-service.ts`: OAuth 토큰 교환, 갱신 및 세션 관리 비즈니스 로직
- `src/lib/crypto`: 암호화 및 해시(서명) 관련 공통 유틸리티

## Environment Strategy

### 추가 검증 환경 변수

- `SESSION_SECRET`: 세션 쿠키 HMAC 서명 생성을 위한 비밀키 (서버 전용)
- `SPOTIFY_CLIENT_ID`: Spotify Developer Dashboard에서 발급받은 클라이언트 ID (서버 전용)
- `SPOTIFY_CLIENT_SECRET`: Spotify Developer Dashboard에서 발급받은 비밀키 (서버 전용)
- `SPOTIFY_REDIRECT_URI`: OAuth Callback 주소 (예: `http://localhost:3000/api/spotify/callback`)

## Rejected Options

- **JWT (JSON Web Token) 완전 암호화 (JWE)**: 쿠키 크기가 커지고 암복호화 키 관리가 추가로 필요하므로, 단기 MVP 요구사항 수준에서는 HMAC 서명만으로 세션 정보 오염을 충분히 방지 가능하다고 판단하여 보류함.
- **Memory/Redis Session Storage**: Vercel Serverless 환경 특성상 서버 메모리에 세션을 보관하면 다중 인스턴스 간 공유가 불가능하며, Redis 도입은 MVP 아키텍처 단순화(No DB) 원칙에 위배되므로 배제하고 self-contained signed cookie 방식을 채택함.
- **Short-lived Session with Manual Refresh UI**: 토큰 만료 시마다 사용자에게 다시 로그인을 요구하는 수동 방식은 플레이리스트 생성 등 백그라운드 큐레이션 흐름을 고려할 때 사용자 경험(UX)을 크게 해치므로 자동 갱신 방식을 우선함.
