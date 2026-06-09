# Unit of Work 정의

<!-- markdownlint-disable MD024 -->

## 분해 결정

- 제안한 5개 단위로 진행한다.
- 구현 순서는 Foundation -> Auth -> Spotify Adapter -> Curation Domain -> UI다.
- 코드 조직은 `src/features/*`, `src/server/*`, `src/domain/*`, `src/lib/*`로
  분리한다.
- 모든 단위는 단일 Next.js 애플리케이션 안의 logical module이다.
- 배포 가능한 별도 서비스로 나누지 않는다.

## Greenfield Code Organization

```text
app/
  page.tsx
  layout.tsx
  api/
    spotify/
      auth/
      curate/
      playlists/
src/
  features/
    auth/
    prompt/
    curation-result/
    playlist-creation/
  server/
    auth/
    spotify/
    routes/
  domain/
    curation/
    playlist/
    errors/
  lib/
    env/
    http/
    testing/
docs/
aidlc-docs/
```

## U-001: Project Foundation

### Responsibilities

- Next.js + TypeScript 프로젝트 기반을 만든다.
- 테스트 도구와 기본 스크립트를 준비한다.
- 환경 변수 문서와 예시를 만든다.
- 기본 layout, page, styling baseline을 준비한다.

### Included Components

- App Shell
- 기본 test setup
- environment boundary

### Excluded Scope

- 실제 Spotify OAuth 처리
- 큐레이션 도메인 로직
- 실제 playlist 생성

### Code Areas

- `app/layout.tsx`
- `app/page.tsx`
- `src/lib/env`
- `src/lib/testing`
- package scripts

## U-002: Spotify Auth Session

### Responsibilities

- Spotify OAuth authorization URL을 생성한다.
- callback code를 token으로 교환한다.
- HttpOnly cookie 기반 session 경계를 구현한다.
- 인증 상태 조회 Route Handler를 제공한다.

### Included Components

- Authentication Feature
- AuthService
- auth Route Handlers

### Excluded Scope

- recently played 조회
- playlist 생성
- 큐레이션 도메인

### Code Areas

- `app/api/spotify/auth/*`
- `src/server/auth`
- `src/features/auth`

## U-003: Spotify API Adapter

### Responsibilities

- Spotify Web API 직접 호출 adapter를 구현한다.
- recently played 조회를 제공한다.
- playlist 생성과 track 추가 기능을 제공한다.
- Spotify 오류를 domain-friendly error로 변환한다.

### Included Components

- Spotify API Adapter
- SpotifyProfileDataService
- Spotify API 관련 error mapping

### Excluded Scope

- OAuth UI
- LLM provider
- 추천 결과 UI

### Code Areas

- `src/server/spotify`
- `src/domain/errors`
- adapter tests

## U-004: Curation Domain

### Responsibilities

- 자연어 prompt와 recently played 데이터를 큐레이션 입력으로 결합한다.
- track candidate selector를 구현한다.
- LLM provider port와 placeholder provider를 구현한다.
- `CurationResult`를 생성한다.

### Included Components

- Curation Domain
- TrackCandidateSelector
- CurationProviderPort
- PlaceholderCurationProvider
- CurationService

### Excluded Scope

- 실제 외부 LLM provider
- React UI
- Spotify OAuth token exchange

### Code Areas

- `src/domain/curation`
- `src/domain/playlist`
- domain tests

## U-005: User Experience

### Responsibilities

- 인증, 자연어 입력, 추천 결과, playlist 생성 feature component를 구현한다.
- 주요 UI 상태와 오류 상태를 표시한다.
- Route Handler와 연결해 end-to-end 사용자 흐름을 완성한다.

### Included Components

- Prompt Input Feature
- Curation Result Feature
- Playlist Creation Feature
- Authentication UI

### Excluded Scope

- 새로운 backend service
- DB persistence
- Spotify MCP 통합

### Code Areas

- `src/features/auth`
- `src/features/prompt`
- `src/features/curation-result`
- `src/features/playlist-creation`
- UI tests and e2e tests

## 완료 기준

- 모든 Must story가 하나 이상의 unit에 배정된다.
- 각 unit은 자체 테스트 기대값을 가진다.
- unit 간 의존 방향은 Foundation에서 UI로 흐른다.
- 외부 API는 adapter와 port 뒤에 격리된다.
