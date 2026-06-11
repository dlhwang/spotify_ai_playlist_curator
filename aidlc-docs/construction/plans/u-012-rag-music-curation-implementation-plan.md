# AI-DLC Task Plan: Search-Query RAG Curation Implementation

<!-- markdownlint-disable MD013 -->

## 1. Requirement Summary

스포티파이 Recommendations 및 Audio Features API의 지원 중단(Deprecated)에 대응하여, 실존하는 음원을 검색하는 **절차형 Search-Query RAG** 기반 음악 추천 아키텍처 및 시스템을 구현합니다.

* **3축 SPEC 분해**: 사용자의 자연어 프롬프트를 장르/감성 SPEC, 장소/청취 맥락 SPEC, 아티스트/곡 SPEC으로 구조화합니다.
* **내부 멀티턴 검색 계획 및 후보군 조회**: SPEC별 검색 라운드(Round A/B/C)를 생성하고 Spotify Search API (`GET /v1/search`)를 병렬 호출하여 넓은 1차 후보군을 획득합니다.
* **후보 평가 및 아티스트 깊이 확장**: LLM이 후보군의 SPEC 적합도와 부족한 영역을 평가하고, 최종 후보에 포함될 가능성이 높은 아티스트마다 최소 3곡 확보를 목표로 Round D 추가 검색을 수행합니다.
* **중복 제거 및 컨텍스트 구성**: 여러 검색 라운드의 결과로 수집된 트랙 목록을 병합하고, 고유 ID/URI 기준으로 중복을 제거하여 최종 LLM 컨텍스트 데이터로 정렬합니다.
* **긴 플레이리스트 최종 큐레이션 및 선별**: 최종 LLM에 원래 프롬프트, 3축 SPEC, 확장 후보 트랙 리스트를 전달하여, 2~3시간 길이도 허용하는 최종 플레이리스트를 구성하고 상세한 음악적 큐레이션 사유를 획득합니다.
* **API 실패 대응 폴백 처리**: Spotify Search API 호출 실패 또는 검색 결과 전무 시, 사용자의 최근 재생 곡 목록을 플레이리스트로 그대로 반환하는 폴백 정책을 적용하여 서비스의 안정성을 확보합니다.

## 2. Task Type

기능 추가 및 서비스 레이어 고도화 (Feature Implementation & Service Refactoring)

## 3. Selected AI-DLC Execution Mode

Standard Track

## 4. Reason for Selected Mode

기존 아키텍처 구조 내부에서 서비스 레이어(`SpotifyService`, `LlmClient`)의 역할을 확장하고, API 엔드포인트 핸들러(`/api/curate`)의 데이터 오케스트레이션 로직을 재구성하며, 각각에 대한 단위 테스트 및 통합 테스트를 보강하므로 `Standard Track`에 적합합니다. 단, 2026-06-11 인셉션 보강으로 큐레이션 도메인 규칙과 LLM 단계가 확장되었으므로 구현 전 본 계획의 세부 메서드와 테스트 항목을 우선 반영합니다.

## 5. Required Context Files

* [rag-curation-requirements.md](file:///d:/workspace/spotify_aI_playlist_curator/aidlc-docs/inception/requirements/rag-curation-requirements.md)
* [rag-architecture.md](file:///d:/workspace/spotify_aI_playlist_curator/aidlc-docs/inception/application-design/rag-architecture.md)
* [spotify-service.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.ts)
* [llm-client.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.ts)
* [route.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/route.ts)

## 6. Expected Files to Change

* **[MODIFY]** [spotify-service.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.ts): 다중 검색 쿼리를 병렬 호출하고 결과를 중복 제거하여 병합하는 메서드(`searchTracksByQueryRounds`)와 아티스트 깊이 확장 메서드(`expandArtistDepthCandidates`) 구현 및 Mock 처리 추가
* **[MODIFY]** [llm-client.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.ts): SPEC 분해(`extractCurationSpecs`), 검색 계획 생성(`createSearchPlan`), 후보 평가(`evaluateCandidateCoverage`), 최종 큐레이션(`curateWithExpandedCandidates`) 구현 및 Mock 처리 추가, 기존 `curate` 인터페이스 호환 지원
* **[MODIFY]** [route.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/route.ts): 절차형 RAG 큐레이션 흐름 오케스트레이션 적용 및 부분 실패/전체 실패 폴백 연동
* **[MODIFY]** [spotify-service.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.test.ts): 라운드별 검색, 중복 제거, 아티스트별 최소 3곡 확장, 검색 결과 부족 허용, Mock 처리 테스트 추가
* **[MODIFY]** [llm-client.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.test.ts): SPEC 분해, 검색 계획 생성, 후보 평가, 긴 플레이리스트 최종 선별, 아티스트 부족 사유 생성 테스트 추가
* **[MODIFY]** [route.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/route.test.ts): `/api/curate`의 절차형 RAG 흐름 연동 통합 테스트, 부분 라운드 실패 지속 처리, 전체 폴백 시나리오 검증 추가

## 7. Files or Directories That Must Not Change

* `aidlc-rules/`
* `AGENTS.md`

## 8. Validation Commands

* `powershell -ExecutionPolicy Bypass -Command "npx vitest run"` (단위 및 통합 테스트 실행)
* `powershell -ExecutionPolicy Bypass -Command "npm run typecheck"` (TypeScript 빌드 타입 정합성 검증)

## 9. Risks or Assumptions

* **검색 결과 중복 및 제한**: 여러 검색 라운드에서 중복된 곡이 많이 발생할 수 있으므로, 고유 ID 및 URI를 기반으로 엄격하게 중복을 제거하여 최종 LLM에 전달되는 후보의 정합성을 지켜야 합니다.
* **아티스트별 최소 3곡 정책의 예외**: 특정 아티스트의 Spotify Search 결과가 3곡 미만이거나 부적합할 수 있으므로, 최소 3곡은 hard fail 조건이 아니라 목표 조건으로 다루고 부족 사유를 결과 설명에 남겨야 합니다.
* **긴 플레이리스트 비용과 지연 시간**: 2~3시간 플레이리스트는 후보 수와 LLM 토큰 사용량을 크게 늘릴 수 있으므로, 검색 라운드 수, 쿼리별 limit, 후보군 상한, 최종 트랙 수 상한을 설정값으로 제어해야 합니다.
* **실패 폴백 보장**: 다단계 API 연동(SPEC LLM -> Search API 병렬 -> 후보 평가 LLM -> 아티스트 확장 Search -> 최종 LLM) 중 예외나 에러 발생 시, 성공한 후보군만으로 계속 진행하거나 최종적으로 사용자의 최근 재생 트랙 목록 기반 폴백(`createFallbackPlaylist`)을 반환하는 복원력이 유지되어야 합니다.
