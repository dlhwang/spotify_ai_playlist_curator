# 컴포넌트 설계

<!-- markdownlint-disable MD024 -->

## 설계 결정 요약

- 인증 상태는 서버 전용 HttpOnly cookie 기반 세션으로 설계한다.
- Route Handler는 `/api/spotify/*` 중심으로 Spotify 관련 server boundary를
  모은다.
- 큐레이션 후보 선정과 LLM playlist 컨셉 생성은 별도 port/service로 분리한다.
- Spotify 사용자 데이터 입력은 `recently played`를 우선한다.
- UI는 인증, 입력, 결과, 생성 상태를 feature component로 분리한다.
- Spotify MCP는 사용하지 않는다.

## Component C-001: App Shell

### Purpose

Next.js App Router의 최상위 페이지와 레이아웃을 제공한다.

### Responsibilities

- 첫 화면에서 큐레이션 경험을 바로 시작할 수 있게 구성한다.
- 인증 상태에 따라 feature component를 배치한다.
- 전역 스타일, metadata, 접근 가능한 기본 구조를 제공한다.

### Interfaces

- `app/page.tsx`
- `app/layout.tsx`

## Component C-002: Authentication Feature

### Purpose

Spotify OAuth 시작과 인증 상태 표시를 담당하는 UI와 server boundary를 제공한다.

### Responsibilities

- Spotify 로그인 시작 액션을 제공한다.
- 인증 전, 인증 실패, 인증 완료 상태를 표시한다.
- OAuth callback 이후 HttpOnly cookie 기반 세션을 사용하는 경계를 제공한다.

### Interfaces

- `AuthStatusPanel`
- `SpotifyLoginButton`
- `/api/spotify/auth/login`
- `/api/spotify/auth/callback`
- `/api/spotify/auth/session`

## Component C-003: Prompt Input Feature

### Purpose

사용자의 자연어 큐레이션 입력을 수집하고 검증한다.

### Responsibilities

- 분위기, 상황, 활동을 자연어로 입력받는다.
- 빈 입력과 제출 중 상태를 처리한다.
- 큐레이션 요청 모델로 변환 가능한 payload를 만든다.

### Interfaces

- `CurationPromptForm`
- `CurationPromptInput`

## Component C-004: Curation Result Feature

### Purpose

playlist 제목, 설명, 전체 분위기 요약, 곡 후보를 사용자에게 표시한다.

### Responsibilities

- 큐레이션 성공 결과를 표시한다.
- 추천 결과 재생성 또는 입력 수정 액션을 제공한다.
- playlist 생성 액션을 노출한다.

### Interfaces

- `CurationResultPanel`
- `PlaylistSummary`
- `TrackPreviewList`

## Component C-005: Playlist Creation Feature

### Purpose

추천 결과를 실제 Spotify playlist로 생성하는 사용자 액션과 상태를 담당한다.

### Responsibilities

- playlist 생성 요청을 Route Handler로 보낸다.
- 생성 중, 성공, 실패 상태를 표시한다.
- 생성 성공 시 Spotify에서 열 수 있는 정보를 제공한다.

### Interfaces

- `CreatePlaylistButton`
- `PlaylistCreationStatus`
- `/api/spotify/playlists`

## Component C-006: Spotify API Adapter

### Purpose

Spotify Web API 직접 호출을 캡슐화한다.

### Responsibilities

- OAuth token 교환과 refresh 경계를 제공한다.
- recently played 데이터를 조회한다.
- playlist 생성과 track 추가를 수행한다.
- Spotify 오류를 애플리케이션 오류로 변환한다.

### Interfaces

- `SpotifyApiPort`
- `SpotifyWebApiAdapter`

## Component C-007: Curation Domain

### Purpose

외부 API와 UI에서 분리된 큐레이션 도메인 모델과 후보 선정 로직을 제공한다.

### Responsibilities

- Spotify track 데이터를 내부 모델로 변환한다.
- 자연어 prompt와 최근 재생 데이터를 결합해 후보 선정 입력을 만든다.
- LLM provider에 전달할 큐레이션 요청을 생성한다.

### Interfaces

- `CurationService`
- `TrackCandidateSelector`
- `CurationRequest`
- `CurationResult`

## Component C-008: LLM Curation Provider

### Purpose

playlist 제목, 설명, 분위기 요약 생성을 LLM provider port 뒤로 분리한다.

### Responsibilities

- 큐레이션 후보와 사용자 prompt를 받아 playlist 컨셉을 생성한다.
- MVP에서는 placeholder provider로 안정적인 응답 형식을 제공한다.
- 후속 단계에서 실제 LLM provider로 교체 가능해야 한다.

### Interfaces

- `CurationProviderPort`
- `PlaceholderCurationProvider`

## Component C-009: Error Mapping

### Purpose

OAuth, Spotify API, LLM provider, playlist 생성 오류를 사용자와 테스트가
이해할 수 있는 애플리케이션 오류로 변환한다.

### Responsibilities

- 대표 오류 코드를 정의한다.
- 사용자 표시용 메시지와 재시도 가능 여부를 제공한다.
- Route Handler 응답 형태를 표준화한다.

### Interfaces

- `AppError`
- `mapSpotifyError`
- `toErrorResponse`
