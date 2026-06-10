# AI-DLC Task Plan: Spotify User Profile Integration

<!-- markdownlint-disable MD013 -->

## 1. Requirement Summary

스포티파이 `/v1/me` API를 호출하는 백엔드 서비스를 확장하여 사용자의 이름(DisplayName), 이메일, 프로필 이미지 URL 등을 조회하는 기능을 추가합니다. 이를 노출하기 위한 백엔드 API 엔드포인트 `/api/spotify/profile`을 신설하고, 프론트엔드 홈 화면(`home-page.tsx`)에서 이 정보를 fetch하여 로그인 완료 시 세련된 프로필 카드 UI로 출력하도록 개선합니다.

## 2. Task Type

기능 보강 및 UI 개선 (Feature enhancement)

## 3. Selected AI-DLC Execution Mode

Standard Track

## 4. Reason for Selected Mode

기존 애플리케이션 아키텍처 구조 내부에서 서비스 레이어 보강, 신규 엔드포인트 신설, React 컴포넌트 뷰 확장이 유기적으로 연결된 기능 구현이므로 Standard Track에 해당합니다.

## 5. Required Context Files

- `src/server/services/spotify-service.ts`
- `src/features/home/home-page.tsx`

## 6. Expected Files to Change

- **[MODIFY]** [spotify-service.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.ts): `getCurrentUserProfile` 메서드 추가
- **[NEW]** [route.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/spotify/profile/route.ts): 사용자 프로필 조회용 API 엔드포인트 생성
- **[MODIFY]** [home-page.tsx](file:///d:/workspace/spotify_aI_playlist_curator/src/features/home/home-page.tsx): `/api/spotify/profile` 연동 및 사용자 프로필 카드 UI 개선

## 7. Files or Directories That Must Not Change

- `aidlc-rules/`
- `AGENTS.md`

## 8. Validation Commands

- `cmd.exe /c npm run typecheck` (타입 안전성 검사)
- `cmd.exe /c npm test` (기존 테스트 및 신규 단위 테스트 구동)

## 9. Risks or Assumptions

- 스포티파이 사용자 계정에 프로필 이미지나 이름 정보가 비어 있거나 없는 경우의 기본값(Fallback) 대응이 필요합니다.
- 로컬 개발 환경에서의 프록시/보안 인증 우회 설정(`NODE_TLS_REJECT_UNAUTHORIZED=0`)이 유효하게 동작해야 합니다.
