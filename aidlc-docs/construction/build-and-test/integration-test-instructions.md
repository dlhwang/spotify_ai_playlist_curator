# 통합 테스트 안내서 (Integration Test Instructions)

<!-- markdownlint-disable MD013 -->

본 문서는 여러 컴포넌트 간 상호작용 및 API Route Handler 결합 흐름을 확인하는 통합 테스트 방법을 안내합니다.

## 통합 검증 범위

본 애플리케이션은 DB가 없는 서버리스 MVP 아키텍처를 지향하므로, 외부 영속성 저장소에 대한 연동 테스트 대신 API Route Handler 레벨에서의 종단간(End-to-End) 통합 흐름을 Vitest의 Fetch Spy 및 서비스 스텁을 통해 통합 검증합니다.

### 주요 통합 시나리오

#### Scenario 1: POST /api/curate 통합 연동

- **설명**: 사용자의 프롬프트를 수집하고 Spotify 최근 재생 이력을 읽어온 뒤, LLM Client를 통해 추천 리스트를 조립하고 최종적으로 Spotify Search API로 고유 URI를 매핑하는 파이프라인 흐름을 검증합니다.
- **수행 방법**: `app/api/curate/route.test.ts` 통합 테스트 파일 실행을 통해, 서비스들(`AuthService`, `SpotifyService`, `LlmClient`)과 Route Handler 간의 데이터 계약이 충족되는지 자동 확인합니다.
- **결과**: `HTTP 200 OK` 응답과 함께 `SearchCurationResult` 규격에 맞는 가공된 플레이리스트 JSON 데이터가 정상적으로 조립되어 반환됩니다.

## 통합 테스트 실행 방법

### 1. 테스트 실행

통합 테스트 스위트를 포함한 전체 테스트를 구동하여 컴포넌트 간의 상호작용 계약을 확인합니다.

```bash
npm test
```

### 2. 특정 통합 테스트 단독 검증

라우트 핸들러 통합 시나리오만 따로 확인하고 싶다면 아래와 같이 특정 테스트 파일만 필터링하여 실행할 수 있습니다.

```bash
npx vitest run app/api/curate/route.test.ts
```

### 3. 검증 성공 판단

- **통과 요건**: `POST /api/curate Route Handler` 하위의 모든 테스트 케이스가 성공(Passed)해야 합니다.
- **로그 및 증빙**: 실행 중 실패가 발생하면 500 예외 스택트레이스 및 에러 핸들러 로깅(`Curation handler failed unexpectedly`)이 발생하므로 이를 모니터링하여 병목이나 모킹 불일치를 해소합니다.
