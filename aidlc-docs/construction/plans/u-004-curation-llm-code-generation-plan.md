# U-004 Curation Engine / LLM Client Code Generation 계획

<!-- markdownlint-disable MD013 MD053 -->

## 단위 컨텍스트

- **Unit**: U-004 Curation Engine 및 LLM Client 연동
- **Workspace Root**: `D:\workspace\spotify_aI_playlist_curator`
- **Project Type**: Next.js + TypeScript 애플리케이션
- **Application Code Location**: 워크스페이스 루트 (`src/domain/curation.ts`, `src/server/services/llm-client.ts` 등)
- **Documentation Location**: `aidlc-docs/construction/u-004-curation-llm/code/`
- **Stories**: S-004 (AI 큐레이션 및 추천 텍스트 생성)
- **Requirements**:
  - NFR-001 (LLM API Timeout Boundary - 10초)
  - NFR-002 (Parsing Resilience & Default Fallback)
  - NFR-003 (API Key Missing & Mock LLM Integration - 1~2종 정적 더미)
  - NFR-004 (Mocking and Local Testability)

## 생성 접근

U-004는 사용자의 자연어 프롬프트와 최근 재생 트랙을 기반으로 LLM API를 활용해 새로운 플레이리스트 제목, 설명 및 추천 곡 텍스트 리스트를 생성하는 단위입니다.
실제 API Key(`LLM_API_KEY` 혹은 `GEMINI_API_KEY` 등) 존재 시 실제 LLM API 호출을 통해 추천을 시도하며, API Key가 부재하거나 테스트/모크 모드(`MOCK_LLM=true`)일 때는 사전에 준비된 1~2종의 고정 정적(static) 더미 데이터 플레이리스트(`CuratedPlaylist`)를 즉시 반환합니다.
LLM 호출 시 10초의 AbortController 기반 타임아웃을 강제하며, JSON 파싱 실패 시 1회 즉시 재요청(Retry)을 보냅니다. 최종 실패 시에는 사용자 최근 재생 목록 기반의 기본 폴백 플레이리스트 데이터를 구성하여 서비스의 복원력을 확보합니다.

## 대상 경로

### Application Code

- `src/domain/curation.ts` (CuratedTrack, CuratedPlaylist 도메인 타입 정의 및 Default Fallback 생성 로직)
- `src/server/services/llm-client.ts` (Gemini API / OpenAI API 연동 및 Mock LLM 분기, 10초 타임아웃, 파싱 실패 시 1회 재시도 구현)
- `src/server/services/llm-client.test.ts` (타임아웃, 모킹 분기, 1회 파싱 실패 재시도, 최종 폴백 데이터 검증 테스트)
- `app/api/curate/route.ts` (세션 확인 및 최근 재생 트랙 조회 연동 후 AI 큐레이션을 처리하는 Route Handler)

### Documentation

- `aidlc-docs/construction/u-004-curation-llm/code/code-summary.md`

## 실행 단계

### Step 1: Domain Definition

- [x] `src/domain/curation.ts`를 생성하여 `CuratedTrack` 및 `CuratedPlaylist` 도메인 스펙 타입을 정의하고, 에러 상황 시 최근 곡 목록에서 폴백 데이터를 파싱 및 조립하는 순수 유틸 함수(`createFallbackPlaylist`)를 작성한다.

### Step 2: LLM Client Service Generation

- [x] `src/server/services/llm-client.ts`를 생성한다.
  - `LLM_API_KEY` 환경 변수가 누락되었거나 `MOCK_LLM=true` 환경에서 정적 Mock 데이터를 즉시 반환하는 Mocking 로직 구현.
  - AbortController를 이용해 10초 타임아웃 제한 로직 구현.
  - LLM 응답 JSON 파싱 실패 시, 1회 즉각 수정 재요청을 보내는 에러 복원 메커니즘 구현.
  - 최종 실패(2회 연속 파싱 실패, 네트워크 중단, 10초 타임아웃) 시 `createFallbackPlaylist`를 호출하여 안전하게 복구된 폴백 객체를 최종 반환.
- [x] `src/server/services/llm-client.test.ts`를 작성하여 각 예외 상황(타임아웃 발생, JSON 파싱 에러 1회 발생 시 복구, 2회 발생 시 최종 폴백 복구, Mock 모드 우회)을 Vitest 기반으로 고립 검증한다.

### Step 3: API Route Handler Generation

- [x] `app/api/curate/route.ts`를 작성한다.
  - HttpOnly 세션 쿠키를 검증하고 만료 시 오류 반환.
  - `SpotifyService`를 호출해 사용자 최근 재생 트랙 목록을 수집한다.
  - 사용자가 제공한 분위기 자연어 프롬프트와 최근 재생 곡 데이터를 LLM 클라이언트에 넘겨 큐레이션 결과를 JSON 형태로 응답한다.

### Step 4: Verification & Documentation

- [x] `npm.cmd run build`, `npm.cmd run typecheck`, `npm.cmd test`를 차례로 실행해 모든 테스트 통과 및 컴파일 안정성을 입증한다.
- [x] `aidlc-docs/construction/u-004-curation-llm/code/code-summary.md`를 생성하여 작업 내용 및 검증 결과를 작성한다.
- [x] 본 계획서의 체크박스를 즉시 갱신한다.

## Requirement and Story Verification

| Requirement/Story | Evidence |
| :--- | :--- |
| NFR-001 (LLM API Timeout) | AbortController 기반 10초 초과 시 Abort 동작 및 예외 차단 단위 테스트 |
| NFR-002 (Parsing Fallback) | JSON 파싱 오류 시 1회 재요청 트리거 및 최종 실패 시 Default Fallback 데이터 무결성 검증 테스트 |
| NFR-003 (Mock Engine) | API Key 누락 / Mock 모드 환경에서 사전에 정의된 정적 더미 데이터 플레이리스트 반환 테스트 |
| NFR-004 (Local Testability) | Fetch API / Node-fetch Mocking을 이용해 외부 네트워크 의존 없는 1초 이내 로컬 격리 테스트 통과 |
| S-004 (AI Playlist Recommend) | 자연어 분위기와 최근 재생 곡을 받아 어울리는 플레이리스트 제목/설명/곡 텍스트 추천 연동 검증 |

## 확인 질문

## Question 1

이 계획을 승인하고 U-004 Curation Engine / LLM Client 코드 생성 단계를 진행할까요?

A) 승인하고 코드 생성을 진행

B) 계획 수정이 필요함 (의견 제공 필요)

[Answer]:A
