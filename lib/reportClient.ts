import { buildFallbackReport } from "./mockLlm";
import {
  MAX_TASK_A_CHARS,
  MAX_TASK_B_CHARS,
  type Report,
  type ReportSource,
} from "./report";
import type { Scores, TaskAMetrics, TaskBMetrics, TypeKey } from "./scoring";

/** 서버 응답을 기다리는 상한. Vercel 함수(60초)보다 조금 짧게 잡는다. */
const CLIENT_TIMEOUT_MS = 50_000;

/**
 * POST /api/analyze 로 리포트를 받아온다.
 * 키가 없거나(503) 호출이 실패하면 목업 리포트로 폴백한다 — 앱은 어떤 경우에도 완주한다.
 */
export async function requestReport(
  scores: Scores,
  type: TypeKey,
  taskA: TaskAMetrics,
  taskB: TaskBMetrics,
): Promise<{ report: Report; source: ReportSource }> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
      body: JSON.stringify({
        scores,
        type,
        taskA: { ...taskA, text: taskA.text.slice(0, MAX_TASK_A_CHARS) },
        taskB: { ...taskB, text: taskB.text.slice(0, MAX_TASK_B_CHARS) },
      }),
    });

    if (!res.ok) throw new Error(`analyze ${res.status}`);

    const data = (await res.json()) as { report?: Report };
    if (!isUsable(data.report)) throw new Error("malformed report");

    return { report: data.report, source: "llm" };
  } catch (err) {
    console.warn("[report] falling back to mock:", err);
    return {
      report: buildFallbackReport(scores, taskA, taskB),
      source: "fallback",
    };
  }
}

function isUsable(r: Report | undefined): r is Report {
  return (
    !!r &&
    typeof r.headline === "string" &&
    Array.isArray(r.sections) &&
    r.sections.length === 4 &&
    Array.isArray(r.routine) &&
    r.routine.length === 4 &&
    !!r.writingAnalysis?.body &&
    !!r.sixMonths?.body
  );
}
