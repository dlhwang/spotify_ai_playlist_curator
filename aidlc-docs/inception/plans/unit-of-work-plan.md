# Unit of Work 계획

<!-- markdownlint-disable MD053 -->

## 목적

Application Design에서 정의한 컴포넌트와 서비스를 구현 가능한 작업 단위로
분해한다. 이 단계는 Construction phase에서 각 단위의 Functional Design,
Code Generation, Build and Test 추적 기준이 된다.

## 실행 체크리스트

- [x] 요구사항, story, application design을 기준으로 단위 후보를 검토한다.
- [x] 단위 경계와 구현 순서를 확정한다.
- [x] 단위별 책임, 포함 컴포넌트, 제외 범위를 작성한다.
- [x] 단위 간 dependency matrix를 작성한다.
- [x] story와 requirement를 단위에 매핑한다.
- [x] Greenfield code organization 전략을 문서화한다.
- [x] 모든 story가 하나 이상의 unit에 배정됐는지 확인한다.
- [x] `aidlc-docs/inception/application-design/unit-of-work.md`를 생성한다.
- [x] `aidlc-docs/inception/application-design/unit-of-work-dependency.md`를
  생성한다.
- [x] `aidlc-docs/inception/application-design/unit-of-work-story-map.md`를
  생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 제안 단위

| Unit | Name | Summary |
| --- | --- | --- |
| U-001 | Project Foundation | Next.js, TypeScript, 테스트, 환경 변수 문서 |
| U-002 | Spotify Auth Session | OAuth와 HttpOnly cookie session |
| U-003 | Spotify API Adapter | recently played, playlist 생성, track 추가 |
| U-004 | Curation Domain | 후보 선정, LLM port, placeholder provider |
| U-005 | User Experience | feature components와 주요 UI 상태 |

## 기본 분해 원칙

- 단일 Next.js 애플리케이션 안의 logical module 단위로 나눈다.
- 배포 가능한 독립 서비스로 나누지 않는다.
- port와 adapter를 통해 외부 API 의존성을 격리한다.
- UI unit은 domain/service contract가 준비된 뒤 붙인다.
- test setup은 U-001에서 마련하고 각 단위가 자신의 테스트를 추가한다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면
`X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

단위 분해는 위 5개 단위로 진행할까요?

A) 예, 제안한 5개 단위로 진행

B) UI 단위를 더 작게 나누어 입력, 결과, 생성 상태를 별도 단위로 분리

C) OAuth와 Spotify API Adapter를 하나의 Spotify Integration 단위로 병합

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2

구현 순서는 어떻게 잡을까요?

A) Foundation -> Auth -> Spotify Adapter -> Curation Domain -> UI

B) Foundation -> Domain -> Spotify Adapter -> Auth -> UI

C) Foundation -> UI skeleton -> Auth -> Adapter -> Domain

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3

Greenfield 코드 조직은 어떤 스타일로 잡을까요?

A) `src/features/*`, `src/server/*`, `src/domain/*`, `src/lib/*`로 분리

B) Next.js `app/` 아래 route와 component를 중심으로 가까운 곳에 배치

C) 단위별 top-level package처럼 `src/modules/*` 중심으로 배치

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## 승인

모든 질문에 답한 뒤, 이 Unit of Work 계획을 승인할지 표시해 주세요.

A) 승인하고 Unit of Work 산출물 생성을 진행

B) 계획 수정을 요청

X) Other (please describe after [Answer]: tag below)

[Answer]: A
