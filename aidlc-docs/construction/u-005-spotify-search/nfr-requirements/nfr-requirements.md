# U-005 Spotify Search NFR Requirements

<!-- markdownlint-disable MD013 -->
<!-- markdownlint-disable MD024 -->

## 범위

U-005는 Spotify Search API 연동 및 트랙 매핑 기능과 관련된 성능(병렬화 및 타임아웃), 안정성(일부 곡 실패 시 복구), 모의 객체(Mock) 검색 모드 지원 및 테스트 고립 요구사항을 규정합니다.

## NFR-001: Parallel Search & Individual Timeout (Question 1 - Option A)

### Requirement

추천된 여러 곡에 대해 Spotify Search API를 호출할 때, 전체 프로세스 지연을 방지하기 위해 병렬 호출 구조를 취하고 각 개별 API 호출의 타임아웃 한계를 두어 병목을 조기에 예방합니다.

### Acceptance Criteria

- AI가 추천한 곡 리스트(보통 5~10곡)를 검색할 때 `Promise.all`을 사용하여 병렬 비동기 호출을 수행합니다.
- 각 검색 API 호출당 **최대 5초**의 AbortController 기반 개별 타임아웃을 적용하여, 특정 곡의 검색이 무한 블로킹되거나 전체 응답 시간을 크게 늘리는 현상을 방지합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 개별 검색 API 호출 중 특정 곡에 대해 5초 이상의 응답 지연이 발생할 때, 해당 호출이 정상적으로 Abort되고 나머지 곡들의 검색 완료 흐름이 방해받지 않는지 테스트로 검증합니다.

---

## NFR-002: Mapping Resilience (Individual Skip & Validation)

### Requirement

특정 곡의 검색이 실패하거나 결과가 없더라도 전체 플레이리스트 생성 프로세스가 비정상 종료되지 않고, 성공적으로 매핑된 트랙만으로 유연하게 서비스를 이어갈 수 있어야 합니다.

### Acceptance Criteria

- Spotify Search API 호출 중 특정 곡에서 에러(404, 429, 500, 혹은 타임아웃 등)가 발생하거나 매핑 결과가 없는 경우, 해당 오류는 로그 파일에만 기록하고 스킵하여 다른 트랙의 매핑 흐름을 중단하지 않습니다.
- 단, 모든 트랙 검색을 완료한 후 실제 Spotify URI로 매핑에 성공한 결과가 **0개**인 경우에는 매핑 예외(`Curation Mapping Failure` 등)를 발생시켜 플레이리스트 생성 단계로 넘어가지 않도록 방지합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 3곡 중 1곡만 Spotify 검색 API 에러를 발생시키는 환경에서 나머지 2곡은 정상적으로 매핑된 결과에 포함되는지 확인하고, 3곡 모두 검색에 실패하는 환경에서는 적절한 매핑 예외가 발생하는지 검증하는 테스트를 구현합니다.

---

## NFR-003: Mock Search Support for Local Development (Question 2 - Option A)

### Requirement

로컬 개발 환경이거나 `.env.local` 파일에 Spotify API Credential(Client ID/Secret)이 정상 설정되지 않았을 때도 애플리케이션의 큐레이션 및 매핑 흐름이 원활히 동작하여 개발/시연이 가능해야 합니다.

### Acceptance Criteria

- Spotify API 인증 설정이 비활성화되었거나 누락된 상태일 때, 원격 API 호출을 건너뛰고 입력된 곡명/아티스트명 정보를 그대로 사용하여 가짜 Spotify URI(`spotify:track:mock-{name_hash}`)를 100% 매핑에 성공하는 Mock Search 기능을 제공합니다.
- Mock Search 동작의 활성화 여부는 환경 변수나 설정 상태에 따라 유연하게 제어되어야 합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: Spotify API Credential이 없는 모의 환경에서 Mock Search를 활성화했을 때, 입력된 트랙명들을 기반으로 생성된 모크 트랙 URI들이 온전하게 결과에 매핑되는지 검증합니다.

---

## NFR-004: Testing Isolation

### Requirement

외부 네트워크 상태나 실제 Spotify API 자격 증명의 만료 여부와 무관하게 로컬 및 빌드 파이프라인에서 테스트가 결정론적(deterministic)이며 안전하게 통과되어야 합니다.

### Acceptance Criteria

- Spotify Search API를 호출하는 fetch 통신을 완전히 Mocking할 수 있는 테스트 환경 구조를 갖추어 외부 네트워크 의존성을 제거합니다.
- 테스트 기동 중 네트워크 지연으로 인한 불안정성을 최소화하기 위해 모킹 응답 속도를 극대화하여 테스트 실행 속도를 유지합니다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 외부 통신이 원천 차단된 고립 환경에서 Spotify Search 관련 모든 단위 및 통합 테스트가 100% 성공 통과함을 보여줍니다.
