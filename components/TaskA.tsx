"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "@/components/Toast";
import { TASK_A } from "@/content/tasks";
import type { TypingMetrics } from "@/lib/metrics";

const LIMIT: number = TASK_A.seconds;
const MIN_CHARS: number = TASK_A.minChars;
/** 3초 이상 멈추면 정지 1회로 센다 */
const PAUSE_MS = 3000;

export default function TaskA({
  onSubmit,
}: {
  onSubmit: (text: string, typing: TypingMetrics) => void;
}) {
  const [left, setLeft] = useState(LIMIT);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const submitted = useRef(false);
  const textRef = useRef("");
  textRef.current = text;

  // 착수 지연 · 정지 횟수 · 삭제율
  const mountedAt = useRef(Date.now());
  const firstKeyAt = useRef<number | null>(null);
  const lastKeyAt = useRef<number | null>(null);
  const pauseCount = useRef(0);
  const typedChars = useRef(0);
  const deletedChars = useRef(0);

  const finish = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(textRef.current, {
      startDelayMs: firstKeyAt.current
        ? firstKeyAt.current - mountedAt.current
        : LIMIT * 1000,
      pauseCount: pauseCount.current,
      deleteRatio: typedChars.current
        ? deletedChars.current / typedChars.current
        : 0,
    });
  }, [onSubmit]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [finish]);

  const charCount = text.trim().length;
  const canSubmit = charCount >= MIN_CHARS;

  const hint = canSubmit
    ? "시간이 남아도 지금 제출할 수 있습니다"
    : `${MIN_CHARS}자 이상 입력하면 측정할 수 있습니다`;

  function handleChange(next: string) {
    const now = Date.now();
    if (firstKeyAt.current === null) firstKeyAt.current = now;
    else if (lastKeyAt.current && now - lastKeyAt.current >= PAUSE_MS) {
      pauseCount.current += 1;
    }
    lastKeyAt.current = now;

    const delta = next.length - text.length;
    if (delta > 0) typedChars.current += delta;
    else deletedChars.current += -delta;

    setText(next);
  }

  return (
    <div className="flex flex-1 flex-col pt-6">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-[13px] text-muted">과제 A · AI 없이 글쓰기</span>
        <span
          className="tabular text-[22px] leading-none tracking-tight"
          aria-live="off"
        >
          {String(Math.floor(left / 60)).padStart(2, "0")}:
          {String(left % 60).padStart(2, "0")}
        </span>
      </div>

      <p className="mt-6 whitespace-pre-line text-[17px] leading-[1.7]">
        {TASK_A.prompt}
      </p>
      <p className="mt-3 text-[13px] leading-[1.7] text-ceded">
        {TASK_A.example}
      </p>

      <textarea
        autoFocus
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          setToast("직접 입력만 반영됩니다");
        }}
        onDrop={(e) => {
          e.preventDefault();
          setToast("직접 입력만 반영됩니다");
        }}
        placeholder="여기에 직접 입력하세요."
        className="mt-5 min-h-[240px] w-full flex-1 resize-none border border-line bg-surface p-4 outline-none placeholder:text-muted focus:border-mine"
      />

      <div className="mt-2 flex justify-between pb-4 text-[13px]">
        <span className="text-muted">{hint}</span>
        <span className="tabular text-muted">{charCount}자</span>
      </div>

      <p className="pb-4 text-[13px] leading-[1.7] text-muted">
        {TASK_A.notice}
      </p>

      <div className="sticky bottom-0 -mx-5 bg-ground px-5 pb-5">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={finish}
          className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white disabled:bg-ceded disabled:text-white"
        >
          다 썼어요
        </button>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
