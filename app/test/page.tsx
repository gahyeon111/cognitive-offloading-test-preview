"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Gauge from "@/components/Gauge";
import SurveyStep from "@/components/SurveyStep";
import Transition from "@/components/Transition";
import TaskA from "@/components/TaskA";
import TaskB from "@/components/TaskB";
import Fork from "@/components/Fork";
import TaskC, { type TaskCSubmit } from "@/components/TaskC";
import Computing from "@/components/Computing";
import { TRANSITION_1, TRANSITION_2 } from "@/content/copy";
import { PAGE_COUNT, PAGE_SIZE, QUESTIONS, isStraightline } from "@/lib/questions";
import type { TypingMetrics } from "@/lib/metrics";
import { saveResult } from "@/lib/storage";
import {
  axisSum,
  computeGaps,
  computeScores,
  decideType,
  measureTaskA,
  measureTaskB,
  measureTaskC,
  selfScore,
  type TaskAMetrics,
  type TaskBMetrics,
  type TaskCMetrics,
} from "@/lib/scoring";

/** 문항 24 + 과제 A + 과제 B + 갈림길 + 과제 C */
const TOTAL_UNITS = QUESTIONS.length + 4;

const STEP = {
  TRANSITION_1: PAGE_COUNT,
  TASK_A: PAGE_COUNT + 1,
  TASK_B: PAGE_COUNT + 2,
  TRANSITION_2: PAGE_COUNT + 3,
  FORK: PAGE_COUNT + 4,
  TASK_C: PAGE_COUNT + 5,
  COMPUTING: PAGE_COUNT + 6,
} as const;

const STEP_LABEL: Record<number, string> = {
  [STEP.TRANSITION_1]: "전환",
  [STEP.TASK_A]: "과제 A",
  [STEP.TASK_B]: "과제 B",
  [STEP.TRANSITION_2]: "전환",
  [STEP.FORK]: "갈림길",
  [STEP.TASK_C]: "과제 C",
  [STEP.COMPUTING]: "계산",
};

export default function TestPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [choseHelp, setChoseHelp] = useState(false);

  const taskARef = useRef<TaskAMetrics | null>(null);
  const taskBRef = useRef<TaskBMetrics | null>(null);
  const taskCRef = useRef<TaskCMetrics | null>(null);
  const startedRef = useRef(false);

  const answeredCount = Object.keys(answers).length;
  const doneUnits =
    answeredCount +
    (step > STEP.TASK_A ? 1 : 0) +
    (step > STEP.TASK_B ? 1 : 0) +
    (step > STEP.FORK ? 1 : 0) +
    (step > STEP.TASK_C ? 1 : 0);
  const progress = (doneUnits / TOTAL_UNITS) * 100;

  const pageComplete =
    step < PAGE_COUNT &&
    QUESTIONS.slice(step * PAGE_SIZE, (step + 1) * PAGE_SIZE).every(
      (q) => answers[q.id] !== undefined,
    );

  const advance = useCallback((to: number) => {
    setStep(to);
    window.scrollTo(0, 0);
  }, []);

  const handleAnswer = useCallback((id: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleTaskA = useCallback(
    (text: string, typing: TypingMetrics) => {
      taskARef.current = measureTaskA(text, typing);
      advance(STEP.TASK_B);
    },
    [advance],
  );

  const handleTaskB = useCallback(
    (text: string) => {
      taskBRef.current = measureTaskB(text);
      advance(STEP.TRANSITION_2);
    },
    [advance],
  );

  const handleTaskC = useCallback(
    (r: TaskCSubmit) => {
      taskCRef.current = measureTaskC({ ...r, choseHelp });
      advance(STEP.COMPUTING);
    },
    [advance, choseHelp],
  );

  /** 설문만으로 낸 중간 위탁도 — 전환 1에서 공개해 이탈을 막는다 */
  const provisionalOff = selfScore(axisSum(answers, "OFF"), 6);

  // 계산 화면 — 여기서는 LLM을 부르지 않는다.
  // 리포트는 결제(unlock) 시점에 /result 가 생성한다.
  useEffect(() => {
    if (step !== STEP.COMPUTING || startedRef.current) return;
    startedRef.current = true;

    const taskA = taskARef.current ?? measureTaskA("");
    const taskB = taskBRef.current ?? measureTaskB("");
    const taskC = taskCRef.current;
    const scores = computeScores(answers, taskA, taskB, taskC);

    saveResult({
      v: 4,
      createdAt: Date.now(),
      answers,
      scores,
      taskA,
      taskB,
      taskC,
      choseHelp,
      gaps: computeGaps(answers, taskA, taskB, taskC),
      type: decideType(scores),
      straightline: isStraightline(answers),
      estimated: !taskC || !taskA.charCount,
    });

    const id = window.setTimeout(() => router.replace("/result"), 2200);
    return () => window.clearTimeout(id);
  }, [step, answers, choseHelp, router]);

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-40 bg-ground">
        <div className="mx-auto w-full max-w-[440px] px-5 pt-5 pb-3">
          <div className="mb-2.5 flex items-baseline justify-between text-[13px]">
            <span className="text-muted">
              {step < PAGE_COUNT ? (
                <button
                  type="button"
                  onClick={() =>
                    step === 0 ? router.push("/") : advance(step - 1)
                  }
                  className="text-muted"
                >
                  ← 이전
                </button>
              ) : (
                STEP_LABEL[step]
              )}
            </span>
            <span className="tabular text-muted">
              {Math.min(doneUnits, TOTAL_UNITS)} / {TOTAL_UNITS}
            </span>
          </div>
          <Gauge value={progress} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5">
        {step < PAGE_COUNT && (
          <SurveyStep page={step} answers={answers} onAnswer={handleAnswer} />
        )}

        {step === STEP.TRANSITION_1 && (
          <Transition
            label="전환"
            title={TRANSITION_1.title}
            body={TRANSITION_1.body}
            gauge={{ label: TRANSITION_1.gaugeLabel, value: provisionalOff }}
            onNext={() => advance(STEP.TASK_A)}
          />
        )}

        {step === STEP.TASK_A && <TaskA onSubmit={handleTaskA} />}
        {step === STEP.TASK_B && <TaskB onSubmit={handleTaskB} />}

        {step === STEP.TRANSITION_2 && (
          <Transition
            label="전환"
            title={TRANSITION_2.title}
            body={TRANSITION_2.body}
            onNext={() => advance(STEP.FORK)}
          />
        )}

        {step === STEP.FORK && (
          <Fork
            onChoose={(help) => {
              setChoseHelp(help);
              advance(STEP.TASK_C);
            }}
          />
        )}

        {step === STEP.TASK_C && (
          <TaskC choseHelp={choseHelp} onSubmit={handleTaskC} />
        )}

        {step === STEP.COMPUTING && <Computing />}

        {step < PAGE_COUNT && (
          <div className="sticky bottom-0 mt-auto -mx-5 bg-ground px-5 pt-4 pb-5">
            <button
              type="button"
              disabled={!pageComplete}
              onClick={() => advance(step + 1)}
              className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white disabled:bg-ceded disabled:text-white"
            >
              {pageComplete
                ? step === PAGE_COUNT - 1
                  ? "과제로 이동"
                  : "다음"
                : `${PAGE_SIZE}문항에 모두 답해 주세요`}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
