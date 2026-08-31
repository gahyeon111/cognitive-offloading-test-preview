import { AXIS_LABEL } from "@/lib/questions";
import type { AxisGap } from "@/lib/scoring";

/**
 * 모듈 1 — 괴리 차트. 이 제품의 시그니처.
 * 축마다 '말한 나'(빈 원)와 '잰 나'(채운 원)를 찍고 선으로 잇는다.
 * 자기보고만 하는 검사는 이 그래프를 그릴 수 없다.
 *
 * 차트 라이브러리를 쓰지 않는다. PDF 출력 대응을 위해 애니메이션도 없다.
 */

const W = 340;
const PAD_L = 10;
const PAD_R = 10;
const TRACK = W - PAD_L - PAD_R;

const TICK_H = 22; // 눈금 라벨 영역
const ROW_H = 76;
const LABEL_DY = 16; // 행 상단에서 축 이름까지
const LINE_DY = 44; // 행 상단에서 선까지
/** 두 점이 이만큼 안에 붙으면 값 라벨을 위아래로 나눈다 */
const COLLIDE_PX = 78;

const x = (v: number) => PAD_L + (Math.max(0, Math.min(100, v)) / 100) * TRACK;

export default function GapChart({ gaps }: { gaps: AxisGap[] }) {
  if (!gaps.length) return null;

  const widest = gaps.reduce((a, b) =>
    Math.abs(b.self - b.measured) > Math.abs(a.self - a.measured) ? b : a,
  );
  const spread = Math.round(Math.abs(widest.self - widest.measured));
  const over = widest.self > widest.measured;
  const H = TICK_H + gaps.length * ROW_H;

  return (
    <figure className="border border-line bg-surface p-5">
      <figcaption className="mb-2 text-[13px] text-muted">
        말한 나와 잰 나
      </figcaption>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label="축별 자기보고 값과 실측 값의 차이"
          className="min-w-[300px]"
        >
          {/* 눈금 */}
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line
                x1={x(t)}
                y1={TICK_H}
                x2={x(t)}
                y2={H - 8}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
              <text
                x={x(t)}
                y={TICK_H - 8}
                textAnchor={t === 0 ? "start" : t === 100 ? "end" : "middle"}
                fontSize={10}
                fill="var(--color-muted)"
              >
                {t}
              </text>
            </g>
          ))}

          {gaps.map((g, i) => {
            const top = TICK_H + i * ROW_H;
            const ly = top + LINE_DY;
            // 과대평가(말한 > 잰)는 회색, 과소평가는 인디고
            const stroke =
              g.self > g.measured ? "var(--color-ceded)" : "var(--color-mine)";
            const star = g.axis === widest.axis && spread >= 10;
            const [lo, hi] =
              g.self < g.measured ? [g.self, g.measured] : [g.measured, g.self];
            const tight = Math.abs(x(g.self) - x(g.measured)) < COLLIDE_PX;

            return (
              <g key={g.axis}>
                <text
                  x={PAD_L}
                  y={top + LABEL_DY}
                  fontSize={12}
                  fill="var(--color-ink)"
                >
                  {AXIS_LABEL[g.axis]}
                  {star ? " ★" : ""}
                </text>

                <line
                  x1={x(lo)}
                  y1={ly}
                  x2={x(hi)}
                  y2={ly}
                  stroke={stroke}
                  strokeWidth={3}
                />

                {/* 잰 나 — 채운 원 */}
                <circle cx={x(g.measured)} cy={ly} r={6} fill="var(--color-mine)" />
                {/* 말한 나 — 빈 원 */}
                <circle
                  cx={x(g.self)}
                  cy={ly}
                  r={5}
                  fill="var(--color-surface)"
                  stroke="var(--color-ink)"
                  strokeWidth={1.5}
                />

                {/* 두 점이 붙으면 위아래로 나눠 겹침을 막는다 */}
                <text
                  x={clampLabel(x(g.measured))}
                  y={tight ? ly - 14 : ly + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-mine)"
                >
                  잰 {Math.round(g.measured)}
                </text>
                <text
                  x={clampLabel(x(g.self))}
                  y={ly + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-muted)"
                >
                  말한 {Math.round(g.self)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex gap-4 border-t border-line pt-3 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-ink bg-surface" />
          말한 나
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-mine" />잰 나
        </span>
      </div>

      <p className="mt-3 text-[13px] leading-[1.7]">
        가장 크게 어긋난 것은 {AXIS_LABEL[widest.axis]}입니다. {spread}점 차이,{" "}
        {over ? "스스로를 높게 보고 있었습니다." : "스스로를 낮게 보고 있었습니다."}
      </p>
    </figure>
  );
}

/** 라벨이 그림 밖으로 나가지 않게 가둔다 */
const clampLabel = (px: number) => Math.max(PAD_L + 22, Math.min(W - PAD_R - 22, px));
