import type {
  Scores,
  TaskAMetrics,
  TaskBMetrics,
  TaskCMetrics,
  TypeKey,
} from "./scoring";

export type ReportSection = { title: string; body: string };
export type RoutineItem = { week: string; title: string; body: string };

/**
 * 유료 구간 리포트. 결제(unlock) 시점에만 생성한다.
 * 결정적 한 줄은 여기 없다 — 무료 구간 소유이고 lib/headline.ts가 만든다.
 */
export type Report = {
  /** 축별 해석 5편. OFF / CAL / GEN / ACC / ANX 순서 */
  sections: ReportSection[];
  /** 과제 A 원문을 실제로 읽고 쓴 분석 */
  writingAnalysis: ReportSection;
  /** 같은 유형이 6개월 뒤 겪는 변화 */
  sixMonths: ReportSection;
  /** 4주 회복 루틴 */
  routine: RoutineItem[];
};

/** 리포트가 LLM에서 왔는지 목업 폴백인지 */
export type ReportSource = "llm" | "fallback";

/** POST /api/analyze 요청 본문 */
export type AnalyzeRequest = {
  scores: Scores;
  type: TypeKey;
  taskA: TaskAMetrics;
  taskB: TaskBMetrics;
  taskC: TaskCMetrics | null;
};

/** 서버로 보내기 전/후 잘라내는 상한 (지갑 방어) */
export const MAX_TASK_A_CHARS = 2000;
export const MAX_TASK_B_CHARS = 500;
export const MAX_TASK_C_CHARS = 1500;
