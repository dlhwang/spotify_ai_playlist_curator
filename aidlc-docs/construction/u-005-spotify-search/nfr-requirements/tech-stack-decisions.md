# U-005 기술 스택 결정

<!-- markdownlint-disable MD013 -->

## 결정 요약

| 영역 | 기술 결정 | Rationale |
| --- | --- | --- |
| API 병렬성 | `Promise.all` 기반 다중 비동기 호출 | 지연시간 최적화를 위해 추천된 5~10곡의 트랙 검색을 동시에 비동기로 수행하여 런타임 성능을 극대화 (Option A) |
| API Timeout | AbortController 기반 각 곡당 5초 타임아웃 | 특정 외부 호출의 무기한 블로킹을 차단하고 신속하게 예외를 격리하기 위해 개별 요청마다 5초 타임아웃 통제 적용 |
| Resilience Policy | 개별 트랙 스킵 및 최종 0개 매핑 시 예외 처리 | 개별 검색 실패 시 경고 로그 후 스킵 처리하여 복원력을 확보하되, 최종 매핑 완료된 트랙이 단 한 개도 없을 때만 명시적 오류 발생 |
| Mocking Strategy | 자격증명 부재 시 100% Mock Search 지원 | Spotify 자격 증명이 없는 로컬 개발/시연의 가용성 보장을 위해 입력 트랙 정보를 활용한 Mock URI 매핑 로직 구축 (Option A) |
| Testing Strategy | Vitest / Fetch Mocking 및 Spy | Vitest의 fetch 모킹 도구를 활용해 Search API의 HTTP 오류, 타임아웃(Abort), 정상 데이터 등 다양한 API 반응 환경을 외부 통신 없이 완벽 격리 검증 |

## Test Strategy

### U-005 필수 검증 대상

- **Parallel Search Execution**: 5개 이상의 트랙에 대한 검색을 수행할 때 `Promise.all`을 이용해 병렬 호출이 수행되는지 검증.
- **Individual Timeout Handling**: 특정 곡 검색 요청이 5초를 초과하여 Abort 신호가 전달되었을 때, 해당 곡만 스킵되고 나머지 매핑 성공 트랙들은 안전하게 최종 수집되는지 검증.
- **Single Track Skip & Logger**: 검색에 실패한 개별 곡에 대해 적절한 경고 로깅이 수행되고 전체 프로세스는 정상 생존하는지 검증.
- **Mapping Zero Exception**: 모든 추천곡의 매핑 결과가 없거나 실패하여 최종 트랙 수가 0개일 때, `Curation Mapping Failure` 예외가 정상 발생하여 전체 트랙 매핑 단계를 중단하는지 검증.
- **Mock Search fallback**: 자격 증명 누락 혹은 Mock Search가 명시적으로 활성화되었을 때, 외부 API fetch를 원천 스킵하고 모크 트랙 URI들로 채워진 성공 목록을 즉시 반환하는지 검증.

## Directory Strategy

```text
src/
  server/
    services/
      spotify-service.ts        # Spotify Search API 연동, Promise.all 병렬화, AbortController 타임아웃, 예외 복원력 및 Mock Search 구현
```

- `src/server/services/spotify-service.ts`: Spotify Web API의 Search 기능과 관련된 도메인 결합 매핑 기능 및 테스트 Mocking 로직이 포함됩니다.

## Rejected Options

- **순차적 비동기 검색 (Sequential Processing)**: 5~10곡의 트랙을 1개씩 순차 호출하면 최대 10번의 왕복 지연이 축적되어 응답 시간이 10초 이상 지연될 수 있으므로 병목 예방을 위해 기각함 (Option B 기각).
- **Mock Search 배제**: 실제 자격 증명이 있어야만 검색이 돌아가도록 할 경우 로컬 단위 테스트 구성과 개발 데모의 허들이 크게 높아지므로 개발 생산성 관점에서 기각함 (Option B 기각).
