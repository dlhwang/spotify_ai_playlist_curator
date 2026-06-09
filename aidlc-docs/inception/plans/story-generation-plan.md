# User Stories 생성 계획

<!-- markdownlint-disable MD053 -->

## 목적

Spotify AI 플레이리스트 큐레이터 MVP의 요구사항을 사용자 중심 story와
persona로 변환한다. 산출물은 이후 설계, 구현, 테스트 계획에서 추적 가능한
수용 기준과 검증 기대값을 포함한다.

## 실행 체크리스트

- [x] 요구사항 문서의 기능 요구사항과 비기능 요구사항을 story 후보로 매핑한다.
- [x] 사용자 답변을 기반으로 story 분해 방식을 확정한다.
- [x] 핵심 persona를 정의하고 각 persona의 목표, 제약, 성공 기준을 작성한다.
- [x] 사용자 journey별 epic을 정의한다.
- [x] 각 epic 아래에 INVEST 기준을 만족하는 story를 작성한다.
- [x] 각 story에 Given/When/Then 형식 또는 관찰 가능한 acceptance criteria를
  작성한다.
- [x] 각 story에 verification expectations를 작성한다.
- [x] persona와 story 간 매핑을 작성한다.
- [x] `aidlc-docs/inception/user-stories/personas.md`를 생성한다.
- [x] `aidlc-docs/inception/user-stories/stories.md`를 생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 권장 story 분해 방식

### 선택지 검토

- **User Journey-Based**: 인증부터 추천 결과와 playlist 생성까지 실제 사용자
  흐름을 따라 story를 구성한다. MVP 경험 검증에 가장 적합하다.
- **Feature-Based**: OAuth, Spotify API, LLM interface, UI처럼 기능 단위로
  구성한다. 구현 분리는 쉽지만 사용자 맥락이 약해질 수 있다.
- **Persona-Based**: 사용자 유형별로 story를 나눈다. MVP persona가 적을 때는
  중복이 생길 수 있다.
- **Domain-Based**: 인증, 큐레이션, 외부 API adapter 같은 도메인 경계를 따라
  구성한다. 설계 추적성은 좋지만 사용자 가치 표현이 약해질 수 있다.
- **Epic-Based**: 큰 epic 아래 세부 story를 둔다. journey와 feature를 함께
  다루기에 적합하다.

### 제안

`Epic-Based + User Journey-Based` 혼합 방식을 사용한다. 상위 epic은 사용자
journey를 기준으로 두고, 각 epic 아래 story는 작은 기능 단위로 나눈다.

## story 작성 규칙

- story 형식은 `As a [persona], I want [capability], so that [benefit].`를
  사용한다.
- acceptance criteria는 가능한 경우 Given/When/Then 형식으로 작성한다.
- 외부 API나 UI 상태처럼 Given/When/Then이 어색한 항목은 관찰 가능한 결과
  문장으로 작성한다.
- 모든 사용자-visible story에는 verification expectations를 포함한다.
- 자동화가 어려운 Spotify OAuth 실제 화면 왕복과 Vercel 환경 설정은 수동
  검증 사유를 함께 기록한다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면
`X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

MVP의 기본 사용자 persona를 어떻게 정의할까요?

A) 음악을 자주 듣고 새로운 playlist 추천을 원하는 일반 Spotify 사용자

B) 특정 분위기나 상황에 맞는 playlist를 빠르게 만들고 싶은 사용자

C) 개발자가 데모와 검증을 위해 사용하는 실험적 MVP 사용자

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2

추천 결과 화면에서 가장 중요하게 보여야 하는 정보는 무엇입니까?

A) 추천된 곡 목록과 각 곡의 추천 이유

B) playlist 제목, 설명, 전체 분위기 요약

C) Spotify에 생성 가능한 최종 playlist preview

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3

MVP에서 Spotify playlist 생성은 어떤 story로 다룰까요?

A) 실제 Spotify 계정에 playlist를 생성하는 핵심 story로 포함

B) 추천 결과 preview까지만 핵심 story로 두고 생성은 선택 story로 둠

C) 생성 API 경계만 정의하고 UI에서는 비활성 또는 placeholder로 둠

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4

사용자가 큐레이션에 줄 수 있는 입력은 MVP에서 어디까지 포함할까요?

A) Spotify 데이터만 사용하고 사용자 추가 입력은 받지 않음

B) 분위기, 활동, 장르 같은 간단한 텍스트 또는 선택 입력을 받음

C) 자연어 프롬프트를 받아 큐레이션 방향에 반영

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 5

인증 또는 Spotify API 오류 story의 수준은 어떻게 잡을까요?

A) 주요 실패 상태를 모두 사용자 story와 acceptance criteria로 명시

B) 대표 실패 상태만 story로 두고 나머지는 구현 단계에서 처리

C) MVP에서는 오류 story를 최소화하고 happy path 중심으로 작성

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 6

스토리 우선순위 표현은 어떤 방식이 좋습니까?

A) Must/Should/Could로 표시

B) MVP/Core/Optional로 표시

C) 우선순위는 표시하지 않고 story 목록만 작성

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## 승인

모든 질문에 답한 뒤, 이 story 생성 계획을 승인할지 표시해 주세요.

A) 승인하고 story 생성을 진행

B) 계획 수정을 요청

X) Other (please describe after [Answer]: tag below)

[Answer]: A
