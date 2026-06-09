# U-004 Curation Engine / LLM Client Functional Design 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-004는 사용자의 자연어 프롬프트와 최근 재생 곡 목록(`Track[]`)을 결합하여 AI 플레이리스트 큐레이션을 수행하고, LLM의 반환 데이터(플레이리스트 제목, 설명, 추천 트랙 리스트)를 파싱하여 도메인 모델로 정제하는 비즈니스 흐름을 갖는다. 본 단계에서는 LLM 프롬프트 조립 규칙, 외부 LLM 클라이언트 연동 정책, 결과물 파싱 실패 등 예외 흐름 처리를 설계하고 문서화한다.

## 실행 체크리스트

- [x] U-004 책임과 사용자 스토리 S-004, S-006의 수용 기준을 검토한다.
- [x] 입력 프롬프트(`userPrompt` + `recentTracks`)를 조립하여 LLM에 전달할 시스템/유저 프롬프트 설계 템플릿을 정의한다.
- [x] LLM이 반환해야 할 JSON 스키마 구조(플레이리스트 메타데이터 및 추천 트랙 리스트)를 정의한다.
- [x] LLM API 호출 실패 및 결과 파싱 에러(JSON 포맷 위반 등) 발생 시의 폴백 규칙을 정의한다.
- [x] 추천된 트랙들을 Spotify 검색용 데이터 구조로 정제하는 규칙을 정의한다.
- [x] `aidlc-docs/construction/u-004-curation-llm/functional-design/business-logic-model.md`를 생성한다.
- [x] `aidlc-docs/construction/u-004-curation-llm/functional-design/business-rules.md`를 생성한다.
- [x] `aidlc-docs/construction/u-004-curation-llm/functional-design/domain-entities.md`를 생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 설계 방향

- LLM 통신 로직은 `CurationService` (또는 `LlmClient`)로 분리하여 외부 AI 서비스에 대한 의존성을 캡슐화하고 모킹 테스트가 쉽도록 설계한다.
- LLM 응답은 구조화된 JSON 응답(JSON Mode 또는 스키마 정의 지시)을 출력하도록 프롬프트를 구성한다.
- 실제 LLM Credential이 준비되지 않은 개발/테스트 환경을 지원하기 위해, 환경 변수 `LLM_API_KEY` 등이 없을 때 작동할 모의(Mock) LLM 응답 엔진을 갖춘다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면 `X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

AI 큐레이션을 수행할 때 사용할 LLM Client는 어떻게 구성할까요?

A) 외부 LLM API(예: OpenAI GPT, Gemini 등)를 직접 호출하는 Route Handler 서비스를 구성하되, 모의(Mock) LLM 응답도 제공할 수 있는 환경 변수 구조 적용

B) 외부 API 비용이나 Credential 문제를 완전히 배제하기 위해, MVP 수준에서는 내부적인 룰 기반(Rule-based) 모의 LLM 응답 엔진을 완성 형태로 제공

[Answer]: A

## Question 2

LLM이 반환하는 추천 트랙들의 매핑 방식은 어떤 규칙으로 잡을까요?

A) LLM이 추천한 트랙의 제목(Title)과 아티스트명(Artist)의 텍스트 리스트를 응답받고, 후속 단위(U-005)에서 Spotify Search API를 통해 실제 Spotify URI를 획득하여 추가하도록 설계

B) LLM이 최근 재생 곡(`recentTracks`)의 URI 목록에서만 선택해 플레이리스트를 빌드하도록 제약하고 텍스트 검색 과정은 생략

[Answer]: A

## Question 3

LLM이 구조화된 JSON 데이터 형식을 지키지 않고 일반 텍스트로 응답을 보냈을 때(파싱 에러)의 폴백 규칙은 어떻게 할까요?

A) 최대 1회까지 재생성(Retry) 프롬프트를 보내거나, 최종 구조 파싱에 실패하면 디폴트 제목("AI Curated Playlist")과 디폴트 트랙 목록(최근 재생 곡들)을 담아 정상 폴백함

B) 파싱 실패 시 즉시 예외를 전파하고 사용자에게 대표 큐레이션 실패 오류(`error=curation_failed`)를 표시하고 흐름을 차단

[Answer]: A

## 승인

모든 질문에 답한 뒤, 이 U-004 Functional Design 계획을 승인할지 표시해 주세요.

A) 승인하고 U-004 Functional Design 산출물 생성을 진행

B) 계획 수정을 요청

[Answer]: A
