/** 5축. ACC는 문항이 없고 과제 C에서만 나온다. */
export type Axis = "OFF" | "CAL" | "GEN" | "ACC" | "ANX";
/** 자기보고 문항이 있는 축 */
export type SurveyAxis = Exclude<Axis, "ACC">;

export type Question = {
  id: number;
  /** 'q01' ~ 'q24'. DB responses.item 과 같은 값 */
  code: string;
  axis: SurveyAxis;
  text: string;
  reverse?: boolean;
  /** CAL 축만. 상대신뢰차 계산에 쓴다 (역채점 전 원값 사용) */
  trustTarget?: "ai" | "self";
};

export const AXIS_LABEL: Record<Axis, string> = {
  OFF: "인지 위탁도",
  CAL: "신뢰 보정도",
  GEN: "자생 생성력",
  ACC: "자기지식 정확도",
  ANX: "의존 불안",
};

export const AXIS_DEF: Record<Axis, string> = {
  OFF: "사고의 출발점을 도구에 넘기는 정도",
  CAL: "맡긴 것을 되짚는 정확도",
  GEN: "도구 없이 근거를 세워 만드는 힘",
  ACC: "아는 것과 안다고 믿는 것의 거리",
  ANX: "도구 부재 시 무력감",
};

const q = (
  id: number,
  axis: SurveyAxis,
  text: string,
  opts: { reverse?: boolean; trustTarget?: "ai" | "self" } = {},
): Question => ({
  id,
  code: `q${String(id).padStart(2, "0")}`,
  axis,
  text,
  ...opts,
});

export const QUESTIONS: Question[] = [
  // OFF — 인지 위탁도
  q(1, "OFF", "궁금한 게 생기면 검색창보다 AI 채팅창을 먼저 연다."),
  q(2, "OFF", "글을 쓸 때 빈 화면에서 시작하기보다 AI에게 초안을 먼저 시킨다."),
  q(3, "OFF", "막히는 지점이 나오면 붙잡고 있기보다 바로 AI에 붙여넣는다."),
  q(4, "OFF", "원문보다 AI가 만든 요약본을 주로 읽는다."),
  q(5, "OFF", "어떤 내용을 나중에 다시 찾을 수 있다고 생각하면 굳이 기억해 두지 않는다."),
  q(6, "OFF", "답이 잘 안 나올 때 도구를 켜기 전에 한참 더 생각해 보는 편이다.", { reverse: true }),

  // CAL — 신뢰 보정도. q07~q09 AI 신뢰 / q10~q12 자기 신뢰
  q(7, "CAL", "AI가 알려준 내용은 대체로 맞다고 생각한다.", { reverse: true, trustTarget: "ai" }),
  q(8, "CAL", "AI가 자신 있게 말하면 그만큼 더 믿게 된다.", { reverse: true, trustTarget: "ai" }),
  q(9, "CAL", "AI 결과물을 확인 없이 그대로 제출한 적이 있다.", { reverse: true, trustTarget: "ai" }),
  q(10, "CAL", "내 분야에서는 AI보다 내 판단이 낫다고 생각한다.", { trustTarget: "self" }),
  q(11, "CAL", "AI 답변에서 틀린 부분을 발견한 적이 여러 번 있다.", { trustTarget: "self" }),
  q(12, "CAL", "중요한 결과물일수록 AI 사용 비중을 의도적으로 줄인다.", { trustTarget: "self" }),

  // GEN — 자생 생성력
  q(13, "GEN", "AI 없이도 내 문장으로 한 편을 끝까지 쓸 수 있다."),
  q(14, "GEN", "아이디어가 떠오르면 일단 내 머리로 굴려본 뒤에 AI를 켠다."),
  q(15, "GEN", "최근 반년 사이 내가 쓰는 어휘가 단조로워졌다고 느낀다.", { reverse: true }),
  q(16, "GEN", "AI가 준 표현이 내 표현보다 나아 보여서 그대로 쓴 적이 많다.", { reverse: true }),
  q(17, "GEN", "내 글을 보고 누군가 “AI 같다”고 말한 적이 있다.", { reverse: true }),
  q(18, "GEN", "AI와 함께 만든 결과물을 내 것이라고 느끼기 어렵다.", { reverse: true }),

  // ANX — 의존 불안
  q(19, "ANX", "AI가 내일 사라지면 내 작업 속도가 절반 이하로 떨어질 것 같다."),
  q(20, "ANX", "AI를 쓰고 나서 스스로 무능해졌다고 느낀 적이 있다."),
  q(21, "ANX", "AI 없이 결과물을 냈을 때 오히려 불안하다."),
  q(22, "ANX", "AI를 썼다는 사실을 굳이 남에게 말하지 않는다."),
  q(23, "ANX", "이대로 가면 내 사고력이 퇴화할 것 같다는 생각이 든다."),
  q(24, "ANX", "AI를 쓰는 동료를 보면 뒤처진다는 압박을 느낀다."),
];

export const SCALE_LABELS = [
  "전혀 아니다",
  "아니다",
  "보통",
  "그렇다",
  "매우 그렇다",
];

export const PAGE_SIZE = 6;
export const PAGE_COUNT = QUESTIONS.length / PAGE_SIZE;

/** 24문항 중 15개 이상 동일값이면 불성실 응답으로 본다 */
export function isStraightline(answers: Record<number, number>): boolean {
  const counts = new Map<number, number>();
  for (const q of QUESTIONS) {
    const v = answers[q.id];
    if (v === undefined) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.values()].some((c) => c >= 15);
}
