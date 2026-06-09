# U-002 Spotify Auth Session Code Generation 계획

<!-- markdownlint-disable MD013 MD053 -->

## 단위 컨텍스트

- **Unit**: U-002 Spotify Auth Session
- **Workspace Root**: `D:\workspace\spotify_aI_playlist_curator`
- **Project Type**: Greenfield monolith Next.js application
- **Application Code Location**: 워크스페이스 루트
- **Documentation Location**: `aidlc-docs/construction/u-002-spotify-auth-session/code/`
- **Stories**: S-001 (사용자 로그인 및 Spotify 연동), S-002 (인증 완료 및 세션 유지), S-005 (세션 갱신 및 토큰 Refresh)
- **Requirements**: NFR-001 (Session Cookie Security), NFR-002 (Session Expiry/Token Refresh), NFR-003 (OAuth State CSRF), NFR-004 (Error Handling/Observability), NFR-005 (Mocking/Testability)

## 생성 접근

U-002는 사용자 인증 및 세션 제어를 담당하는 단위이다. Spotify OAuth 2.0 Authorization Code Flow를 준수하여 State 검증(CSRF 방지), HMAC 서명을 통한 세션 무결성 검증, 쿠키 기반 HttpOnly 세션 관리 및 백엔드 측 토큰 갱신(Refresh)을 구현한다.
테스트 시 Spotify API에 의존하지 않도록 서비스 레이어를 분리하고 Vitest mock을 적극 활용한다.

## 대상 경로

### Application Code

- `.env.example` (Spotify API Credentials 및 `SESSION_SECRET` 변수 추가)
- `src/lib/crypto/session-signature.ts` (HMAC 서명 및 검증 로직)
- `src/lib/crypto/session-signature.test.ts`
- `src/server/services/auth-service.ts` (OAuth 토큰 교환, 쿠키 파싱/발급, 자동 갱신 비즈니스 서비스)
- `src/server/services/auth-service.test.ts`
- `app/api/spotify/login/route.ts` (OAuth 로그인 진입점, State 임시 쿠키 생성 및 Spotify Authorization URI 생성)
- `app/api/spotify/callback/route.ts` (OAuth 콜백 처리, State 검증, 토큰 교환, 세션 쿠키 발급 및 리다이렉트)
- `app/api/spotify/refresh/route.ts` (세션 토큰 강제/자동 갱신 확인용 API Route Handler)
- `src/features/auth/login-button.tsx` (Spotify 로그인 버튼 UI 컴포넌트)
- `src/features/auth/login-button.test.tsx`
- `app/page.tsx` (로그인 유무 상태에 따른 UI 반응 및 로그인 버튼 노출 수정)

### Documentation

- `aidlc-docs/construction/u-002-spotify-auth-session/code/code-summary.md`

## 실행 단계

### Step 1: Crypto Boundary Generation

- [x] `src/lib/crypto/session-signature.ts`를 생성하여 `SESSION_SECRET`을 기반으로 한 세션 데이터 직렬화, 서명 및 무결성 검증 로직을 구현한다.
- [x] `src/lib/crypto/session-signature.test.ts`를 생성하여 유효한 서명과 변조된 서명에 대한 검증 단위 테스트를 작성한다.

### Step 2: Auth Service Generation

- [x] `src/server/services/auth-service.ts`를 생성한다.
  - Spotify Token URL로 Authorization Code를 Access/Refresh Token으로 교환하는 기능 구현.
  - Refresh Token으로 Access Token을 갱신하는 기능 구현.
  - 쿠키에서 세션을 복원하고 서명을 검증하는 기능 구현.
- [x] `src/server/services/auth-service.test.ts`를 생성하고 Vitest mock/Node Fetch mock을 사용해 외부 네트워크 의존성 없는 단위 테스트를 작성한다.

### Step 3: Route Handlers Generation

- [x] `app/api/spotify/login/route.ts`를 작성하여 `state` 임시 쿠키 생성 및 리다이렉트 로직 구현.
- [x] `app/api/spotify/callback/route.ts`를 작성하여 `state` 검증, 세션 쿠키 서명 발급 및 에러 발생 시 `/` 리다이렉트(에러 쿼리 파라미터 포함) 구현.
- [x] `app/api/spotify/refresh/route.ts`를 작성하여 현재 세션을 강제 갱신 테스트하는 Endpoint 구현.

### Step 4: UI and Integration

- [x] `src/features/auth/login-button.tsx`를 생성하여 Spotify 로그인 흐름을 호출할 수 있는 사용자 인터페이스 컴포넌트를 구성한다.
- [x] `src/features/auth/login-button.test.tsx` 단위 테스트 구현.
- [x] `app/page.tsx`를 수정하여 쿠키 세션 존재 여부에 따라 로그인 버튼을 노출하거나 세션 정보를 기반으로 한 기본 환영 문구를 띄우도록 연동한다.

### Step 5: Verification & Documentation

- [x] `npm run build`, `npm run typecheck`, `npm test`를 실행하여 타입 검증 및 단위 테스트의 통과를 확인한다.
- [x] `aidlc-docs/construction/u-002-spotify-auth-session/code/code-summary.md`에 결과 및 검증 결과를 작성한다.
- [x] 본 계획서의 체크박스를 업데이트하고 `aidlc-state.md`를 갱신한다.

## Requirement and Story Verification

| Requirement/Story | Evidence |
| :--- | :--- |
| NFR-001 (Cookie Security) | HttpOnly, Lax, Secure 플래그 설정 및 HMAC 서명 검증 테스트 |
| NFR-002 (Expiry & Refresh) | expires_at 기반 백엔드 내 자동 갱신 및 실패 시 쿠키 소멸 테스트 |
| NFR-003 (OAuth State CSRF) | state 불일치 시 차단, 임시 쿠키 즉시 소멸 로직 단위 테스트 |
| NFR-004 (Observability) | redirect 시 error_code 노출 및 에러 시 로깅 테스트 |
| NFR-005 (Mocking/Testability) | 외부 Spotify API 호출부를 Vitest mock으로 고립시킨 테스트 수행 |
| S-001 (User Login & Link) | 로그인 버튼 제공 및 Spotify OAuth 연동 핸들러 구성 |
| S-002 (Auth & Session Maintain) | 로그인 콜백 성공 시 세션 쿠키 세팅 및 사용자 정보 유지 |
| S-005 (Session Refresh) | 백엔드 내/외 토큰 자동 리프레시 검증 |

## 확인 질문

## Question 1

이 계획을 승인하고 U-002 Spotify Auth Session 코드 생성 단계를 진행할까요?

A) 승인하고 코드 생성을 진행
B) 계획 수정이 필요함 (의견 제공 필요)

[Answer]:A
