# Spotify AI Playlist Curator

<!-- markdownlint-disable MD013 -->

사용자의 최근 재생 음악 취향과 자연어 프롬프트를 분석하여 맞춤형 AI 플레이리스트를 추천하고, 이를 실제 Spotify 계정에 플레이리스트로 연동 및 저장할 수 있는 Next.js 기반의 무상태(Stateless) MVP 웹 애플리케이션입니다.

본 프로젝트는 AI-DLC(AI Software Development Life Cycle) 사양에 의거하여 설계, 구현, 검증이 진행되었습니다.

---

## 핵심 기능 (Key Features)

### 1. Spotify OAuth 인증

- 안전한 서버 전용 HttpOnly Cookie 기반 세션 서명 검증(HMAC) 제공.
- 만료 시 자동으로 백엔드 레이어에서 리프레시 토큰 갱신 및 1회 재시도(Retry) 처리.

### 2. 최근 재생 곡 수집 및 정제

- 사용자의 Spotify 최근 재생 이력(Recently Played) API 실시간 연동.
- 중복 트랙 제거(최신순 보존) 및 필수 필드(ID, URI, 곡명, 아티스트명) 최소 payload 추출.
- 외부 API 장애 대응용 5초 타임아웃 및 빈 배열 지원 복원력 설계.

### 3. LLM Curation Engine (AI 추천)

- 사용자 자연어 프롬프트와 정제된 최근 재생 목록을 컨텍스트로 결합하여 맞춤 큐레이션 생성.
- OpenAI / Gemini API 연동 및 10초 타임아웃(Abort) 제어.
- JSON 응답 파싱 에러 시 1회 자동 재시도 및 실패 시 디폴트 폴백 데이터 안정성 확보.
- API Key 미설정 및 로컬 개발용 정적 Mock LLM 데이터 시뮬레이터 내장.

### 4. Spotify Search 트랙 매핑

- AI 추천 곡명(텍스트) 정보를 Spotify Search API (`GET /v1/search`)로 병렬 호출(`Promise.all`)하여 실제 Spotify URI 획득.
- 각 곡당 개별 5초 타임아웃 적용 및 매핑 에러 시 해당 곡 자동 스킵 복원력 보장.
- 최종 매핑에 성공한 트랙이 0개인 경우에만 명시적 오류 예외 처리.
- 로컬 모드를 위한 100% Mock Search(가짜 URI 생성 매핑) 지원.

---

## 기술 스택 (Tech Stack)

- **프레임워크**: Next.js v15 (App Router)
- **라이브러리**: React v19, TypeScript, Tailwind CSS
- **테스트 프레임워크**: Vitest, React Testing Library, JSDOM
- **패키지 관리자**: npm v9+
- **런타임**: Node.js v18+

---

## 디렉토리 구조 (Directory Structure)

```text
src/
  ├── domain/             # 도메인 모델 정의 (track.ts, search.ts 등)
  ├── features/           # UI 컴포넌트 단위 (auth, home 등)
  ├── lib/                # 환경 변수 유효성 검사 및 유틸리티
  └── server/
        └── services/     # 비즈니스 서비스 (auth-service, spotify-service, llm-client)
app/
  ├── api/                # Route Handler (OAuth callback, curate API 등)
  └── globals.css         # 글로벌 CSS 및 Tailwind 스타일링
aidlc-docs/               # AI-DLC 산출물 문서
aidlc-rules/              # 적용된 AI-DLC 규격 규칙 정의서
```

---

## 시작 가이드 (Getting Started)

### 1. 환경 변수 설정

루트 디렉토리에 `.env.local` 파일을 생성하여 아래 필수 환경 변수 값을 구성합니다:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/auth/callback
SESSION_SECRET=your_hmac_session_secret_at_least_32_bytes
LLM_API_KEY=your_openai_or_gemini_api_key
```

> [!NOTE]
> `SESSION_SECRET`은 세션 쿠키의 서명을 위한 비밀 키로, 32바이트 이상의 임의의 보안 문자열이어야 합니다.
> `LLM_API_KEY` 및 Spotify 자격 증명이 누락된 경우 애플리케이션은 로컬 시뮬레이션 모드(Mock 모드)로 동작하여 정상 빌드 및 실행을 보장합니다.

### 2. 의존성 패키지 설치

```bash
npm install
```

### 3. 로컬 개발 서버 실행

```bash
npm run dev
```

### 4. 프로덕션 빌드

```bash
npm run build
```

---

## 테스트 및 검증 (Testing & Verification)

### 1. 타입 검사 실행

```bash
npm run typecheck
```

### 2. 테스트 스위트 구동 (총 41개 단위/통합 테스트)

```bash
npm test
```

### 3. AI-DLC 문서 마크다운 린트 검사

```bash
npx markdownlint-cli2 "README.md" "aidlc-docs/**/*.md"
```

---

## AI-DLC 설계 및 검증 산출물 (SDD) 워크플로우

본 프로젝트의 설계(SDD)와 개발 프로세스는 **AI-DLC(AI Software Development Life Cycle)** 규격을 따라 순차적으로 진행되었습니다. 아래 순서대로 문서를 읽으시면 프로젝트의 흐름을 가장 잘 파악하실 수 있습니다.

### 1단계: Inception (요구사항 정의 및 상위 설계)

프로젝트의 목표를 정의하고 아키텍처 경계를 나누는 분석 설계 단계입니다.

1. **요구사항 정의서** ([requirements.md](aidlc-docs/inception/requirements/requirements.md))
   - 시스템의 기능적 요구사항(`R-XXX`)과 비기능적 요구사항(`NFR-XXX`)을 처음으로 정의한 핵심 스펙 문서입니다.
2. **사용자 스토리** ([stories.md](aidlc-docs/inception/user-stories/stories.md))
   - 요구사항을 바탕으로 사용자 시나리오(`S-XXX`)와 각 스토리가 통과해야 할 인수 조건(Acceptance Criteria)을 작성한 문서입니다.
3. **상위 설계 통합 문서** ([application-design.md](aidlc-docs/inception/application-design/application-design.md))
   - 전체 시스템 아키텍처, 디렉토리 설계, 핵심 도메인 모델(큐레이션, 세션 등) 간의 협력을 정립한 문서입니다.
4. **작업 단위 맵핑 및 의존성**
   - [unit-of-work.md](aidlc-docs/inception/application-design/unit-of-work.md): 스토리와 요구사항을 5개의 단위 작업(`U-001` ~ `U-005`)으로 분할하고 담당 범위를 명시합니다.
   - [unit-of-work-story-map.md](aidlc-docs/inception/application-design/unit-of-work-story-map.md): 어떤 스토리가 어떤 유닛에 구현되는지 매핑한 관계 테이블입니다.
5. **실행 계획서** ([execution-plan.md](aidlc-docs/inception/plans/execution-plan.md))
   - 각 작업 단위의 구현 순서, 마일스톤, 그리고 테스트 검증 기준을 종합한 로드맵입니다.

### 2단계: Construction (상세 설계 및 구현)

각 작업 단위(`U-001`부터 `U-005`까지)별로 구체적인 설계를 세우고 구현을 진행하는 단계입니다.

- **상세 기능/비기능 설계 및 코드 생성 계획** (`aidlc-docs/construction/plans/`)
  - 각 유닛의 작업 착수 전에 설계 사양을 정의하고 계획을 기술한 문서들입니다. (예: [U-002 코드 생성 계획](aidlc-docs/construction/plans/u-002-spotify-auth-session-code-generation-plan.md))
- **유닛별 결과 산출물** (`aidlc-docs/construction/u-*/`)
  - 각 단위 작업마다 실제로 도출된 상세 비기능 요구사항 분석 및 기능 설계 결과가 담겨 있습니다. (예: `u-002-spotify-auth-session/` 내의 설계 문서들)

### 3단계: Verification & Audit (최종 검증 및 상태 관리)

- **빌드 및 테스트 결과 요약** ([build-and-test-summary.md](aidlc-docs/construction/build-and-test/build-and-test-summary.md))
  - 개발 완료 후 41개의 모든 단위/통합 테스트와 빌드 검증을 최종적으로 수행하여 품질 목표를 통과했음을 증명하는 보고서입니다.
- **진행 상태 관리** ([aidlc-state.md](aidlc-docs/aidlc-state.md))
  - 유닛별로 현재 단계(Functional Design, Code Gen 등)의 진행 및 완료 상태를 투명하게 관리하는 문서입니다.
- **의사결정 및 감사 기록** ([audit.md](aidlc-docs/audit.md))
  - 개발 과정에서 발생한 핵심 의사결정 사항, 사용자 계획 승인 내역, 상태 변경 이력을 타임스탬프 순으로 누적 기록한 감사 로그입니다.
