import { AXIS_LABEL } from "./questions";
import { bottomPercent, topPercent } from "./norms";
import { TYPES, type AxisGap, type Scores, type TypeKey } from "./scoring";
import type { TaskCMetrics } from "./scoring";

export type HeadlineInputs = {
  scores: Scores;
  type: TypeKey;
  taskC?: TaskCMetrics | null;
  gaps?: AxisGap[];
};

/** IOED 하락 임계 (1~7 척도) */
const DROP_THRESHOLD = 3;
/** 자기보고-실측 괴리 임계 (백분위 포인트) */
const GAP_THRESHOLD = 30;

/**
 * 결정적 한 줄 — 무료 구간의 얼굴. LLM을 쓰지 않는다.
 * 백분위 수치를 그대로 읽어 주는 문장이라 한 번도 틀리면 안 되고,
 * 결제 전에 보여야 하므로 비용이 들면 안 된다.
 */
export function buildHeadline({
  scores,
  type,
  taskC,
  gaps,
}: HeadlineInputs): string {
  // 1순위 — IOED 하락. 본인이 스스로 내린 점수만큼 강한 근거가 없다.
  if (taskC) {
    const drop = taskC.ratingPre - taskC.ratingPost;
    if (drop >= DROP_THRESHOLD) {
      return `당신은 이 주제를 ${taskC.ratingPre}점이라고 했습니다.\n75초 뒤, 스스로 ${taskC.ratingPost}점으로 내렸습니다.\n사이에 달라진 것은 아무것도 없습니다. 설명해 보려 했을 뿐입니다.`;
    }
  }

  // 2순위 — 자기보고와 실측이 가장 크게 갈린 축.
  const widest = widestGap(gaps);
  if (widest) {
    const spread = Math.round(widest.self - widest.measured);
    return `당신은 ${AXIS_LABEL[widest.axis]}를 ${Math.round(widest.self)}점이라고 답했습니다.\n실제로 잰 값은 ${Math.round(widest.measured)}점입니다.\n${spread}점을 스스로 높게 보고 있었습니다.`;
  }

  // 3순위 — 유형별 기본 문장.
  return baseline(scores, type);
}

/** 과대평가(말한 > 잰) 폭이 가장 큰 축 */
function widestGap(gaps: AxisGap[] | undefined): AxisGap | null {
  if (!gaps?.length) return null;
  const worst = gaps.reduce((a, b) =>
    b.self - b.measured > a.self - a.measured ? b : a,
  );
  return worst.self - worst.measured >= GAP_THRESHOLD ? worst : null;
}

function baseline(scores: Scores, type: TypeKey): string {
  const off = rank(scores.OFF);
  const cal = rank(scores.CAL);
  const line = TYPES[type].line;
  return `당신의 인지 위탁도는 ${off}입니다.\n신뢰 보정도는 ${cal}입니다.\n${line}.`;
}

const rank = (x: number) => {
  const p = bottomPercent(x);
  return p >= 50 ? `상위 ${topPercent(x)}%` : `하위 ${p}%`;
};
