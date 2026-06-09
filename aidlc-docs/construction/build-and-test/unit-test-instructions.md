# 단위 테스트 실행 안내서 (Unit Test Execution Instructions)

<!-- markdownlint-disable MD013 -->

본 문서는 애플리케이션의 격리 단위 테스트 실행 및 결과 확인 방법을 안내합니다.

## 단위 테스트 실행

### 1. 전체 단위 테스트 기동

로컬 또는 CI 환경에서 전체 테스트 스위트를 기동합니다.

```bash
npm test
```

### 2. 결과 검토 및 성공 판단

- **정상 판단 기준**: 전체 8개 테스트 파일의 **41개 테스트가 모두 성공(Passed)** 통과하고 실패(Failed)가 0건이어야 합니다.
- **최근 검증 증빙 (Evidence)**:
  - `src/lib/crypto/session-signature.test.ts` (5개 테스트 통과)
  - `src/lib/env/server-env.test.ts` (3개 테스트 통과)
  - `src/server/services/auth-service.test.ts` (6개 테스트 통과)
  - `src/server/services/spotify-service.test.ts` (12개 테스트 통과)
  - `src/server/services/llm-client.test.ts` (8개 테스트 통과)
  - `src/features/auth/login-button.test.tsx` (2개 테스트 통과)
  - `src/features/home/home-page.test.tsx` (2개 테스트 통과)
  - `app/api/curate/route.test.ts` (3개 테스트 통과)

### 3. 실패 테스트 교정 (Troubleshooting)

만약 특정 단위 테스트에서 에러가 포착된다면:

1. 콘솔에 출력된 스택트레이스 및 실패 원인(`Expected ... Received ...`)을 파악합니다.
2. 외부 네트워크 연결 여부와 상관없이 격리된 Vitest Mock(fetch spy 등)이 깨졌는지 분석합니다.
3. 코드 로직 또는 스텁 데이터 설정에 누락이 없는지 수정 후 `npm test`를 단독 또는 워치 모드(`npm run test:watch`)로 재기동하여 점검합니다.
