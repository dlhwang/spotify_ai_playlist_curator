# 요구사항 확인 질문

<!-- markdownlint-disable MD053 -->

아래 질문에 답하면 요구사항 분석을 계속 진행할 수 있습니다. 각 질문의
`[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면 마지막
`Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

이 저장소에서 만들 프로젝트의 주요 목표는 무엇입니까?

A) Spotify API를 연동해 사용자의 취향을 분석하고 플레이리스트를 추천하거나 생성하는 백엔드 서비스

B) Spotify 플레이리스트 큐레이션 기능을 포함한 전체 애플리케이션

C) AI-DLC 규칙과 프로젝트 문서만 먼저 정비하는 초기 문서화 작업

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2

이번 작업에서 바로 구현해야 하는 범위는 어디까지입니까?

A) 프로젝트 골격과 기본 빌드 설정까지 생성

B) 핵심 도메인, API 계약, 테스트 골격까지 설계하고 구현

C) 요구사항과 실행 계획까지만 작성하고 구현은 다음 단계에서 승인 후 진행

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3

선호하는 백엔드 기술 스택은 무엇입니까?

A) Kotlin + Spring Boot + Gradle

B) Java + Spring Boot + Gradle

C) 아직 결정하지 않았으며 AI-DLC 설계 단계에서 제안받고 싶음

X) Other (please describe after [Answer]: tag below)

[Answer]: X Next.js + TypeScript 기반으로 구현하고, 별도 Spring Boot 백엔드는 두지 않습니다.
Spotify Web API와 LLM API 호출은 Next.js Route Handler(Serverless API)에서 처리하는 구조를 선호합니다.
MVP에서는 DB 없이 Vercel 배포만으로 동작하도록 구성합니다.

## Question 4

Spotify 연동 방식은 어떤 수준을 목표로 합니까?

A) OAuth 로그인과 사용자 라이브러리, 재생 기록, 플레이리스트 생성까지 포함

B) 서버 측 API 토큰 또는 개발용 자격 증명으로 추천 로직 검증까지만 포함

C) 실제 Spotify 연동은 나중에 하고 우선 내부 모델과 테스트 더블로 진행

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5

AI 기반 큐레이션은 어떤 방식으로 구현하길 원합니까?

A) OpenAI API 같은 외부 LLM을 사용

B) 규칙 기반 또는 단순 점수화 로직으로 먼저 구현

C) AI 연동은 인터페이스만 두고 실제 구현은 이후 단계로 미룸

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 6

데이터 저장소가 필요합니까?

A) 관계형 데이터베이스를 사용

B) 인메모리 저장소 또는 파일 기반 저장소로 초기 구현

C) 저장소 없이 외부 API 응답과 요청 단위 처리만 수행

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 7

이번 작업의 우선 품질 목표는 무엇입니까?

A) 테스트 가능한 도메인 설계와 자동화 테스트

B) 빠르게 실행 가능한 프로토타입

C) 보안, 인증, 토큰 관리 정책을 포함한 production-grade 기반

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8

Security Baseline 확장 규칙을 적용할까요?

A) Yes - 보안 규칙을 차단 조건으로 적용

B) No - PoC 또는 실험 단계로 보고 보안 확장 규칙은 생략

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 9

Property-Based Testing 확장 규칙을 적용할까요?

A) Yes - PBT 규칙을 차단 조건으로 적용

B) Partial - 순수 함수와 직렬화 왕복 검증에만 제한 적용

C) No - 일반 단위 테스트와 통합 테스트 중심으로 진행

X) Other (please describe after [Answer]: tag below)

[Answer]: C
