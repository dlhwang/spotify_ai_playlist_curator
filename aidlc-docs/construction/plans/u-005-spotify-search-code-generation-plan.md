# U-005 Spotify Search 및 트랙 매핑 Code Generation 계획

<!-- markdownlint-disable MD013 MD053 -->

## 단위 컨텍스트

- **Unit**: U-005 Spotify Search API 연동 및 트랙 매핑
- **Workspace Root**: `/Users/sayongja/IdeaProjects/spotify_ai_playlist_curator`
- **Project Type**: Greenfield monolith Next.js application
- **Application Code Location**: 워크스페이스 루트
- **Documentation Location**: `aidlc-docs/construction/u-005-spotify-search/code/`
- **Stories**: S-005 (트랙 매핑 및 플레이리스트 변환)
- **Requirements**: NFR-001 (Parallel Search & Timeout), NFR-002 (Mapping Resilience), NFR-003 (Mock Search Local Support), NFR-004 (Testing Isolation)

## 생성 접근

U-005는 AI Curation의 추천곡 리스트를 전달받아, 각 트랙 정보를 기반으로 Spotify Search API(`GET /v1/search`)를 병렬 호출하여 실제 Spotify URI 정보가 담긴 `MappedTrack` 배열로 매핑하고, 최종 플레이리스트 구조인 `SearchCurationResult`를 조립하여 반환하는 단계이다.
다중 API 호출 속도 최적화를 위해 `Promise.all`과 각 곡당 5초 타임아웃을 적용하며, 특정 곡의 검색 실패는 로그 출력 후 스킵하지만 최종 결과가 0개인 경우에는 예외를 던진다. 자격 증명이 누락된 경우에는 Mock Search 모드로 가짜 URI를 100% 매핑하여 기동성을 제공한다.

## 대상 경로

### Application Code

- [NEW] `src/domain/search.ts` (MappedTrack, SearchCurationResult 및 API DTO 타입 정의)
- [MODIFY] `src/server/services/spotify-service.ts` (searchTracks 및 Mock Search 기능 추가)
- [MODIFY] `src/server/services/spotify-service.test.ts` (searchTracks 병렬 처리, 타임아웃, 예외 복원력, Mock Search 시나리오 테스트 추가)
- [MODIFY] `app/api/curate/route.ts` (LLM 큐레이션 완료 후 spotifyService.searchTracks 연동 및 결과 반환하도록 수정)

### Documentation

- [NEW] `aidlc-docs/construction/u-005-spotify-search/code/code-summary.md`

## 실행 단계

### Step 1: Domain Definition

- [x] `src/domain/search.ts`를 생성하여 `MappedTrack`, `SearchCurationResult` 엔티티 및 `RawSpotifySearchResponse` DTO 타입을 설계서 기준에 부합하게 선언한다.

### Step 2: Spotify Service Modification

- [x] `src/server/services/spotify-service.ts`에 `searchTracks` 메소드를 구현한다.
  - `Promise.all`을 사용하여 추천곡 리스트를 동시에 병렬 검색.
  - AbortController를 이용해 각 검색 호출당 5초 타임아웃 설정.
  - 특정 곡 검색 실패(에러 또는 결과 없음) 시 로그 출력 후 스킵 처리.
  - 최종 매핑에 성공한 곡 개수가 0개일 때 `Error("Curation Mapping Failure: No tracks could be mapped to Spotify URIs")` 예외 전파.
  - Spotify Client ID/Secret 환경 변수가 누락되었거나 Mock 모드 설정 시 가짜 URI(`spotify:track:mock-{name_hash}`)를 100% 매핑에 성공시키는 Mock Search 구현.
- [x] `src/server/services/spotify-service.test.ts`에 `searchTracks`와 관련된 테스트 케이스들을 추가한다.
  - 병렬 검색 검증, 5초 타임아웃 Abort 검증, 개별 검색 실패 시 스킵 검증, 0개 성공 시 예외 발생 검증, Mock Search 활성화 시의 바이패스 검증을 포함한다.

### Step 3: API Route Handler Modification

- [x] `app/api/curate/route.ts`를 수정하여 `LlmClient` 호출을 통해 얻은 `CuratedPlaylist` 결과의 추천 트랙 리스트를 `SpotifyService.searchTracks`에 전달하고, 최종 반환되는 `SearchCurationResult`를 클라이언트에 응답하도록 라우트 로직을 확장한다.

### Step 4: Verification & Documentation

- [x] `npm run typecheck`, `npm test`를 실행하여 모든 타입 검증 및 단위 테스트의 무결성을 확인한다.
- [x] `aidlc-docs/construction/u-005-spotify-search/code/code-summary.md`에 코드 생성 및 검증 결과를 작성한다.
- [x] 본 계획서의 체크박스를 업데이트하고 `aidlc-state.md`를 갱신한다.

## Requirement and Story Verification

| Requirement/Story | Evidence |
| :--- | :--- |
| NFR-001 (Parallel & Timeout) | `Promise.all` 병렬 처리 및 AbortController 기반 5초 타임아웃 격리 테스트 |
| NFR-002 (Mapping Resilience) | 개별 검색 실패 시 경고 로그 후 스킵 처리 및 최종 0개 매핑 시 예외 발생 테스트 |
| NFR-003 (Mock Search Local) | 자격 증명 누락 시 가짜 URI 100% 성공 매핑 Mock Search 테스트 |
| NFR-004 (Testing Isolation) | Fetch API mock을 활용해 외부 의존 없이 100% 격리된 로컬 검증 수행 |
| S-005 (Track Mapping) | AI 큐레이션 결과의 텍스트 곡명들을 실제 Spotify 트랙으로 성공적 변환 검증 |

## 확인 질문

## Question 1

이 계획을 승인하고 U-005 Spotify Search 및 트랙 매핑 코드 생성 단계를 진행할까요?

A) 승인하고 코드 생성을 진행
B) 계획 수정이 필요함 (의견 제공 필요)

[Answer]: A
