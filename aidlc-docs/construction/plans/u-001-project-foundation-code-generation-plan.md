# U-001 Project Foundation Code Generation 계획

## 단위 컨텍스트

- **Unit**: U-001 Project Foundation
- **Workspace Root**: `D:\workspace\spotify_aI_playlist_curator`
- **Project Type**: Greenfield monolith Next.js application
- **Application Code Location**: 워크스페이스 루트
- **Documentation Location**: `aidlc-docs/construction/u-001-project-foundation/code/`
- **Stories**: S-008 중심, S-001/S-002/S-005/S-006의 기반 제공
- **Requirements**: NFR-001, NFR-002, NFR-003, NFR-004, NFR-005

## 생성 접근

U-001은 애플리케이션 기반 단위다. 실제 Spotify OAuth, adapter, 큐레이션
도메인, 완성 UI는 후속 단위에서 구현한다. 이번 단계는 Next.js 프로젝트,
Tailwind CSS, Vitest, React Testing Library, 환경 변수 helper, 기본 page와
테스트가 실행 가능한 상태를 만든다.

## 대상 경로

### Application Code

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
- `src/lib/env/server-env.ts`
- `src/lib/env/server-env.test.ts`
- `src/lib/testing/render.tsx`
- `src/features/home/home-page.tsx`
- `src/features/home/home-page.test.tsx`

### Documentation

- `aidlc-docs/construction/u-001-project-foundation/code/code-summary.md`

## 실행 단계

### Step 1: Project Structure Setup

- [x] `package.json`에 Next.js, React, TypeScript, Tailwind, Vitest,
  React Testing Library, ESLint 관련 scripts와 dependencies를 정의한다.
- [x] `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`,
  `tailwind.config.ts`, `eslint.config.mjs`, `vitest.config.ts`,
  `vitest.setup.ts`를 생성한다.
- [x] `.gitignore`와 `.env.example`을 생성한다.

### Step 2: App Shell Generation

- [x] `app/layout.tsx`를 생성한다.
- [x] `app/globals.css`에 Tailwind CSS와 기본 theme token을 설정한다.
- [x] `app/page.tsx`를 생성하고 `HomePage` feature component를 렌더링한다.

### Step 3: Foundation Feature Component Generation

- [x] `src/features/home/home-page.tsx`를 생성한다.
- [x] 첫 화면에는 Spotify 큐레이션 앱의 실제 시작 화면을 둔다.
- [x] interactive element에는 안정적인 `data-testid`를 부여한다.

### Step 4: Environment Boundary Generation

- [x] `src/lib/env/server-env.ts`를 생성한다.
- [x] server-only 환경 변수 이름과 validation helper를 정의한다.
- [x] secret 값 자체를 client component에서 import하지 않도록 경계를 둔다.

### Step 5: Testing Foundation Generation

- [x] `src/lib/testing/render.tsx`를 생성한다.
- [x] `src/lib/env/server-env.test.ts`를 생성한다.
- [x] `src/features/home/home-page.test.tsx`를 생성한다.
- [x] U-001 품질 게이트인 unit test 기반을 검증한다.

### Step 6: Documentation Generation

- [x] `aidlc-docs/construction/u-001-project-foundation/code/code-summary.md`를
  생성한다.
- [x] 생성 파일, 제외 범위, requirement/story verification 계획을 요약한다.
- [x] e2e smoke test는 후속 확장 후보로 N/A 사유를 기록한다.

### Step 7: Progress Update

- [x] 이 계획의 완료된 체크박스를 즉시 갱신한다.
- [x] `aidlc-docs/aidlc-state.md`를 U-001 Code Generation 완료 상태로 갱신한다.

## Requirement and Story Verification

| Requirement/Story | Evidence |
| --- | --- |
| NFR-001 | `npm run build`, `npm run typecheck` 대상 설정 |
| NFR-002 | Vitest와 React Testing Library 테스트 생성 |
| NFR-003 | ESLint 설정과 `npm run lint` script |
| NFR-004 | `.env.example`, `server-env.ts`, env unit test |
| NFR-005 | Next.js App Router와 Vercel-compatible build |
| S-008 | DB 없는 프로젝트 기반과 env/build/test 구조 |

## 승인 조건

이 계획 승인 후에는 위 단계 순서대로 실제 애플리케이션 파일을 워크스페이스
루트에 생성한다. `aidlc-docs/`에는 코드 요약 문서만 생성한다.
