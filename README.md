# 인지 위탁 검사 (Cognitive Offloading Test) — PoC

자기보고 20문항 + 실측 과제 2개로 "AI 없이 무엇이 남아 있는지"를 재는 단일 페이지 웹앱.

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## 배포

```bash
vercel --prod
```

환경변수 없음. 서버 없음. DB 없음.

## 구조

| 경로 | 역할 |
|---|---|
| `app/page.tsx` | 랜딩. 후킹 카피 + 잔존 게이지 |
| `app/test/page.tsx` | 스텝 머신 (설문 4페이지 → 과제 A → 과제 B → 계산) |
| `app/result/page.tsx` | `localStorage` 읽어서 결과 렌더. 값 없으면 `/`로 리다이렉트 |
| `lib/questions.ts` | 설문 20문항 (축: OFF / VER / GEN / ANX) |
| `lib/scoring.ts` | 과제 측정, 채점식, 백분위, 유형 판정 |
| `lib/mockLlm.ts` | 리포트 목업. 실제 API 교체 지점 |
| `lib/storage.ts` | `cot_result_v1` 저장/로드 |
| `components/Gauge.tsx` | 잔존 게이지 (랜딩·진행바·결과에서 반복) |

## LLM 연동 지점

`lib/mockLlm.ts`의 `generateReport(scores, taskA, taskB)` 하나만 교체하면 된다.

```ts
// TODO(real): POST /api/analyze — { scores, taskA, taskB }
//   → { headline, sections[], routine[] }
```

응답을 동일한 shape(`Report`)으로 돌려주면 UI 수정 없이 붙는다.
현재는 축별 점수 구간(높음/보통/낮음)에 따라 12개 문단 중 4개를 골라 반환한다.

## 결제

PoC라 결제는 목업 모달이다. 모달 하단의 `개발용으로 열어보기`를 누르면
유료 구간(축별 해석 4편 + 4주 루틴)이 그대로 열린다. 배포본에도 남겨 두었다.
