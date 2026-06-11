# U-005 도메인 엔티티 (Domain Entities)

<!-- markdownlint-disable MD013 -->

본 문서는 U-005에서 사용할 Spotify Search 결과 및 트랙 매핑 관련 도메인 엔티티와 DTO(Data Transfer Object) 구조를 정의합니다.

## 1. Core Domain Entities (`src/domain/search.ts`)

도메인 모델은 외부 스포티파이 Search API의 응답 스펙 및 물리 스키마에 직접 의존하지 않는 순수 TypeScript 타입으로 설계됩니다.

### MappedTrack Entity

Spotify 카탈로그 상에서 음원 정보 검색 및 검증이 완료되어 고유 URI를 보유한 트랙 엔티티입니다.

```typescript
export interface MappedTrack {
  /** 스포티파이 고유 트랙 식별자 (예: "4iV5W9...") */
  id: string;

  /** 스포티파이 리소스 고유 URI (예: "spotify:track:4iV5W9...") */
  uri: string;

  /** 트랙(곡) 제목 (예: "Coffee") */
  title: string;

  /** 대표 아티스트 이름 (예: "beabadoobee") */
  artistName: string;
}
```

### SearchCurationResult Entity

추천 트랙 목록의 개별 텍스트 정보들이 실제 Spotify URI로 매핑 완료되어 플레이리스트 저장이 가능한 큐레이션 결과 데이터입니다.

```typescript
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

## 2. Spotify API DTO (Data Transfer Object)

스포티파이 Web API의 Search 엔드포인트(`GET /v1/search?type=track`)가 반환하는 JSON 응답 본문에서 필요한 정보만 매핑하기 위한 구조입니다.

### RawSpotifySearchResponse Schema

```json
{
  "tracks": {
    "items": [
      {
        "id": "4iV5W9...",
        "uri": "spotify:track:4iV5W9...",
        "name": "Coffee",
        "artists": [
          {
            "name": "beabadoobee"
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
