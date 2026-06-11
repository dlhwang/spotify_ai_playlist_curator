# U-004 도메인 엔티티 (Domain Entities)

<!-- markdownlint-disable MD013 -->

본 문서는 U-004에서 사용할 AI 큐레이션 통합 도메인 엔티티와 LLM DTO(Data Transfer Object) 구조를 정의합니다.

## 1. Core Domain Entities (`src/domain/curation.ts`)

도메인 모델은 RAG 절차형 파이프라인의 각 단계(SPEC 분해, 검색 계획, 커버리지 검사, 최종 큐레이션, 생성 후 검증 및 수리)에서 수집 및 전달되는 데이터를 나타냅니다.

### Curation Specs

자연어 프롬프트에서 분해된 3축 SPEC 및 라인업 제약사항 정보입니다.

```typescript
export interface CurationSpec {
  mustHave: string[];
  niceToHave: string[];
  avoid: string[];
  confidence: number;
}

export interface ArtistTitleSpec {
  artists: string[];
  similarArtists: string[];
  titles: string[];
  avoid: string[];
  confidence: number;
}

export interface CurationConstraints {
  /** 큐레이션 동작 모드 ("open" | "lineup") */
  mode: "open" | "lineup";

  /** 페스티벌/라인업 모드 시 반드시 지켜야 하는 아티스트 목록 */
  allowedArtists: string[];

  /** 아티스트명의 표기 차이를 극복하기 위한 별칭 맵 */
  allowedArtistAliases?: Record<string, string[]>;

  /** 라인업 제약의 엄격도 ("strict" | "soft") */
  lineupConstraint?: "strict" | "soft";
}

export interface CurationSpecs {
  genreMoodSpec: CurationSpec;
  placeContextSpec: CurationSpec;
  artistTitleSpec: ArtistTitleSpec;
  constraints?: CurationConstraints;
}
```

### Search Query Rounds & Coverage

Spotify Search API를 호출하기 위해 설계된 계획 및 1차 검색 후의 후보군 평가 데이터 구조입니다.

```typescript
export interface SearchQueryRound {
  round: "genreMood" | "placeContext" | "artistTitle" | "artistDepth";
  queries: string[];
  limitPerQuery: number;
  offsets?: number[];
}

export interface ArtistDepthTarget {
  artistName: string;
  requestedMinimum: number;
  queries: string[];
}

export interface CandidateCoverageEvaluation {
  artistDepthTargets: ArtistDepthTarget[];
  missingSpecs: string[];
}
```

### Verification & Repair Entities

최종 선별된 플레이리스트 트랙들을 규칙 기반으로 검증 및 수리하는 단계에서 사용되는 엔티티입니다.

```typescript
export interface CurationValidationIssue {
  type: "artist_not_allowed" | "duplicate_track" | "missing_spotify_uri" | "artist_depth_shortage";
  trackId?: string;
  artistName?: string;
  reason: string;
}

export interface CurationValidationResult {
  passed: boolean;
  hardConstraintViolations: CurationValidationIssue[];
  coverageWarnings: CurationValidationIssue[];
  repairActions: CurationValidationIssue[];
}

export interface ArtistDepthNote {
  artistName: string;
  requestedMinimum: number;
  selectedCount: number;
  reason: string;
}
```

### Procedural Curation Result

최종적으로 클라이언트에 반환되는 RAG 큐레이션 결과 정보입니다.

```typescript
import { MappedTrack } from "./search";

export interface ProceduralCurationResult {
  /** 생성할 플레이리스트의 추천 제목 */
  title: string;

  /** 생성할 플레이리스트의 추천 설명 */
  description: string;

  /** 스포티파이 ID/URI가 매핑 완료된 실존 트랙 리스트 */
  tracks: MappedTrack[];

  /** 플레이리스트 목표 시간 (분 단위) */
  targetDurationMinutes?: number;

  /** 아티스트별 3곡 확보 관련 분석 기록 */
  artistDepthNotes?: ArtistDepthNote[];

  /** 생성 후 검증 및 수리 통계 리포트 */
  validation?: CurationValidationResult;
}
```

---

## 2. LLM DTO (Data Transfer Object)

외부 LLM API 호출 및 프롬프트 결과물 파싱 시 준수해야 할 JSON 스키마 구조입니다.

### CurationSpecs DTO (`extractCurationSpecs`)

```json
{
  "genreMoodSpec": {
    "mustHave": ["lo-fi", "chill"],
    "niceToHave": ["warm acoustic"],
    "avoid": ["heavy metal"],
    "confidence": 0.85
  },
  "placeContextSpec": {
    "mustHave": ["cafe", "studying"],
    "niceToHave": ["rainy day"],
    "avoid": [],
    "confidence": 0.90
  },
  "artistTitleSpec": {
    "artists": ["beabadoobee"],
    "similarArtists": ["Bruno Major"],
    "titles": ["Coffee"],
    "avoid": [],
    "confidence": 0.75
  },
  "constraints": {
    "mode": "open",
    "allowedArtists": [],
    "allowedArtistAliases": {},
    "lineupConstraint": "soft"
  }
}
```

### SearchPlan DTO (`createSearchPlan`)

```json
{
  "rounds": [
    {
      "round": "genreMood",
      "queries": ["genre:indie mood:chill", "lofi acoustic"],
      "limitPerQuery": 10,
      "offsets": [0]
    }
  ]
}
```

### CandidateCoverageEvaluation DTO (`evaluateCandidateCoverage`)

```json
{
  "artistDepthTargets": [
    {
      "artistName": "beabadoobee",
      "requestedMinimum": 3,
      "queries": ["artist:\"beabadoobee\""]
    }
  ],
  "missingSpecs": ["cafe playlist mood overlaps"]
}
```

### RawProceduralCurationResponse DTO (`curateWithExpandedCandidates`)

```json
{
  "playlistTitle": "플레이리스트 추천 제목",
  "playlistDescription": "플레이리스트 추천 설명",
  "targetDurationMinutes": 120,
  "tracks": [
    {
      "id": "spotify_id",
      "uri": "spotify:track:spotify_id",
      "title": "곡 제목",
      "artistName": "아티스트 이름",
      "reason": "큐레이션 추천 사유"
    }
  ],
  "artistDepthNotes": [
    {
      "artistName": "beabadoobee",
      "requestedMinimum": 3,
      "selectedCount": 2,
      "reason": "스포티파이 후보군에서 2곡만 수집되었습니다."
    }
  ]
}
```
