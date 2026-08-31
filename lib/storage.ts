import type { Report } from "./mockLlm";
import type {
  Scores,
  TaskAMetrics,
  TaskBMetrics,
  TypeKey,
} from "./scoring";

export const STORAGE_KEY = "cot_result_v1";

export type StoredResult = {
  v: 1;
  createdAt: number;
  answers: Record<number, number>;
  scores: Scores;
  taskA: TaskAMetrics;
  taskB: TaskBMetrics;
  type: TypeKey;
  report: Report;
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
    if (!parsed || parsed.v !== 1 || !parsed.scores || !parsed.report) {
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
