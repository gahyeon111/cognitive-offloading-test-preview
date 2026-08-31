import type { Report, ReportSource } from "./report";
import type { Scores, TaskAMetrics, TaskBMetrics, TypeKey } from "./scoring";

export const STORAGE_KEY = "cot_result_v1";
/** 리포트 shape이 바뀌면 올린다. 이전 버전 결과는 무효 처리된다. */
const SCHEMA_VERSION = 2;

export type StoredResult = {
  v: typeof SCHEMA_VERSION;
  createdAt: number;
  answers: Record<number, number>;
  scores: Scores;
  taskA: TaskAMetrics;
  taskB: TaskBMetrics;
  type: TypeKey;
  report: Report;
  source: ReportSource;
};

export function saveResult(result: StoredResult) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    /* 저장 실패해도 흐름은 계속된다 */
  }
}

export function loadResult(): StoredResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredResult;
    if (
      !parsed ||
      parsed.v !== SCHEMA_VERSION ||
      !parsed.scores ||
      !parsed.report?.writingAnalysis
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearResult() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
