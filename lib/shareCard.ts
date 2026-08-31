import { AXIS_LABEL, type Axis } from "./questions";
import { rankLabel } from "./norms";
import { TYPES, type Scores, type TypeKey } from "./scoring";

const W = 1080;
const H = 1350;
const PAD = 88;

const C = {
  ground: "#F0F1F3",
  surface: "#FFFFFF",
  ink: "#14161A",
  muted: "#7A8090",
  mine: "#2F44A8",
  ceded: "#C9CCD4",
  line: "#DDDFE4",
};

const AXES: Axis[] = ["OFF", "CAL", "GEN", "ACC", "ANX"];

const sans = (w: number, size: number) =>
  `${w} ${size}px "Pretendard Variable", Pretendard, system-ui, sans-serif`;
const report = (size: number) =>
  `700 ${size}px "Gowun Batang", "Pretendard Variable", serif`;

/**
 * 결과 카드를 캔버스에 직접 그린다.
 * html2canvas 같은 라이브러리를 쓰지 않는다 — 게이지가 사각형 막대뿐이라
 * 직접 그리는 편이 결과물도 정확하고 의존성도 0이다.
 */
export async function drawShareCard(
  scores: Scores,
  type: TypeKey,
  headline: string,
): Promise<HTMLCanvasElement> {
  // 웹폰트가 로드되기 전에 그리면 시스템 폰트로 떨어진다
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      /* 폰트 상태를 못 읽어도 계속 그린다 */
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = C.ground;
  ctx.fillRect(0, 0, W, H);

  let y = PAD + 24;

  // 머리말
  ctx.fillStyle = C.muted;
  ctx.font = sans(400, 28);
  ctx.fillText("인지 위탁 검사", PAD, y);
  y += 22;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();

  // 유형
  y += 92;
  ctx.fillStyle = C.ink;
  ctx.font = report(76);
  ctx.fillText(TYPES[type].name, PAD, y);
  y += 52;
  ctx.fillStyle = C.muted;
  ctx.font = sans(400, 30);
  for (const line of wrapLines(ctx, TYPES[type].line, W - PAD * 2)) {
    ctx.fillText(line, PAD, y);
    y += 44;
  }
  y -= 44;

  // 결정적 한 줄
  y += 56;
  const boxTop = y;
  const boxPad = 36;
  ctx.font = report(38);
  const lines = headline
    .split("\n")
    .flatMap((l) => wrapLines(ctx, l, W - PAD * 2 - boxPad * 2));
  const boxH = 56 + lines.length * 56;
  ctx.fillStyle = C.surface;
  ctx.fillRect(PAD, boxTop, W - PAD * 2, boxH);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(PAD, boxTop, W - PAD * 2, boxH);
  ctx.fillStyle = C.ink;
  ctx.font = report(38);
  let ly = boxTop + 62;
  for (const line of lines) {
    ctx.fillText(line, PAD + boxPad, ly);
    ly += 56;
  }
  y = boxTop + boxH + 76;

  // 5축 게이지
  const track = W - PAD * 2;
  for (const axis of AXES) {
    const v = Math.max(0, Math.min(100, scores[axis]));
    ctx.fillStyle = C.ink;
    ctx.font = sans(400, 30);
    ctx.fillText(AXIS_LABEL[axis], PAD, y);

    ctx.fillStyle = C.ink;
    ctx.font = sans(600, 32);
    const score = String(Math.round(v));
    ctx.fillText(score, W - PAD - ctx.measureText(score).width, y);

    y += 20;
    ctx.fillStyle = C.ceded;
    ctx.fillRect(PAD, y, track, 20);
    ctx.fillStyle = C.mine;
    ctx.fillRect(PAD, y, (track * v) / 100, 20);

    y += 40;
    ctx.fillStyle = C.muted;
    ctx.font = sans(400, 24);
    ctx.fillText(rankLabel(v), PAD, y);
    y += 52;
  }

  // 꼬리말
  ctx.fillStyle = C.muted;
  ctx.font = sans(400, 24);
  ctx.fillText("설문 24문항 · 실측 과제 3종", PAD, H - PAD);

  return canvas;
}

/** 현재 ctx.font 기준으로 maxW에 맞게 줄을 나눈다 */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string[] {
  const out: string[] = [];
  let line = "";

  const push = () => {
    if (line) out.push(line);
    line = "";
  };

  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxW) {
      line = test;
      continue;
    }
    push();
    // 한 어절 자체가 너무 길면 글자 단위로 자른다
    if (ctx.measureText(word).width > maxW) {
      let chunk = "";
      for (const ch of word) {
        if (ctx.measureText(chunk + ch).width > maxW && chunk) {
          out.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    } else {
      line = word;
    }
  }
  push();
  return out;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
