import { buildFallbackReport } from "./fallback";
import {
  MAX_TASK_A_CHARS,
  MAX_TASK_B_CHARS,
  MAX_TASK_C_CHARS,
  type Report,
  type ReportSource,
} from "./report";
import type {
  Scores,
  TaskAMetrics,
  TaskBMetrics,
  TaskCMetrics,
  TypeKey,
} from "./scoring";

/** 서버 응답 대기 상한. Vercel 함수(60초)보다 조금 짧게 잡는다. */
const CLIENT_TIMEOUT_MS = 50_000;

/**
 * POST /api/analyze 로 리포트를 받아온다. 결제(unlock) 시점에만 호출된다.
 * 키가 없거나(503) 호출이 실패하면 폴백 원고로 넘어간다 — 앱은 어떤 경우에도 완주한다.
 */
export async function requestReport(
  scores: Scores,
  type: TypeKey,
  taskA: TaskAMetrics,
  taskB: TaskBMetrics,
  taskC: TaskCMetrics | null,
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
        taskC: taskC
          ? { ...taskC, text: taskC.text.slice(0, MAX_TASK_C_CHARS) }
          : null,
      }),
    });

    if (!res.ok) throw new Error(`analyze ${res.status}`);

    const data = (await res.json()) as { report?: Report };
    if (!isUsable(data.report)) throw new Error("malformed report");

    return { report: data.report, source: "llm" };
  } catch (err) {
    console.warn("[report] falling back:", err);
    return {
      report: buildFallbackReport(scores, taskA, taskC),
      source: "fallback",
    };
  }
}

function isUsable(r: Report | undefined): r is Report {
  return (
    !!r &&
    Array.isArray(r.sections) &&
    r.sections.length === 5 &&
    r.sections.every((s) => !!s?.body) &&
    !!r.writingAnalysis?.body &&
    !!r.sixMonths?.body
  );
}
