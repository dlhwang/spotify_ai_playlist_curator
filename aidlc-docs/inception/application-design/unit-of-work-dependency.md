# Unit of Work 의존성

## 구현 순서

1. U-001 Project Foundation
2. U-002 Spotify Auth Session
3. U-003 Spotify API Adapter
4. U-004 Curation Domain
5. U-005 User Experience

## Dependency Matrix

| Unit | Depends On | Unlocks | Reason |
| --- | --- | --- | --- |
| U-001 | None | U-002, U-003, U-004, U-005 | 프로젝트와 테스트 기반 |
| U-002 | U-001 | U-003, U-005 | 인증 session이 Spotify 호출에 필요 |
| U-003 | U-001, U-002 | U-004, U-005 | recently played와 playlist API 제공 |
| U-004 | U-001, U-003 | U-005 | 큐레이션 결과 contract 제공 |
| U-005 | U-001, U-002, U-003, U-004 | Build and Test | 사용자 흐름 완성 |

## Dependency Rules

- U-001은 모든 단위의 공통 기반이다.
- U-002는 실제 사용자 인증과 server session 경계를 제공한다.
- U-003은 U-002의 session을 사용하지만 UI에는 의존하지 않는다.
- U-004는 Spotify adapter가 제공한 track 데이터를 사용하되 HTTP response
  타입에 의존하지 않는다.
- U-005는 앞선 단위들의 public contract를 사용한다.

## 병렬화 가능성

- U-003과 U-004의 일부 타입 설계는 U-001 이후 병렬 가능하다.
- 실제 구현은 U-003의 Spotify track contract가 안정화된 뒤 U-004가 이어지는
  순서가 안전하다.
- U-005의 정적 UI skeleton은 U-001 이후 시작할 수 있지만, 최종 연결은 U-002,
  U-003, U-004 이후 진행한다.

## Integration Checkpoints

| Checkpoint | Units | Validation |
| --- | --- | --- |
| CP-001 | U-001 | Next.js build와 test runner 실행 |
| CP-002 | U-001, U-002 | OAuth URL, callback, session 테스트 |
| CP-003 | U-002, U-003 | authenticated Spotify adapter 테스트 |
| CP-004 | U-003, U-004 | recently played 기반 큐레이션 domain 테스트 |
| CP-005 | U-001-U-005 | 핵심 사용자 흐름 e2e 또는 동등한 브라우저 검증 |

## Risk Notes

- HttpOnly cookie session 세부 정책은 Functional Design에서 구체화한다.
- Spotify 실제 OAuth redirect URI는 로컬과 Vercel 환경이 다를 수 있다.
- DB가 없으므로 session 크기와 token refresh 전략을 과도하게 복잡하게 만들지
  않는다.
