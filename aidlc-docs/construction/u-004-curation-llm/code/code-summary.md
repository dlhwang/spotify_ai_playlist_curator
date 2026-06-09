# U-004 Curation Engine / LLM Client 코드 요약

<!-- markdownlint-disable MD013 -->

## 구현 개요

본 단위(U-004)에서는 사용자의 분위기 자연어 프롬프트와 Spotify 최근 재생 곡 목록을 기반으로 플레이리스트 제목, 설명 및 추천 트랙 목록을 텍스트로 생성하는 AI 큐레이션 엔진을 구현하였습니다. `LLM_API_KEY` 환경 변수가 누락되었거나 `MOCK_LLM=true`인 테스트/개발 환경에서는 원격 호출 없이 사전에 정의된 정적(static) 더미 데이터 플레이리스트를 즉각 반환하는 Mock LLM 모드로 동작합니다. 실서버 연동 시에는 10초 AbortController 타임아웃을 강제하며, JSON 파싱 실패 시 1회 즉각 수정 재요청을 보냅니다. 최종 실패 시에는 최근 재생 곡을 추천 곡으로 고스란히 이식하는 기본 폴백 플레이리스트를 반환하여 서비스 복원력을 갖췄습니다.

## 생성 및 변경된 파일 목록

- **도메인 엔티티 및 유틸**:
  - `src/domain/curation.ts`: `CuratedTrack`, `CuratedPlaylist` 타입 정의 및 최근 재생 곡 목록 기반의 폴백 가공 로직 `createFallbackPlaylist` 구현
- **비즈니스 서비스**:
  - `src/server/services/llm-client.ts`: Gemini API 포맷 요청 연동, API Key 미소유 시 Mock Bypass 처리, AbortController 기반 10초 타임아웃, 1회 파싱 실패 재시도, 최종 폴백 반환 연동 구현
  - `src/server/services/llm-client.test.ts`: 모킹 분기 검증, 타임아웃 발생 검증, 1회 파싱 오류 시 재요청 성공 검증, 최종 실패 시 폴백 복구 검증 단위 테스트 작성
- **API Route Handler**:
  - `app/api/curate/route.ts`: HttpOnly 세션 쿠키 검증, userPrompt JSON 바디 파싱, Spotify 최근 재생 곡 수집 연동 및 LlmClient 호출을 통한 최종 큐레이션 JSON 반환 처리
  - `app/api/curate/route.test.ts`: 세션 미소유 시 401 반환 검증, 세션 소유 시 정상 큐레이션 수행 검증, Spotify API 에러 발생 시 빈 배열로 복원력 유지 검증 테스트 작성

## 제외 범위 및 사유

- **유저 분위기 연동 동적 모킹**: 복잡한 동적 모킹 로직은 개발 비용을 증가시키고 테스트의 일관성을 해치므로, 프롬프트 키워드에 따라 1~2종의 고정 정적(static) 더미 플레이리스트 데이터를 즉시 리턴하는 정적 Mock 방식으로 단순화하였습니다.
- **URI 즉각 매핑 처리**: LLM에게 특정 곡 URI의 엄격한 추출을 제약하기보다 음악 지식 기반 텍스트 매핑 추천을 유도하였으며, 실제 Spotify URI 매핑은 후속 단위(U-005)인 Spotify Search API 연동 컴포넌트로 위임하였습니다.

## 품질 검증 요약

| Requirement/Story | 검증 증적 |
| :--- | :--- |
| NFR-001 (LLM API Timeout) | AbortController 기반 10초 초과 시 Abort 중단 및 예외 처리 테스트 통과 |
| NFR-002 (Parsing Fallback) | 1차 JSON 파싱 에러 시 재시도 수행 및 최종 실패 시 Default Fallback 플레이리스트 무결성 반환 검증 완료 |
| NFR-003 (Mock Engine) | API Key 미설정 시 분위기별 2종 정적 더미 플레이리스트 즉시 반환 검증 완료 |
| NFR-004 (Local Testability) | Fetch API/Node-fetch Mocking을 통해 외부 의존 없이 1초 이내 로컬 격리 테스트 100% 통과 |
| S-004 (AI Playlist Recommend) | 자연어 프롬프트와 수집 트랙을 조합하여 큐레이션 결과를 반환하는 라우트 핸들러 비즈니스 흐름 검증 완료 |
