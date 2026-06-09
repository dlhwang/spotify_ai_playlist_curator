# U-004 도메인 엔티티 (Domain Entities)

<!-- markdownlint-disable MD013 -->

본 문서는 U-004에서 사용할 AI 큐레이션 통합 도메인 엔티티와 LLM DTO(Data Transfer Object) 구조를 정의합니다.

## 1. Core Domain Entities (`src/domain/curation.ts`)

도메인 모델은 외부 LLM API 스펙 및 데이터 변환에 의존하지 않는 순수 TypeScript 타입으로 설계됩니다.

### CuratedPlaylist Entity

LLM 큐레이션 및 정제 프로세스가 완료된 후 최종적으로 반환되는 플레이리스트 결과 정보입니다.

```typescript
export interface CuratedTrack {
  /** 추천된 곡의 제목 (예: "Stay") */
  title: string;
  
  /** 추천된 곡의 아티스트 이름 (예: "The Kid LAROI") */
  artistName: string;
}

export interface CuratedPlaylist {
  /** 생성할 플레이리스트의 추천 제목 */
  title: string;
  
  /** 생성할 플레이리스트의 추천 설명 */
  description: string;
  
  /** AI가 추천한 텍스트 기반 트랙 리스트 (최대 10~15곡) */
  tracks: CuratedTrack[];
}
```

---

## 2. LLM DTO (Data Transfer Object)

외부 LLM API 호출 및 프롬프트 결과물 파싱 시 준수해야 할 원시 JSON 스키마 구조입니다.

### RawLlmResponse Schema

LLM이 생성 결과물로 반환하도록 지시하는 타겟 JSON 포맷 사양입니다.

```json
{
  "playlistTitle": "플레이리스트 추천 제목",
  "playlistDescription": "플레이리스트 추천 설명",
  "recommendedTracks": [
    {
      "title": "곡 제목",
      "artistName": "아티스트 이름"
    }
  ]
}
```

TypeScript 타입 매핑:

```typescript
export interface RawLlmResponse {
  playlistTitle: string;
  playlistDescription: string;
  recommendedTracks: Array<{
    title: string;
    artistName: string;
  }>;
}
```

---

## 3. Curation Request DTO

Route Handler (`POST /api/curate`)에서 클라이언트로부터 전달받는 입력 명세 구조입니다.

```typescript
import { Track } from "./track";

export interface CurationRequest {
  /** 사용자가 작성한 분위기 관련 자연어 프롬프트 */
  userPrompt: string;
  
  /** 사용자가 최근 재생한 중복 제거된 고유 트랙 목록 */
  recentTracks: Track[];
}
```
