"use client";

import Gauge from "@/components/Gauge";

export default function Transition({
  label,
  title,
  body,
  gauge,
  onNext,
}: {
  label: string;
  title: string;
  body: string;
  /** 전환 1에서만. 중간 점수 공개가 이탈률을 가장 크게 줄인다 */
  gauge?: { label: string; value: number };
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col pt-6">
      <span className="text-[13px] text-muted">{label}</span>

      <p className="mt-6 text-[17px] leading-[1.7]">{title}</p>

      {gauge && (
        <div className="mt-8 border border-line bg-surface p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[13px] text-muted">{gauge.label}</span>
            <span className="tabular text-[22px] leading-none">
              {Math.round(gauge.value)}
            </span>
          </div>
          <Gauge value={gauge.value} />
        </div>
      )}

      <p className="mt-8 whitespace-pre-line text-[15px] leading-[1.7] text-muted">
        {body}
      </p>

      <div className="flex-1" />

      <div className="sticky bottom-0 -mx-5 bg-ground px-5 pt-4 pb-5">
        <button
          type="button"
          onClick={onNext}
          className="h-[52px] w-full bg-mine text-[15px] font-semibold text-white"
        >
          시작
        </button>
      </div>
    </div>
  );
}
