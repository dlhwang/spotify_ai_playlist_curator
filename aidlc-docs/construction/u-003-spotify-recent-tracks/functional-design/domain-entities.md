# U-003 도메인 엔티티 (Domain Entities)

<!-- markdownlint-disable MD013 -->

본 문서는 U-003에서 사용할 애플리케이션 코어 도메인 엔티티와 Spotify API DTO(Data Transfer Object) 구조를 정의합니다.

## 1. Core Domain Entities (`src/domain/track.ts` 또는 `src/domain/index.ts`)

도메인 모델은 외부 API 구조 및 데이터베이스 모델과 분리되어 네트워크 없이 테스트 가능한 순수 TypeScript 타입으로 설계됩니다.

### Track Entity

플레이리스트 큐레이션 및 생성 과정에서 필요한 트랙의 필수 정보입니다.

```typescript
export interface Track {
  /** Spotify 트랙 고유 식별자 (예: "4iV5W9...") */
  id: string;
  
  /** Spotify 음원 주소 (예: "spotify:track:4iV5W9...") */
  uri: string;
  
  /** 트랙 제목 (예: "Neon Evening") */
  title: string;
  
  /** 대표 아티스트 이름 (예: "Various Artists") */
  artistName: string;
}
```

### CurationInput Model

AI 플레이리스트 큐레이션 요청 시 조립되는 통합 도메인 모델입니다.

```typescript
export interface CurationInput {
  /** 사용자가 입력한 자연어 분위기 프롬프트 */
  userPrompt: string;
  
  /** 사용자가 최근 재생한 중복 제거된 고유 트랙 목록 */
  recentTracks: Track[];
}
```

---

## 2. Spotify API Data Structures (DTO)

외부 통신 레이어인 `src/server/` 영역에서 사용하는 Spotify Web API의 최근 재생 곡 목록 원본 스펙 명세입니다.

### RawSpotifyPlayHistory

`GET /v1/me/player/recently-played` API의 응답 구조 중 주요 필드만을 명시합니다.

```typescript
export interface RawSpotifyPlayHistory {
  track: RawSpotifyTrack;
  played_at: string;
  context: {
    uri: string;
    type: string;
  } | null;
}

export interface RawSpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: RawSpotifyArtist[];
  album: RawSpotifyAlbum;
}

export interface RawSpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface RawSpotifyAlbum {
  id: string;
  name: string;
  images: RawSpotifyImage[];
}

export interface RawSpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface RawSpotifyRecentlyPlayedResponse {
  items: RawSpotifyPlayHistory[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  } | null;
  limit: number;
}
```
