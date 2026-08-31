"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "@/components/Toast";

const LIMIT = 180;
const UNLOCK_AT = 60;
const MIN_CHARS = 40;

export default function TaskA({
  onSubmit,
}: {
  onSubmit: (text: string) => void;
}) {
  const [left, setLeft] = useState(LIMIT);
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

  const elapsed = LIMIT - left;
  const charCount = text.trim().length;
  const enoughChars = charCount >= MIN_CHARS;
  const unlocked = elapsed >= UNLOCK_AT;
  const canSubmit = unlocked && enoughChars;

  const hint = !unlocked
    ? `${UNLOCK_AT - elapsed}초 뒤에 제출할 수 있습니다`
    : !enoughChars
      ? `${MIN_CHARS}자 이상 입력하면 측정할 수 있습니다`
      : "시간이 남아도 지금 제출할 수 있습니다";

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

      <p className="mt-6 text-[17px] leading-[1.7]">
        지난주에 당신이 내린 결정 하나를 고르세요.
        <br />왜 그렇게 결정했는지, 아무 도구 없이 설명해 주세요.
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
        placeholder="여기에 직접 입력하세요."
        className="mt-5 min-h-[240px] w-full flex-1 resize-none border border-line bg-surface p-4 outline-none placeholder:text-muted focus:border-mine"
      />

      <div className="mt-2 flex justify-between pb-4 text-[13px]">
        <span className="text-muted">{hint}</span>
        <span className="tabular text-muted">{charCount}자</span>
      </div>

      <p className="pb-4 text-[13px] leading-[1.7] text-muted">
        작성한 글은 분석을 위해서만 전송되며 저장하지 않습니다.
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
