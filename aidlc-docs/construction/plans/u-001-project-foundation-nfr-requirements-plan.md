# U-001 Project Foundation NFR Requirements 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-001 Project Foundation의 비기능 요구사항과 기술 스택 결정을 정리한다.
이 단위는 상세 비즈니스 로직이 없으므로 Functional Design은 생략하고,
빌드 가능성, 테스트 기반, 환경 변수, Vercel 배포 적합성에 집중한다.

## 실행 체크리스트

- [x] U-001 책임과 제외 범위를 검토한다.
- [x] 빌드, 테스트, 타입 검증 요구사항을 정의한다.
- [x] 환경 변수와 secret 경계 요구사항을 정의한다.
- [x] Vercel 배포 적합성 요구사항을 정의한다.
- [x] 기본 기술 스택 결정을 문서화한다.
- [x] `aidlc-docs/construction/u-001-project-foundation/nfr-requirements/nfr-requirements.md`를 생성한다.
- [x] `aidlc-docs/construction/u-001-project-foundation/nfr-requirements/tech-stack-decisions.md`를 생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 판단

- 앱은 Next.js + TypeScript 단일 프로젝트다.
- MVP는 DB 없이 Vercel 배포를 목표로 한다.
- test setup은 모든 후속 단위가 사용할 기반이다.
- Spotify secret과 선택적 LLM secret은 서버 전용 환경 변수로 관리한다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면
`X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

테스트 도구는 어떤 조합으로 설계할까요?

A) Vitest + React Testing Library + Playwright

B) Jest + React Testing Library + Playwright

C) 단위 테스트만 먼저 두고 e2e는 후속 단계로 미룸

X) Other (please describe after [Answer]: tag below)

[Answer]: C MVP에서는 단위 테스트를 우선 구성하고 e2e는 후속 단계로 미룹니다.
다만 인증/OAuth callback, playlist publish 같은 주요 사용자 흐름은 추후 Playwright smoke test로 확장할 수 있도록 테스트 구조와 스크립트 경계를 열어둡니다.

## Question 2

스타일링과 UI 기반은 어떤 방향으로 둘까요?

A) Tailwind CSS 기반

B) CSS Modules 기반

C) 기본 CSS와 최소 className으로 시작

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3

U-001의 품질 게이트는 어디까지 포함할까요?

A) build, lint, typecheck, unit test, e2e smoke test

B) build, lint, typecheck, unit test

C) build와 typecheck만 우선

X) Other (please describe after [Answer]: tag below)

[Answer]:B

## 승인

모든 질문에 답한 뒤, 이 U-001 NFR Requirements 계획을 승인할지 표시해
주세요.

A) 승인하고 U-001 NFR Requirements 산출물 생성을 진행

B) 계획 수정을 요청

X) Other (please describe after [Answer]: tag below)

[Answer]: A
