/** 랜딩·전환·결과 고정 카피 */

export const LANDING = {
  steps: [
    ["1단계", "자기보고 설문 24문항"],
    ["2단계", "AI 없이 글쓰기 · 180초"],
    ["3단계", "지문 읽고 요약 · 135초"],
    ["4단계", "설명해 보기 · 100초"],
  ],
  meta: "설문 24문항 · 실측 과제 3종 · 수집 데이터 포인트 137개 · 약 9분",
} as const;

export const TRANSITION_1 = {
  title: "여기까지가 당신이 스스로 말한 당신입니다.",
  gaugeLabel: "현재 추정 위탁도",
  body: "이제부터는 묻지 않습니다. 잽니다.\n3분 걸립니다. 도구는 쓸 수 없습니다.",
} as const;

export const TRANSITION_2 = {
  title: "마지막입니다. 100초.",
  body: "이번에는 아는 것을 묻지 않습니다.\n안다고 믿는 것과 실제로 아는 것의 거리를 봅니다.",
} as const;

/** 숨긴 것을 스스로 밝히면 함정이 방법론이 된다. */
export const METHODOLOGY = {
  title: "이 검사는 어떻게 쟀는가",
  body: "과제 B의 지문에는 사실 오류가 하나 들어 있었습니다. 전자계산기 보급 시기입니다. 실제로는 1970년대 초입니다. 검증 습관을 자기보고로만 재면 정확하지 않기 때문에 심어둔 것입니다.\n\n과제 C는 Rozenblit & Keil(2002)과 Fisher et al.(2015)의 절차를 축약한 것입니다. 설명 깊이의 착각이라고 부릅니다. 점수를 내린 것은 우리가 아니라 당신입니다.",
} as const;

export const PAYWALL = {
  locked: [
    "말한 나와 잰 나의 괴리 분석",
    "축별 상세 해석 5편",
    "당신이 쓴 글의 실제 분석",
    "당신이 무너지는 상황 3가지",
    "4주 회복 루틴",
    "PDF 리포트 (10~14페이지)",
  ],
  cta: "전체 리포트 보기 · 3,900원",
  refund: "리포트 열람 전 100% 환불. 열람 후에는 불가합니다.",
} as const;

export const DISCLAIMER =
  "이 검사는 의학적 진단이 아니며 자기 점검을 위한 도구입니다.";

/** 결과 페이지 방법론 섹션에 그대로 노출한다 */
export const REFERENCES = [
  "Risko & Gilbert (2016). Cognitive offloading. Trends in Cognitive Sciences 20(9).",
  "Gerlich (2025). AI tools and critical thinking. Societies 15(1):6.",
  "Lee et al. (2025). AI trust and critical thinking. CHI '25.",
  "Fisher, Goddu & Keil (2015). Searching for explanations. JEP: General 144(3).",
  "Rozenblit & Keil (2002). The illusion of explanatory depth. Cognitive Science 26(5).",
  "Kosmyna et al. (2025). Your brain on ChatGPT. arXiv:2506.08872.",
  "Lee & See (2004). Trust in automation. Human Factors 46(1).",
];
