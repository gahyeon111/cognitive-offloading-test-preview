import type { Scores, TaskAMetrics, TaskBMetrics, TypeKey } from "./scoring";

export type ReportSection = { title: string; body: string };
export type RoutineItem = { week: string; title: string; body: string };

export type Report = {
  /** 결정적 한 줄 (무료 구간 노출). 줄바꿈 포함 3줄 이내 */
  headline: string;
  /** 축별 해석 4편. OFF / VER / GEN / ANX 순서 */
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
};

/** 서버로 보내기 전/후 잘라내는 상한 (지갑 방어) */
export const MAX_TASK_A_CHARS = 2000;
export const MAX_TASK_B_CHARS = 500;
