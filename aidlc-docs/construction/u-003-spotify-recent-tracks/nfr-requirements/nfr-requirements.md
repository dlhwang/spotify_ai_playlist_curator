# U-003 최근 재생 곡 연동 NFR Requirements

<!-- markdownlint-disable MD013 -->
<!-- markdownlint-disable MD024 -->

## 범위

U-003은 Spotify 최근 재생 곡 수집 기능과 관련된 성능, 안정성, 예외 전파, 로컬 테스트 가능성 요구사항을 규정합니다.

## NFR-001: Spotify API Timeout Boundary (Question 1 - Option A)

### Requirement

Spotify Web API 호출 시 외부 네트워크 지연으로 인해 전체 요청이 무기한 블로킹되는 현상을 방지해야 합니다.

### Acceptance Criteria

- 최근 재생 곡 조회 API(`GET /v1/me/player/recently-played`) 호출을 담당하는 HTTP 요청 클라이언트(`SpotifyClient` 등)에 **최대 5초**의 명시적 제한시간(Timeout)을 설정해야 합니다.
- API 응답이 5초 이내에 수신되지 않는 경우, 요청을 강제 중단(Abort)하고 타임아웃 예외를 트리거해야 합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 5초 이상의 응답 지연을 인위적으로 발생시킨 모킹 테스트 환경에서 타임아웃 예외가 정상 트리거되는지 단위 테스트 검증 결과

---

## NFR-002: API Error Observability & Redirection (Question 3 - Option A)

### Requirement

인증 갱신 시도 이후에도 Spotify API 호출이 최종 실패(403 Forbidden, 429 Rate Limit, 5xx Server Error, 5초 타임아웃 초과 등)하는 경우, 보안성 유지를 위해 사용자 화면에는 간소화된 대표 오류 코드만 노출하고 서버 로그에는 구체적인 분석 정보를 남겨야 합니다.

### Acceptance Criteria

- 외부 API 통신 실패 및 복구 불가능한 장애 감지 시 즉시 라우팅 처리를 중단하고, 사용자를 `error=spotify_api_error` 대표 쿼리 파라미터가 포함된 홈 주소(`/`)로 안전하게 리다이렉트하거나 홈 화면에 해당 대표 오류를 노출합니다.
- 서버 로그에는 Spotify API가 반환한 구체적인 에러 객체(상태 코드, 원시 응답 내용, 호출 파라미터 정보)를 예외 발생 시점 정보와 함께 상세히 로깅하여 사후 관측성을 제공합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: API 호출 실패 시 대표 에러 쿼리로 리다이렉트 처리되는 로직 및 에러 로깅 유틸 호출 테스트 결과

---

## NFR-003: Token Refresh Reliability in HTTP Client

### Requirement

사용자의 Access Token이 만료된 상황(401 Unauthorized)에서도 비즈니스 흐름이 깨지지 않고 부드럽게 복구되어야 합니다.

### Acceptance Criteria

- API 요청 시 `401 Unauthorized` 오류가 수신되는 경우, 백엔드 서비스 단에서 `AuthService`를 호출하여 쿠키 내 Refresh Token을 기준으로 Access Token을 자동 재발급(1회)합니다.
- 토큰 재발급 성공 시, 새 토큰으로 세션을 즉시 업데이트(Set-Cookie)하고 실패했던 Spotify API 요청을 단 1회 자동으로 다시 호출(Retry)합니다.
- 만약 리프레시 토큰도 만료되었거나 2차 호출마저 실패하는 경우, 세션을 파기하고 홈(`/`)으로 리다이렉트합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 최초 401 오류 발생 시 자동 토큰 리프레시 후 재시도 성공 시나리오와, 최종 실패 시 세션 파기 시나리오 단위 테스트 결과

---

## NFR-004: Mocking and Local Testability

### Requirement

실제 Spotify 개발자 Credential 및 원격 네트워크 의존성 없이 로컬 빌드 및 CI 환경에서 안전하게 연동 및 비즈니스 테스트를 통과할 수 있어야 합니다.

### Acceptance Criteria

- `SpotifyClient` 또는 `fetch` 레이어를 완전히 가로챌 수 있는 모킹 구조(Vitest mock 또는 Node Fetch mock)를 마련하여 외부 인터넷 연결 없이 가짜 JSON 데이터를 주입받아 테스트할 수 있도록 설계합니다.
- 빌드 시점에 환경 변수 누락으로 빌드가 깨지지 않도록 모킹 레이어의 무의존성 수준을 보장해야 합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: Mock 데이터 소스 하에 전체 도메인 정제 및 자동 토큰 갱신 프로세스가 완전하게 구동되는 단위 테스트 결과
