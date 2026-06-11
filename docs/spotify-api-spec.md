# Spotify Web API 스펙 명세서 (Recommendations, Audio Features, Search)

<!-- markdownlint-disable MD013 -->

본 문서는 Spotify Web API의 추천/검색 관련 API 상태와 이 프로젝트의 적용 기준을 정리한 참조용 문서입니다.

2026-06-11 기준 공식 Spotify for Developers 문서에서 `Recommendations`, `Get Several Tracks' Audio Features`, `Get Track's Audio Features`는 Deprecated로 표시되어 있습니다. 또한 Spotify의 2024-11-27 Web API 변경 공지에 따르면 신규 Web API use case와 개발 모드 앱은 `Recommendations`, `Audio Features`, `Audio Analysis` 등에 접근할 수 없습니다. 기존 extended mode Web API access 앱은 영향을 받지 않는 것으로 안내되어 있으나, 신규 MVP와 개발 모드 검증은 해당 제한을 전제로 설계해야 합니다.

Spotify 공식 OpenAPI 스키마(`https://developer.spotify.com/reference/web-api/open-api-schema.yaml`)에서 Search API 및 주변 API를 별도로 정리한 참조 문서는 [spotify-open-api-search-reference.md](spotify-open-api-search-reference.md)를 확인합니다.

## 0. 프로젝트 적용 기준

* **기본 실행 경로**: 현재 MVP는 `Recommendations` 및 `Audio Features`를 직접 호출하지 않고, `GET /v1/me/player/recently-played`, `GET /v1/search`, `GET /v1/me`, `POST /v1/me/playlists`, `POST /v1/playlists/{playlist_id}/items`를 사용합니다.
* **Deprecated API 사용 방침**: `Recommendations` 및 `Audio Features`는 기존 설계 의도와 API 제약을 이해하기 위한 참조로만 유지합니다. 신규 구현의 기본 의존성으로 추가하지 않습니다.
* **대체 추천 전략**: Search-Query RAG 방식으로 사용자의 자연어 프롬프트에서 검색 쿼리를 도출하고, Spotify Search API로 실존 트랙 후보를 확보한 뒤 LLM이 최종 선별하도록 설계합니다.
* **AI/ML 정책 주의**: Spotify 공식 Reference에는 Spotify Platform 또는 Spotify Content를 ML/AI 모델 학습에 사용하거나 ML/AI 모델에 ingest할 수 없다는 중요 정책 노트가 포함되어 있습니다. 외부 LLM에 Spotify Content를 전달하는 프로덕션 기능은 Spotify 정책, 앱 심사, 데이터 처리 범위 검토를 거친 뒤 적용해야 합니다.

참조:

* [Spotify Get Recommendations Reference](https://developer.spotify.com/documentation/web-api/reference/get-recommendations)
* [Spotify Get Several Tracks' Audio Features Reference](https://developer.spotify.com/documentation/web-api/reference/get-several-audio-features)
* [Spotify Web API changes announcement, 2024-11-27](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)

---

## 1. Recommendations API (Deprecated)

추천 시스템의 기반이 되는 후보곡을 가져오기 위한 API입니다. 입력된 시드(장르, 아티스트, 트랙)를 바탕으로 유사한 곡들을 매칭하여 반환합니다.

* **엔드포인트**: `GET https://api.spotify.com/v1/recommendations`
* **인증**: Authorization Bearer Token 필요
* **현재 상태**: Deprecated
* **프로젝트 적용**: 신규 MVP 기본 경로에서 사용하지 않음
* **주요 제약사항**:
  * `seed_artists`, `seed_genres`, `seed_tracks` 파라미터를 조합하여 최대 **5개**의 시드 값만 입력할 수 있습니다. (예: 아티스트 2개 + 장르 3개 = 5개)
  * 세 종류의 시드 중 최소 한 가지 이상은 반드시 제공되어야 합니다.
  * 신규 Web API use case 및 개발 모드 앱은 2024-11-27 변경 이후 접근 제한 대상입니다.

### Recommendations 쿼리 파라미터 (Query Parameters)

| 파라미터명 | 타입 | 필수여부 | 기본값 / 제약조건 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | integer | 선택 | 기본값: 20 (최소 1, 최대 100) | 반환받을 추천 트랙 목록의 개수입니다. |
| `market` | string | 선택 | - | 콘텐츠 시장(국가) 코드입니다. (예: `KR`, `US`) |
| `seed_artists` | string | 조건부 필수 | 최대 5개 조합 제한 | 쉼표(,)로 구분된 Spotify 아티스트 ID 목록입니다. |
| `seed_genres` | string | 조건부 필수 | 최대 5개 조합 제한 | 쉼표(,)로 구분된 장르 시드 목록입니다. [장르 목록 API](/documentation/web-api/reference/get-recommendation-genres) 기준 유효한 문자열이어야 합니다. |
| `seed_tracks` | string | 조건부 필수 | 최대 5개 조합 제한 | 쉼표(,)로 구분된 Spotify 트랙 ID 목록입니다. |

### 튜닝 가능한 트랙 속성 (Tunable Track Attributes)

추천 필터링 및 타겟 매칭을 위해 아래 접두사를 붙여 추가 쿼리 파라미터로 보낼 수 있습니다:

* `min_*`: 해당 속성의 하한선 지정 (예: `min_tempo=140`)
* `max_*`: 해당 속성의 상한선 지정 (예: `max_energy=0.8`)
* `target_*`: 선호하는 속성의 목표치 지정 (예: `target_valence=0.6`)

대표적인 튜닝 가능 오디오 피처 속성:

* `acousticness` (0.0 ~ 1.0)
* `danceability` (0.0 ~ 1.0)
* `energy` (0.0 ~ 1.0)
* `instrumentalness` (0.0 ~ 1.0)
* `key` (0 ~ 11)
* `liveness` (0.0 ~ 1.0)
* `loudness` (dB 수치)
* `mode` (0: 마이너, 1: 메이저)
* `popularity` (0 ~ 100)
* `speechiness` (0.0 ~ 1.0)
* `tempo` (BPM 수치)
* `valence` (0.0 ~ 1.0)

---

## 2. Audio Features API (여러 트랙 조회, Deprecated)

여러 곡의 물리적/음악적 분석 정보를 한 번에 가져오는 API입니다. RAG 큐레이션 단계에서 1차 후보군 트랙들의 정량적인 감성 지표를 LLM에 전달하기 위해 사용합니다.

* **엔드포인트**: `GET https://api.spotify.com/v1/audio-features`
* **인증**: Authorization Bearer Token 필요
* **현재 상태**: Deprecated
* **프로젝트 적용**: 신규 MVP 기본 경로에서 사용하지 않음
* **주요 제약사항**:
  * 신규 Web API use case 및 개발 모드 앱은 2024-11-27 변경 이후 접근 제한 대상입니다.
  * 공식 Reference의 AI/ML 정책 노트에 따라 Spotify Content의 ML/AI 모델 학습 또는 ingest 사용은 금지됩니다.

### Audio Features 쿼리 파라미터 (Query Parameters)

| 파라미터명 | 타입 | 필수여부 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `ids` | string | 필수 | 쉼표(,)로 구분된 ID 목록 (최대 100개) | 오디오 피처를 조회할 Spotify 트랙 ID 목록입니다. |

### 주요 반환 데이터 필드 (Audio Features Object)

| 필드명 | 타입 | 범위 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | string | - | 해당 트랙의 Spotify ID입니다. |
| `uri` | string | - | 해당 트랙의 Spotify URI입니다. (`spotify:track:xxxx`) |
| `valence` | number | 0.0 ~ 1.0 | 곡의 음악적 긍정성(밝기) 지수입니다. 수치가 높을수록 긍정적이고 밝으며(예: 기쁨, 흥겨움), 낮을수록 부정적이고 어둡습니다(예: 슬픔, 분노). |
| `energy` | number | 0.0 ~ 1.0 | 곡의 에너지 및 강도 지수입니다. 빠르고 시끄럽고 강렬한 곡(예: 데스 메탈)은 1.0에 가까우며, 느리고 차분한 곡(예: 바흐 첼로 조곡)은 0.0에 가깝습니다. |
| `tempo` | number | - | 곡의 분당 박자수(BPM)입니다. |
| `danceability` | number | 0.0 ~ 1.0 | 박자, 리듬 안정성, 비트 강도 등을 종합하여 춤추기에 적합한 정도를 나타냅니다. |
| `acousticness` | number | 0.0 ~ 1.0 | 곡의 어쿠스틱 악기 사용 비중입니다. |
| `instrumentalness` | number | 0.0 ~ 1.0 | 보컬이 없을 확률을 나타냅니다. 1.0에 가까울수록 연주곡(Instrumental)에 가깝습니다. |
| `speechiness` | number | 0.0 ~ 1.0 | 곡에 포함된 말소리(Spoken words)의 비율을 나타냅니다. |
| `liveness` | number | 0.0 ~ 1.0 | 녹음 중 관객의 소리 등 라이브 공연 환경의 존재 여부를 나타냅니다. |

---

## 3. Audio Features API (단일 트랙 조회, Deprecated)

단일 트랙의 오디오 분석 피처를 가져오는 API입니다.

* **엔드포인트**: `GET https://api.spotify.com/v1/audio-features/{id}`
* **인증**: Authorization Bearer Token 필요
* **현재 상태**: Deprecated
* **프로젝트 적용**: 신규 MVP 기본 경로에서 사용하지 않음

### 경로 파라미터 (Path Parameters)

| 파라미터명 | 타입 | 필수여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | string | 필수 | 조회하고자 하는 단일 트랙의 Spotify ID입니다. |

### 반환 데이터

`GET /v1/audio-features`에서 단일 객체만 반환되는 구조로 포맷은 동일합니다.

---

## 4. Search API (현재 MVP 대체 전략)

Spotify 카탈로그에 실제 존재하는 트랙을 찾기 위한 현재 MVP의 핵심 API입니다. LLM이 생성한 텍스트 기반 추천 곡명이나 Search-Query RAG의 1차 검색 쿼리를 실제 Spotify 트랙 ID/URI로 매핑할 때 사용합니다.

* **엔드포인트**: `GET https://api.spotify.com/v1/search`
* **인증**: Authorization Bearer Token 필요
* **현재 상태**: Deprecated 아님
* **프로젝트 적용**: 현재 기본 실행 경로에서 사용

### Search 쿼리 파라미터 (Query Parameters)

| 파라미터명 | 타입 | 필수여부 | 프로젝트 사용값 / 제약조건 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `q` | string | 필수 | `track:"{title}" artist:"{artist}"` 또는 느슨한 키워드 | 검색할 키워드입니다. |
| `type` | string array 또는 comma-separated string | 필수 | `track` 중심, 보조적으로 `artist`, `album`, `playlist` | 검색 대상 타입입니다. |
| `market` | string | 선택 | 사용자 token 국가 우선, 설정값은 fallback | 콘텐츠 이용 가능 국가입니다. |
| `limit` | integer | 선택 | 기본 5, 최대 10 | 반환받을 항목 수입니다. 긴 후보군 확보에는 query/offset 확장이 필요합니다. |
| `offset` | integer | 선택 | 기본 0, 최대 1000 | 같은 query의 다음 페이지를 조회합니다. |
| `include_external` | string | 선택 | `audio` | 외부 호스팅 오디오 playable 표시가 필요할 때만 사용합니다. |

### Search field filter

| Filter | 적용 대상 | 프로젝트 활용 |
| :--- | :--- | :--- |
| `album` | albums, tracks | 특정 앨범명 단서 또는 앨범 기반 확장 |
| `artist` | albums, artists, tracks | 특정 아티스트 곡 검색 및 아티스트별 최소 3곡 확보 |
| `track` | tracks | 특정 곡 제목의 엄격 매핑 |
| `year` | albums, artists, tracks | 시대감 SPEC 반영. 단일 연도 또는 범위 |
| `genre` | artists, tracks | 장르/감성 SPEC 반영 |
| `isrc` | tracks | 정확한 외부 식별자가 있을 때만 사용 |
| `upc` | albums | 앨범 UPC가 있을 때만 사용 |
| `tag:new` | albums | 최근 발매 앨범 탐색 |
| `tag:hipster` | albums | 낮은 popularity 앨범 탐색 |

### 현재 구현 매핑 전략

1. `track:"곡명" artist:"아티스트"` 형태의 엄격한 쿼리로 1차 검색합니다.
2. 실패 시 괄호/대괄호 부가 정보를 제거한 제목 및 아티스트명으로 2차 검색합니다.
3. 계속 실패하면 `곡명 아티스트` 형태의 느슨한 키워드 검색을 수행합니다.
4. 개별 트랙 검색은 5초 타임아웃을 적용합니다.
5. 401 응답은 상위 서비스에서 토큰 리프레시 후 1회 재시도합니다.
6. 개별 검색 실패는 해당 곡만 스킵하되, 최종 매핑 성공 트랙이 0개이면 명시적 오류로 처리합니다.

### Search-Query RAG 고도화 기준

Search-Query RAG 구현 시에는 다음 기준을 적용합니다.

* LLM은 사용자 프롬프트를 장르/감성 SPEC, 장소/청취 맥락 SPEC, 아티스트/곡 SPEC으로 먼저 분해합니다.
* SPEC별 Round A/B/C 검색 쿼리를 만들고, Search API의 `limit` 최대 10 제약을 고려해 query 수와 `offset` 페이지를 조합합니다.
* 아티스트별 최소 3곡 목표가 부족하면 Round D 아티스트 깊이 확장을 수행합니다.
* 후보군은 Spotify `id` 또는 `uri` 기준으로 중복 제거합니다.
* 최종 LLM은 후보군의 곡명/아티스트/ID/URI/검색 라운드 출처를 참고하여 2~3시간 길이도 허용하는 최종 플레이리스트를 선별합니다.
* Spotify 정책상 외부 LLM 컨텍스트에 포함 가능한 데이터 범위는 프로덕션 적용 전에 별도 검토합니다.

---

## 5. RAG 인셉션 활용 API 선별

Spotify OpenAPI 스키마를 기준으로, 절차형 RAG 큐레이션에 활용할 API를 다음과 같이 선별합니다.

### 5.1 우선 활용

| API | 상태 | Scope | 활용 목적 |
| :--- | :--- | :--- | :--- |
| `GET /search` | 사용 가능 | OAuth | SPEC별 후보 검색의 중심 API |
| `GET /me/player/recently-played` | 사용 가능 | `user-read-recently-played` | 최근 청취 맥락 및 fallback playlist 기반 |
| `GET /me/top/{type}` | 사용 가능 | `user-top-read` | 장기/중기/단기 취향 seed 생성 |
| `GET /artists/{id}/albums` | 사용 가능 | OAuth | 특정 아티스트 후보가 부족할 때 앨범 경유 확장 |
| `GET /albums/{id}/tracks` | 사용 가능 | OAuth | 앨범에서 추가 트랙 후보 확보 |
| `POST /playlists/{playlist_id}/items` | 사용 가능 | `playlist-modify-public/private` | 최종 큐레이션 저장 |

### 5.2 제한 활용

| API | 상태 | 활용 판단 |
| :--- | :--- | :--- |
| `GET /tracks/{id}` | 사용 가능 | Search 응답만으로 부족할 때 단일 트랙 상세 보강 |
| `GET /artists/{id}` | 사용 가능 | 아티스트 이름, 장르, popularity 등 메타데이터가 꼭 필요할 때만 보강 |
| `GET /playlists/{playlist_id}` | 사용 가능 | 사용자가 직접 선택한 playlist 분석에 제한적으로 사용 |
| `GET /playlists/{playlist_id}/items` | 사용 가능 | 현재 사용자 소유/협업 playlist 분석에 제한적으로 사용 |

### 5.3 제외 또는 기본 미사용

| API | 제외 사유 |
| :--- | :--- |
| `GET /tracks` | Deprecated |
| `GET /artists` | Deprecated |
| `GET /artists/{id}/top-tracks` | Deprecated. 아티스트 대표곡 검색은 Search `artist` filter로 대체 |
| `GET /artists/{id}/related-artists` | Deprecated. 유사 아티스트 탐색은 Search `type=artist`와 LLM 추론으로 대체 |
| `GET /albums` | Deprecated |
| `GET /markets` | Deprecated. `market`은 사용자 token 국가 또는 설정값으로 처리 |
| `GET /playlists/{playlist_id}/tracks` | Deprecated. `GET /playlists/{playlist_id}/items`로 대체 |

### 5.4 인셉션 반영 결정

* 후보군 80~150곡 확보는 단일 Search query로 불가능하므로, SPEC별 다중 query와 offset 확장을 기본 전략으로 둡니다.
* 아티스트별 최소 3곡 확보는 `artist:"{artistName}"` 또는 `artist:{artistName}` 기반 Search를 1차로 사용합니다.
* 아티스트 곡이 부족할 때만 `GET /artists/{id}/albums`와 `GET /albums/{id}/tracks`를 보조 경로로 검토합니다.
* 사용자 취향 seed 품질을 높이기 위해 `GET /me/top/{type}` scope 추가를 U-012 구현 전 검토합니다.
* 공개 playlist를 일반 Retrieval corpus처럼 쓰는 전략은 접근 제약과 정책 검토 부담 때문에 이번 인셉션 기본 경로에서는 제외합니다.
