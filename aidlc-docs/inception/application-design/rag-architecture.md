# RAG 기반 음악 큐레이션 아키텍처 설계서

<!-- markdownlint-disable MD013 -->

## 1. 아키텍처 개요

본 설계서는 사용자의 감정 프롬프트와 음악 취향을 스포티파이 Recommendations
API 및 Audio Features API의 실제 카탈로그 정보와 융합하고, 2단계 LLM
파이프라인을 통해 정밀 필터링하는 **RAG(Retrieval-Augmented Generation) 기반
음악 추천 모델**의 물리적/논리적 아키텍처를 정의합니다.

---

## 2. 컴포넌트 역할 및 설계 구조

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              Next.js App                               │
│                                                                        │
│  ┌──────────────────────┐      요청      ┌──────────────────────────┐  │
│  │   Curation Handler   │ ─────────────> │        LlmClient         │  │
│  │   (/api/curate)      │ <───────────── │        (서비스)          │  │
│  └──────────────────────┘     큐레이션   └──────────────────────────┘  │
│             │                                          │               │
│             │ (이력 조회 / 후보 검색)                  │               │
│             ▼                                          ▼               │
│  ┌──────────────────────┐                     ┌─────────────────────┐  │
│  │    SpotifyService    │                     │    1차 LLM (시드)   │  │
│  │    (Spotify API)     │                     │    2차 LLM (최종)   │  │
│  └──────────────────────┘                     └─────────────────────┘  │
└─────────────│──────────────────────────────────────────│───────────────┘
              │                                          │
              ▼ (REST API)                               ▼ (Gemini/OpenAI)
   ┌──────────────────────┐                     ┌─────────────────────┐
   │     Spotify API      │                     │     LLM API 키      │
   └──────────────────────┘                     └─────────────────────┘
```

* **Curation Handler (`/api/curate` Route Handler)**:
  전체 오케스트레이션 역할을 담당합니다. 클라이언트의 분위기 입력을 받고,
  `SpotifyService`와 `LlmClient`를 조율하여 데이터 흐름을 제어합니다.
* **SpotifyService (백엔드 서비스)**:
  최근 재생 곡 수집, 1차 시드 기반 Recommendations API 조회, Audio Features
  조회를 실행하고 데이터 매핑을 담당합니다.
* **LlmClient (AI 서비스)**:
  * **1차 프롬프트 (시드 추출기)**: 자연어 프롬프트에서 스포티파이 장르/아티스트
    5개를 도출합니다.
  * **2차 프롬프트 (최종 큐레이터)**: 실존 1차 후보군 텍스트 정보와 오디오
    피처를 혼합해 감성을 분석하고, 최종 10~15곡을 엄선합니다.

---

## 3. 데이터 흐름 및 시퀀스 다이어그램 (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as "사용자 (브라우저)"
    participant Handler as "Curation Handler (/api/curate)"
    participant Spotify as "SpotifyService"
    participant LLM1 as "LlmClient (1차: 시드 추출)"
    participant LLM2 as "LlmClient (2차: 최종 선별)"

    User->>Handler: 분위기 프롬프트 전달
    Handler->>Spotify: 최근 재생 곡 조회 (최대 20곡)
    Spotify-->>Handler: 최근 재생 곡 리스트 반환
    
    Handler->>LLM1: 프롬프트 전달 (스포티파이 추천 시드 5개 추출 요청)
    LLM1-->>Handler: 5개 추천 시드 반환 (장르/아티스트 리스트)
    
    Handler->>Spotify: GET /v1/recommendations (추출된 5개 시드 전달)
    Spotify-->>Handler: 30~50곡 1차 추천 후보군 목록 반환
    
    Handler->>Spotify: GET /v1/audio-features (후보군 곡들의 오디오 피처 조회)
    Spotify-->>Handler: 각 후보곡의 오디오 피처 (valence, energy 등) 반환
    
    Note over Handler: [컨텍스트 증강]<br/>곡명 + 아티스트 + 오디오 피처 데이터 병합
    
    Handler->>LLM2: 증강된 후보 리스트 + 원래 프롬프트 전달
    Note over LLM2: 분위기 매칭 우선도(가중) 필터링<br/>및 음악적 추천 사유 서술
    LLM2-->>Handler: 최종 엄선된 10~15곡 및 플레이리스트 정보 반환
    
    Handler-->>User: 진짜 ID가 매핑된 완성형 큐레이션 결과 반환
```

---

## 4. 상세 인터페이스 계약 (Interface Contracts)

### 4.1 1차 LLM 시드 추출 프롬프트 및 응답 스키마

* **System Prompt**:
  "자연어 프롬프트를 분석하여 Spotify Recommendations API에 전달할
  시드 파라미터(genres, artists)를 도출하라. 최대 5개로 제한하며, 스포티파이
  공식 장르 명세에 존재하는 문자열만 반환해야 한다."

* **Response JSON Schema**:

  ```json
  {
    "seedGenres": ["chill", "lo-fi"],
    "seedArtists": ["BTS", "Ed Sheeran"]
  }
  ```

### 4.2 2차 최종 LLM 컨텍스트 증강 데이터 구조

* LLM에 전달할 증강 컨텍스트(`recommendedTracks` 후보군):

  ```json
  [
    {
      "id": "5HCyWkgU61j21yUjVmw2aV",
      "title": "Stay",
      "artistName": "The Kid LAROI, Justin Bieber",
      "audioFeatures": {
        "energy": 0.76,
        "valence": 0.87,
        "tempo": 170.0,
        "danceability": 0.59
      }
    }
  ]
  ```

### 4.3 예외 상황(Recommendations API 실패)에 대한 폴백 계약

* 5번 단계(Recommendations API) 혹은 6번 단계(Audio Features API) 중 하나라도
  네트워크 에러 또는 데이터 없음이 발생할 경우, Handler는 즉시 2단계에서 받은
  **최근 재생 곡 목록(`recentTracks`)**을 최종 큐레이션 결과 데이터 구조에
  그대로 래핑하여 200 OK로 폴백 반환한다.
