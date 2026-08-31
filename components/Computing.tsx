"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "응답을 정렬하는 중",
  "작성한 글을 계량하는 중",
  "규준과 대조하는 중",
];

export default function Computing() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setI((p) => Math.min(MESSAGES.length - 1, p + 1)),
      733,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-1 flex-col justify-center py-20">
      <div className="border border-line bg-surface p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-[13px] text-muted">계측</span>
          <span className="tabular text-[13px] text-muted">
            {i + 1} / {MESSAGES.length}
          </span>
        </div>

        <div className="h-[10px] w-full bg-ceded">
          <div
            className="h-full bg-mine"
            style={{
              width: `${((i + 1) / MESSAGES.length) * 100}%`,
              transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>

        <p className="mt-4 text-[17px]" aria-live="polite">
          {MESSAGES[i]}
        </p>
      </div>

      <p className="mt-5 text-[13px] leading-[1.7] text-muted">
        잠시만 기다려 주십시오. 이 화면을 벗어나면 측정값이 사라집니다.
      </p>
    </div>
  );
}
