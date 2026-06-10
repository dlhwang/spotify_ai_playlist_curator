# AI-DLC Task Plan: Search-Query RAG Curation Implementation

<!-- markdownlint-disable MD013 -->

## 1. Requirement Summary

스포티파이 Recommendations 및 Audio Features API의 지원 중단(Deprecated)에 대응하여, 실존하는 음원을 검색하는 **Search-Query RAG** 기반 음악 추천 아키텍처 및 시스템을 구현합니다.

* **1차 검색 쿼리 추출 및 추천 후보군 조회**: 사용자의 자연어 프롬프트를 분석하여 1차 LLM을 통해 스포티파이 검색어(장르 필터, 대표 아티스트 등) 최대 3~5개를 추출하고, 이를 기반으로 Spotify Search API (`GET /v1/search`)를 다중 병렬 호출하여 30~50곡의 1차 추천 후보군을 획득합니다.
* **중복 제거 및 컨텍스트 구성**: 여러 검색어의 결과로 수집된 트랙 목록을 병합하고, 고유 ID 기준으로 중복을 제거하여 2차 최종 LLM 컨텍스트 데이터로 정렬합니다.
* **분위기 가중 RAG 최종 큐레이션 및 선별**: 2차 최종 LLM에 원래 프롬프트와 1차 후보 트랙 리스트를 전달하여, LLM 자체의 음악적 감성 지식을 바탕으로 프롬프트 무드에 가장 조화로운 10~15곡을 최종 엄선하고 상세한 음악적 큐레이션 사유를 담은 플레이리스트 정보를 획득합니다.
* **API 실패 대응 폴백 처리**: Spotify Search API 호출 실패 또는 검색 결과 전무 시, 사용자의 최근 재생 곡 목록을 플레이리스트로 그대로 반환하는 폴백 정책을 적용하여 서비스의 안정성을 확보합니다.

## 2. Task Type

기능 추가 및 서비스 레이어 고도화 (Feature Implementation & Service Refactoring)

## 3. Selected AI-DLC Execution Mode

Standard Track

## 4. Reason for Selected Mode

기존 아키텍처 구조 내부에서 서비스 레이어(`SpotifyService`, `LlmClient`)의 역할을 확장하고, API 엔드포인트 핸들러(`/api/curate`)의 데이터 오케스트레이션 로직을 재구성하며, 각각에 대한 단위 테스트 및 통합 테스트를 보강하므로 `Standard Track`에 적합합니다.

## 5. Required Context Files

* [rag-curation-requirements.md](file:///d:/workspace/spotify_aI_playlist_curator/aidlc-docs/inception/requirements/rag-curation-requirements.md)
* [rag-architecture.md](file:///d:/workspace/spotify_aI_playlist_curator/aidlc-docs/inception/application-design/rag-architecture.md)
* [spotify-service.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.ts)
* [llm-client.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.ts)
* [route.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/route.ts)

## 6. Expected Files to Change

* **[MODIFY]** [spotify-service.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.ts): 다중 검색 쿼리를 병렬 호출하고 결과를 중복 제거하여 병합하는 메서드 구현 (`searchTracksMultipleQueries`) 및 Mock 처리 추가
* **[MODIFY]** [llm-client.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.ts): 1차 검색어 추출(`extractQueries`), 2차 감성 필터링 큐레이션(`curateWithTracks`) 구현 및 Mock 처리 추가, 기존 `curate` 인터페이스 호환 지원
* **[MODIFY]** [route.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/route.ts): RAG 큐레이션 흐름 오케스트레이션 적용 및 폴백 연동
* **[MODIFY]** [spotify-service.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.test.ts): 신규 다중 검색 메서드의 단위 테스트 및 모킹 테스트 추가
* **[MODIFY]** [llm-client.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.test.ts): 2단계 RAG 파이프라인의 단위 테스트 및 예외/모킹 테스트 추가
* **[MODIFY]** [route.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/route.test.ts): `/api/curate`의 RAG 흐름 연동 통합 테스트 및 폴백 시나리오 검증 추가

## 7. Files or Directories That Must Not Change

* `aidlc-rules/`
* `AGENTS.md`

## 8. Validation Commands

* `powershell -ExecutionPolicy Bypass -Command "npx vitest run"` (단위 및 통합 테스트 실행)
* `powershell -ExecutionPolicy Bypass -Command "npm run typecheck"` (TypeScript 빌드 타입 정합성 검증)

## 9. Risks or Assumptions

* **검색 결과 중복 및 제한**: 여러 개의 검색어 쿼리를 날렸을 때 중복된 곡이 많이 발생할 수 있으므로, 고유 ID 및 URI를 기반으로 엄격하게 중복을 제거하여 2차 LLM에 전달되는 후보의 정합성을 지켜야 합니다.
* **실패 폴백 보장**: 다단계 API 연동(LLM1 -> Search API 병렬 -> LLM2) 중 예외나 에러 발생 시, 즉시 사용자의 최근 재생 트랙 목록을 기반으로 안전하게 큐레이션 결과로 변환 반환(`createFallbackPlaylist`)하는 복원력이 유지되어야 합니다.
