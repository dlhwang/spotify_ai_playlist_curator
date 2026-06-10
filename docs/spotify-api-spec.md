# Spotify Web API 스펙 명세서 (Recommendations & Audio Features)

<!-- markdownlint-disable MD013 -->

본 문서는 Spotify Web API의 OpenAPI 스키마에서 핵심 추천 관련 API인 `Recommendations` 및 `Audio Features` 엔드포인트의 명세를 정리한 참조용 문서입니다.

---

## 1. Recommendations API

추천 시스템의 기반이 되는 후보곡을 가져오기 위한 API입니다. 입력된 시드(장르, 아티스트, 트랙)를 바탕으로 유사한 곡들을 매칭하여 반환합니다.

* **엔드포인트**: `GET https://api.spotify.com/v1/recommendations`
* **인증**: Authorization Bearer Token 필요
* **주요 제약사항**: 
  * `seed_artists`, `seed_genres`, `seed_tracks` 파라미터를 조합하여 최대 **5개**의 시드 값만 입력할 수 있습니다. (예: 아티스트 2개 + 장르 3개 = 5개)
  * 세 종류의 시드 중 최소 한 가지 이상은 반드시 제공되어야 합니다.

### 쿼리 파라미터 (Query Parameters)

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

## 2. Audio Features API (여러 트랙 조회)

여러 곡의 물리적/음악적 분석 정보를 한 번에 가져오는 API입니다. RAG 큐레이션 단계에서 1차 후보군 트랙들의 정량적인 감성 지표를 LLM에 전달하기 위해 사용합니다.

* **엔드포인트**: `GET https://api.spotify.com/v1/audio-features`
* **인증**: Authorization Bearer Token 필요

### 쿼리 파라미터 (Query Parameters)

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
| `instrumentalness`| number | 0.0 ~ 1.0 | 보컬이 없을 확률을 나타냅니다. 1.0에 가까울수록 연주곡(Instrumental)에 가깝습니다. |
| `speechiness` | number | 0.0 ~ 1.0 | 곡에 포함된 말소리(Spoken words)의 비율을 나타냅니다. |
| `liveness` | number | 0.0 ~ 1.0 | 녹음 중 관객의 소리 등 라이브 공연 환경의 존재 여부를 나타냅니다. |

---

## 3. Audio Features API (단일 트랙 조회)

단일 트랙의 오디오 분석 피처를 가져오는 API입니다.

* **엔드포인트**: `GET https://api.spotify.com/v1/audio-features/{id}`
* **인증**: Authorization Bearer Token 필요

### 경로 파라미터 (Path Parameters)

| 파라미터명 | 타입 | 필수여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | string | 필수 | 조회하고자 하는 단일 트랙의 Spotify ID입니다. |

### 반환 데이터
`GET /v1/audio-features`에서 단일 객체만 반환되는 구조로 포맷은 동일합니다.
