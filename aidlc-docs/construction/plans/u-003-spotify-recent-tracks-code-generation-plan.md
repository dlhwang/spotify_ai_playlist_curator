# U-003 최근 재생 곡 연동 Code Generation 계획

<!-- markdownlint-disable MD013 MD053 -->

## 단위 컨텍스트

- **Unit**: U-003 최근 재생 곡 연동 및 도메인 모델 설계
- **Workspace Root**: `D:\workspace\spotify_aI_playlist_curator`
- **Project Type**: Greenfield monolith Next.js application
- **Application Code Location**: 워크스페이스 루트
- **Documentation Location**: `aidlc-docs/construction/u-003-spotify-recent-tracks/code/`
- **Stories**: S-003 (최근 재생 곡 수집)
- **Requirements**: NFR-001 (API Timeout), NFR-002 (Error Redirection), NFR-003 (Token Refresh Reliability), NFR-004 (Mocking/Testability)

## 생성 접근

U-003은 Spotify 최근 재생 목록 데이터를 수집하여 큐레이션 입력으로 적절히 가공하고 도메인을 격리하는 단위이다. AbortController를 이용해 명시적인 5초 타임아웃을 두고, 401 에러 감지 시 1회 백엔드 내부 토큰 갱신(AuthService 연동) 및 재시도를 처리한다. 비지니즈 룰에 따라 플레이리스트 생성에 필수적인 필드(ID, URI, 제목, 아티스트명)만 최소 추출하며 중복은 제거한다. 최근 재생 목록이 비어 있는 경우에도 예외 없이 빈 배열(`[]`)로 도메인 레이어에 정상 전송되도록 보장한다.

## 대상 경로

### Application Code

- `src/domain/track.ts` (Track, CurationInput 도메인 타입 정의)
- `src/server/services/spotify-service.ts` (Spotify 최근 재생 곡 조회 및 정제, 5초 타임아웃 및 401 재시도)
- `src/server/services/spotify-service.test.ts` (타임아웃, 중복 제거, 401 재시도 시나리오 테스트)
- `app/api/spotify/tracks/route.ts` (세션 검사 및 최근 재생 트랙 반환 Route Handler)

### Documentation

- `aidlc-docs/construction/u-003-spotify-recent-tracks/code/code-summary.md`

## 실행 단계

### Step 1: Domain Definition

- [x] `src/domain/track.ts`를 생성하여 `Track` 엔티티 및 `CurationInput` 인터페이스를 명확한 TypeScript 타입으로 선언한다.

### Step 2: Spotify Service Generation

- [x] `src/server/services/spotify-service.ts`를 생성한다.
  - AbortController를 이용한 5초 타임아웃 로직 구현.
  - 401 Unauthorized 포착 시 `AuthService`를 통해 토큰을 갱신하고 단 1회 재시도(Retry)하는 구조 구현.
  - 원시 DTO(`RawSpotifyPlayHistory`)에서 고유 `Track` 배열로 중복 제거(최근 시점 1개만 보존)하며 데이터 최소 정제하는 어댑터 로직 내장.
- [x] `src/server/services/spotify-service.test.ts`를 생성하여 타임아웃 차단, 401 자동 재시도, 중복 제거 필터링, 빈 배열 수용 여부 단위 테스트 구현.

### Step 3: API Route Handler Generation

- [x] `app/api/spotify/tracks/route.ts`를 작성하여 세션 쿠키를 검사하고, 유효한 경우 `SpotifyService`를 호출해 최근 재생 곡 리스트를 JSON으로 반환하게끔 연동한다. 세션이 없거나 재생 목록 조회 실패 시 적절히 간소화된 오류 코드로 대응한다.

### Step 4: Verification & Documentation

- [x] `npm.cmd run build`, `npm.cmd run typecheck`, `npm.cmd test`를 실행하여 타입 검증 및 모든 단위 테스트의 무결성을 확인한다.
- [x] `aidlc-docs/construction/u-003-spotify-recent-tracks/code/code-summary.md`에 생성 및 검증 결과를 작성한다.
- [x] 본 계획서의 체크박스를 업데이트하고 `aidlc-state.md`를 갱신한다.

## Requirement and Story Verification

| Requirement/Story | Evidence |
| :--- | :--- |
| NFR-001 (API Timeout) | AbortController 기반 5초 타임아웃 예외 차단 단위 테스트 |
| NFR-002 (Error Redirection) | 403, 429, 5xx 에러 포착 시 대표 오류 리다이렉트 처리 검증 |
| NFR-003 (Token Retry) | 401 에러 시 AuthService 갱신 위임 및 1회 재호출 성공 테스트 |
| NFR-004 (Mocking/Testability) | Fetch API/Node-fetch mock을 활용한 로컬 무의존성 검증 |
| S-003 (Recent Tracks Collect) | 최근 재생 목록 조회 API 연동 및 중복 곡 필터링 테스트 |

## 확인 질문

## Question 1

이 계획을 승인하고 U-003 최근 재생 곡 연동 코드 생성 단계를 진행할까요?

A) 승인하고 코드 생성을 진행
B) 계획 수정이 필요함 (의견 제공 필요)

[Answer]:A
