# U-002 Spotify Auth Session 코드 요약

<!-- markdownlint-disable MD013 -->

## 구현 개요

본 단위(U-002)에서는 Spotify OAuth 2.0 흐름을 통한 로그인 및 세션 관리 로직을 구현하였습니다. 세션 데이터는 HMAC-SHA256으로 서명하여 클라이언트 사이드 변조를 원천 차단하였고, Route Handler 내부에서 Spotify API를 호출하기 전에 액세스 토큰을 만료 시간 기준 자동으로 갱신(Auto-Refresh)하는 보안 및 편의성 설계를 반영하였습니다.

## 생성 및 변경된 파일 목록

- **환경 설정**:
  - `.env.example`: `SESSION_SECRET` 및 Spotify Credentials 환경 변수 정의
- **암호화 라이브러리**:
  - `src/lib/crypto/session-signature.ts`: HMAC 서명 및 무결성 검증 유틸리티
  - `src/lib/crypto/session-signature.test.ts`: 서명 변조 차단에 대한 단위 테스트
- **비즈니스 서비스**:
  - `src/server/services/auth-service.ts`: Spotify Token Exchange, Refresh, 쿠키 세션 수명 관리 로직
  - `src/server/services/auth-service.test.ts`: Vitest mock 기반의 서비스 단위 테스트
- **API Route Handlers**:
  - `app/api/spotify/login/route.ts`: State 생성 및 Spotify Authorization 화면 리다이렉트
  - `app/api/spotify/callback/route.ts`: CSRF State 검증, 토큰 교환, 세션 암호화 쿠키 발급 및 홈 리다이렉트
  - `app/api/spotify/refresh/route.ts`: 수동/강제 토큰 리프레시 검증용 Route Handler
  - `app/api/spotify/logout/route.ts`: 세션 삭제 및 로그아웃 처리
- **프론트엔드 UI**:
  - `src/features/auth/login-button.tsx`: Spotify 브랜드 디자인이 적용된 로그인 유도 버튼
  - `src/features/auth/login-button.test.tsx`: 클릭 이벤트 및 window.location 리다이렉트 테스트
  - `src/features/home/home-page.tsx`: 인증 상태(`isAuthenticated`)에 따른 UI 분기 및 로그아웃 기능 융합
  - `src/features/home/home-page.test.tsx`: 인증 유무 별 버튼 노출 분기 검증 테스트 추가
  - `app/page.tsx`: Next.js Server Component 단에서 세션 검사 후 HomePage에 주입하도록 변경

## 제외 범위 및 사유

- **세션 데이터 대칭 암호화(AES-GCM 등)**: HMAC 서명으로 세션 페이로드 무결성이 충분히 확보되며, 중요 크리덴셜은 브라우저 스크립트에 노출되지 않는 HttpOnly 속성이 강제되므로 MVP 속도를 위해 양방향 암호화는 제외하고 후속 개선 후보로 둡니다.
- **Spotify Web API의 추가 정보 가져오기**: U-002 범위는 OAuth 토큰 교환 및 세션 라이프사이클에 국한되므로, 사용자 프로필 조회 등의 구체적인 API 호출부는 U-003(최근 재생 목록 조회) 이후 개발합니다.

## 품질 검증 요약

| Requirement/Story | 검증 방식 | 결과 |
| :--- | :--- | :--- |
| NFR-001 (Cookie Security) | signed cookie 복원 테스트 및 HttpOnly/Secure 속성 부여 테스트 | **PASS** |
| NFR-002 (Expiry & Refresh) | expires_at 만료 임박 시 자동 리프레시 검증 및 예외 시 파기 테스트 | **PASS** |
| NFR-003 (OAuth State CSRF) | state 비교 불일치 시 차단 및 state 임시 쿠키 즉시 삭제 테스트 | **PASS** |
| NFR-004 (Observability) | 토큰 실패 시 대표 오류 쿼리 스트링 리다이렉트 및 서버 로깅 검증 | **PASS** |
| NFR-005 (Mocking/Testability) | Fetch API/Node-fetch mock을 활용한 로컬 무의존성 검증 | **PASS** |
| S-001 (User Login & Link) | 로그인 버튼 생성 및 Spotify OAuth 로그인 시작 확인 | **PASS** |
| S-002 (Auth & Session Maintain) | 로그인 성공 시 쿠키 세션 수립 및 상태 유지 연동 확인 | **PASS** |
| S-005 (Session Refresh) | 백엔드 내/외 자동 및 수동 토큰 리프레시 검사 완료 | **PASS** |
