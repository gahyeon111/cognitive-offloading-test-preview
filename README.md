# 인지 위탁 검사 (Cognitive Offloading Test) — PoC

자기보고 20문항 + 실측 과제 2개로 "AI 없이 무엇이 남아 있는지"를 재는 단일 페이지 웹앱.

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
| `app/page.tsx` | 랜딩. 후킹 카피 + 잔존 게이지 |
| `app/test/page.tsx` | 스텝 머신 (설문 4페이지 → 과제 A → 과제 B → 계산) |
| `app/result/page.tsx` | `localStorage` 읽어서 결과 렌더. 값 없으면 `/`로 리다이렉트 |
| `lib/questions.ts` | 설문 20문항 (축: OFF / VER / GEN / ANX) |
| `lib/scoring.ts` | 과제 측정, 채점식, 백분위, 유형 판정 |
| `app/api/analyze/route.ts` | OpenAI 호출. 실패하면 클라이언트가 목업으로 폴백 |
| `lib/analyze.ts` | 응답 JSON Schema, 프롬프트, 입력 검증, 응답 매핑 |
| `lib/reportClient.ts` | `/api/analyze` 호출 + 폴백 |
| `lib/mockLlm.ts` | 폴백용 목업 리포트 |
| `lib/storage.ts` | `cot_result_v1` 저장/로드 |
| `components/Gauge.tsx` | 잔존 게이지 (랜딩·진행바·결과에서 반복) |

## LLM

`POST /api/analyze` 가 리포트 전체를 한 번에 만든다. 응답은 `lib/report.ts`의 `Report` 타입.

- OpenAI **Responses API** + `text.format` 의 `json_schema` (strict) 로 shape을 강제한다.
- 축 4개와 주차 4개는 배열이 아니라 고정 키 객체(`OFF/VER/GEN/ANX`, `week1..4`)로 받는다.
  strict 모드가 개수를 보장해 주므로 "4개가 왔는지" 검사할 필요가 없다. 배열 변환은 `toReport()`.
- 채점·백분위·유형 판정은 `lib/scoring.ts`의 결정론적 코드다. LLM은 숫자를 받아 문장만 쓴다.
- 사용자가 쓴 글은 구분선으로 감싸 데이터로만 취급하도록 지시한다.

### 폴백

키 없음(503), 호출 실패(502), 타임아웃, shape 불일치 — 어느 경우든 `lib/mockLlm.ts`의
목업 리포트로 넘어간다. 결과 화면 상단에 `분석`(LLM) / `템플릿`(폴백) 로 출처가 표시된다.

### 첫 실제 호출에서 확인할 것

이 저장소는 실제 OpenAI 호출 없이 스텁으로만 검증했다. 첫 호출에서 400이 나면
`app/api/analyze/route.ts`의 `client.responses.create` 블록만 보면 된다:
모델 문자열 → `reasoning.effort` 지원 여부 → `text.format` 형태 순으로 확인.

## 결제

PoC라 결제는 목업 모달이다. 모달 하단의 `개발용으로 열어보기`를 누르면
유료 구간(축별 해석 4편 + 4주 루틴)이 그대로 열린다. 배포본에도 남겨 두었다.
