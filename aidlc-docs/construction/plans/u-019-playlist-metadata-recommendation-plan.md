# AI-DLC Task Plan: AI-Driven Playlist Name and Description Recommendations (U-019)

<!-- markdownlint-disable MD013 -->

## 1. Requirement Summary

플레이리스트 저장 시 기본 제공되던 고정/단순한 제목 및 설명 대신, AI가 현재 구성된 곡 리스트와 원본 프롬프트를 기반으로 감성적인 제목과 설명을 다시 추천하는 전용 API 및 프론트엔드 편집/재추천 UI를 제공합니다. 사용자가 플레이리스트 저장 전에 제목과 설명을 자유롭게 수정할 수 있게 하고, "AI 추천 작명" 버튼을 눌러 곡의 분위기와 프롬프트 의도에 꼭 맞춘 감성적인 타이틀/설명을 LLM을 통해 재작명받을 수 있도록 연동합니다.

## 2. Task Type

기능 추가 및 UI 개선 (Feature addition & UI enhancement)

## 3. Selected AI-DLC Execution Mode

Design Track

## 4. Reason for Selected Mode

플레이리스트 작명을 위한 신규 API `/api/curate/recommend-metadata` 추가, `LlmClient` 내부의 신규 프롬프트 및 추천 서비스 연동 설계, 그리고 UI 컴포넌트 상에서의 가변 상태(제목/설명 편집 폼) 설계가 연관되므로 설계 결정이 먼저 필요합니다.

## 5. Required Context Files

- `src/server/services/llm-client.ts`
- `app/api/spotify/playlists/route.ts`
- `src/features/home/home-page.tsx`

## 6. Expected Files to Change

- **[MODIFY]** [llm-client.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.ts): `recommendPlaylistMetadata` 메서드 추가
- **[MODIFY]** [llm-client.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.test.ts): `recommendPlaylistMetadata` 단위 테스트 추가
- **[NEW]** [route.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/recommend-metadata/route.ts): 플레이리스트 메타데이터 추천 API 엔드포인트 생성
- **[NEW]** [route.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/recommend-metadata/route.test.ts): API 단위 테스트 파일 생성
- **[MODIFY]** [home-page.tsx](file:///d:/workspace/spotify_aI_playlist_curator/src/features/home/home-page.tsx): 제목/설명 편집 폼 제공, AI 추천 연동, 저장 시 편집 내용 전송
- **[MODIFY]** [home-page.test.tsx](file:///d:/workspace/spotify_aI_playlist_curator/src/features/home/home-page.test.tsx): 편집 및 저장 시나리오에 대한 테스트 케이스 추가
- **[MODIFY]** [aidlc-state.md](file:///d:/workspace/spotify_aI_playlist_curator/aidlc-docs/aidlc-state.md): 작업 상태 업데이트
- **[MODIFY]** [audit.md](file:///d:/workspace/spotify_aI_playlist_curator/aidlc-docs/audit.md): 작업 로그 추가

## 7. Files or Directories That Must Not Change

- `aidlc-rules/`
- `AGENTS.md`

## 8. Validation Commands

- `cmd.exe /c npm run typecheck`
- `cmd.exe /c npm test`
- `npx markdownlint-cli2 "aidlc-docs/**/*.md" "docs/**/*.md"`
- `git diff --check`

## 9. Risks or Assumptions

- AI 작명 API는 큐레이션 결과(`tracks`와 `userPrompt`)가 주어졌을 때 비동기로 호출되며, LLM API Key 미설정 혹은 Mock 모드 활성화 시에는 정형화된 감성 제목 후보들 중 분위기에 맞게 휴리스틱으로 추천하여 복원력을 확보합니다.
- 플레이리스트 저장 완료 후에는 제목/설명 변경 입력 폼이 비활성화되거나 완료 메시지로 가려져야 혼선을 방지할 수 있습니다.
