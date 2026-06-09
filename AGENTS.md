# AGENTS.md

## 목적과 적용 범위

이 문서는 이 저장소에서 작업하는 코드 어시스트가 가장 먼저 읽고
따라야 하는 루트 지침이다. 별도의 "Using AI-DLC" 요청이 없어도 모든
개발 및 문서 작업은 이 문서와 AI-DLC 작업 흐름을 기본 방식으로
사용한다.

이 저장소는 개발 과정에서 사용하는
AI-DLC 규칙 및 프로젝트 산출물을 함께 관리한다.

## 작업 시작 순서

작업을 시작할 때 다음 순서를 따른다.

1. 이 문서와 사용자 요청을 읽는다.
2. 현재 작업과 관련된 저장소 파일 및 기존 산출물을 확인한다.
3. `aidlc-rules/aws-aidlc-rules/core-workflow.md`를 읽고 작업 규모와
   유형에 맞는 AI-DLC 단계 및 관련 상세 규칙을 식별한다.
4. AI-DLC 규칙에서 요구하는 계획, 승인, 산출물 및 검증 절차를
   수행한다.
5. 완료 시 변경 요약과 실제 수행한 검증 결과를 보고한다.

이 문서는 AI-DLC 규칙에서 요구하는 계획 외에 별도의 implementation
plan 산출물을 추가로 요구하지 않는다.

## AI-DLC 기본 작업 방식

AI-DLC는 이 저장소의 기본 개발 절차이며 선택적인 주문어가 아니다.
현재 작업에 필요한 단계와 깊이는
`aidlc-rules/aws-aidlc-rules/core-workflow.md`와 관련 상세 규칙에 따라
결정한다.

이 저장소에서 사용하는 AI-DLC 경로는 다음과 같이 구분한다.

```text
aidlc-rules/
|-- aws-aidlc-rules/core-workflow.md       # 워크플로우 진입 규칙
`-- aws-aidlc-rule-details/                # 단계별/공통/확장 상세 규칙

aidlc-docs/                                # 이 프로젝트에서 생성한 산출물
|-- aidlc-state.md                         # 작업 상태
|-- audit.md                               # 작업 기록
|-- inception/                             # 분석 및 계획 산출물
`-- construction/                          # 설계, 구현, 검증 산출물
```

- 이 저장소에서는 `aidlc-rules/aws-aidlc-rule-details/`를 상세 규칙의
  기준 경로로 사용한다. 가져온 워크플로우 문서가 다른 설치 경로를
  예시로 들더라도 현재 저장소의 실제 경로를 우선한다.
- 작업을 시작하거나 재개할 때 `aidlc-docs/aidlc-state.md`와 필요한 기존
  산출물을 확인해 이미 결정된 내용과 진행 상태를 존중한다.
- 작업 단계에서 요구하는 상세 규칙만 `aidlc-rules/`에서 읽고 적용한다.
- `aidlc-docs/`의 기존 문서는 이 프로젝트가 만든 기록과 산출물이다.
  삭제하거나 외부 템플릿, 가져온 예제, 정리 대상 파일로 취급하지
  않는다.
- 외부 AI-DLC에서 가져온 파일의 유지 기준은 `aidlc-rules/` 중심이다.
  불필요해 보이는 외부 문서, 예제, 템플릿 또는 자동화 파일을 발견해도
  즉시 삭제하지 말고 경로와 판단 근거를 정리 대상 목록으로 먼저
  제안한다.

### AI-DLC 실행 모드

코드 어시스트는 AI-DLC를 항상 적용하되, 모든 AI-DLC 단계를 항상
실행하지는 않는다. 작업 규모와 위험도에 따라 실행 모드를 선택하고,
실행하지 않는 단계는 명시적으로 skip 사유를 남긴다.

실행 모드는 `core-workflow.md`의 `Adaptive Workflow Principle`을 이
저장소의 작업 규모에 맞게 구체화하는 기준이다. upstream workflow와
활성화된 extension의 필수 게이트를 무효화하지 않으며, 선택한 모드의
기본 생략 단계라도 실제 위험, 불확실성 또는 extension 요구가 있으면
실행 단계로 올린다.

#### 모드 선택과 사전 계획 기록

작업을 시작할 때 코드 어시스트는 작업 규모, 설계 불확실성, 위험도,
검증 필요성을 평가해 `Fast Track`, `Standard Track`, `Design Track`,
`Full Track` 중 하나를 선택한다. 선택한 모드는 기존 산출물의 진행
상태와 충돌하지 않아야 하며, 진행 중인 작업을 보완할 때는 기존
승인과 차단 조건을 유지한다.

소스 또는 문서를 수정하기 전에 AI-DLC 작업 계획에 다음 내용을 먼저
기록한다. 짧고 분명한 변경은 기존 작업 기록 또는 최소 계획에
기록할 수 있으며, 그 사실만으로 불필요한 새 산출물을 만들지 않는다.

1. `Requirement summary`
2. `Task type`
3. `Selected AI-DLC execution mode`
4. `Reason for selected mode`
5. `Required context files`
6. `Expected files to change`
7. `Files or directories that must not change`
8. `Validation commands`
9. `Risks or assumptions`

계획에는 실행할 AI-DLC 단계, 생략할 AI-DLC 단계, 단계별 생략 사유와
검증 계획을 함께 명시한다. 작업 중 새 API 계약, 도메인 경계, 데이터
저장 의미, 보안 또는 배포 영향이 드러나면 더 높은 모드로 재평가하고
변경 이유를 기록한다.

#### Fast Track

- **사용 조건**: 문서 일부 수정, 오타 또는 명확한 설정 변경, 단일
  파일 중심의 작은 버그 수정, 실패 원인이 분명한 CI 또는 테스트
  보정처럼 영향 범위가 제한적이며, 새로운 API 계약, 도메인 경계,
  DB 스키마 변경이 없는 작업에 사용한다.
- **대표 예시**: `AGENTS.md` 설명 보강, 잘못된 test import 수정,
  이미 확정된 설정 키의 오탈자 보정.
- **기본 실행 단계**: Workspace 확인, `Requirements Analysis`
  minimal, `Workflow Planning` minimal, `Code Generation` 또는 문서
  수정, 최소 검증, 완료 보고.
- **기본 생략 단계**: `User Stories`, `Application Design`,
  `Units Generation`, `Functional Design`, `NFR Requirements`,
  `NFR Design`, `Infrastructure Design`.
- **조건부 실행 단계**: 변경 중 사용자 동작이나 계약 영향이
  발견되면 `Functional Design` 또는 `Standard Track` 이상으로
  전환한다. 보안, 성능, 배포 조건이 발생하면 관련 NFR 또는
  `Infrastructure Design` 단계를 실행한다.
- **검증 기준**: 변경 문서 lint, 영향 파일 diff 확인, 좁은 코드
  변경이면 관련 테스트 실행을 기본으로 하며, 변경 영향이 넓어지면
  전체 관련 검증으로 확장한다.

#### Standard Track

- **사용 조건**: 기존 아키텍처 경계 안에서 일반 기능을 추가하거나
  수정하는 작업, `controller`, `use case`, `domain`, `repository`,
  test 중 둘 이상의 계층 변경, 기존 도메인 안의 기능 추가, 기존 API
  응답 필드 추가 또는 기존 테스트 보강에 사용한다.
- **대표 예시**: 기존 고해 조회 응답에 이미 설계된 집계 필드 연결,
  기존 use case와 repository adapter를 함께 보완하는 기능 수정.
- **기본 실행 단계**: Workspace 확인, `Requirements Analysis`
  minimal 또는 standard, `Workflow Planning` standard, 필요 시
  `Functional Design`, `Code Generation`, `Build and Test`.
- **기본 생략 단계**: 새 사용자 흐름, 새 구성 요소, 새 NFR 또는 단위
  분해가 없다면 `User Stories`, `Application Design`,
  `Units Generation`, `NFR Requirements`, `NFR Design`,
  `Infrastructure Design`을 생략한다.
- **조건부 실행 단계**: 사용자 동작이나 수용 기준이 달라지면
  `User Stories`, 구성 요소 경계가 바뀌면 `Application Design`,
  독립 단위 분리가 필요하면 `Units Generation`, 비기능 요구가
  생기면 `NFR Requirements`와 후속 설계를 실행한다.
- **검증 기준**: 수정 계층에 대응하는 단위/통합 테스트와 build
  검증을 수행하고, 변경된 문서나 계약 산출물에는 Markdown 검증을
  함께 적용한다.

#### Design Track

- **사용 조건**: 구현보다 설계 결정이 먼저 필요한 작업, 도메인 경계
  또는 API 계약 결정, 상태 전이 또는 멱등성 정책 결정, rate
  limiting, 인증, 익명 식별 같은 정책 경계 결정, 구현 선택지의
  trade-off가 큰 작업에 사용한다.
- **대표 예시**: 반응 선택을 단일 선택으로 할지 선택 집합으로 할지
  결정하는 API 설계, 익명 식별 저장과 자기 동작 거부 정책 수립.
- **기본 실행 단계**: Workspace 확인, `Requirements Analysis`
  standard, 필요한 질문 작성, `Workflow Planning`,
  `Application Design` 또는 `Functional Design`, 설계 결정 기록,
  승인 후 `Code Generation`, `Build and Test`.
- **기본 생략 단계**: 단일 경계의 설계로 해결되면
  `User Stories`, `Units Generation`, `NFR Requirements`,
  `NFR Design`, `Infrastructure Design`은 기본적으로 생략할 수
  있으며 사유를 기록한다.
- **조건부 실행 단계**: 사용자 시나리오가 핵심이면 `User Stories`,
  여러 책임 단위가 생기면 `Units Generation`, 정책이 보안, 성능,
  운영 조건을 포함하면 `NFR Requirements`와 `NFR Design`을
  실행한다.
- **검증 기준**: 승인된 설계 결정과 구현 및 테스트의 추적 가능성을
  확인하고, 계약/상태 규칙/정책 경계를 검증하는 테스트와 관련 문서
  검증을 수행한다.

#### Full Track

- **사용 조건**: 여러 도메인, 여러 계층, 배포, 보안, 운영 영향이
  있는 큰 변경, 신규 주요 기능 전체 구현, 프론트엔드와 백엔드 계약을
  함께 바꾸는 작업, DB 스키마와 보안/운영/배포가 함께 바뀌는 작업,
  여러 unit of work로 나누어야 하는 작업에 사용한다.
- **대표 예시**: 별도 저장 모델과 공개 변이 API, 보안 제어, 배포
  증빙을 함께 도입하는 신규 기능.
- **기본 실행 단계**:
  `aidlc-rules/aws-aidlc-rules/core-workflow.md`의 전체 흐름을
  적용하며, 활성화된 extension의 차단 조건과 승인 게이트를 모두
  따른다.
- **기본 생략 단계**: 없음. adaptive 판단으로 특정 조건부 단계를
  생략할 때만 구체적 생략 사유를 계획과 완료 보고에 기록한다.
- **조건부 실행 단계**: `core-workflow.md`가 조건부로 정의한 모든
  단계는 실제 적용성 평가 대상이며, 적용성이 확인되면 실행한다.
- **검증 기준**: 단위별 테스트, 통합 검증, 데이터/계약/NFR 검증,
  배포 및 운영 증빙, 활성 extension 준수 판정을 포함해 계획된 전체
  품질 게이트를 통과해야 한다.

## 저장소 구조와 보호 범위

현재 주요 경로는 다음과 같다.

```text
src/                          # Kotlin Spring Boot 애플리케이션과 테스트
aidlc-rules/                  # 가져온 AI-DLC 규칙과 워크플로우
aidlc-docs/                   # 프로젝트별 AI-DLC 산출물과 기록
docs/
|-- BACKEND_GITFLOW.md        # 백엔드 브랜치 및 PR 정책
`-- PROJECT_OVERVIEW.md       # 저장소 개요
.github/
|-- workflows/backend-gitflow.yml
`-- pull_request_template.md
```

- `aidlc-rules/aws-aidlc-rules/`와
  `aidlc-rules/aws-aidlc-rule-details/`의 경로를 임의로 이동하거나
  이름을 바꾸지 않는다.
- `aidlc-docs/`를 가져온 샘플 콘텐츠로 보아 정리하거나 삭제하지 않는다.
- `src/` 아래 백엔드 변경에는 `docs/BACKEND_GITFLOW.md`를 적용한다.
- 프로젝트가 명시적으로 채택하지 않은 upstream AI-DLC 릴리스,
  평가, 정기 보안 스캐너 workflow를 다시 추가하지 않는다.

## 문서 작성 언어

새로 작성하거나 실질적으로 수정하는 문서, 계획, 요약, 설명 산출물은
기본적으로 한국어로 작성한다. 코드 식별자, 명령어, 파일 경로, 프로토콜
명칭, 외부 고유명과 사용자가 정확한 원문 보존을 요구한 내용은 원문
형식을 유지한다. 기존 영문 문서를 언어 변경만을 위해 일괄 번역하지
않는다.

## GitFlow와 Pull Request

백엔드 전달 작업의 상세 정책은 `docs/BACKEND_GITFLOW.md`를 기준으로
한다.

- `feature/*`는 `develop`에서 분기하고 `develop` 대상 pull request로
  병합한다.
- `release/*`는 `develop`에서 분기하고 `main` 대상 pull request로
  릴리스를 안정화한 뒤, 릴리스 결과를 `develop`에 반영한다.
- `hotfix/*`는 `main`에서 분기하고 `main` 대상 pull request로 긴급
  수정한 뒤, 수정 결과를 `develop`에 반드시 병합하거나 backport한다.
- `main`과 `develop`에는 직접 push하지 않고 pull request 및 요구되는
  검증을 거친다.
- 커밋 제목과 pull request 제목은 conventional commit 형식을 사용하고,
  pull request 설명은 `.github/pull_request_template.md` 구조를 따른다.

### `gitflow ㄱㄱ` 단축 루틴

사용자가 `gitflow ㄱㄱ`, `gitflow 가자`, `gitflow 진행`, 또는 이에
준하는 짧은 요청을 하면 코드 어시스트는 현재 변경점을 GitFlow 방식으로
마무리하라는 뜻으로 해석한다. 이 루틴은 기본적으로 branch 생성 또는
확인, 관련 변경만 stage, 검증, conventional commit, pull request 메시지
초안 작성까지 수행한다.

기본 절차는 다음과 같다.

1. 현재 branch와 working tree 상태를 확인한다.
2. 현재 branch가 `develop`이고 새 작업이라면 `feature/<slug>` branch를
   만든다. 이미 `feature/*` branch라면 그 branch를 계속 사용한다.
3. 변경 파일을 요청 범위와 무관한 변경, 이전 작업 잔여 변경, 이번
   작업 변경으로 분류한다.
4. 이번 요청과 직접 관련된 파일만 stage한다. 범위가 애매한 파일은
   stage하지 않고 보고한다.
5. 변경 유형에 맞는 검증을 실행한다. 문서 변경은 Markdown lint와
   `git diff --check`를 기본으로 하고, `src/**` 또는 build/runtime
   변경은 `.\gradlew.bat test`를 포함한다.
6. conventional commit 형식으로 commit한다.
7. `.github/pull_request_template.md` 구조를 따라 PR 제목과 본문 초안을
   작성해 사용자에게 제공한다.

`gitflow ㄱㄱ`는 기본적으로 push 또는 실제 pull request 생성을 수행하지
않는다. 사용자가 `push까지`, `PR 생성까지`, `gh pr create까지`처럼
명시적으로 요청한 경우에만 원격 push 또는 실제 PR 생성을 진행한다.
네트워크 또는 권한 승인이 필요한 명령은 실행 전에 승인을 받는다.

로컬 터미널에서 같은 흐름을 반복 실행할 때는
`scripts/gitflow-feature.ps1`을 사용할 수 있다. 이 helper도 명시한
path만 stage하며, 기본 출력은 commit과 PR 메시지 초안 생성까지다.

## 검증과 완료 보고

AI-DLC 단계에서 수립한 계획과 변경 유형에 맞는 검증을 수행한다.
이 저장소의 기본 검증 명령은 다음과 같다.

```powershell
# 백엔드 코드 또는 동작 변경
.\gradlew.bat test

# Markdown 문서 변경 (`markdownlint-cli2` 사용 가능 시)
npx markdownlint-cli2 "**/*.md"
```

완료 보고에는 다음 내용을 간결하게 포함한다.

- 변경한 파일과 핵심 변경 내용
- 생성, 수정, 삭제하지 않은 보호 대상 또는 범위상 제외한 파일
- 실제 실행한 검증 명령과 성공/실패 결과
- 검증을 실행하지 못했거나 기존 문제로 통과하지 못한 경우 그 이유
- 삭제 전 검토가 필요한 외부 AI-DLC 정리 후보를 발견한 경우 그 목록
