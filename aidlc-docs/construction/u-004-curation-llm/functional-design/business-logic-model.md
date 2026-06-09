# U-004 비즈니스 로직 모델 (Business Logic Model)

<!-- markdownlint-disable MD013 -->

## AI 플레이리스트 큐레이션 로직 흐름

사용자가 입력한 자연어 분위기 프롬프트와 정제된 최근 재생 곡 목록을 바탕으로 프롬프트를 구성하여 LLM API를 호출하고, 반환된 응답 구조를 파싱하여 플레이리스트 정보와 추천 트랙 리스트를 도메인 모델로 확보하는 흐름을 정의합니다.

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자
    participant Home as 홈 화면 (Page/Client)
    participant Handler as Route Handler (/api/curate)
    participant Curation as CurationService (서버)
    participant LLM as 외부 LLM API (OpenAI / Gemini 등)

    User->>Home: 큐레이션 시작 버튼 클릭 (프롬프트 입력)
    Home->>Handler: POST /api/curate { userPrompt, recentTracks }
    
    Handler->>Curation: curatePlaylist(userPrompt, recentTracks)
    note over Curation: 프롬프트 템플릿 조립 (최근 곡 + 프롬프트)
    
    rect rgb(240, 248, 255)
        note over Curation, LLM: LLM 호출 및 폴백 로직
        Curation->>LLM: POST /chat/completions (시스템/유저 프롬프트)
        alt LLM 호출 성공 및 JSON 정상 파싱
            LLM-->>Curation: 구조화된 JSON 응답
        else LLM 호출 실패 또는 JSON 파싱 오류 (1차)
            Curation->>LLM: POST /chat/completions (재시도 요청)
            alt 2차 재시도마저 실패
                note over Curation: 디폴트 플레이리스트 제목 & 설명 & 최근 재생 곡 폴백 생성
            end
        end
    end

    Curation-->>Handler: CuratedPlaylist (도메인 모델)
    Handler-->>Home: JSON { playlist: CuratedPlaylist } 반환
    Home-->>User: 생성될 플레이리스트 정보 (제목, 설명, 곡 목록) 화면 전시
```

## 컴포넌트별 명세 및 책임

### 1. Curation Service (`src/server/services/curation-service.ts`)

- **책임**: 프롬프트를 결합 및 조립하고, 외부 LLM API와의 연동을 대행하며, 응답 결과를 구조화된 JSON 도메인 객체로 추출하고 폴백 처리를 보증합니다.
- **수행 작업**:
  - `curatePlaylist(userPrompt: string, recentTracks: Track[]): Promise<CuratedPlaylist>`
  - `LLM_API_KEY` 환경 변수가 누락된 경우, 비즈니스가 멈추지 않도록 정해진 규격의 모의(Mock) LLM 응답을 자동 생성하여 반환합니다 (Option A - 환경 변수 연동 Mock 지원).

### 2. Prompt Builder (`src/server/services/prompt-builder.ts` 또는 CurationService 내부)

- **책임**: 사용자 프롬프트와 최근 재생 곡 데이터를 바탕으로 지시 사항(JSON Schema 출력 강제 등)이 포함된 최적의 LLM 시스템/유저 메시지 구조를 빌드합니다.
- **수행 작업**:
  - `buildPrompt(userPrompt: string, recentTracks: Track[]): string`
  - 최근 재생 트랙이 비어 있는 경우(Option C 규칙) 이를 감지하고, 최근 곡 반영 조건 부분을 생략한 일반 큐레이션용 최적화 프롬프트를 구성합니다.
