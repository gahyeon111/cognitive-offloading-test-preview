"use client";

import { useEffect, useState } from "react";

type Props = {
  /** 0~100 */
  value: number;
  /** 진입 시 0 → value 로 700ms 1회 애니메이션 */
  animate?: boolean;
  /** 애니메이션 시작 지연(ms) */
  delay?: number;
};

/**
 * 잔존 게이지 — 이 제품의 시그니처.
 * 왼쪽 채워진 부분이 '내 것', 오른쪽 빈 부분이 '위탁된 것'.
 * 높이 10px, radius 0. 랜딩 / 진행바 / 결과 지표에서 동일한 형태로 반복된다.
 */
export default function Gauge({ value, animate = false, delay = 0 }: Props) {
  const target = Math.max(0, Math.min(100, value));
  const [shown, setShown] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate) {
      setShown(target);
      return;
    }
    const id = window.setTimeout(() => setShown(target), delay + 20);
    return () => window.clearTimeout(id);
  }, [animate, target, delay]);

  return (
    <div
      className="h-[10px] w-full bg-ceded"
      role="img"
      aria-label={`잔존 ${Math.round(target)}퍼센트`}
    >
      <div
        className="h-full bg-mine"
        style={{
          width: `${shown}%`,
          transition: animate ? "width 700ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }}
      />
    </div>
  );
}
