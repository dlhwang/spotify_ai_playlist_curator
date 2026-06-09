# 컴포넌트 메서드 설계

## C-002 Authentication Feature

### UI Methods

```ts
type AuthStatusPanelProps = {
  status: "unknown" | "unauthenticated" | "authenticated" | "error";
  onLogin: () => void;
};
```

### Server Methods

```ts
function buildSpotifyAuthorizationUrl(state: string): string;

async function exchangeAuthorizationCode(input: {
  code: string;
  redirectUri: string;
}): Promise<SpotifyTokenSet>;

async function createAuthSession(tokens: SpotifyTokenSet): Promise<AuthSession>;

async function readAuthSession(): Promise<AuthSession | null>;
```

## C-003 Prompt Input Feature

```ts
type CurationPromptFormProps = {
  disabled: boolean;
  onSubmit: (prompt: string) => Promise<void>;
};

function validateCurationPrompt(prompt: string): ValidationResult;
```

## C-004 Curation Result Feature

```ts
type CurationResultPanelProps = {
  result: CurationResult;
  onCreatePlaylist: () => Promise<void>;
  onRevisePrompt: () => void;
};
```

## C-005 Playlist Creation Feature

```ts
type CreatePlaylistButtonProps = {
  disabled: boolean;
  onCreate: () => Promise<void>;
};

async function createPlaylistRoute(
  request: CreatePlaylistHttpRequest
): Promise<CreatePlaylistHttpResponse>;
```

## C-006 Spotify API Adapter

```ts
interface SpotifyApiPort {
  getRecentlyPlayed(
    session: AuthSession,
    options: RecentlyPlayedOptions
  ): Promise<SpotifyTrack[]>;

  createPlaylist(
    session: AuthSession,
    input: CreateSpotifyPlaylistInput
  ): Promise<CreatedSpotifyPlaylist>;

  addTracksToPlaylist(
    session: AuthSession,
    input: AddTracksToPlaylistInput
  ): Promise<PlaylistSnapshot>;

  refreshAccessToken(session: AuthSession): Promise<AuthSession>;
}
```

## C-007 Curation Domain

```ts
interface CurationService {
  curate(input: CurationInput): Promise<CurationResult>;
}

interface TrackCandidateSelector {
  selectCandidates(input: {
    prompt: string;
    recentlyPlayed: SpotifyTrack[];
  }): TrackCandidate[];
}

function mapSpotifyTrackToCandidate(track: SpotifyTrack): TrackCandidate;
```

## C-008 LLM Curation Provider

```ts
interface CurationProviderPort {
  generatePlaylistConcept(
    request: CurationProviderRequest
  ): Promise<PlaylistConcept>;
}

class PlaceholderCurationProvider implements CurationProviderPort {
  generatePlaylistConcept(
    request: CurationProviderRequest
  ): Promise<PlaylistConcept>;
}
```

## C-009 Error Mapping

```ts
type AppErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_FAILED"
  | "SPOTIFY_RATE_LIMITED"
  | "SPOTIFY_PERMISSION_DENIED"
  | "PLAYLIST_CREATE_FAILED"
  | "CURATION_FAILED";

function mapSpotifyError(error: unknown): AppError;

function toErrorResponse(error: AppError): Response;
```

## 상세화 유보

토큰 refresh 세부 정책, cookie 암호화 또는 서명 방식, 후보 선정 점수화 기준,
LLM prompt 구조는 Functional Design에서 상세화한다.
