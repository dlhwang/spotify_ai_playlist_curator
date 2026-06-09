# Application Design 통합 문서

## 설계 범위

이 설계는 Spotify AI playlist curator MVP의 상위 컴포넌트와 서비스 경계를
정의한다. 상세 비즈니스 규칙, token refresh 세부 정책, 후보 선정 점수화,
LLM prompt 구조는 Construction 단계의 Functional Design에서 확정한다.

## 확정된 설계 결정

- 인증은 서버 전용 HttpOnly cookie 기반 세션으로 설계한다.
- Route Handler는 `/api/spotify/*` 중심으로 구성한다.
- 큐레이션 후보 선정과 LLM playlist 컨셉 생성은 별도 port/service로 분리한다.
- Spotify 사용자 데이터는 recently played를 우선 입력 소스로 둔다.
- UI는 인증, 입력, 결과, 생성 상태를 feature component로 분리한다.
- Spotify MCP는 사용하지 않는다.

## 생성된 산출물

- `components.md`: 주요 컴포넌트와 책임
- `component-methods.md`: 컴포넌트별 public method와 type signature 후보
- `services.md`: application service와 orchestration 흐름
- `component-dependency.md`: 의존 방향, dependency matrix, data flow

## 주요 컴포넌트

| Component | Purpose |
| --- | --- |
| App Shell | Next.js page와 layout 제공 |
| Authentication Feature | OAuth 시작과 인증 상태 표시 |
| Prompt Input Feature | 자연어 큐레이션 입력 |
| Curation Result Feature | playlist 제목, 설명, 분위기 요약 표시 |
| Playlist Creation Feature | Spotify playlist 생성 액션 |
| Spotify API Adapter | Spotify Web API 직접 호출 |
| Curation Domain | 후보 선정과 도메인 모델 |
| LLM Curation Provider | playlist 컨셉 생성 port |
| Error Mapping | 대표 오류 변환 |

## 주요 서비스

| Service | Role |
| --- | --- |
| AuthService | OAuth URL, callback, HttpOnly session |
| SpotifyProfileDataService | recently played 조회 |
| CurationService | prompt와 track 기반 큐레이션 orchestration |
| PlaylistService | playlist 생성과 track 추가 |
| ErrorResponseService | 표준 오류 응답 변환 |

## 요구사항 추적

| Requirement/Story | Design Coverage |
| --- | --- |
| R-001/S-001 | Authentication Feature, AuthService |
| R-002/S-003 | Spotify API Adapter, SpotifyProfileDataService |
| R-003/S-002/S-003 | Prompt Input Feature, Curation Domain |
| R-004/S-004 | LLM Curation Provider |
| R-005/S-005/S-006 | Curation Result Feature, Playlist Creation Feature |
| R-006/S-002/S-005 | App Shell, feature components |
| NFR-001/S-008 | port 기반 adapter와 domain service 분리 |
| NFR-002/S-008 | DB 없는 service/session 경계 |
| NFR-003/S-001/S-006/S-008 | HttpOnly cookie, server-only secret 사용 |
| NFR-004/S-008 | Vercel serverless Route Handler 중심 구조 |

## 다음 단계

`Units Generation` 단계에서 이 설계를 구현 가능한 작업 단위로 분해한다.
예상 단위는 Project Foundation, Spotify OAuth, Spotify API Adapter,
Curation Domain, User Experience다.
