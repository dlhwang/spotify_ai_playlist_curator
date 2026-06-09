# U-004 Curation Engine / LLM Client NFR Requirements

<!-- markdownlint-disable MD013 -->
<!-- markdownlint-disable MD024 -->

## 범위

U-004는 AI 큐레이션 및 LLM 연동 기능과 관련된 성능(타임아웃), 안정성(예외 파싱 복구), 모의 객체(Mock) 연동 및 테스트 고립 요구사항을 규정합니다.

## NFR-001: LLM API Timeout Boundary (Question 1 - Option A)

### Requirement

LLM API 호출 시 지연이 발생하더라도 Next.js API Route Handler 레벨에서 전체 요청이 무기한 차단되거나 지연되지 않도록 상한선을 제약해야 합니다.

### Acceptance Criteria

- LLM API를 호출하는 비즈니스 레이어(`LlmClient` 등)에 **최대 10초**의 명시적 제한시간(Timeout)을 설정해야 합니다.
- 10초 이내에 응답이 수신되지 않을 경우, HTTP 요청을 강제 중단(Abort)하고 타임아웃 예외를 발생시켜 폴백 처리가 동작되도록 해야 합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 10초 이상의 응답 지연이 발생하는 가상 환경을 모킹하여 타임아웃 예외가 정상적으로 발생하고 디폴트 폴백 동작으로 이어지는지 테스트

---

## NFR-002: Parsing Resilience & Default Fallback

### Requirement

LLM 응답이 개발자가 요구한 JSON 포맷을 따르지 않거나 파싱 중 오류가 발생할 때, 전체 프로세스가 즉시 실패하지 않고 부드럽게 복구될 수 있어야 합니다.

### Acceptance Criteria

- LLM API 응답 데이터의 JSON 파싱 실패(`SyntaxError` 등) 시, 1회 즉각 재시도(Retry) 요청을 보내 복구를 시도합니다.
- 재시도 요청마저 실패하거나 파싱에 실패하는 경우, 사전에 정의된 디폴트 폴백 플레이리스트 데이터 구조(최근 재생 목록 트랙들 기반의 추천 및 기본 타이틀/설명)를 반환하여 호출 측이 정상적인 흐름을 유지할 수 있게 합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 잘못된 포맷의 LLM 응답을 모의 주입하여 1회 재시도가 트리거되는지 확인하고, 최종 실패 시 디폴트 폴백 데이터가 정상 반환되는지 확인하는 테스트

---

## NFR-003: API Key Missing & Mock LLM Integration (Question 2 - Option B)

### Requirement

실제 OpenAI/Gemini API Key가 누락되었거나 로컬 개발 및 테스트 실행 모드(`MOCK_LLM=true` 혹은 API Key 비활성화)일 때, 전체 서비스가 정상 기동되고 가벼운 동작 확인이 가능해야 합니다.

### Acceptance Criteria

- API Key 환경 변수가 존재하지 않거나 명시적인 모크 모드가 활성화된 경우, 원격 LLM 서버로 요청을 전송하지 않고 사전에 정의된 1~2종의 고정된 정적(static) 더미 데이터를 즉시 반환하도록 Mock LLM 동작을 연결합니다.
- Mock LLM 응답 데이터 구조는 비즈니스 모델 규격(`CuratedPlaylist`)을 엄격하게 준수해야 합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: API Key가 누락된 상황을 연출하고 Mock LLM 활성화 시 정해진 정적 더미 플레이리스트 구조가 규격대로 즉각 반환되는지 검증하는 테스트

---

## NFR-004: Mocking and Local Testability

### Requirement

원격 API 연동 및 외부 네트워크 가용 여부와 무관하게 로컬 및 CI 테스트 빌드 과정이 고립되어 안전하게 통과되어야 합니다.

### Acceptance Criteria

- 외부 LLM API(예: OpenAI, Gemini 등)를 호출하는 fetch 또는 Client 객체를 완전히 모킹(Mocking)할 수 있는 구조를 마련하여 외부 통신을 원천 차단합니다.
- 테스트 시점에 불필요한 네트워크 의존성을 제거하여 테스트 실행 시간이 1초 내외로 유지되도록 설계합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 외부 인터넷을 명시적으로 차단하거나 차단된 단위 테스트 환경에서 전체 단위 테스트가 100% 성공 통과함을 보여주는 증빙
