import type { TaskCMetrics } from "@/lib/scoring";
import { TASK_C, TASK_C_ITEMS } from "@/content/tasks";

/**
 * 모듈 2 — IOED 낙하. 무료 구간의 새 주인공이고 캡처되어 돌아다닐 카드다.
 * 또래 평균은 실규준이 붙기 전까지 그리지 않는다 (가짜 기준선 금지).
 */

const W = 280;
const H = 120;
const PAD = 28;

export default function IoedDrop({ taskC }: { taskC: TaskCMetrics }) {
  const { ratingPre, ratingPost } = taskC;
  const drop = ratingPre - ratingPost;
  const label =
    TASK_C_ITEMS.find((i) => i.key === taskC.item)?.label ?? "이 주제";

  const y = (v: number) =>
    PAD + (1 - (v - TASK_C.scaleMin) / (TASK_C.scaleMax - TASK_C.scaleMin)) *
      (H - PAD * 2);

  return (
    <figure className="border border-line bg-surface p-5">
      <figcaption className="text-[13px] text-muted">
        설명해 보기 전과 후 · {label}
      </figcaption>

      <div className="mt-4 flex items-center gap-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={`자가평정 ${ratingPre}점에서 ${ratingPost}점으로 변화`}
          className="max-w-[190px] shrink-0"
        >
          <line x1={PAD} y1={y(ratingPre)} x2={W - PAD} y2={y(ratingPost)} stroke="var(--color-mine)" strokeWidth={3} />
          <circle cx={PAD} cy={y(ratingPre)} r={6} fill="var(--color-mine)" />
          <circle cx={W - PAD} cy={y(ratingPost)} r={6} fill="var(--color-mine)" />
          <text x={PAD} y={y(ratingPre) - 12} textAnchor="middle" fontSize={13} fill="var(--color-ink)">{ratingPre}</text>
          <text x={W - PAD} y={y(ratingPost) - 12} textAnchor="middle" fontSize={13} fill="var(--color-ink)">{ratingPost}</text>
          <text x={PAD} y={H - 4} textAnchor="middle" fontSize={12} fill="var(--color-muted)">설명 전</text>
          <text x={W - PAD} y={H - 4} textAnchor="middle" fontSize={12} fill="var(--color-muted)">설명 후</text>
        </svg>

        <span className="tabular font-report text-[32px] leading-none">
          {drop > 0 ? `-${drop}` : drop === 0 ? "0" : `+${-drop}`}
        </span>
      </div>

      <p className="mt-4 border-t border-line pt-4 text-[15px] leading-[1.8]">
        {drop === 0 ? (
          <>
            당신은 점수를 바꾸지 않았습니다. 드문 경우입니다. 설명해 보기 전과 후의
            자기평가가 같다는 것은, 안다고 느낀 것과 실제로 꺼낼 수 있는 것의 거리가
            짧다는 뜻입니다.
          </>
        ) : drop < 0 ? (
          <>
            설명해 보고 나서 오히려 {-drop}점 올렸습니다. 쓰는 과정에서 흩어져 있던
            것이 정리된 경우입니다. 드물지만 나타나는 방향입니다.
          </>
        ) : (
          <>
            {drop}점 내려갔습니다. 이 낙하는 당신이 무언가를 잊어서 생긴 것이
            아닙니다. 설명해 보기 전까지 <b className="font-semibold">안다는 느낌</b>이
            실제로 꺼낼 수 있는 것보다 앞서 있었고, 쓰는 동안 그 거리가 드러난
            것입니다. 설명 깊이의 착각이라고 부릅니다.
          </>
        )}
      </p>
    </figure>
  );
}
