# 빌드 안내서 (Build Instructions)

<!-- markdownlint-disable MD013 -->

본 문서는 Spotify AI Playlist Curator 애플리케이션의 로컬 개발 및 프로덕션 환경용 빌드 절차를 안내합니다.

## Prerequisites

- **런타임**: Node.js v18.0.0 이상
- **패키지 관리자**: npm v9.0.0 이상
- **주요 의존성**: Next.js v15, React v19, TypeScript v5
- **환경 변수**:
  - `SPOTIFY_CLIENT_ID`: Spotify Developer Dashboard에서 획득한 Client ID
  - `SPOTIFY_CLIENT_SECRET`: Spotify Developer Dashboard에서 획득한 Client Secret
  - `SPOTIFY_REDIRECT_URI`: Spotify OAuth 인증 콜백 URI (기본값: `http://localhost:3000/api/spotify/auth/callback`)
  - `SESSION_SECRET`: 세션 암호화 및 서명을 위한 32바이트 이상의 무작위 보안 문자열
  - `LLM_API_KEY`: LLM API 호출용 키 (미설정 시 Mock 큐레이션 동작)

## Build Steps

### 1. 의존성 패키지 설치

의존성 패키지들을 설치하여 프로젝트 기동 환경을 준비합니다.

```bash
npm install
```

### 2. 환경 변수 설정

루트 디렉토리에 `.env.local` 파일을 생성하여 필수 환경 변수들을 기입합니다. (원본 템플릿은 `.env.example`을 참고)

```bash
cp .env.example .env.local
# 이후 에디터로 .env.local을 열어 필요한 자격 증명 기입
```

### 3. 애플리케이션 빌드

프로덕션 배포용 정적 파일 및 Route Handler 서버 빌드를 수행합니다.

```bash
npm run build
```

### 4. 빌드 성공 검증

- **정상 출력**: 빌드 정상 완료 시 터미널에 Next.js 빌드 리포트(라우트 목록, 정적/서버 구분 표시)가 출력되며 `First Load JS` 용량 정보 등이 표시됩니다.
- **산출물**: 루트 하위의 `.next/` 디렉토리에 최적화 빌드 결과물이 정상 생성됩니다.

## 문제 해결 (Troubleshooting)

### Dependency Resolution 실패

- **원인**: 로컬 Node.js/npm 버전이 권장 사양 이하이거나 캐시 오염
- **해결**: Node.js 버전을 v18+로 업데이트하고, `rm -rf node_modules package-lock.json` 및 `npm cache clean --force` 수행 후 `npm install` 재기동

### Compilation / TypeScript 에러

- **원인**: 타입 선언 불일치 또는 잘못된 import 경로
- **해결**: `npm run typecheck` 명령어를 통해 상세 에러 위치를 식별하고, Typescript 컴파일러 설정 혹은 코드를 검토 및 수정
