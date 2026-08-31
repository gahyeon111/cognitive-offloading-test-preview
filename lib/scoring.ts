import { QUESTIONS, type Axis } from "./questions";

export type Scores = { OFF: number; VER: number; GEN: number; ANX: number };

export type TaskAMetrics = {
  text: string;
  charCount: number;
  uniqueTokenRatio: number;
};

export type TaskBMetrics = {
  text: string;
  overlap: number;
};

export type TypeKey = "pilot" | "passenger" | "mechanic" | "climber";

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** 과제 B 지문. 40초 노출 후 숨긴다. */
export const SOURCE_TEXT =
  "어떤 도구든 처음에는 우리가 하던 일을 대신해 준다. 그러나 그 도구를 오래 쓰다 보면 대신해 주던 일이 애초에 우리가 할 줄 알던 일이었는지 흐려진다. 계산기를 오래 쓴 사람은 암산이 느려지지만 계산 자체를 못 하게 되지는 않는다. 문제는 판단을 대신 맡길 때다. 판단은 반복해서 쓰지 않으면 근거를 세우는 감각부터 사라지고, 사라진 뒤에는 무엇이 사라졌는지조차 알기 어렵다.";

/** 과제 A 측정 */
export function measureTaskA(text: string): TaskAMetrics {
  const charCount = text.trim().length;
  const tokens = text
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  const uniqueTokenRatio = tokens.length
    ? new Set(tokens).size / tokens.length
    : 0;
  return { text, charCount, uniqueTokenRatio };
}

function bigrams(s: string) {
  const c = s.replace(/\s/g, "");
  return new Set(
    Array.from({ length: Math.max(0, c.length - 1) }, (_, i) => c.slice(i, i + 2)),
  );
}

/** 과제 B 측정 — 원문 대비 문자 2-gram 겹침 비율 */
export function measureTaskB(text: string): TaskBMetrics {
  const a = bigrams(SOURCE_TEXT);
  const b = bigrams(text);
  const overlap = b.size
    ? [...b].filter((x) => a.has(x)).length / b.size
    : 0;
  return { text, overlap };
}

/** 축별 자기보고: 5문항 합(5~25) → 0~100 */
export const selfScore = (sum: number) => ((sum - 5) / 20) * 100;

export function axisSum(answers: Record<number, number>, axis: Axis) {
  return QUESTIONS.filter((q) => q.axis === axis).reduce((acc, q) => {
    const raw = answers[q.id] ?? 3;
    return acc + (q.reverse ? 6 - raw : raw);
  }, 0);
}

export function computeScores(
  answers: Record<number, number>,
  taskA: TaskAMetrics,
  taskB: TaskBMetrics,
): Scores {
  const lengthPart = Math.min(50, (taskA.charCount / 400) * 50);
  const diversityPart = clamp(
    ((taskA.uniqueTokenRatio - 0.45) / 0.35) * 50,
    0,
    50,
  );
  const genTask = lengthPart + diversityPart;

  const OFF =
    0.8 * selfScore(axisSum(answers, "OFF")) +
    0.2 * clamp((taskB.overlap / 0.5) * 100, 0, 100);
  const VER = selfScore(axisSum(answers, "VER"));
  const GEN = 0.5 * selfScore(axisSum(answers, "GEN")) + 0.5 * genTask;
  const ANX = selfScore(axisSum(answers, "ANX"));

  return { OFF, VER, GEN, ANX };
}

/** 목업 규준: 평균 55, 표준편차 15의 정규분포 가정 */
export function percentile(x: number) {
  const z = (x - 55) / 15;
  const p =
    0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp((-2 * z * z) / Math.PI)));
  return Math.min(99, Math.max(1, Math.round(p * 100)));
}

/** 상위 N% */
export const topPercent = (x: number) => 100 - percentile(x);
/** 하위 N% */
export const bottomPercent = (x: number) => percentile(x);

export const TYPES: Record<
  TypeKey,
  { name: string; line: string }
> = {
  pilot: { name: "조종사형", line: "많이 맡기지만 계기판에서 눈을 떼지 않는다" },
  passenger: { name: "승객형", line: "목적지는 정했지만 경로는 보지 않는다" },
  mechanic: { name: "정비사형", line: "안 믿어서 직접 뜯어본다. 대신 느리다" },
  climber: {
    name: "등반가형",
    line: "맨손으로 오른다. 남들이 케이블카를 타는 동안",
  },
};

export function decideType(scores: Scores): TypeKey {
  const highOff = scores.OFF >= 55;
  const highVer = scores.VER >= 55;
  if (highOff && highVer) return "pilot";
  if (highOff && !highVer) return "passenger";
  if (!highOff && highVer) return "mechanic";
  return "climber";
}

export type Band = "high" | "mid" | "low";
export const band = (v: number): Band =>
  v >= 66 ? "high" : v >= 40 ? "mid" : "low";
