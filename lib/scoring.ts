import { QUESTIONS, type Axis, type SurveyAxis } from "./questions";
import {
  avgSentenceLength,
  causalDensity,
  clamp,
  mattr,
  ngramOverlap,
  norm,
  tokenize,
  trapScore,
  type TypingMetrics,
} from "./metrics";
import { REFERENCE, SOURCE_B, type TaskCItemKey } from "@/content/tasks";

export type Scores = {
  OFF: number;
  CAL: number;
  GEN: number;
  ACC: number;
  ANX: number;
};

export type TaskAMetrics = {
  text: string;
  charCount: number;
  causalDensity: number;
  mattr: number;
  avgSentLen: number;
  typing?: TypingMetrics;
};

export type TaskBMetrics = {
  text: string;
  overlap: number;
  trapScore: number;
};

export type TaskCMetrics = {
  item: TaskCItemKey;
  ratingPre: number;
  ratingPost: number;
  choseHelp: boolean;
  text: string;
  /** 참조답변 표현 채택률. '도움 받기'를 고른 경우만 의미가 있다 */
  adoption: number;
};

export { clamp };

/* ── 측정 ──────────────────────────────────────────────── */

export function measureTaskA(text: string, typing?: TypingMetrics): TaskAMetrics {
  return {
    text,
    charCount: text.trim().length,
    causalDensity: causalDensity(text),
    mattr: mattr(tokenize(text)),
    avgSentLen: avgSentenceLength(text),
    typing,
  };
}

export function measureTaskB(text: string): TaskBMetrics {
  return {
    text,
    overlap: ngramOverlap(SOURCE_B, text, 2),
    trapScore: trapScore(text),
  };
}

export function measureTaskC(input: {
  item: TaskCItemKey;
  ratingPre: number;
  ratingPost: number;
  choseHelp: boolean;
  text: string;
}): TaskCMetrics {
  return {
    ...input,
    adoption: input.choseHelp
      ? ngramOverlap(REFERENCE[input.item], input.text, 3)
      : 0,
  };
}

/* ── 채점 ──────────────────────────────────────────────── */

/** n문항 합(n~5n) → 0~100 */
export const selfScore = (sum: number, n: number) => ((sum - n) / (4 * n)) * 100;

/** 역채점을 적용한 축 합계 */
export function axisSum(answers: Record<number, number>, axis: SurveyAxis) {
  return QUESTIONS.filter((q) => q.axis === axis).reduce((acc, q) => {
    const raw = answers[q.id] ?? 3;
    return acc + (q.reverse ? 6 - raw : raw);
  }, 0);
}

/** 역채점 전 원값 평균. CAL 상대신뢰차에만 쓴다 */
function trustMean(
  answers: Record<number, number>,
  target: "ai" | "self",
): number {
  const items = QUESTIONS.filter((q) => q.trustTarget === target);
  if (!items.length) return 3;
  return items.reduce((a, q) => a + (answers[q.id] ?? 3), 0) / items.length;
}

/** 과제 A 실측 → 0~100 */
export function genTaskScore(a: TaskAMetrics): number {
  return (
    100 *
    (0.45 * norm(a.causalDensity, 0, 4) +
      0.35 * norm(a.mattr, 0.55, 0.9) +
      0.2 * norm(a.avgSentLen, 15, 45))
  );
}

/** 상대신뢰차 — Lee et al. 2025의 이중 신뢰를 조작화 */
export function calSelfScore(answers: Record<number, number>): number {
  const trustAI = trustMean(answers, "ai");
  const trustSelf = trustMean(answers, "self");
  return clamp(((trustSelf - trustAI + 4) / 8) * 100, 0, 100);
}

const overlapScore = (overlap: number) => clamp((overlap / 0.5) * 100, 0, 100);

export function computeScores(
  answers: Record<number, number>,
  taskA: TaskAMetrics,
  taskB: TaskBMetrics,
  taskC: TaskCMetrics | null,
): Scores {
  const OFF =
    0.6 * selfScore(axisSum(answers, "OFF"), 6) +
    0.25 * (taskC?.choseHelp ? 100 : 0) +
    0.15 * overlapScore(taskB.overlap);

  const CAL = 0.5 * calSelfScore(answers) + 0.5 * (taskB.trapScore * 100);

  const GEN = 0.5 * selfScore(axisSum(answers, "GEN"), 6) + 0.5 * genTaskScore(taskA);

  // 과제 C를 건너뛰면 중립값. 결과에 '실측 미포함' 배지를 단다.
  const ACC = taskC
    ? 100 - norm(taskC.ratingPre - taskC.ratingPost, 0, 4) * 100
    : 50;

  const ANX = selfScore(axisSum(answers, "ANX"), 6);

  return { OFF, CAL, GEN, ACC, ANX };
}

/* ── 말한 나 vs 잰 나 ──────────────────────────────────── */

export type AxisGap = { axis: Axis; self: number; measured: number };

/**
 * 괴리 차트(모듈 1)의 데이터.
 * 자기보고와 실측이 모두 있는 세 축만 그린다 — ACC는 실측뿐이고 ANX는 자기보고뿐이다.
 */
export function computeGaps(
  answers: Record<number, number>,
  taskA: TaskAMetrics,
  taskB: TaskBMetrics,
  taskC: TaskCMetrics | null,
): AxisGap[] {
  const offMeasured =
    (0.25 * (taskC?.choseHelp ? 100 : 0) + 0.15 * overlapScore(taskB.overlap)) /
    0.4;

  return [
    { axis: "OFF", self: selfScore(axisSum(answers, "OFF"), 6), measured: offMeasured },
    { axis: "CAL", self: calSelfScore(answers), measured: taskB.trapScore * 100 },
    { axis: "GEN", self: selfScore(axisSum(answers, "GEN"), 6), measured: genTaskScore(taskA) },
  ];
}

/* ── 8유형 ─────────────────────────────────────────────── */

export type TypeKey =
  | "captain"
  | "firstOfficer"
  | "glider"
  | "passenger"
  | "mechanic"
  | "controller"
  | "climber"
  | "drifter";

/** 축 중앙값. 실규준 확보 후 실제 중앙값으로 바꾼다 */
export const CUT = 55;

export const TYPES: Record<TypeKey, { code: string; name: string; line: string }> = {
  captain: { code: "HHH", name: "기장", line: "다 맡기지만 계기판에서 눈을 떼지 않는다" },
  firstOfficer: { code: "HHL", name: "부조종사", line: "확인은 철저한데, 처음 방향을 자기가 정하지 않는다" },
  glider: { code: "HLH", name: "활공사", line: "엔진을 끄고도 잘 난다. 계기는 안 본다" },
  passenger: { code: "HLL", name: "승객", line: "목적지는 정했다. 경로는 보지 않는다" },
  mechanic: { code: "LHH", name: "정비사", line: "안 믿어서 직접 뜯는다. 대신 느리다" },
  controller: { code: "LHL", name: "관제사", line: "남의 항로는 정확히 본다. 자기 비행은 없다" },
  climber: { code: "LLH", name: "등반가", line: "맨손으로 오른다. 옆으로 케이블카가 지나간다" },
  drifter: { code: "LLL", name: "표류자", line: "아직 어느 쪽도 고르지 않았다" },
};

const BY_CODE: Record<string, TypeKey> = Object.fromEntries(
  (Object.keys(TYPES) as TypeKey[]).map((k) => [TYPES[k].code, k]),
);

/** OFF × CAL × GEN 세 축만 쓴다. ACC와 ANX는 유형 내 개인차 지표다 */
export function decideType(scores: Scores): TypeKey {
  const code =
    (scores.OFF >= CUT ? "H" : "L") +
    (scores.CAL >= CUT ? "H" : "L") +
    (scores.GEN >= CUT ? "H" : "L");
  return BY_CODE[code];
}

export const typeCode = (type: TypeKey) => TYPES[type].code;
