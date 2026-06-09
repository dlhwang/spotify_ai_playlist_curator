# U-003 기술 스택 결정

<!-- markdownlint-disable MD013 -->

## 결정 요약

| 영역 | 기술 결정 | Rationale |
| --- | --- | --- |
| API Timeout | AbortController 기반 5초 타임아웃 | Next.js API Route Handler에서 Fetch API 호출 시 최대 5초를 제약하여 외부 지연에 따른 병목 예방 |
| Caching Policy | No Caching (실시간 수집) | 최근 곡의 높은 실시간 정합성을 유지하고 불필요한 인메모리 캐시 관리 오버헤드를 배제하기 위해 캐싱을 도입하지 않음 (Option A) |
| Resilience Policy | 401 오류 한정 1회 자동 재시도 (Retry) | 세션 만료 401 발생 시에만 Refresh Token을 이용해 세션을 재수립한 뒤 1회 재요청을 즉시 전송함 |
| Error Delivery | Simple Error Code & Server logging | 상세 장애 내역 유출에 따른 보안 위협을 예방하기 위해, 클라이언트에는 단순한 에러 코드만 노출하고 상세 원인은 서버 로그에 분류 기록함 (Option A) |
| Testing Strategy | Vitest / Abort Mocking | AbortController의 AbortSignal 동작 및 타임아웃 예외 상황을 Vitest의 타이머 모킹 및 spy를 통해 완벽히 가두어 검증함 |

## Test Strategy

### U-003 필수 검증 대상

- **Timeout Execution**: Fetch 호출 시 AbortController가 작동하여 5초 제한시간 초과 시 요청이 Abort되는지 검증.
- **Deduplication Filter**: Spotify API의 중복 트랙 데이터를 가진 원본 응답이 도메인 모델 변환 레이어를 거쳤을 때, 가장 최근에 재생된 순으로 고유 트랙만 남는 중복 제거 규칙 검증.
- **Empty List Compliance**: 최근 재생 이력이 비어있을 때(`items: []`) 예외를 던지지 않고 정상적으로 빈 배열(`[]`) 도메인 데이터가 생성되는지 검증.
- **401 Auto-Retry**: Spotify API 호출 중 401 에러 감지 시 AuthService의 토큰 리프레시 로직을 호출하고, 재시도 성공 시 최종 정제 데이터를 정상 반환하는지 모킹 검증.
- **Error Propagation**: 401 이외의 403, 429, 500 에러 수신 시 Route Handler가 적절한 에러 파라미터를 갖춰 홈으로 리다이렉트하는지 검증.

## Directory Strategy

```text
src/
  domain/
    track.ts               # Track 및 CurationInput 도메인 엔티티 정의
  server/
    services/
      spotify-service.ts   # Spotify API 연동, Timeout, 401 Auto-Retry 처리 로직
```

- `src/domain/track.ts`: 순수 도메인 스펙 모델 보관.
- `src/server/services/spotify-service.ts`: AbortController 기반 타임아웃 통제 및 Spotify API 연동 구현.

## Rejected Options

- **임시 캐싱 전략 (1분 메모리 캐시)**: 캐시 수명 관리 및 사용자 간 데이터 오염 우려가 있고, 큐레이션을 시작하는 시점에는 항상 최신의 재생 상태를 수집하는 것이 도메인 요구사항과 부합하므로 MVP 범위에서 제외함.
- **Exponential Backoff 다중 재시도**: 5xx 에러나 429 에러 발생 시 백엔드 단에서 계속 대기하며 다중 재시도를 하는 것은 웹 요청 생명주기(Request Life Cycle)를 길게 만들어 사용자 경험을 해치므로 기각하고 즉시 대표 에러 리다이렉트 방식을 사용함.
