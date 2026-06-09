# 서비스 설계

<!-- markdownlint-disable MD024 -->

## Service SVC-001: AuthService

### Responsibilities

- Spotify OAuth authorization URL을 생성한다.
- callback code를 token set으로 교환한다.
- HttpOnly cookie 기반 session을 생성하고 읽는다.
- token refresh가 필요한 경우 Spotify adapter와 협력한다.

### Interactions

- `SpotifyApiPort`의 token 관련 메서드를 사용한다.
- Route Handler에서 호출된다.
- UI에는 민감한 token을 반환하지 않는다.

## Service SVC-002: SpotifyProfileDataService

### Responsibilities

- 인증된 session을 사용해 Spotify recently played 데이터를 조회한다.
- MVP의 취향 입력 소스로 recently played를 우선 사용한다.
- Spotify 오류를 표준 `AppError`로 변환한다.

### Interactions

- `SpotifyApiPort.getRecentlyPlayed`를 호출한다.
- `CurationService`에 전달할 track 데이터를 제공한다.

## Service SVC-003: CurationService

### Responsibilities

- 사용자 자연어 prompt와 Spotify recently played 데이터를 큐레이션 입력으로
  결합한다.
- `TrackCandidateSelector`를 호출해 후보 track을 선정한다.
- `CurationProviderPort`를 호출해 playlist 제목, 설명, 분위기 요약을 만든다.
- 최종 `CurationResult`를 반환한다.

### Interactions

- `SpotifyProfileDataService`에서 가져온 데이터를 사용한다.
- `TrackCandidateSelector`와 `CurationProviderPort`에 의존한다.
- Route Handler `/api/spotify/curate`에서 호출된다.

## Service SVC-004: PlaylistService

### Responsibilities

- `CurationResult` 기반으로 Spotify playlist 생성 입력을 만든다.
- Spotify playlist를 생성한다.
- 선정된 track URI를 playlist에 추가한다.
- 생성 결과 URL과 식별자를 반환한다.

### Interactions

- `SpotifyApiPort.createPlaylist`를 호출한다.
- `SpotifyApiPort.addTracksToPlaylist`를 호출한다.
- Route Handler `/api/spotify/playlists`에서 호출된다.

## Service SVC-005: ErrorResponseService

### Responsibilities

- 대표 오류를 HTTP status와 사용자 메시지로 변환한다.
- 재시도 가능 여부를 응답에 포함한다.
- Route Handler별 오류 응답 형식을 통일한다.

## 주요 오케스트레이션

### 큐레이션 실행

1. UI가 자연어 prompt를 `/api/spotify/curate`로 보낸다.
2. Route Handler가 `AuthService`로 session을 확인한다.
3. `SpotifyProfileDataService`가 recently played 데이터를 조회한다.
4. `CurationService`가 후보를 선정하고 provider에 playlist 컨셉을 요청한다.
5. Route Handler가 `CurationResult`를 반환한다.

### playlist 생성

1. UI가 확정된 `CurationResult`를 `/api/spotify/playlists`로 보낸다.
2. Route Handler가 session을 확인한다.
3. `PlaylistService`가 Spotify playlist를 생성한다.
4. `PlaylistService`가 track URI를 playlist에 추가한다.
5. Route Handler가 생성된 playlist URL을 반환한다.
