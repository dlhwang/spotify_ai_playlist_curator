# AI-DLC 상태 추적

<!-- markdownlint-disable MD013 -->

## 프로젝트 정보

- **프로젝트 유형**: Greenfield
- **시작 일시**: 2026-06-09T13:37:57+09:00
- **현재 단계**: CONSTRUCTION - RAG Music Curation Implementation

## 작업 계획

- **Requirement summary**: Spotify 플레이리스트 큐레이션 기능을 포함한
  전체 애플리케이션을 Next.js + TypeScript 기반으로 구현한다. Spotify
  OAuth와 Web API 호출은 Next.js Route Handler에서 처리하고, MVP에서는
  DB 없이 Vercel 배포를 목표로 한다.
- **Task type**: 신규 기능 애플리케이션 개발
- **Selected AI-DLC execution mode**: Design Track
- **Reason for selected mode**: 신규 전체 애플리케이션이며 OAuth,
  외부 API 연동, LLM 인터페이스, 테스트 가능한 도메인 설계가 포함된다.
  구현 전에 사용자 흐름과 API 계약, 구성 경계 결정이 필요하다.
- **Required context files**:
  - `AGENTS.md`
  - `aidlc-rules/aws-aidlc-rules/core-workflow.md`
  - `aidlc-rules/aws-aidlc-rule-details/common/process-overview.md`
  - `aidlc-rules/aws-aidlc-rule-details/common/session-continuity.md`
  - `aidlc-rules/aws-aidlc-rule-details/common/content-validation.md`
  - `aidlc-rules/aws-aidlc-rule-details/common/question-format-guide.md`
  - `aidlc-rules/aws-aidlc-rule-details/inception/workspace-detection.md`
  - `aidlc-rules/aws-aidlc-rule-details/inception/requirements-analysis.md`
- **Expected files to change**:
  - `aidlc-docs/aidlc-state.md`
  - `aidlc-docs/audit.md`
  - `aidlc-docs/inception/requirements/requirement-verification-questions.md`
  - `aidlc-docs/inception/plans/user-stories-assessment.md`
  - `aidlc-docs/inception/plans/story-generation-plan.md`
  - `aidlc-docs/inception/plans/spotify-mcp-consideration.md`
  - `aidlc-docs/inception/plans/execution-plan.md`
  - `aidlc-docs/inception/plans/application-design-plan.md`
  - `aidlc-docs/inception/application-design/components.md`
  - `aidlc-docs/inception/application-design/component-methods.md`
  - `aidlc-docs/inception/application-design/services.md`
  - `aidlc-docs/inception/application-design/component-dependency.md`
  - `aidlc-docs/inception/application-design/application-design.md`
  - `aidlc-docs/inception/plans/unit-of-work-plan.md`
  - `aidlc-docs/inception/application-design/unit-of-work.md`
  - `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
  - `aidlc-docs/inception/application-design/unit-of-work-story-map.md`
  - `aidlc-docs/construction/plans/u-001-project-foundation-nfr-requirements-plan.md`
  - `aidlc-docs/construction/u-001-project-foundation/nfr-requirements/nfr-requirements.md`
  - `aidlc-docs/construction/u-001-project-foundation/nfr-requirements/tech-stack-decisions.md`
  - `aidlc-docs/construction/plans/u-001-project-foundation-code-generation-plan.md`
  - `package.json`
  - `package-lock.json`
  - `next.config.mjs`
  - `tsconfig.json`
  - `postcss.config.mjs`
  - `tailwind.config.ts`
  - `eslint.config.mjs`
  - `vitest.config.ts`
  - `vitest.setup.ts`
  - `.gitignore`
  - `.env.example`
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/globals.css`
  - `src/features/home/home-page.tsx`
  - `src/features/home/home-page.test.tsx`
  - `src/lib/env/server-env.ts`
  - `src/lib/env/server-env.test.ts`
  - `src/lib/testing/render.tsx`
  - `aidlc-docs/construction/u-001-project-foundation/code/code-summary.md`
  - `aidlc-docs/construction/plans/u-002-spotify-auth-session-functional-design-plan.md`
  - `aidlc-docs/construction/u-002-spotify-auth-session/functional-design/business-logic-model.md`
  - `aidlc-docs/construction/u-002-spotify-auth-session/functional-design/business-rules.md`
  - `aidlc-docs/construction/u-002-spotify-auth-session/functional-design/domain-entities.md`
  - `aidlc-docs/construction/plans/u-002-spotify-auth-session-nfr-requirements-plan.md`
  - `aidlc-docs/inception/user-stories/personas.md`
  - `aidlc-docs/inception/user-stories/stories.md`
  - `aidlc-docs/construction/plans/u-004-curation-llm-code-generation-plan.md`
  - `aidlc-docs/construction/u-004-curation-llm/nfr-requirements/nfr-requirements.md`
  - `aidlc-docs/construction/u-004-curation-llm/nfr-requirements/tech-stack-decisions.md`
  - `aidlc-docs/construction/plans/u-005-spotify-search-functional-design-plan.md`
  - `aidlc-docs/construction/u-005-spotify-search/functional-design/business-logic-model.md`
  - `aidlc-docs/construction/u-005-spotify-search/functional-design/business-rules.md`
  - `aidlc-docs/construction/u-005-spotify-search/functional-design/domain-entities.md`
  - `aidlc-docs/construction/plans/u-005-spotify-search-nfr-requirements-plan.md`
  - `aidlc-docs/construction/u-005-spotify-search/nfr-requirements/nfr-requirements.md`
  - `aidlc-docs/construction/u-005-spotify-search/nfr-requirements/tech-stack-decisions.md`
  - `aidlc-docs/construction/plans/u-005-spotify-search-code-generation-plan.md`
  - `aidlc-docs/construction/u-005-spotify-search/code/code-summary.md`
  - `aidlc-docs/construction/build-and-test/build-instructions.md`
  - `aidlc-docs/construction/build-and-test/unit-test-instructions.md`
  - `aidlc-docs/construction/build-and-test/integration-test-instructions.md`
  - `aidlc-docs/construction/build-and-test/performance-test-instructions.md`
  - `aidlc-docs/construction/build-and-test/build-and-test-summary.md`
- **Files or directories that must not change**:
  - `aidlc-rules/`
  - `AGENTS.md`
  - 애플리케이션 소스 파일은 요구사항 승인 전 생성하지 않는다.
- **Validation commands**:
  - `git status --short --branch`는 Git 저장소가 아니어서 실패했다.
  - Markdown 변경 후 `npx markdownlint-cli2 "aidlc-docs/**/*.md"` 실행을 고려한다.
- **Risks or assumptions**:
  - 현재 저장소에는 애플리케이션 코드와 빌드 파일이 없다.
  - 실제 LLM API 구현은 이번 MVP에서 인터페이스 중심으로 제한한다.
  - Spotify MCP server는 MVP에서 사용하지 않는다. 필요한 기능은 Spotify Web
    API 직접 호출로 구현한다.
  - DB 없이 OAuth 토큰과 세션을 다루므로 토큰 보관 방식은 설계 단계에서
    주의가 필요하다.
  - 현재 Spotify token 또는 developer credential은 준비되어 있지 않다.
  - Git 저장소가 초기화되어 있지 않아 GitFlow 검증은 현재 적용할 수 없다.

## 현재 작업 계획 (2026-06-11 README 및 스펙 문서 보강)

- **Requirement summary**: README.md와 Spotify API 스펙 문서를 현재 구현 상태 및 최신 Spotify 공식 문서 기준으로 점검하고, Deprecated API 제약과 Search API 기반 대체 흐름을 보강한다.
- **Task type**: 문서 점검 및 보강
- **Selected AI-DLC execution mode**: Fast Track
- **Reason for selected mode**: 소스 코드, API 계약, DB 스키마, 배포 구성 변경 없이 문서 정확도만 높이는 제한 범위 작업이다.
- **Required context files**:
  - `AGENTS.md`
  - `aidlc-rules/aws-aidlc-rules/core-workflow.md`
  - `aidlc-rules/aws-aidlc-rule-details/common/process-overview.md`
  - `aidlc-rules/aws-aidlc-rule-details/common/session-continuity.md`
  - `aidlc-rules/aws-aidlc-rule-details/common/content-validation.md`
  - `aidlc-rules/aws-aidlc-rule-details/common/question-format-guide.md`
  - `README.md`
  - `docs/spotify-api-spec.md`
  - `src/server/services/spotify-service.ts`
  - `src/server/services/llm-client.ts`
  - `app/api/curate/route.ts`
  - `app/api/spotify/playlists/route.ts`
- **Expected files to change**:
  - `aidlc-docs/aidlc-state.md`
  - `aidlc-docs/audit.md`
  - `README.md`
  - `docs/spotify-api-spec.md`
- **Files or directories that must not change**:
  - `aidlc-rules/`
  - `AGENTS.md`
  - `src/`
  - `app/`
- **Validation commands**:
  - `npx.cmd markdownlint-cli2 "README.md" "docs/**/*.md" "aidlc-docs/**/*.md"`
  - `git diff --check`
- **Risks or assumptions**:
  - Spotify Web API 정책은 변경될 수 있으므로, 2026-06-11 기준 공식 문서 확인 결과를 명시한다.
  - README의 테스트 개수는 향후 테스트 추가에 따라 바뀔 수 있으므로 고정 숫자 대신 검증 명령과 최근 확인 결과를 중심으로 기술한다.
- **실행 단계**: Workspace 확인, Requirements Analysis minimal, Workflow Planning minimal, 문서 수정, Markdown 검증, 완료 보고
- **생략 단계 및 사유**: User Stories, Application Design, Units Generation, Functional Design, NFR Requirements, NFR Design, Infrastructure Design은 사용자 동작/API 계약/도메인/인프라 변경이 없는 문서 보강 작업이므로 생략한다.

## 현재 작업 계획 (2026-06-11 절차형 RAG 큐레이션 설계 보강)

- **Requirement summary**: RAG-Based Music Curation 인셉션을 장르/감성 SPEC, 장소/청취 맥락 SPEC, 아티스트/곡 SPEC으로 분해하고, 내부 멀티턴 검색/확장 및 아티스트별 최소 3곡 확보 정책을 갖도록 보강한다.
- **Task type**: 인셉션 요구사항 및 아키텍처 설계 보강
- **Selected AI-DLC execution mode**: Design Track
- **Reason for selected mode**: 큐레이션 도메인 규칙, LLM 호출 절차, Spotify Search 후보 확장 정책, 최종 플레이리스트 구성 계약을 바꾸는 설계 결정이 포함된다.
- **Required context files**:
  - `AGENTS.md`
  - `aidlc-rules/aws-aidlc-rules/core-workflow.md`
  - `aidlc-docs/aidlc-state.md`
  - `aidlc-docs/inception/requirements/rag-curation-requirements.md`
  - `aidlc-docs/inception/application-design/rag-architecture.md`
  - `aidlc-docs/construction/plans/u-012-rag-music-curation-implementation-plan.md`
- **Expected files to change**:
  - `aidlc-docs/aidlc-state.md`
  - `aidlc-docs/audit.md`
  - `aidlc-docs/inception/requirements/rag-curation-requirements.md`
  - `aidlc-docs/inception/application-design/rag-architecture.md`
  - `aidlc-docs/construction/plans/u-012-rag-music-curation-implementation-plan.md`
- **Files or directories that must not change**:
  - `aidlc-rules/`
  - `AGENTS.md`
  - `src/`
  - `app/`
- **Validation commands**:
  - `npx.cmd markdownlint-cli2 "aidlc-docs/**/*.md"`
  - `git diff --check`
- **Risks or assumptions**:
  - 멀티턴은 우선 사용자 추가 질문이 아닌 단일 요청 내부의 LLM/Search 반복 호출로 정의한다.
  - 2~3시간 플레이리스트는 긴 응답과 API 비용을 만들 수 있으므로 후보군 확장, 중복 제거, 최종 트랙 수 상한을 설계에 둔다.
  - 한 아티스트당 최소 3곡은 목표 규칙이며, Spotify 검색 결과가 부족하면 가능한 곡 수만 포함하고 부족 사유를 메타데이터로 남긴다.
- **실행 단계**: Workspace 확인, Requirements Analysis standard, Workflow Planning, Application Design 보강, 구현 계획 갱신, Markdown 검증, 완료 보고
- **생략 단계 및 사유**: User Stories는 기존 사용자 목표의 세분화로 충분해 생략한다. Units Generation은 신규 작업 단위 분해 없이 U-012 구현 계획을 보강하므로 생략한다. NFR Design, Infrastructure Design, Code Generation, Build and Test는 이번 턴이 인셉션/계획 문서 보강이고 소스 변경이 없으므로 생략한다.

## 현재 작업 계획 (2026-06-11 Spotify OpenAPI Search 지식 정리)

- **Requirement summary**: Spotify 공식 OpenAPI 스키마를 읽고 Search API 중심 참조 문서를 새로 작성한 뒤, RAG 인셉션에 활용할 수 있는 API 후보를 기존 Spotify API 스펙 문서에 선별 반영한다.
- **Task type**: 외부 API 스키마 분석 및 문서/인셉션 스펙 보강
- **Selected AI-DLC execution mode**: Design Track
- **Reason for selected mode**: Search API의 query/filter/limit/offset 제약과 주변 API의 Deprecated/정책 상태가 RAG 후보 확보 전략 및 구현 계획에 직접 영향을 준다.
- **Required context files**:
  - `AGENTS.md`
  - `aidlc-rules/aws-aidlc-rules/core-workflow.md`
  - `aidlc-docs/aidlc-state.md`
  - `docs/spotify-api-spec.md`
  - `aidlc-docs/inception/requirements/rag-curation-requirements.md`
  - `aidlc-docs/inception/application-design/rag-architecture.md`
  - `https://developer.spotify.com/reference/web-api/open-api-schema.yaml`
- **Expected files to change**:
  - `aidlc-docs/aidlc-state.md`
  - `aidlc-docs/audit.md`
  - `docs/spotify-open-api-search-reference.md` [NEW]
  - `docs/spotify-api-spec.md`
- **Files or directories that must not change**:
  - `aidlc-rules/`
  - `AGENTS.md`
  - `src/`
  - `app/`
- **Validation commands**:
  - `npx.cmd markdownlint-cli2 "docs/**/*.md" "aidlc-docs/**/*.md"`
  - `git diff --check`
- **Risks or assumptions**:
  - 공식 스키마는 2026-06-11에 내려받은 내용을 기준으로 정리한다.
  - Search API `limit` 최대 10 제약 때문에 긴 플레이리스트 후보군 확보는 다중 query와 offset 페이지 확장을 전제로 한다.
  - `x-spotify-policy-list`에 MachineLearning 정책이 연결된 API는 외부 LLM 컨텍스트 사용 시 최소 메타데이터 전달과 별도 정책 검토가 필요하다.
- **실행 단계**: Workspace 확인, Requirements Analysis standard, Workflow Planning, API 참조 문서 생성, 인셉션 적용 후보 반영, Markdown 검증, 완료 보고
- **생략 단계 및 사유**: User Stories와 Units Generation은 사용자 흐름과 작업 단위가 바뀌지 않아 생략한다. Code Generation과 Build and Test는 소스 코드 변경 없이 문서와 설계 지식만 보강하므로 생략한다.

## 워크스페이스 상태

- **Existing Code**: No
- **Programming Languages**: 없음
- **Build System**: 없음
- **Project Structure**: Empty
- **Workspace Root**: `D:\workspace\spotify_aI_playlist_curator`
- **Reverse Engineering Needed**: No

## 코드 위치 규칙

- **Application Code**: 워크스페이스 루트에 둔다. `aidlc-docs/` 안에 애플리케이션 코드를 생성하지 않는다.
- **Documentation**: AI-DLC 산출물은 `aidlc-docs/`에 둔다.
- **Structure patterns**: 구현 단계에서 `construction/code-generation.md`의 규칙을 따른다.

## Extension Configuration

| Extension | Enabled | Decided At |
| --- | --- | --- |
| Security Baseline | No | Requirements Analysis |
| Property-Based Testing | No | Requirements Analysis |

## 단계 진행

### INCEPTION PHASE

- [x] Workspace Detection
- [x] Reverse Engineering - SKIP
  - **사유**: 기존 애플리케이션 코드가 없어 분석 대상이 없다.
- [x] Requirements Analysis
  - **상태**: 요구사항 문서 작성 완료, 사용자 승인 완료
- [x] User Stories
  - **상태**: persona와 story 산출물 작성 완료, 사용자 승인 완료
- [x] Workflow Planning
  - **상태**: 실행 계획 작성 완료, 사용자 승인 완료
- [x] Application Design
  - **상태**: 설계 산출물 작성 완료, 사용자 승인 완료
- [x] Units Generation
  - **상태**: Unit of Work 산출물 작성 완료, 사용자 승인 완료

### CONSTRUCTION PHASE

- [ ] Functional Design - SKIP FOR U-001, COMPLETE FOR U-002, COMPLETE FOR U-003, COMPLETE FOR U-004, COMPLETE FOR U-005
  - **사유**: U-001은 프로젝트 기반, 빌드, 테스트, 환경 변수 문서 중심이며
    상세 비즈니스 로직이 없다.
  - **상태**: U-002/U-003/U-004/U-005 Functional Design 산출물 작성 완료, 사용자 승인 완료
- [ ] NFR Requirements - COMPLETE FOR U-001, COMPLETE FOR U-002, COMPLETE FOR U-003, COMPLETE FOR U-004, COMPLETE FOR U-005
  - **상태**: U-001/U-002/U-003/U-004/U-005 NFR 산출물 작성 완료, 사용자 승인 완료
- [ ] NFR Design - SKIP
- [ ] Infrastructure Design - SKIP
- [ ] Code Generation - COMPLETE FOR U-001, COMPLETE FOR U-002, COMPLETE FOR U-003, COMPLETE FOR U-004, COMPLETE FOR U-005
  - **상태**: U-001/U-002/U-003/U-004/U-005 코드 생성 완료, 사용자 승인 완료
- [x] Build and Test - COMPLETE FOR U-001, COMPLETE FOR U-002, COMPLETE FOR U-003, COMPLETE FOR U-004, COMPLETE FOR U-005
  - **상태**: 빌드, 타입 검사, 49개 단위 테스트 및 마크다운 린트 모두 성공 통과

### OPERATIONS PHASE

- [x] Operations - COMPLETE (Current MVP has no infrastructure deployment logic)

### MAINTENANCE & EXPANSION PHASE

- [x] U-006: Spotify User Profile Integration - COMPLETE
  - **상태**: 스포티파이 사용자 상세 프로필 연동 및 UI 표기 기능 구현 완료, 테스트 검증 통과
- [x] U-007: /api/spotify/profile Request Logging - COMPLETE
  - **상태**: API 엔드포인트 요청 정보 로깅 구현 완료 및 빌드/테스트/마크다운 린트 검증 완료
- [x] U-008: Spotify Playlist Tracks API to Items Migration - COMPLETE
  - **상태**: 사용 중단된 /tracks 엔드포인트를 /items로 이관 완료 및 테스트 검증 완료
- [x] U-009: Actual Track Data Integration for Preview Flow - COMPLETE
  - **상태**: AI 호출 없이 스포티파이 실제 트랙 추가를 바로 테스트할 수 있도록 진짜 곡 데이터 3건을 UI에 연동 완료 및 빌드/테스트/마크다운 린트 검증 완료
- [x] U-010: Console Logging Simplification - COMPLETE
  - **상태**: 백엔드 API 요청들의 비대한 로그를 간결한 1줄짜리 흐름 로그로 간소화 완료 및 빌드/테스트/마크다운 린트 검증 완료
- [x] U-011: RAG-Based Music Curation Inception & Design - COMPLETE
  - **상태**: 스포티파이 Search API 기반 RAG 큐레이션 모델 기획/요구사항 정의/아키텍처 설계 완료. 2026-06-11에 절차형 SPEC 분해 및 내부 멀티턴 검색 흐름으로 보강
- [x] U-012: RAG-Based Music Curation Implementation - COMPLETE
  - **상태**: RAG 기반 음악 큐레이션(Search API, 3축 SPEC 분해, 내부 멀티턴 LLM/Search 파이프라인) 실제 기능 구현 및 단위/통합 테스트 진행 중
- [x] U-013: README and Spotify API Spec Refresh - COMPLETE
  - **상태**: README와 Spotify API 스펙 문서에 Deprecated API 제약, Search API 기반 대체 전략, 현재 구현 기능, 검증 명령을 보강하고 Markdown lint 및 diff 공백 검증을 통과
- [x] U-014: Procedural RAG Curation Inception Refinement - COMPLETE
  - **상태**: RAG 요구사항, 아키텍처, U-012 구현 계획을 3축 SPEC 분해, 내부 멀티턴 검색, 아티스트별 최소 3곡 목표, 2~3시간 플레이리스트 허용 정책으로 보강하고 Markdown lint 및 diff 공백 검증을 통과
- [x] U-015: Spotify OpenAPI Search Knowledge Extraction - COMPLETE
  - **상태**: Spotify 공식 OpenAPI 스키마를 기반으로 Search API 참조 문서를 새로 작성하고, RAG 인셉션 활용 API 선별 내용을 Spotify API 스펙 문서에 반영했으며 Markdown lint 및 diff 공백 검증을 통과
- [x] U-016: Curation Progress Visibility - COMPLETE
  - **상태**: `/api/curate`에 POST 기반 NDJSON progress stream을 추가하고, 홈 화면에서 SPEC 분해, 검색 계획, 후보 수집, 후보 평가, 아티스트 depth 확장, 최종 큐레이션 단계를 진행률과 누적 메시지로 표시하도록 구현 완료. 타입체크, 테스트, 변경 파일 ESLint, Markdown lint, diff 공백 검증을 통과
- [x] U-017: Post-generation Validation Requirements - COMPLETE
  - **상태**: RAG 요구사항과 아키텍처에 `generate -> validate -> repair -> final` 흐름, 라인업 제한형 allowlist 하드 제약, 생성 후 검증/수리 정책을 반영 완료
- [x] U-018: Lineup Validation and Repair Implementation - COMPLETE
  - **상태**: 라인업 제한형 큐레이션에서 `allowedArtists` 추출, 아티스트 검색 우선 계획, 후보군 allowlist 필터링, 아티스트 depth target 제한, 최종 결과 검증/수리 메타데이터를 구현하고 테스트 검증을 통과
- [x] U-019: AI-Driven Playlist Name and Description Recommendations - COMPLETE
  - **상태**: 플레이리스트 저장 시 사용자가 제목/설명을 자유롭게 편집할 수 있는 입력 폼 UI를 연동하고, 곡 리스트와 프롬프트 기반의 AI 추천 재작명 전용 API `/api/curate/recommend-metadata` 및 UI 연동을 구현 완료하여 타입체크, 테스트, 마크다운 린트를 통과함.

## 현재 상태

- **Lifecycle Phase**: CONSTRUCTION
- **Current Stage**: Construction
- **Next Stage**: Maintenance and Expansion
- **Status**: RAG-based music curation implementation, curation progress visibility, post-generation validation requirements, lineup validation/repair, and AI-driven playlist name/description recommendations with user-editable forms completed on 2026-06-11. `/api/curate` now uses 3-axis SPEC extraction, internal multi-turn LLM/Search planning, Spotify Search candidate collection, artist depth expansion, candidate coverage evaluation, final candidate-grounded curation, optional NDJSON progress streaming, and strict lineup allowlist filtering/repair for festival prompts.

## 현재 작업 계획 (2026-06-11 큐레이션 진행 상태 표시)

- **Requirement summary**: AI 멀티턴 큐레이션 중 사용자가 대기 상태를 이해할 수 있도록 `/api/curate`의 단계별 진행 이벤트와 홈 화면 진행 메시지 UI를 추가한다.
- **Task type**: 사용자 대기 경험 개선, API 응답 모드 확장, 프론트 상태 표시 보강
- **Selected AI-DLC execution mode**: Standard Track
- **Reason for selected mode**: 기존 route handler와 홈 화면, 테스트를 함께 변경하며 사용자에게 보이는 동작을 확장하지만 DB, 인증, 배포, 신규 인프라 변경은 없다.
- **Required context files**:
  - `AGENTS.md`
  - `aidlc-rules/aws-aidlc-rules/core-workflow.md`
  - `aidlc-docs/aidlc-state.md`
  - `app/api/curate/route.ts`
  - `app/api/curate/route.test.ts`
  - `src/features/home/home-page.tsx`
  - `src/features/home/home-page.test.tsx`
- **Expected files to change**:
  - `app/api/curate/route.ts`
  - `app/api/curate/route.test.ts`
  - `src/features/home/home-page.tsx`
  - `src/features/home/home-page.test.tsx`
  - `aidlc-docs/audit.md`
  - `aidlc-docs/aidlc-state.md`
- **Files or directories that must not change**:
  - `aidlc-rules/`
  - `AGENTS.md`
- **Validation commands**:
  - `npm.cmd run typecheck`
  - `npm.cmd test`
  - `npx.cmd markdownlint-cli2 "docs/**/*.md" "aidlc-docs/**/*.md"`
  - `git diff --check`
- **Risks or assumptions**:
  - POST 기반 진행 이벤트는 `EventSource` 대신 `fetch`의 `ReadableStream`을 사용한다.
  - 스트리밍을 지원하지 않는 환경에서는 기존 JSON 파싱 경로 또는 fallback 메시지로 복원력을 유지한다.
  - 진행률 숫자는 실제 시간 예측이 아니라 완료된 절차 단계 비율을 나타낸다.
- **실행 단계**: Workspace 확인, Requirements Analysis standard, Workflow Planning standard, Code Generation, Build and Test
- **생략 단계 및 사유**: User Stories, Application Design, Units Generation, NFR Requirements, NFR Design, Infrastructure Design은 기존 화면과 API 경계 안에서 대기 상태 표시를 보강하는 작업이므로 생략한다.

## 현재 작업 계획 (2026-06-11 플레이리스트 AI 작명 추천 및 편집 기능 추가)

- **Requirement summary**: 플레이리스트 저장 시 기본 제공되던 고정/단순한 제목 및 설명 대신, AI가 현재 구성된 곡 리스트와 원본 프롬프트를 기반으로 감성적인 제목과 설명을 다시 추천하는 전용 API 및 프론트엔드 편집/재추천 UI를 제공한다.
- **Task type**: 기능 추가 및 UI 개선
- **Selected AI-DLC execution mode**: Design Track
- **Reason for selected mode**: 플레이리스트 작명을 위한 신규 API `/api/curate/recommend-metadata` 추가, `LlmClient` 내부의 신규 프롬프트 및 추천 서비스 연동 설계, 그리고 UI 컴포넌트 상에서의 가변 상태(제목/설명 편집 폼) 설계가 연관된다.
- **Required context files**:
  - `AGENTS.md`
  - `aidlc-rules/aws-aidlc-rules/core-workflow.md`
  - `aidlc-docs/aidlc-state.md`
  - `src/server/services/llm-client.ts`
  - `app/api/spotify/playlists/route.ts`
  - `src/features/home/home-page.tsx`
- **Expected files to change**:
  - `aidlc-docs/aidlc-state.md`
  - `aidlc-docs/audit.md`
  - `src/server/services/llm-client.ts`
  - `src/server/services/llm-client.test.ts`
  - `app/api/curate/recommend-metadata/route.ts` [NEW]
  - `app/api/curate/recommend-metadata/route.test.ts` [NEW]
  - `src/features/home/home-page.tsx`
  - `src/features/home/home-page.test.tsx`
- **Files or directories that must not change**:
  - `aidlc-rules/`
  - `AGENTS.md`
- **Validation commands**:
  - `npm.cmd run typecheck`
  - `npm.cmd test`
  - `npx.cmd markdownlint-cli2 "aidlc-docs/**/*.md"`
  - `git diff --check`
- **Risks or assumptions**:
  - AI 작명 API는 큐레이션 결과(`tracks`와 `userPrompt`)가 주어졌을 때 비동기로 호출되며, LLM API Key 미설정 혹은 Mock 모드 활성화 시에는 정형화된 감성 제목 후보들 중 분위기에 맞게 휴리스틱으로 추천하여 복원력을 확보한다.
  - 플레이리스트 저장 완료 후에는 제목/설명 변경 입력 폼이 비활성화되거나 완료 메시지로 가려져야 혼선을 방지할 수 있다.
- **실행 단계**: Workspace 확인, Requirements Analysis standard, Workflow Planning standard, Application Design 보강, Code Generation, Build and Test
- **생략 단계 및 사유**: User Stories, Units Generation, NFR Requirements, NFR Design, Infrastructure Design은 신규 작업 분해나 비기능적/인프라적 변경 사항이 없는 단일 마일스톤 기능 추가이므로 생략한다.
