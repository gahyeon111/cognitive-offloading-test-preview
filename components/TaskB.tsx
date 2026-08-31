"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "@/components/Toast";
import { SOURCE_TEXT } from "@/lib/scoring";

const READ_LIMIT = 40;
const WRITE_LIMIT = 90;
const MIN_CHARS = 20;

export default function TaskB({
  onSubmit,
}: {
  onSubmit: (text: string) => void;
}) {
  const [phase, setPhase] = useState<"read" | "write">("read");
  const [left, setLeft] = useState(READ_LIMIT);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const submitted = useRef(false);
  const textRef = useRef("");

  textRef.current = text;

  const finish = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(textRef.current);
  }, [onSubmit]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((prev) => {
        if (prev > 1) return prev - 1;
        window.clearInterval(id);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (left !== 0) return;
    if (phase === "read") {
      setPhase("write");
      setLeft(WRITE_LIMIT);
    } else {
      finish();
    }
  }, [left, phase, finish]);

  const charCount = text.trim().length;
  const canSubmit = charCount >= MIN_CHARS;

  if (phase === "read") {
    return (
      <div className="flex flex-1 flex-col pt-6">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <span className="text-[13px] text-muted">과제 B · 읽기</span>
          <span className="tabular text-[22px] leading-none tracking-tight">
            00:{String(left).padStart(2, "0")}
          </span>
        </div>

        <p className="mt-6 text-[13px] text-muted">
          아래 글을 읽으십시오. 다음 화면에서는 다시 볼 수 없습니다.
        </p>

        <article className="mt-4 border border-line bg-surface p-5 text-[17px] leading-[1.8]">
          {SOURCE_TEXT}
        </article>

        <div className="flex-1" />

        <div className="sticky bottom-0 -mx-5 bg-ground px-5 pb-5 pt-4">
          <button
            type="button"
            onClick={() => {
              setPhase("write");
              setLeft(WRITE_LIMIT);
            }}
            className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white"
          >
            다 읽었어요
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pt-6">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-[13px] text-muted">과제 B · 요약</span>
        <span className="tabular text-[22px] leading-none tracking-tight">
          {String(Math.floor(left / 60)).padStart(2, "0")}:
          {String(left % 60).padStart(2, "0")}
        </span>
      </div>

      <p className="mt-6 text-[17px] leading-[1.7]">
        방금 읽은 내용을 <b className="font-semibold">두 문장으로</b>, 원문 표현을
        쓰지 말고 요약하세요.
      </p>

      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          setToast("직접 입력만 반영됩니다");
        }}
        onDrop={(e) => {
          e.preventDefault();
          setToast("직접 입력만 반영됩니다");
        }}
        placeholder="두 문장으로 요약하세요."
        className="mt-5 min-h-[180px] w-full flex-1 resize-none border border-line bg-surface p-4 outline-none placeholder:text-muted focus:border-mine"
      />

      <div className="mt-2 flex justify-between pb-4 text-[13px]">
        <span className="text-muted">
          {canSubmit
            ? "시간이 남아도 지금 제출할 수 있습니다"
            : `${MIN_CHARS}자 이상 입력하면 측정할 수 있습니다`}
        </span>
        <span className="tabular text-muted">{charCount}자</span>
      </div>

      <div className="sticky bottom-0 -mx-5 bg-ground px-5 pb-5">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={finish}
          className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white disabled:bg-ceded disabled:text-white"
        >
          제출하기
        </button>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
