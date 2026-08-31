import type { Report, ReportSource } from "./report";
import type {
  AxisGap,
  Scores,
  TaskAMetrics,
  TaskBMetrics,
  TaskCMetrics,
  TypeKey,
} from "./scoring";

export const STORAGE_KEY = "cot_result_v1";
/** 저장 shape이 바뀌면 올린다. 이전 버전 결과는 무효 처리된다. */
const SCHEMA_VERSION = 4;

export type StoredResult = {
  v: typeof SCHEMA_VERSION;
  createdAt: number;
  answers: Record<number, number>;
  scores: Scores;
  taskA: TaskAMetrics;
  taskB: TaskBMetrics;
  /** 과제 C를 건너뛰면 null */
  taskC: TaskCMetrics | null;
  choseHelp: boolean;
  gaps: AxisGap[];
  type: TypeKey;
  /** 24문항 중 15개 이상 동일값 */
  straightline: boolean;
  /** 실측이 빠져 추정치로 낸 결과 */
  estimated: boolean;
  /** 결제(unlock) 전에는 없다 */
  report?: Report;
  source?: ReportSource;
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
      !parsed.gaps
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
