# Application Design 계획

<!-- markdownlint-disable MD053 -->

## 목적

Spotify AI playlist curator MVP의 상위 애플리케이션 구조를 정의한다. 이
단계에서는 상세 비즈니스 로직보다 컴포넌트 책임, 인터페이스, 서비스
오케스트레이션, 의존 방향을 결정한다.

## 실행 체크리스트

- [x] 요구사항과 story에서 핵심 business capability를 추출한다.
- [x] Next.js App Router 화면 컴포넌트와 Route Handler 경계를 정의한다.
- [x] OAuth, Spotify API, 큐레이션 도메인, LLM provider port의 책임을
  분리한다.
- [x] 컴포넌트별 public interface와 method signature 후보를 작성한다.
- [x] 서비스 계층의 orchestration 흐름을 정리한다.
- [x] 컴포넌트 의존 방향과 통신 패턴을 문서화한다.
- [x] `aidlc-docs/inception/application-design/components.md`를 생성한다.
- [x] `aidlc-docs/inception/application-design/component-methods.md`를
  생성한다.
- [x] `aidlc-docs/inception/application-design/services.md`를 생성한다.
- [x] `aidlc-docs/inception/application-design/component-dependency.md`를
  생성한다.
- [x] `aidlc-docs/inception/application-design/application-design.md`를
  생성한다.
- [x] 설계 완전성과 요구사항/story 추적성을 확인한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 설계 방향

- 앱은 Next.js + TypeScript 단일 프로젝트로 구성한다.
- UI는 첫 화면에서 인증, 자연어 입력, 분석 중, 추천 결과, playlist 생성
  상태를 다룬다.
- Route Handler는 OAuth, 큐레이션 실행, playlist 생성의 server boundary를
  담당한다.
- 도메인 서비스는 네트워크 없이 테스트 가능하게 만든다.
- Spotify Web API는 `SpotifyApiPort` 뒤에 둔다.
- LLM은 `CurationProviderPort` 또는 유사한 port 뒤에 두고 MVP에서는
  placeholder provider를 사용한다.
- Spotify MCP는 사용하지 않는다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면
`X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

MVP에서 OAuth token과 인증 상태는 어떤 방식으로 설계할까요?

A) 서버 전용 HttpOnly cookie 기반 세션으로 설계

B) NextAuth 같은 인증 라이브러리 도입을 전제로 설계

C) MVP용 임시 server-side token 처리 경계만 두고 상세 구현은 Functional
Design에서 확정

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2

Route Handler API 경계는 어떤 수준으로 나눌까요?

A) `/api/auth/*`, `/api/curate`, `/api/playlists`처럼 기능별로 명확히 분리

B) `/api/spotify/*` 중심으로 Spotify 관련 기능을 모아 둠

C) MVP에서는 route 수를 최소화하고 하나의 orchestration route 중심으로 둠

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3

큐레이션 도메인 서비스는 어느 정도까지 LLM placeholder와 분리할까요?

A) 후보 선정과 LLM playlist 컨셉 생성을 완전히 별도 port/service로 분리

B) 하나의 CurationService 안에서 후보 선정과 placeholder 생성을 함께 처리

C) MVP에서는 단순 구현 후 Functional Design에서 분리 수준을 재평가

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4

Spotify 사용자 데이터 조회의 우선 입력 소스는 무엇으로 설계할까요?

A) liked songs 중심

B) recently played 중심

C) liked songs와 recently played를 모두 후보로 두고 adapter에서 조합

X) Other (please describe after [Answer]: tag below)

[Answer]:B

## Question 5

UI 컴포넌트 구조는 어떤 방향을 선호합니까?

A) 단일 페이지에 상태별 section을 조합하는 간결한 MVP 구조

B) 인증, 입력, 결과, 생성 상태를 feature component로 분리

C) App Router route segment를 여러 화면으로 나누는 구조

X) Other (please describe after [Answer]: tag below)

[Answer]:B

## 승인

모든 질문에 답한 뒤, 이 Application Design 계획을 승인할지 표시해 주세요.

A) 승인하고 Application Design 산출물 생성을 진행

B) 계획 수정을 요청

X) Other (please describe after [Answer]: tag below)

[Answer]:A
