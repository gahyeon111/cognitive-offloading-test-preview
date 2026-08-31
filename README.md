# 인지 위탁 검사 (Cognitive Offloading Test) — v2

자기보고 24문항 + 실측 과제 3종으로 "AI 없이 무엇이 남아 있는지"를 재는 단일 페이지 웹앱.

차별점: 자기보고만 하는 검사는 그릴 수 없는 그래프를 그린다 — 말한 나와 잰 나의 괴리.

## 실행

```bash
npm install
cp .env.example .env.local   # OPENAI_API_KEY 채우기
npm run dev                  # http://localhost:3000
npm run build
```

키가 없어도 앱은 끝까지 돌아간다 — 리포트가 목업 텍스트로 폴백된다.

## 환경변수

| 이름 | 필수 | 기본값 | 설명 |
|---|---|---|---|
| `OPENAI_API_KEY` | ○ | — | 서버에서만 읽는다. `NEXT_PUBLIC_` 금지 |
| `OPENAI_MODEL` | | `gpt-5-nano` | 문장 품질이 아쉬우면 `gpt-5-mini` 등으로. 코드 수정 불필요 |

## 배포

```bash
vercel --prod
```

Vercel 대시보드 → Settings → Environment Variables 에 위 두 개를 등록한다.
DB 없음, 로그인 없음. `/api/analyze` 만 서버리스 함수로 뜬다.

## 구조

| 경로 | 역할 |
|---|---|
| `app/page.tsx` | 랜딩 |
| `app/test/page.tsx` | 스텝 머신 (설문 → 전환1 → 과제A → 과제B → 전환2 → 갈림길 → 과제C → 계산) |
| `app/result/page.tsx` | 결과. `localStorage` 없으면 `/`로 |
| `app/api/analyze/route.ts` | OpenAI 호출. **결제(unlock) 후에만** |
| `content/tasks.ts` | 과제 지문, 함정 지문, 고정 참조답변 4종 |
| `content/copy.ts` | 랜딩·전환·방법론·페이월 고정 카피 |
| `lib/questions.ts` | 24문항 · 4축 매핑 · 역채점 · CAL 신뢰 대상 |
| `lib/metrics.ts` | MATTR, 인과밀도, 평균 문장길이, n-gram 겹침, 함정 탐지 |
| `lib/scoring.ts` | 5축 채점 · 8유형 판정 · 괴리 계산 |
| `lib/norms.ts` | 백분위 (μ=52, σ=18). 표본 300 이상이면 실규준으로 전환 |
| `lib/headline.ts` | 결정적 한 줄. **LLM 미사용** |
| `lib/analyze.ts` | 응답 스키마 · 프롬프트 · 입력 검증 · 응답 매핑 |
| `lib/fallback.ts` | LLM 실패 시 폴백 원고 |
| `lib/shareCard.ts` | 결과 이미지를 캔버스에 직접 그린다 |
| `components/viz/GapChart.tsx` | 괴리 차트 ★ 시그니처. 손으로 쓴 SVG |
| `components/viz/IoedDrop.tsx` | IOED 낙하 |

## 5축

| 코드 | 이름 | 구성 |
|---|---|---|
| OFF | 인지 위탁도 | 자기보고 60% + 갈림길 선택 25% + 요약 겹침 15% |
| CAL | 신뢰 보정도 | 상대신뢰차 50% + 함정 탐지 50% |
| GEN | 자생 생성력 | 자기보고 50% + 과제A 실측 50% |
| ACC | 자기지식 정확도 | IOED 하락폭 100% |
| ANX | 의존 불안 | 자기보고 100% |

유형 판정은 OFF × CAL × GEN 세 축만 쓴다 (8유형). ACC와 ANX는 유형 내 개인차 지표다.

## 비용 정책

**무료 사용자 1인당 LLM 비용은 0원이다.** 무료 구간(유형·5축 게이지·결정적 한 줄·IOED
카드·방법론)은 전부 결정론적 코드가 만든다. `/api/analyze`는 결제(unlock) 시점에 정확히
한 번만 호출되고, 결과는 localStorage에 캐시돼 재진입 시 재호출하지 않는다.

과제 C의 참조답변에도 LLM을 붙이지 않는다. 비용 때문이 아니라 측정 때문이다 —
사용자마다 다른 답변을 주면 표현 겹침률을 비교할 기준이 사라진다.

## LLM

`POST /api/analyze` 가 유료 구간 리포트를 만든다. 결정적 한 줄은 여기 없다 — `lib/headline.ts` 소유다. 응답은 `lib/report.ts`의 `Report` 타입.

- OpenAI **Responses API** + `text.format` 의 `json_schema` (strict) 로 shape을 강제한다.
- 축 5개와 주차 4개는 배열이 아니라 고정 키 객체(`OFF/CAL/GEN/ACC/ANX`, `week1..4`)로 받는다.
  strict 모드가 개수를 보장해 주므로 "4개가 왔는지" 검사할 필요가 없다. 배열 변환은 `toReport()`.
- 채점·백분위·유형 판정은 `lib/scoring.ts`의 결정론적 코드다. LLM은 숫자를 받아 문장만 쓴다.
- 사용자가 쓴 글은 구분선으로 감싸 데이터로만 취급하도록 지시한다.

### 폴백

키 없음(503), 호출 실패(502), 타임아웃, shape 불일치 — 어느 경우든 `lib/fallback.ts`의
원고로 넘어간다. 결과 화면 상단에 `분석`(LLM) / `원고`(폴백) 로 출처가 표시된다.

### 첫 실제 호출에서 확인할 것

이 저장소는 실제 OpenAI 호출 없이 스텁으로만 검증했다. 첫 호출에서 400이 나면
`app/api/analyze/route.ts`의 `client.responses.create` 블록만 보면 된다:
모델 문자열 → `reasoning.effort` 지원 여부 → `text.format` 형태 순으로 확인.

## 결제

PoC라 결제는 목업 모달이다. 모달 하단의 `개발용으로 열어보기`를 누르면
유료 구간(축별 해석 4편 + 4주 루틴)이 그대로 열린다. 배포본에도 남겨 두었다.
