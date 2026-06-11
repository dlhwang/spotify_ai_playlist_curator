# Spotify OpenAPI Search Reference 정리

<!-- markdownlint-disable MD013 -->

본 문서는 2026-06-11에 Spotify 공식 OpenAPI 스키마
`https://developer.spotify.com/reference/web-api/open-api-schema.yaml`을 내려받아,
RAG 기반 음악 큐레이션에서 Search API를 잘 활용하기 위해 필요한 내용을
정리한 참조 문서입니다.

원천 스키마는 Spotify Web API 전체를 포함하지만, 이 문서는 Search API와
Search 기반 후보 확장에 직접 연결되는 주변 API만 다룹니다.

---

## 1. 공통 전제

* **Base URL**: `https://api.spotify.com/v1`
* **인증**: 모든 주요 API는 OAuth 2.0 access token을 사용합니다.
* **공통 오류 응답**: 주요 엔드포인트는 `401 Unauthorized`,
  `403 Forbidden`, `429 Too Many Requests`를 반환할 수 있습니다.
* **Market 처리**: `market`은 ISO 3166-1 alpha-2 국가 코드입니다.
  사용자의 유효한 access token이 있으면 토큰의 사용자 국가가 `market`
  파라미터보다 우선합니다. 둘 다 없으면 콘텐츠가 unavailable로 처리될 수 있습니다.
* **정책 주의**: 일부 카탈로그 API는 `x-spotify-policy-list`에
  `MachineLearning` 정책이 연결되어 있습니다. 외부 LLM에 Spotify 데이터를
  전달하는 기능은 최소 메타데이터만 사용하고, 프로덕션 적용 전 정책 검토가
  필요합니다.

---

## 2. Search API 핵심

### 2.1 엔드포인트

| 항목 | 값 |
| :--- | :--- |
| Method | `GET` |
| Path | `/search` |
| Operation ID | `search` |
| Summary | Search for Item |
| 인증 | OAuth 2.0 |
| Deprecated | 아님 |
| 정책 | `MachineLearning` 정책 참조가 연결됨 |

### 2.2 설명

`/search`는 keyword string에 맞는 Spotify catalog 정보를 검색합니다. 검색
대상은 `album`, `artist`, `playlist`, `track`, `show`, `episode`,
`audiobook`입니다. RAG 음악 큐레이션에서는 기본적으로 `track`, 보조적으로
`artist`, `album`, 제한적으로 `playlist`를 사용할 수 있습니다.

### 2.3 쿼리 파라미터

| 파라미터 | 필수 | 타입/제약 | RAG 활용 |
| :--- | :--- | :--- | :--- |
| `q` | 예 | string | 검색어 및 field filter를 포함하는 핵심 파라미터 |
| `type` | 예 | array 또는 comma-separated item types | `track` 중심, 보조적으로 `artist`, `album`, `playlist` |
| `market` | 아니오 | ISO 3166-1 alpha-2 | 사용자의 국가 또는 기본 `KR`/`US` 전략 결정에 사용 |
| `limit` | 아니오 | 기본 5, 최대 10 | 긴 후보군 확보 시 query 수와 offset 확장이 필요 |
| `offset` | 아니오 | 기본 0, 최대 1000 | 같은 query의 다음 페이지 조회에 사용 |
| `include_external` | 아니오 | `audio` | 외부 호스팅 오디오 playable 표시가 필요할 때만 사용 |

### 2.4 `q` field filter

OpenAPI 스키마의 Search 설명에는 다음 field filter가 정의되어 있습니다.

| Filter | 적용 대상 | RAG 활용 |
| :--- | :--- | :--- |
| `album` | albums, tracks | 특정 앨범 또는 앨범명 단서 기반 검색 |
| `artist` | albums, artists, tracks | 특정 아티스트 중심 검색 및 아티스트별 최소 3곡 확보 |
| `track` | tracks | 특정 곡 제목 매핑 또는 엄격 검색 |
| `year` | albums, artists, tracks | 시대감 SPEC 반영. 단일 연도 또는 범위 사용 가능 |
| `genre` | artists, tracks | 장르/감성 SPEC 반영 |
| `isrc` | tracks | 정확한 외부 식별자가 있을 때만 사용 |
| `upc` | albums | 앨범 UPC가 있을 때만 사용 |
| `tag:new` | albums | 최근 2주 내 발매 앨범 탐색 |
| `tag:hipster` | albums | popularity 하위 10% 앨범 탐색 |

### 2.5 RAG 검색 쿼리 패턴

| 목적 | Query 예시 | Type | 비고 |
| :--- | :--- | :--- | :--- |
| 특정 곡 매핑 | `track:"Stay" artist:"The Kid LAROI"` | `track` | 현재 구현의 1차 엄격 검색 |
| 느슨한 곡 검색 | `Stay The Kid LAROI` | `track` | strict 검색 실패 시 fallback |
| 장르/감성 검색 | `genre:pop night drive` | `track` | 장르 SPEC + 감성 키워드 |
| 시대감 검색 | `genre:city-pop year:1980-1995` | `track` | 연도 범위 사용 |
| 아티스트 깊이 확장 | `artist:"YUKIKA"` | `track` | 아티스트별 최소 3곡 확보 |
| 유사 아티스트 발견 | `city pop YUKIKA` | `artist` | Related Artists API 대체 |
| 앨범 후보 탐색 | `artist:"YUKIKA" tag:new` | `album` | 신규 앨범 탐색 시 제한적 사용 |
| 장소/맥락 검색 | `late night drive synth pop` | `track` | 장소/활동 SPEC을 keyword로 표현 |

### 2.6 응답 구조

Search 응답은 요청한 `type`에 따라 다음 paging object를 포함할 수 있습니다.

| 응답 필드 | 스키마 | RAG 활용 |
| :--- | :--- | :--- |
| `tracks` | `PagingTrackObject` | 최종 후보군의 기본 소스 |
| `artists` | `PagingArtistObject` | 아티스트 후보 및 확장 대상 탐색 |
| `albums` | `PagingSimplifiedAlbumObject` | 앨범 단위 후보 확장 |
| `playlists` | `PagingPlaylistObject` | 참고용. 접근/정책 제약 때문에 기본 후보 소스로는 신중히 사용 |
| `shows` | `PagingSimplifiedShowObject` | 음악 큐레이션 범위 밖 |
| `episodes` | `PagingSimplifiedEpisodeObject` | 음악 큐레이션 범위 밖 |
| `audiobooks` | `PagingSimplifiedAudiobookObject` | 음악 큐레이션 범위 밖 |

---

## 3. Search 기반 RAG에 유용한 주변 API

### 3.1 Track API

| Endpoint | 상태 | 주요 파라미터 | 활용 판단 |
| :--- | :--- | :--- | :--- |
| `GET /tracks/{id}` | 사용 가능 | `id`, `market` | Search 결과의 단일 트랙 상세 보강에 사용 가능 |
| `GET /tracks` | Deprecated | `ids`, `market`, 최대 50 IDs | 여러 트랙 상세 일괄 보강 용도로는 현재 사용하지 않음 |

`GET /tracks/{id}`는 단일 트랙의 카탈로그 정보를 조회합니다. 다만 Search
응답만으로 `id`, `uri`, `name`, `artists`를 얻을 수 있다면 추가 호출을
줄이는 편이 좋습니다.

### 3.2 Artist API

| Endpoint | 상태 | 주요 파라미터 | 활용 판단 |
| :--- | :--- | :--- | :--- |
| `GET /artists/{id}` | 사용 가능 | `id` | 아티스트 메타데이터 보강에 사용 가능 |
| `GET /artists` | Deprecated | `ids`, 최대 50 IDs | 여러 아티스트 일괄 보강에는 사용하지 않음 |
| `GET /artists/{id}/albums` | 사용 가능 | `id`, `include_groups`, `market`, `limit`, `offset` | 아티스트별 3곡 확보가 부족할 때 앨범 경유 확장 후보 |
| `GET /artists/{id}/top-tracks` | Deprecated | `id`, `market` | 아티스트별 대표곡 확보에는 매력적이나 신규 전략에서 제외 |
| `GET /artists/{id}/related-artists` | Deprecated | `id` | 유사 아티스트 탐색에는 Search `type=artist`로 대체 |

아티스트 깊이 확장에는 `GET /artists/{id}/top-tracks`가 직관적이지만
Deprecated이므로 기본 설계에서 제외합니다. 대신 `Search type=track`의
`artist` filter와 필요 시 `GET /artists/{id}/albums` + `GET /albums/{id}/tracks`
조합을 검토합니다.

### 3.3 Album API

| Endpoint | 상태 | 주요 파라미터 | 활용 판단 |
| :--- | :--- | :--- | :--- |
| `GET /albums/{id}` | 사용 가능 | `id`, `market` | 앨범 메타데이터 보강에 제한적으로 사용 |
| `GET /albums` | Deprecated | `ids`, `market` | 여러 앨범 일괄 조회는 사용하지 않음 |
| `GET /albums/{id}/tracks` | 사용 가능 | `id`, `market`, `limit`, `offset` | 특정 아티스트/앨범 기반 트랙 확장에 사용 가능 |

앨범 경유 확장은 Search 결과에서 특정 아티스트의 앨범 후보를 얻었는데
트랙 후보가 부족할 때 보조 경로로 사용합니다.

### 3.4 User Taste API

| Endpoint | 상태 | Scope | 활용 판단 |
| :--- | :--- | :--- | :--- |
| `GET /me/top/{type}` | 사용 가능 | `user-top-read` | 장기/중기/단기 취향 seed 생성에 유용 |
| `GET /me/player/recently-played` | 사용 가능 | `user-read-recently-played` | 이미 사용 중. 최근 맥락 seed로 유지 |

`/me/top/{type}`의 `type`은 `artists` 또는 `tracks`이며, `time_range`는
`long_term`, `medium_term`, `short_term`을 사용할 수 있습니다. 사용자 취향을
Search query 생성 단계의 배경 정보로 쓰기 좋습니다.

### 3.5 Playlist API

| Endpoint | 상태 | Scope/제약 | 활용 판단 |
| :--- | :--- | :--- | :--- |
| `GET /playlists/{playlist_id}` | 사용 가능 | OAuth | 외부 플레이리스트 분석은 정책 검토 후 제한적 사용 |
| `GET /playlists/{playlist_id}/items` | 사용 가능 | `playlist-read-private`, 현재 사용자 소유/협업 playlist만 접근 가능 | 사용자의 기존 playlist 기반 취향 분석에 제한적 사용 |
| `GET /playlists/{playlist_id}/tracks` | Deprecated | 기존 tracks path | 사용하지 않음 |
| `POST /playlists/{playlist_id}/items` | 사용 가능 | `playlist-modify-public/private` | 최종 큐레이션 저장 경로로 이미 적합 |

스키마 설명상 `GET /playlists/{playlist_id}/items`는 현재 사용자 소유 또는
협업 playlist에 대해서만 접근 가능합니다. 따라서 공개 playlist를 대규모로
탐색하는 Retrieval 경로로 설계하지 않습니다.

### 3.6 Markets API

| Endpoint | 상태 | 활용 판단 |
| :--- | :--- | :--- |
| `GET /markets` | Deprecated | 사용하지 않음. `market`은 사용자 token 국가 또는 설정값으로 처리 |

---

## 4. RAG 인셉션 적용 후보

### 4.1 우선 적용

1. `GET /search`
   * 모든 Retrieval 라운드의 중심 API입니다.
   * `limit` 최대 10이므로 80~150개 후보군 확보에는 여러 query와 offset
     페이지 확장이 필요합니다.
2. `GET /me/player/recently-played`
   * 최근 청취 맥락과 fallback playlist의 기반입니다.
3. `GET /me/top/{type}`
   * `user-top-read` scope를 추가할 수 있다면 장기/중기/단기 취향 seed를
     만드는 데 유용합니다.
4. `GET /artists/{id}/albums`
   * 아티스트별 최소 3곡 확보가 부족할 때 앨범 경유 확장 후보입니다.
5. `GET /albums/{id}/tracks`
   * 앨범 기반으로 특정 아티스트의 추가 트랙 후보를 확보할 때 사용합니다.
6. `POST /playlists/{playlist_id}/items`
   * 최종 큐레이션 저장 경로입니다.

### 4.2 보류 또는 제한 적용

1. `GET /tracks/{id}`
   * Search 응답만으로 충분하지 않을 때만 단일 트랙 보강에 사용합니다.
2. `GET /artists/{id}`
   * 아티스트 메타데이터가 꼭 필요한 경우에만 사용합니다.
3. `GET /playlists/{playlist_id}` 및 `GET /playlists/{playlist_id}/items`
   * 사용자의 소유/협업 playlist 분석에는 쓸 수 있으나, 공개 playlist
     Retrieval 전략으로는 제한이 큽니다.

### 4.3 제외

1. `GET /tracks`
   * Deprecated.
2. `GET /artists`
   * Deprecated.
3. `GET /artists/{id}/top-tracks`
   * Deprecated.
4. `GET /artists/{id}/related-artists`
   * Deprecated.
5. `GET /albums`
   * Deprecated.
6. `GET /markets`
   * Deprecated.
7. `GET /playlists/{playlist_id}/tracks`
   * Deprecated. `GET /playlists/{playlist_id}/items`로 대체.

---

## 5. Search-Query RAG 구현 메모

* `limit` 최대가 10이므로 라운드별 query 수와 offset 페이지 수를
  설정값으로 둡니다.
* 각 Search 결과는 `id`와 `uri` 기준으로 중복 제거합니다.
* `market`은 사용자의 token 국가 우선 규칙을 고려하고, 명시 설정값은
  fallback으로만 사용합니다.
* `genre` filter는 artists/tracks에만 적용됩니다.
* `artist` filter는 albums/artists/tracks에 적용됩니다.
* `track` filter는 tracks에만 적용됩니다.
* 유사 아티스트 탐색은 Deprecated된 Related Artists API 대신
  `Search type=artist`와 LLM 추론을 조합합니다.
* 아티스트별 최소 3곡 확보는 `artist` filter 기반 Search를 먼저 사용하고,
  부족하면 `artists/{id}/albums`와 `albums/{id}/tracks` 조합을 검토합니다.
* Spotify 정책상 외부 LLM에는 필요한 최소 트랙 메타데이터만 전달합니다.
