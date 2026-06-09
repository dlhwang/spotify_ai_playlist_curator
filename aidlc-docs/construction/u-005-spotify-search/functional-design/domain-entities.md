# U-005 도메인 엔티티 (Domain Entities)

<!-- markdownlint-disable MD013 -->

본 문서는 U-005에서 사용할 Spotify Search API 연동 및 트랙 매핑 관련 도메인 엔티티와 API DTO(Data Transfer Object) 구조를 정의합니다.

## 1. Core Domain Entities (`src/domain/search.ts` 혹은 `src/domain/track.ts` 재사용)

도메인 모델은 외부 API 응답 데이터에 직접 의존하지 않는 순수 TypeScript 타입으로 설계됩니다. 이전에 정의한 `Track`([track.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/domain/track.ts))을 재사용하거나 매핑 결과를 위한 전용 인터페이스를 구성합니다.

### MappedTrack Entity

Spotify Search API를 통해 정상적으로 식별되어 실제 Spotify 리소스 URI와 ID를 부여받은 트랙 모델입니다.

```typescript
export interface MappedTrack {
  /** Spotify track identifier (e.g. "4iV5W9...") */
  id: string;
  
  /** Spotify resource URI (e.g. "spotify:track:4iV5W9...") */
  uri: string;
  
  /** Track title */
  title: string;
  
  /** Primary artist name */
  artistName: string;
}
```

### SearchCurationResult Entity

추천 트랙들의 텍스트 목록이 실제 Spotify 트랙들로 완전히 매핑이 완료된 최종 상태의 플레이리스트 정보입니다.

```typescript
import { MappedTrack } from "./search";

export interface SearchCurationResult {
  /** 플레이리스트 추천 제목 */
  title: string;
  
  /** 플레이리스트 추천 설명 */
  description: string;
  
  /** URI 매핑이 완료된 실제 Spotify 트랙 목록 */
  tracks: MappedTrack[];
}
```

---

## 2. API DTO (Data Transfer Object)

Spotify Search Web API의 응답 규격을 처리하기 위한 원시 JSON 스키마 매핑 사양입니다.

### RawSpotifySearchResponse Schema

Spotify Search API(`GET /v1/search`)가 반환하는 트랙 검색 결과 응답 구조입니다.

```json
{
  "tracks": {
    "items": [
      {
        "id": "트랙_ID",
        "uri": "spotify:track:트랙_ID",
        "name": "곡 제목",
        "artists": [
          {
            "name": "아티스트 이름"
          }
        ]
      }
    ]
  }
}
```

TypeScript 타입 매핑:

```typescript
export interface RawSpotifySearchResponse {
  tracks: {
    items: Array<{
      id: string;
      uri: string;
      name: string;
      artists: Array<{
        name: string;
      }>;
    }>;
  };
}
```
