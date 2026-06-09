# Unit of Work Story Map

<!-- markdownlint-disable MD013 -->

## Story to Unit Mapping

| Story | Priority | Primary Unit | Supporting Units |
| --- | --- | --- | --- |
| S-001 Spotify 계정으로 인증한다 | Must | U-002 | U-001, U-005 |
| S-002 원하는 분위기를 자연어로 입력한다 | Must | U-005 | U-001, U-004 |
| S-003 Spotify 데이터를 내부 큐레이션 모델로 변환한다 | Must | U-003 | U-004 |
| S-004 LLM 인터페이스로 playlist 컨셉을 생성한다 | Must | U-004 | U-001 |
| S-005 playlist 제목, 설명, 분위기 요약을 확인한다 | Must | U-005 | U-004 |
| S-006 추천 결과를 Spotify playlist로 생성한다 | Must | U-005 | U-002, U-003, U-004 |
| S-007 인증과 외부 API 대표 오류를 보여준다 | Should | U-003 | U-002, U-005 |
| S-008 DB 없이 Vercel에서 실행 가능한 구조를 검증한다 | Should | U-001 | U-002, U-003, U-005 |

## Requirement to Unit Mapping

| Requirement | Units | Verification Focus |
| --- | --- | --- |
| R-001 Spotify OAuth 인증 | U-002, U-005 | OAuth URL, callback, session, UI state |
| R-002 Spotify 사용자 데이터 조회 | U-003 | recently played adapter |
| R-003 큐레이션 입력 모델과 도메인 분석 | U-004, U-005 | prompt model, candidate selection |
| R-004 LLM 큐레이션 인터페이스 | U-004 | provider port, placeholder |
| R-005 플레이리스트 추천 또는 생성 흐름 | U-003, U-004, U-005 | playlist API, result UI |
| R-006 Next.js 사용자 화면 | U-001, U-005 | feature components, app shell |
| NFR-001 테스트 가능성 | U-001-U-005 | test double, unit/integration tests |
| NFR-002 무상태 MVP 운영 | U-001, U-002 | no DB, session boundary |
| NFR-003 보안 기본 주의사항 | U-002, U-003, U-005 | secret server-only, cookie |
| NFR-004 배포 용이성 | U-001, U-005 | build, env docs |

## Coverage Check

- 모든 Must story는 primary unit에 배정됐다.
- 모든 Should story는 primary unit과 supporting unit에 배정됐다.
- 각 기능 요구사항은 최소 하나 이상의 unit으로 추적된다.
- NFR 요구사항은 foundation, auth, adapter, UI 검증에 분산 반영된다.

## Construction Phase Guidance

- Functional Design은 U-002, U-003, U-004, U-005에서 특히 필요하다.
- NFR Requirements는 U-001과 U-002를 중심으로 secret, build, testability를
  정리한다.
- Code Generation은 U-001부터 순차 진행한다.
