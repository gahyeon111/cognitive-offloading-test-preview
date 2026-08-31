"use client";

import { FORK } from "@/content/tasks";

/**
 * 갈림길 — 함정이 아니라 사전 고지된 선택.
 * 고지했는데도 도움을 고르는 사람은 여전히 고른다. 오히려 더 강한 데이터다.
 */
export default function Fork({
  onChoose,
}: {
  onChoose: (choseHelp: boolean) => void;
}) {
  return (
    <div className="flex flex-1 flex-col pt-6">
      <span className="text-[13px] text-muted">갈림길</span>

      <p className="mt-6 text-[17px] leading-[1.7]">{FORK.title}</p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => onChoose(false)}
          className="h-[52px] w-full border border-line bg-surface text-[15px]"
        >
          {FORK.alone}
        </button>
        <button
          type="button"
          onClick={() => onChoose(true)}
          className="h-[52px] w-full border border-line bg-surface text-[15px]"
        >
          {FORK.help}
        </button>
      </div>

      <p className="mt-6 text-[13px] leading-[1.7] whitespace-pre-line text-muted">
        {FORK.note}
      </p>

      <div className="flex-1" />
    </div>
  );
}
