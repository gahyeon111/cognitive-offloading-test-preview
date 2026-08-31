"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "@/components/Toast";
import {
  REFERENCE,
  TASK_C,
  TASK_C_ITEMS,
  type TaskCItemKey,
} from "@/content/tasks";

type Phase = "rate" | "explain" | "rerate";

export type TaskCSubmit = {
  item: TaskCItemKey;
  ratingPre: number;
  ratingPost: number;
  text: string;
};

const SCALE = Array.from(
  { length: TASK_C.scaleMax - TASK_C.scaleMin + 1 },
  (_, i) => TASK_C.scaleMin + i,
);

/**
 * 과제 C — 설명 깊이의 착각 (Rozenblit & Keil 2002).
 * 자가평정 → 설명 → 재평정. 사이에 달라진 것은 설명해 봤다는 사실뿐이다.
 */
export default function TaskC({
  choseHelp,
  onSubmit,
}: {
  choseHelp: boolean;
  onSubmit: (r: TaskCSubmit) => void;
}) {
  const [phase, setPhase] = useState<Phase>("rate");
  const [left, setLeft] = useState<number>(TASK_C.rateSeconds);
  const [pre, setPre] = useState<Record<TaskCItemKey, number>>(
    {} as Record<TaskCItemKey, number>,
  );
  const [text, setText] = useState("");
  const [post, setPost] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const itemRef = useRef<TaskCItemKey>("microwave");
  const preRef = useRef(4);
  const textRef = useRef("");
  const submitted = useRef(false);
  textRef.current = text;

  const finish = useCallback(
    (ratingPost: number) => {
      if (submitted.current) return;
      submitted.current = true;
      onSubmit({
        item: itemRef.current,
        ratingPre: preRef.current,
        ratingPost,
        text: textRef.current,
      });
    },
    [onSubmit],
  );

  // 가장 높게 평정한 항목을 자동 선택한다
  const pickTopItem = useCallback(() => {
    let best = TASK_C_ITEMS[0].key;
    let bestV = -1;
    for (const it of TASK_C_ITEMS) {
      const v = pre[it.key] ?? 0;
      if (v > bestV) {
        bestV = v;
        best = it.key;
      }
    }
    itemRef.current = best;
    preRef.current = bestV > 0 ? bestV : 4;
  }, [pre]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((p) => (p > 1 ? p - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (left !== 0) return;
    if (phase === "rate") {
      pickTopItem();
      setPhase("explain");
      setLeft(TASK_C.explainSeconds);
    } else if (phase === "explain") {
      setPhase("rerate");
      setLeft(TASK_C.rerateSeconds);
    } else {
      finish(post ?? preRef.current);
    }
  }, [left, phase, post, finish, pickTopItem]);

  const timer = (
    <span className="tabular text-[22px] leading-none tracking-tight">
      00:{String(left).padStart(2, "0")}
    </span>
  );

  const label =
    TASK_C_ITEMS.find((i) => i.key === itemRef.current)?.label ?? "";

  /* ── 1단계 · 자가평정 ── */
  if (phase === "rate") {
    const allRated = TASK_C_ITEMS.every((i) => pre[i.key] !== undefined);
    return (
      <div className="flex flex-1 flex-col pt-6">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <span className="text-[13px] text-muted">과제 C · 자가평정</span>
          {timer}
        </div>

        <p className="mt-6 text-[17px] leading-[1.7]">
          다음을 남에게 처음부터 설명할 수 있다면 몇 점입니까?
        </p>
        <p className="mt-2 text-[13px] text-muted">
          1점 전혀 못 함 · 7점 막힘없이 설명 가능
        </p>

        <div className="mt-5 space-y-3">
          {TASK_C_ITEMS.map((it) => (
            <fieldset key={it.key} className="border border-line bg-surface p-4">
              <legend className="sr-only">{it.question}</legend>
              <p className="text-[15px] leading-[1.6]">{it.question}</p>
              <div className="mt-3 flex border border-line">
                {SCALE.map((v) => {
                  const selected = pre[it.key] === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPre((p) => ({ ...p, [it.key]: v }))}
                      className={[
                        "tabular h-11 flex-1 border-line text-[15px]",
                        v > TASK_C.scaleMin ? "border-l" : "",
                        selected
                          ? "bg-mine font-semibold text-white"
                          : "bg-surface text-muted",
                      ].join(" ")}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="sticky bottom-0 mt-auto -mx-5 bg-ground px-5 pt-4 pb-5">
          <button
            type="button"
            disabled={!allRated}
            onClick={() => {
              pickTopItem();
              setPhase("explain");
              setLeft(TASK_C.explainSeconds);
            }}
            className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white disabled:bg-ceded disabled:text-white"
          >
            {allRated ? "다음" : "네 항목에 모두 답해 주세요"}
          </button>
        </div>
      </div>
    );
  }

  /* ── 2단계 · 설명 ── */
  if (phase === "explain") {
    const charCount = text.trim().length;
    const canSubmit = charCount >= TASK_C.minChars;
    return (
      <div className="flex flex-1 flex-col pt-6">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <span className="text-[13px] text-muted">과제 C · 설명</span>
          {timer}
        </div>

        <p className="mt-6 text-[17px] leading-[1.7]">
          방금 {preRef.current}점을 준 ‘{label}’을 설명해 주세요.
          <br />
          아는 만큼만 쓰면 됩니다.
        </p>

        {choseHelp && (
          <details
            open
            className="mt-4 border border-line bg-surface p-4 text-[15px] leading-[1.8]"
          >
            <summary className="cursor-pointer text-[13px] text-muted">
              참고 자료
            </summary>
            <p className="mt-3">{REFERENCE[itemRef.current]}</p>
          </details>
        )}

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            setToast("직접 입력만 반영됩니다");
          }}
          placeholder="아는 만큼 직접 설명해 보세요."
          className="mt-5 min-h-[160px] w-full flex-1 resize-none border border-line bg-surface p-4 outline-none placeholder:text-muted focus:border-mine"
        />

        <div className="mt-2 flex justify-between pb-4 text-[13px]">
          <span className="text-muted">
            {canSubmit
              ? "시간이 남아도 지금 넘어갈 수 있습니다"
              : `${TASK_C.minChars}자 이상 입력하면 넘어갈 수 있습니다`}
          </span>
          <span className="tabular text-muted">{charCount}자</span>
        </div>

        <div className="sticky bottom-0 -mx-5 bg-ground px-5 pb-5">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              setPhase("rerate");
              setLeft(TASK_C.rerateSeconds);
            }}
            className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white disabled:bg-ceded disabled:text-white"
          >
            다 썼어요
          </button>
        </div>

        <Toast message={toast} onDone={() => setToast(null)} />
      </div>
    );
  }

  /* ── 3단계 · 재평정 ── */
  return (
    <div className="flex flex-1 flex-col pt-6">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-[13px] text-muted">과제 C · 재평정</span>
        {timer}
      </div>

      <p className="mt-6 text-[17px] leading-[1.7]">
        방금 설명해 보고 나서, 지금 다시 매긴다면 몇 점입니까?
      </p>
      <p className="mt-2 text-[13px] text-muted">‘{label}’</p>

      <div className="mt-5 flex border border-line">
        {SCALE.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={post === v}
            onClick={() => setPost(v)}
            className={[
              "tabular h-12 flex-1 border-line text-[15px]",
              v > TASK_C.scaleMin ? "border-l" : "",
              post === v
                ? "bg-mine font-semibold text-white"
                : "bg-surface text-muted",
            ].join(" ")}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="sticky bottom-0 mt-auto -mx-5 bg-ground px-5 pt-4 pb-5">
        <button
          type="button"
          disabled={post === null}
          onClick={() => finish(post ?? preRef.current)}
          className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white disabled:bg-ceded disabled:text-white"
        >
          {post === null ? "점수를 골라 주세요" : "제출하기"}
        </button>
      </div>
    </div>
  );
}
