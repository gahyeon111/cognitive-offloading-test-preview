"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Gauge from "@/components/Gauge";
import SurveyStep from "@/components/SurveyStep";
import TaskA from "@/components/TaskA";
import TaskB from "@/components/TaskB";
import Computing from "@/components/Computing";
import { PAGE_COUNT, PAGE_SIZE, QUESTIONS } from "@/lib/questions";
import { saveResult } from "@/lib/storage";
import {
  computeScores,
  decideType,
  measureTaskA,
  measureTaskB,
  type TaskAMetrics,
} from "@/lib/scoring";

const TOTAL_UNITS = QUESTIONS.length + 2;
const STEP_TASK_A = PAGE_COUNT;
const STEP_TASK_B = PAGE_COUNT + 1;
const STEP_COMPUTING = PAGE_COUNT + 2;

const STEP_LABEL = ["설문", "설문", "설문", "설문", "과제 A", "과제 B", "계산"];

export default function TestPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const taskARef = useRef<TaskAMetrics | null>(null);
  const startedRef = useRef(false);

  const answeredCount = Object.keys(answers).length;
  const doneUnits =
    answeredCount +
    (step >= STEP_TASK_B ? 1 : 0) +
    (step >= STEP_COMPUTING ? 1 : 0);
  const progress = (doneUnits / TOTAL_UNITS) * 100;

  const pageComplete =
    step < PAGE_COUNT &&
    QUESTIONS.slice(step * PAGE_SIZE, (step + 1) * PAGE_SIZE).every(
      (q) => answers[q.id] !== undefined,
    );

  const handleAnswer = useCallback((id: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleTaskA = useCallback((text: string) => {
    taskARef.current = measureTaskA(text);
    setStep(STEP_TASK_B);
    window.scrollTo(0, 0);
  }, []);

  const taskBTextRef = useRef("");
  const handleTaskB = useCallback((text: string) => {
    taskBTextRef.current = text;
    setStep(STEP_COMPUTING);
    window.scrollTo(0, 0);
  }, []);

  // 계산 화면 — 여기서는 LLM을 부르지 않는다.
  // 리포트는 결제(unlock) 시점에 /result 가 생성한다 (§0 비용 누수 차단).
  // 점수 계산은 즉시 끝나므로 2.2초는 연출로만 소진한다.
  useEffect(() => {
    if (step !== STEP_COMPUTING || startedRef.current) return;
    startedRef.current = true;

    const taskA = taskARef.current ?? measureTaskA("");
    const taskB = measureTaskB(taskBTextRef.current);
    const scores = computeScores(answers, taskA, taskB);

    saveResult({
      v: 3,
      createdAt: Date.now(),
      answers,
      scores,
      taskA,
      taskB,
      type: decideType(scores),
    });

    const id = window.setTimeout(() => router.replace("/result"), 2200);
    return () => window.clearTimeout(id);
  }, [step, answers, router]);

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-40 bg-ground">
        <div className="mx-auto w-full max-w-[440px] px-5 pt-5 pb-3">
          <div className="mb-2.5 flex items-baseline justify-between text-[13px]">
            <span className="text-muted">
              {step < PAGE_COUNT ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 0) {
                      router.push("/");
                    } else {
                      setStep(step - 1);
                      window.scrollTo(0, 0);
                    }
                  }}
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
        {step === STEP_TASK_A && <TaskA onSubmit={handleTaskA} />}
        {step === STEP_TASK_B && <TaskB onSubmit={handleTaskB} />}
        {step === STEP_COMPUTING && <Computing />}

        {step < PAGE_COUNT && (
          <div className="sticky bottom-0 mt-auto -mx-5 bg-ground px-5 pt-4 pb-5">
            <button
              type="button"
              disabled={!pageComplete}
              onClick={() => {
                setStep(step + 1);
                window.scrollTo(0, 0);
              }}
              className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white disabled:bg-ceded disabled:text-white"
            >
              {pageComplete
                ? step === PAGE_COUNT - 1
                  ? "과제로 이동"
                  : "다음"
                : "5문항에 모두 답해 주세요"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
