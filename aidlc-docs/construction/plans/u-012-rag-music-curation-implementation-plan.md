# AI-DLC Task Plan: RAG-based Music Curation Implementation

<!-- markdownlint-disable MD013 -->

## 1. Requirement Summary

AI가 음악 카탈로그 지식 없이 임의의 가짜 곡(환각)을 추천하여 플레이리스트 저장 실패를 야기하던 한계를 극복하기 위해, 실존하는 스포티파이 카탈로그를 조회하여 LLM 컨텍스트에 공급하는 RAG(Retrieval-Augmented Generation) 기반 음악 추천 아키텍처 및 시스템을 구현합니다.

* **1차 추천 시드 추출 및 추천 후보군 조회**: 사용자의 자연어 프롬프트를 분석하여 1차 LLM을 통해 장르/아티스트 리스트(최대 5개)를 추출하고, 이를 기반으로 스포티파이 Recommendations API (`GET /v1/recommendations`)를 호출하여 30~50곡의 1차 추천 후보군을 획득합니다.
* **오디오 피처 활용 및 메타데이터 증강**: 스포티파이 Audio Features API (`GET /v1/audio-features`)를 호출하여 1차 추천 후보군 각 트랙의 `valence`, `energy`, `tempo`, `danceability` 정보를 획득하고 트랙 정보에 병합합니다.
* **분위기 가중 RAG 최종 큐레이션 및 선별**: 2차 최종 LLM에 원래 프롬프트와 오디오 피처 정보가 결합된 추천 후보 트랙 리스트를 전달하여 원래 분위기 매칭 강도(분위기 가중)를 최우선으로 10~15곡을 엄선하고 상세한 큐레이션 사유를 담은 플레이리스트 정보를 획득합니다.
* **API 실패 대응 폴백 처리**: Spotify API 호출(Recommendations, Audio Features) 실패 또는 빈 목록 반환 시, 사용자의 최근 재생 곡 목록을 플레이리스트로 그대로 반환하는 폴백 정책을 적용하여 서비스의 안정성을 확보합니다.

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

* **[MODIFY]** [spotify-service.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.ts): Recommendations API 및 Audio Features API 연동 메서드 구현 (`getRecommendations`, `getAudioFeatures`) 및 Mock 처리 추가
* **[MODIFY]** [llm-client.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.ts): 1차 시드 추출(`extractSeeds`), 2차 오디오 피처 기반 큐레이션(`curateWithFeatures`) 구현 및 Mock 처리 추가, 기존 `curate` 인터페이스 호환 지원
* **[MODIFY]** [route.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/route.ts): RAG 큐레이션 흐름 오케스트레이션 적용 및 폴백 연동
* **[MODIFY]** [spotify-service.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/spotify-service.test.ts): 신규 API 연동 메서드의 단위 테스트 및 모킹 테스트 추가
* **[MODIFY]** [llm-client.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/src/server/services/llm-client.test.ts): 2단계 LLM 파이프라인의 단위 테스트 및 예외/모킹 테스트 추가
* **[MODIFY]** [route.test.ts](file:///d:/workspace/spotify_aI_playlist_curator/app/api/curate/route.test.ts): `/api/curate`의 RAG 흐름 연동 통합 테스트 및 폴백 시나리오 검증 추가

## 7. Files or Directories That Must Not Change

* `aidlc-rules/`
* `AGENTS.md`

## 8. Validation Commands

* `powershell -ExecutionPolicy Bypass -Command "npx vitest run"` (단위 및 통합 테스트 실행)
* `powershell -ExecutionPolicy Bypass -Command "npm run typecheck"` (타입 검사)

## 9. Risks or Assumptions

* **시드 개수 제약**: 스포티파이 Recommendations API는 장르 및 아티스트 시드 개수 합이 5개를 초과하면 400 에러를 반환합니다. 1차 LLM 프롬프트에서 반환 결과를 반드시 합계 5개 이하로 엄격히 제한해야 합니다.
* **오디오 피처 호출 실패 처리**: 일부 트랙에 오디오 피처 데이터가 비어 있을 수 있으므로 방어적 파싱 및 매핑 처리가 필수적입니다.
* **실패 폴백 보장**: 다단계 API 연동(LLM1 -> Recommendations -> Audio Features -> LLM2)의 중간 어느 한 곳이라도 네트워크 오류, 타임아웃(10초 한계) 또는 빈 응답이 발생할 경우 즉시 최근 재생 트랙 목록을 기반으로 안전하게 큐레이션 결과로 변환 반환(`createFallbackPlaylist`)하는 복원력이 유지되어야 합니다.
