# U-004 기술 스택 결정

<!-- markdownlint-disable MD013 -->

## 결정 요약

| 영역 | 기술 결정 | Rationale |
| --- | --- | --- |
| API Timeout | AbortController 기반 10초 타임아웃 | Route Handler가 LLM API 호출 시 최대 10초로 통제하여 외부 지연에 따른 병목을 조기 예방하고 폴백 흐름 유도 (Option A) |
| Resilience Policy | 1회 재요청 및 디폴트 폴백 (Fallback) | JSON 파싱 에러 발생 시 1회 즉각 재요청하여 복원을 시도하고, 최종 실패 시 최근 수집곡 기반의 디폴트 플레이리스트로 복구하여 견고성 보장 |
| Mocking Strategy | 정적(static) 더미 데이터 Mock LLM | 단순하게 1~2종의 고정된 정적 더미 데이터만 반환하는 Mocking 로직을 사용하여 개발 및 로컬 테스트 환경 구성 복잡성을 최소화 (Option B) |
| Testing Strategy | Vitest / Abort & Parse Error Mocking | AbortController에 의한 중단 신호 및 JSON 형식 위반 상황을 Vitest의 타이머 모킹 및 fetch Spy를 사용하여 외부 의존 없이 격리 검증 |

## Test Strategy

### U-004 필수 검증 대상

- **Timeout Execution**: LLM 호출 시 10초 제한 시간을 초과하면 AbortController가 작동하여 요청이 Abort되고 예외가 유도되는지 검증.
- **Parsing Error Auto-Retry**: LLM 응답이 부적절한 JSON 포맷을 가질 때 즉각 실패하지 않고 1회 재시도 요청을 새로 수행하는지 검증.
- **Ultimate Fallback Recovery**: LLM 호출이 완전 실패(2회 시도 모두 실패 또는 10초 타임아웃)할 때, 최근 수집된 Spotify 트랙 목록을 기반으로 구성된 기본 플레이리스트 객체(`CuratedPlaylist`)를 안전하게 반환하는지 검증.
- **Mock Mode Bypass**: `MOCK_LLM=true` 혹은 API Key 누락 조건에서 실제 원격 네트워크 통신(fetch)을 건너뛰고 정적 더미 플레이리스트 데이터를 즉시 리턴하는지 검증.

## Directory Strategy

```text
src/
  domain/
    curation.ts            # CuratedPlaylist 및 추천 메시지 등의 도메인 모델 정의
  server/
    services/
      llm-client.ts        # LLM API 연동, AbortController 타임아웃, 파싱 예외 및 1회 재시도 처리
```

- `src/domain/curation.ts`: 플레이리스트 추천 도메인 구조 및 폴백 데이터 가공 로직 보관.
- `src/server/services/llm-client.ts`: OpenAI/Gemini 또는 Mock API를 조율하는 LLM 클라이언트 구현.

## Rejected Options

- **동적 LLM 모킹 (유저 키워드에 따른 동적 생성)**: 모킹 수준이 너무 복잡해지고, 테스트 시나리오 일관성을 해칠 우려가 있으며, MVP 개발 속도를 저해할 수 있어 기각하고 정적 더미(static dummy) 방식으로 단순화함 (Option A 기각).
- **무제한 타임아웃 유지**: LLM 응답 지연으로 인해 Next.js Route Handler가 길게 홀딩되면 큐레이션 요청 사용자 경험이 극도로 나빠지므로 기각함 (Option C 기각).
