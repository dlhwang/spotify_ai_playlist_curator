# 컴포넌트 의존성

## 의존 방향

```text
UI Feature Components
  -> Route Handlers
  -> Application Services
  -> Ports
  -> External Adapters
```

도메인 로직은 Next.js Route Handler나 Spotify SDK 구현에 직접 의존하지 않는다.
외부 API 세부 구현은 port 뒤에 둔다.

## Dependency Matrix

| From | To | Relationship |
| --- | --- | --- |
| App Shell | UI Feature Components | renders |
| Authentication Feature | Auth Route Handlers | calls |
| Prompt Input Feature | Curate Route Handler | calls |
| Curation Result Feature | Playlist Route Handler | calls |
| Auth Route Handlers | AuthService | orchestrates |
| Curate Route Handler | AuthService | reads session |
| Curate Route Handler | CurationService | orchestrates |
| Playlist Route Handler | PlaylistService | orchestrates |
| AuthService | SpotifyApiPort | exchanges or refreshes token |
| SpotifyProfileDataService | SpotifyApiPort | reads recently played |
| CurationService | TrackCandidateSelector | selects candidates |
| CurationService | CurationProviderPort | generates playlist concept |
| PlaylistService | SpotifyApiPort | creates playlist and adds tracks |
| Route Handlers | ErrorResponseService | maps errors |

## Communication Patterns

- UI와 server boundary는 JSON HTTP 요청과 응답으로 통신한다.
- Route Handler는 session 확인 후 application service를 호출한다.
- Application service는 port interface에 의존한다.
- Adapter는 Spotify Web API를 직접 호출한다.
- LLM provider는 placeholder 구현으로 시작하고 같은 port로 교체 가능하다.

## Data Flow: 큐레이션

```text
User Prompt
  -> CurationPromptForm
  -> POST /api/spotify/curate
  -> AuthService.readAuthSession
  -> SpotifyProfileDataService.getRecentlyPlayed
  -> TrackCandidateSelector.selectCandidates
  -> CurationProviderPort.generatePlaylistConcept
  -> CurationResultPanel
```

## Data Flow: playlist 생성

```text
CurationResult
  -> CreatePlaylistButton
  -> POST /api/spotify/playlists
  -> AuthService.readAuthSession
  -> PlaylistService.createFromCurationResult
  -> SpotifyApiPort.createPlaylist
  -> SpotifyApiPort.addTracksToPlaylist
  -> PlaylistCreationStatus
```

## Coupling Rules

- UI component는 Spotify Web API adapter를 직접 import하지 않는다.
- Route Handler는 세부 후보 선정 알고리즘을 직접 구현하지 않는다.
- `CurationService`는 HTTP request와 response 타입을 알지 않는다.
- `SpotifyWebApiAdapter`는 React component나 UI 상태를 알지 않는다.
- placeholder LLM provider는 실제 provider와 같은 port를 구현한다.
