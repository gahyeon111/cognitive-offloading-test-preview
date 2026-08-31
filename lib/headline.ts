import { AXIS_LABEL, type Axis } from "./questions";
import {
  TYPES,
  bottomPercent,
  topPercent,
  type Scores,
  type TypeKey,
} from "./scoring";

/**
 * 과제 C(IOED) 결과. HANDOFF v2에서 확정되면 채운다.
 * pre/post 는 같은 척도의 자기평가 점수.
 */
export type TaskCResult = {
  ratingPre: number;
  ratingPost: number;
};

/** 자기보고와 실측이 갈린 축. v2 §7 채점이 확정되면 채운다. */
export type AxisGap = {
  axis: Axis;
  /** 자기보고 점수 0~100 */
  self: number;
  /** 실측 점수 0~100 */
  measured: number;
};

export type HeadlineInputs = {
  scores: Scores;
  type: TypeKey;
  taskC?: TaskCResult;
  gaps?: AxisGap[];
};

/** IOED 하락 임계 */
const DROP_THRESHOLD = 3;
/** 자기보고-실측 괴리 임계 (백분위 포인트) */
const GAP_THRESHOLD = 30;

/**
 * 결정적 한 줄 — 무료 구간의 얼굴.
 *
 * LLM을 쓰지 않는다. 이 문장은 백분위 수치를 그대로 읽어 주는 문장이라
 * 한 번도 틀리면 안 되고, 결제 전에 보여야 하므로 비용이 들면 안 된다.
 * (v1에서 LLM이 이 자리에 문서 제목을 뱉은 것도 같은 이유로 발생했다.)
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
      return `당신은 이 주제를 ${taskC.ratingPre}점이라고 했습니다.\n75초 뒤, 스스로 ${taskC.ratingPost}점으로 내렸습니다.`;
    }
  }

  // 2순위 — 자기보고와 실측이 가장 크게 갈린 축.
  const widest = widestGap(gaps);
  if (widest) {
    return `당신은 ${AXIS_LABEL[widest.axis]} 상위 ${topPercent(widest.self)}%라고 답했습니다.\n실제로 잰 값은 하위 ${bottomPercent(widest.measured)}%입니다.`;
  }

  // 3순위 — 유형별 기본 문장.
  return baseline(scores, type);
}

function widestGap(gaps: AxisGap[] | undefined): AxisGap | null {
  if (!gaps?.length) return null;
  const worst = gaps.reduce((a, b) =>
    topPercent(b.self) - topPercent(b.measured) >
    topPercent(a.self) - topPercent(a.measured)
      ? b
      : a,
  );
  const spread = topPercent(worst.self) - topPercent(worst.measured);
  return spread >= GAP_THRESHOLD ? worst : null;
}

function baseline(scores: Scores, type: TypeKey): string {
  const offTop = topPercent(scores.OFF);
  const offBottom = bottomPercent(scores.OFF);
  const verTop = topPercent(scores.VER);
  const verBottom = bottomPercent(scores.VER);

  switch (type) {
    case "pilot":
      return `당신의 인지 위탁도는 상위 ${offTop}%입니다.\n검증 습관 또한 상위 ${verTop}%입니다.\n많이 맡기면서 끝까지 확인하는 사람은 드뭅니다.`;
    case "passenger":
      return `당신의 인지 위탁도는 상위 ${offTop}%입니다.\n다만 검증 습관은 하위 ${verBottom}%입니다.\n넘긴 만큼 되돌아본 기록이 남아 있지 않습니다.`;
    case "mechanic":
      return `당신의 인지 위탁도는 하위 ${offBottom}%입니다.\n대신 검증 습관은 상위 ${verTop}%입니다.\n적게 맡기고 그마저도 직접 뜯어보고 있습니다.`;
    case "climber":
    default:
      return `당신의 인지 위탁도는 하위 ${offBottom}%입니다.\n검증 습관도 하위 ${verBottom}%입니다.\n맡기지 않았기에 아직 확인할 일도 없었습니다.`;
  }
}

/** 유형 한 줄 설명 — headline 바로 아래에서 함께 쓰인다 */
export const typeLine = (type: TypeKey) => TYPES[type].line;
