# U-002 Spotify Auth Session NFR Requirements

<!-- markdownlint-disable MD013 -->
<!-- markdownlint-disable MD024 -->

## 범위

U-002는 Spotify OAuth 로그인, 콜백 처리, 쿠키 기반 세션 관리, 액세스 토큰 자동 갱신(Refresh) 로직을 포함한다. 본 문서는 해당 기능 구현 시 필요한 비기능적 요구사항(보안, 만료 제어, 오류 대응, 테스트 가능성)과 인수 기준을 규정한다.

## NFR-001: Session Cookie Security and Integrity

### Requirement

Spotify OAuth 완료 후 발급되는 토큰 세션을 브라우저 쿠키에 안전하고 무결하게 보관해야 한다.

### Acceptance Criteria

- 세션 쿠키는 `HttpOnly`, `SameSite=Lax`, production 환경에서는 `Secure` 속성을 반드시 가져야 한다.
- 세션 쿠키 페이로드는 클라이언트 측 JavaScript에서 접근할 수 없어야 한다.
- 세션 데이터의 변조를 방지하기 위해 `SESSION_SECRET`을 기반으로 한 HMAC 서명을 사용해 서버에서 변조 여부를 검증해야 한다.
- 세션 페이로드는 `access_token`, `refresh_token`, `expires_at` (만료 타임스탬프)를 포함하는 JSON 구조여야 한다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 쿠키 생성 시 보안 속성 적용 및 HMAC 서명 검증 로직 단위 테스트 통과 결과

---

## NFR-002: Session Expiry and Token Refresh

### Requirement

사용자가 앱을 지속적으로 사용할 수 있도록 세션 쿠키 만료 시간은 길게 유지하고, API 요청 시 액세스 토큰 만료를 감지하여 자동으로 토큰을 갱신한다.

### Acceptance Criteria

- 세션 쿠키의 `maxAge`는 명시적으로 길게 설정한다. (예: 14일 또는 Refresh Token 만료에 맞춤)
- Route Handler 내부에서 Spotify API를 호출하기 전에 세션 내 `expires_at`을 검사하여, 만료되었거나 만료 임박(예: 5분 전)인 경우 Spotify Refresh Token API를 통해 자동으로 Access Token을 갱신한다.
- 토큰 갱신 성공 시, 갱신된 Access Token과 새로운 만료 시간을 반영하여 세션 쿠키를 업데이트(Set-Cookie)해야 한다.
- Refresh Token이 만료되거나 해제되어 갱신에 실패하는 경우, 세션 쿠키를 즉시 삭제(파기)하고 에러 코드와 함께 로그인 페이지(홈)로 리다이렉트 처리한다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 자동 Refresh 성공 시 쿠키 업데이트 및 실패 시 세션 파기/리다이렉트 단위 테스트 결과

---

## NFR-003: OAuth State Validation for CSRF Protection

### Requirement

OAuth 인증 과정 중 발생할 수 있는 Cross-Site Request Forgery (CSRF) 공격을 방지하기 위해 OAuth `state` 검증을 수행한다.

### Acceptance Criteria

- 인증 요청 시작 단계에서 암호학적으로 안전한 무작위 `state` 값을 생성하여 HttpOnly `spotify_auth_state` 임시 쿠키에 저장한다.
- Spotify Redirect Callback Route Handler에서 수신한 `state` 쿼리 파라미터 값과 `spotify_auth_state` 쿠키 값을 비교 검증한다.
- 검증 성공 여부와 관계없이 콜백 처리가 끝나면 `spotify_auth_state` 쿠키는 즉시 삭제해야 한다.
- `state` 불일치 시 인증 프로세스를 차단하고 적절한 에러 파라미터와 함께 홈 화면으로 리다이렉트해야 한다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: State 불일치 시 에러 차단 및 검증 후 State 쿠키 삭제 테스트 통과 결과

---

## NFR-004: Error Handling and Observability Boundary

### Requirement

OAuth 인증 및 토큰 교환 실패 시, 브라우저에는 상세 오류 정보 노출을 최소화하고 서버 로그에는 문제를 추적할 수 있도록 상세 에러 범위를 기록한다.

### Acceptance Criteria

- 클라이언트 리다이렉트 시에는 `error=auth_failed`, `error=state_mismatch` 와 같은 정의된 대표 오류 코드만 노출한다.
- 서버 로그에는 Spotify API가 반환한 구체적인 에러 메시지(예: `invalid_grant`, `invalid_client` 등)와 에러가 발생한 지점(Callback, Refresh) 정보를 로깅한다.
- Spotify API의 Rate Limit(HTTP 429) 발생 시, 오류 내용을 기록하여 향후 모니터링이 가능하게 한다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 인증 실패 리다이렉트 시 간소화된 에러 쿼리 파라미터 검증 및 로깅 유틸리티 테스트 결과

---

## NFR-005: Mocking and Testability of Spotify Web API

### Requirement

로컬 개발 및 CI 빌드 시 실제 Spotify API나 개발자 Credential이 준비되지 않은 상태에서도 테스트를 수행할 수 있어야 한다.

### Acceptance Criteria

- Spotify Authorize/Token Endpoint 호출부를 추상화하거나, 모킹 가능한 구조(Vitest mock 또는 Fetch mock)로 작성한다.
- 환경 변수 `SPOTIFY_CLIENT_ID`나 `SPOTIFY_CLIENT_SECRET`이 없어도 빌드와 테스트가 실패하지 않아야 하며, 환경 변수 부재 시 적절한 경고나 Mock 모드로 동작해야 한다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: Mock을 사용해 외부 Spotify 연동 없이 실행되는 단위 테스트 결과

---

## Exclusions

- 세션 쿠키 페이로드의 강력한 대칭 암호화(AES-GCM 등)는 MVP 보안 제약에서 제외하며, HMAC 무결성 검증으로 대체한다. (후속 개선으로 전환)
- MFA(다요소 인증)는 Spotify 자체 OAuth 화면에서 위임 처리하므로 본 MVP의 NFR 범위에서 제외한다.
