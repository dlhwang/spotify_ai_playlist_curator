# 2026 펜타포트 예습 플레이리스트 결과 평가

<!-- markdownlint-disable MD013 -->

## 평가 대상

- **사용자 프롬프트 목적**: 2026 인천 펜타포트 락 페스티벌 전체 라인업을 기준으로 날짜 구분 없는 예습용 통합 플레이리스트 구성
- **생성 playlist URL**: `https://open.spotify.com/playlist/7s3n8QKyDUVN1O6TvLurSd`
- **평가 일시**: 2026-06-11
- **평가 기준 라인업**: 사용자 프롬프트에 명시된 해외/국내 라인업 목록

## 접근 한계

현재 세션에서는 Spotify 공개 playlist URL의 실제 트랙 목록을 직접 조회하지 못했다. `open.spotify.com` 페이지와 `oembed` 접근은 트랙 목록을 제공하지 않았고, Spotify Web API로 playlist items를 조회하려면 유효한 Spotify access token이 필요하다.

따라서 이 문서는 실제 곡 단위 판정표가 아니라 다음 근거를 기준으로 한 구조 평가다.

- 사용자 관찰: "상관없는 아티스트가 생긴 것 같다."
- 사용자 프롬프트의 제약: "2026 인천 펜타포트 락 페스티벌 전체 라인업을 기준"
- 현재 구현 코드의 후보 수집 및 최종 큐레이션 방식

실제 트랙 목록이 확보되면 이 문서에 `라인업 포함 여부`, `곡별 적합도`, `제외 사유` 테이블을 추가해 정밀 평가할 수 있다.

## 총평

플레이리스트가 분위기나 흐름 면에서는 그럴듯하게 만들어졌을 가능성이 높지만, 이 프롬프트의 핵심 요구사항 기준으로는 **라인업 제약 준수 실패 가능성이 큰 결과**로 봐야 한다.

이 요청은 일반적인 "어둡고 몽환적인 밴드 음악 추천"이 아니라 "특정 페스티벌 라인업 예습"이다. 그러므로 후보 아티스트의 universe는 사용자가 제공한 라인업으로 닫혀 있어야 한다. 취향 반영은 그 닫힌 집합 안에서 곡 선택과 순서를 조정하는 보조 기준이어야 한다.

현재 구현은 이 차이를 강하게 구분하지 못한다. 그래서 장르/감성 검색에서 라인업 밖 아티스트가 후보로 들어오고, 최종 큐레이터는 후보군 안에서만 고르더라도 이미 오염된 후보군을 받아 결과에 포함할 수 있다.

## 프롬프트 요구사항 해석

이 프롬프트에는 세 가지 수준의 제약이 있다.

1. **하드 제약**
   - 아티스트는 2026 인천 펜타포트 라인업에 포함되어야 한다.
   - 날짜 구분 없이 전체 라인업을 통합한다.
   - 예습용이므로 아티스트별 대표성 또는 공연 현장성이 있어야 한다.

2. **큐레이션 목표**
   - 단순 유명곡 나열을 피한다.
   - 실제 페스티벌 현장에서 즐기기 좋은 흐름으로 구성한다.
   - 입문, 취향 확장, 현장 몰입을 돕는다.

3. **사용자 취향 가중치**
   - 쏜애플처럼 어둡고 밀도 있는 밴드 사운드 선호
   - 몽환적이거나 긴장감 있는 사운드 선호
   - 감정선, 폭발력, 기타 사운드, 밴드 합 선호
   - 단, 취향만 고집하지 말고 현장성 있는 곡도 포함

여기서 "취향 확장"은 라인업 밖 유사 아티스트를 추가하라는 뜻이 아니라, 라인업 안에서 사용자가 평소 덜 듣던 아티스트와 곡으로 확장하라는 뜻에 가깝다.

## 현재 구현 기준 원인 분석

### 1. 라인업 allowlist가 없다

현재 `LlmClient.extractCurationSpecs()`는 프롬프트에서 `artistTitleSpec.artists`를 추출하지만, 이 목록을 **허용 아티스트 목록**으로 고정하지 않는다.

그 결과 라인업은 단순한 단서로 취급된다. "반드시 이 아티스트들 안에서만 고르라"는 검증 규칙이 없다.

### 2. 장르/감성 검색이 열린 검색으로 동작한다

`LlmClient.createSearchPlan()`은 `genreMood`, `placeContext`, `artistTitle` 라운드를 만들고, `SpotifyService.searchTracksByQueryRounds()`는 각 query를 그대로 Spotify Search API에 던진다.

예를 들어 `dark dense band sound`, `dreamy tension guitar rock`, `festival rock` 같은 query가 생성되면 Spotify는 라인업과 무관한 인기 트랙을 반환할 수 있다. 이 후보는 이후 dedupe만 거치며, 라인업 검증을 통과해야 하는 단계가 없다.

### 3. 후보군 평가가 오히려 라인업 밖 아티스트를 강화할 수 있다

`getDeterministicCoverage()`는 다음 집합을 기준으로 artist depth target을 만든다.

```text
explicit artists + candidates.map(candidate.artistName)
```

즉, 1차 후보군에 라인업 밖 아티스트가 들어오면 그 아티스트도 "3곡 이상 확보해야 할 대상"으로 승격될 수 있다. 사용자가 말한 "상관없는 아티스트"가 한 곡만 들어오는 정도를 넘어, 추가 검색으로 더 강화될 위험이 있다.

### 4. 최종 큐레이터는 후보 밖 곡을 막지만 후보 자체의 오염은 막지 못한다

`curateWithExpandedCandidates()`는 "provided candidates만 사용하라"고 지시하고, 실제로 LLM이 반환한 `id` 또는 `uri`가 후보군과 매칭되지 않으면 제외한다.

이 제약은 hallucination을 줄이는 데는 좋다. 하지만 후보군에 이미 라인업 밖 아티스트가 포함되어 있으면, 최종 큐레이터는 그 곡을 합법 후보로 볼 수 있다.

## 품질 판정

| 항목 | 평가 | 이유 |
| --- | --- | --- |
| 프롬프트 분위기 반영 | 보통 이상 가능 | 어둡고 몽환적이며 긴장감 있는 검색 query가 생성될 수 있다. |
| 페스티벌 예습 목적 | 부분 충족 | 현장성 중심 흐름은 만들 수 있지만 라인업 제약이 느슨하다. |
| 라인업 준수 | 취약 | allowlist 필터가 없고 열린 Spotify 검색 결과가 그대로 후보가 된다. |
| 아티스트별 depth | 방향은 좋으나 위험 | 라인업 밖 후보까지 depth 대상으로 승격될 수 있다. |
| 신뢰 가능한 RAG | 미흡 | retrieval 결과가 사용자가 제공한 라인업 지식에 grounded 되었는지 검증하지 않는다. |

## 평가 결론

이 결과는 "분위기 기반 RAG 플레이리스트"로는 잘 만들어졌을 수 있지만, "특정 페스티벌 라인업 예습 플레이리스트"로는 아직 신뢰하기 어렵다.

가장 큰 문제는 최종 큐레이션이 아니라 **retrieval 단계의 후보군 경계**다. 지금은 `사용자 프롬프트 → SPEC → 열린 검색 query → 후보군 → 최종 선택` 구조다. 페스티벌 예습에서는 `사용자 프롬프트 → 라인업 allowlist 추출 → 라인업 아티스트별 검색 → 후보군 검증 → 취향/현장성 기반 최종 선택` 구조가 되어야 한다.

## 개선 방향

### 1. festival/lineup 모드 감지

프롬프트에 다음 신호가 있으면 일반 RAG가 아니라 lineup-constrained curation으로 전환한다.

- `페스티벌`
- `라인업`
- `예습`
- 행사명, 기간, 장소
- 아티스트 목록 블록

### 2. artistTitleSpec를 allowlist로 승격

라인업 모드에서는 `artistTitleSpec.artists`를 단순 선호 아티스트가 아니라 `allowedArtists`로 취급한다.

필요한 규칙:

- 최종 결과의 모든 track.artistName은 `allowedArtists`에 매칭되어야 한다.
- Spotify의 표기 차이, 한글/영문 표기 차이, 공동 아티스트 표기는 alias table로 허용한다.
- 매칭 실패 곡은 최종 큐레이션 전에 제거한다.

### 3. 검색 전략 변경

라인업 모드에서는 일반 query를 줄이고 아티스트 필터 검색을 우선한다.

권장 검색 순서:

1. `artist:"쏜애플"`
2. `artist:"THORNAPPLE"` 같은 alias query
3. `artist:"쏜애플" genre:rock` 같은 보조 query
4. 검색 결과가 부족할 때만 fallback query 사용

`genreMood`와 `placeContext`는 후보를 찾는 검색어가 아니라, 이미 찾은 라인업 후보를 점수화하고 정렬하는 기준으로 사용하는 편이 낫다.

### 4. 후보군 후처리 필수화

Spotify Search 결과 수집 뒤 다음 필터를 둔다.

```text
candidate.artistName in allowedArtists or candidate.artistName matches allowedArtistAliases
```

필터링 결과가 부족하면 "라인업 내에서 Spotify 검색 후보가 부족했다"는 note를 남겨야 한다. 라인업 밖 아티스트를 몰래 섞는 것보다 부족한 이유를 명시하는 편이 더 정직하다.

### 5. 최종 LLM 프롬프트 강화

최종 큐레이터 프롬프트에 다음 문장을 추가해야 한다.

```text
This is a lineup-constrained festival preparation playlist.
Never include artists outside allowedArtists.
Preference terms such as dark, dreamy, tense, guitar-driven are ranking criteria only, not permission to add similar artists.
If candidate tracks are insufficient, return fewer tracks and explain the shortage.
```

### 6. 테스트 추가

최소 테스트는 다음을 포함해야 한다.

- 라인업 프롬프트에서 `allowedArtists`를 추출한다.
- Spotify 검색 후보에 라인업 밖 아티스트가 섞여도 최종 후보군에서 제거한다.
- 최종 LLM이 라인업 밖 후보를 선택하려 해도 결과에서 제외한다.
- 아티스트별 3곡 depth 확장은 allowed artist에만 적용한다.

## 다음 구현 후보

이 평가를 기준으로 다음 작업은 `U-017: Lineup-Constrained Festival Curation`으로 분리하는 것이 적절하다.

핵심 범위:

- `CurationSpecs`에 `allowedArtists` 또는 `constraints.allowedArtists` 추가
- `LlmClient.extractCurationSpecs()`에 lineup/festival 감지와 allowlist 추출 강화
- `SpotifyService` 또는 route layer에 allowed artist 필터 추가
- 최종 큐레이션 prompt에 lineup hard constraint 추가
- route/service 테스트 추가
