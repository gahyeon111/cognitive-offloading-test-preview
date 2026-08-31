import type { Axis } from "./questions";

/**
 * 이론분포. v1의 μ=55 σ=15는 너무 좁아 84점이 상위 2%로 튀었다.
 * 표본 300건 이상이 모이면 DB의 축별 실규준 테이블로 전환한다.
 */
export const THEORETICAL = { mu: 52, sd: 18 };

/** 실규준 전환 임계 표본 수 */
export const REAL_NORM_MIN_N = 300;

export function percentile(
  x: number,
  mu = THEORETICAL.mu,
  sd = THEORETICAL.sd,
): number {
  const z = (x - mu) / sd;
  const p =
    0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp((-2 * z * z) / Math.PI)));
  return Math.min(99, Math.max(1, Math.round(p * 100)));
}

/**
 * 축별 백분위. 지금은 전 축 동일 이론분포를 쓴다.
 * 실규준이 붙으면 axis별 테이블 조회로 바뀐다 — 호출부는 그대로 둔다.
 */
export function axisPercentile(axis: Axis, x: number): number {
  void axis;
  return percentile(x);
}

/** 상위 N% */
export const topPercent = (x: number) => 100 - percentile(x);
/** 하위 N% */
export const bottomPercent = (x: number) => percentile(x);

/** 값에 맞는 표기를 고른다. 높은 점수에 '하위 90%'가 붙는 걸 막는다. */
export function rankLabel(x: number): string {
  const p = percentile(x);
  return p >= 50 ? `상위 ${100 - p}%` : `하위 ${p}%`;
}

export type Band = "high" | "mid" | "low";
/** 원고 분기용 점수 구간 */
export const band = (v: number): Band => (v >= 66 ? "high" : v >= 40 ? "mid" : "low");
export const BAND_LABEL: Record<Band, string> = {
  high: "높음",
  mid: "보통",
  low: "낮음",
};
