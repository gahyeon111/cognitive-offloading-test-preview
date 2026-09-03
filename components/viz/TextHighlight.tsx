import {
  causalMatches,
  causalDensity,
  repeatedTokenSpans,
  sentenceSpans,
  type Span,
} from "@/lib/metrics";

/**
 * 모듈 4 — 당신이 쓴 글.
 * 과제 A 원문을 그대로 렌더하고 인과 접속 표현에 인디고 밑줄,
 * 반복 어휘에 회색 배경, 문장마다 경계선을 넣는다.
 *
 * 내가 쓴 글이라 바넘 효과가 아니다. 이 검사에서 몰입도가 가장 높은 자리다.
 * 또래 평균은 실규준(표본 300)이 모이기 전까지 표시하지 않는다.
 */

type Kind = "causal" | "repeat";
type Mark = Span & { kind: Kind };

export default function TextHighlight({ text }: { text: string }) {
  const body = text.trim();
  if (!body) return null;

  const causal = causalMatches(body);
  const repeats = repeatedTokenSpans(body);
  const marks = mergeMarks(causal, repeats);
  const sentences = sentenceSpans(body);
  const density = causalDensity(body);

  return (
    <figure className="border border-line bg-surface p-5">
      <figcaption className="mb-4 text-[13px] text-muted">
        과제 A에서 당신이 쓴 글
      </figcaption>

      <div className="divide-y divide-line border-y border-line">
        {sentences.map((s) => (
          <p key={s.start} className="py-2.5 text-[15px] leading-[1.9]">
            {renderSpan(body, s, marks)}
          </p>
        ))}
      </div>

      <dl className="mt-4 space-y-1.5 text-[13px]">
        <Row label="분량" value={`${body.length}자`} />
        <Row label="인과 표현" value={`${causal.length}회`} />
        <Row label="100자당" value={`${density.toFixed(1)}회`} />
        <Row label="반복 어절" value={`${repeats.length}회`} />
        <Row label="문장" value={`${sentences.length}개`} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3 text-[13px] text-muted">
        <span>
          <span className="border-b-2 border-mine pb-px text-ink">밑줄</span> 인과
          접속 표현
        </span>
        <span>
          <span className="bg-ceded px-1 text-ink">배경</span> 반복된 어절
        </span>
      </div>
    </figure>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}

/** 인과 표현이 반복 어절보다 우선한다. 겹치는 구간은 인과 쪽으로 넘긴다. */
function mergeMarks(causal: Span[], repeats: Span[]): Mark[] {
  const out: Mark[] = causal.map((s) => ({ ...s, kind: "causal" as const }));
  for (const r of repeats) {
    if (causal.some((c) => r.start < c.end && c.start < r.end)) continue;
    out.push({ ...r, kind: "repeat" });
  }
  return out.sort((a, b) => a.start - b.start);
}

/** 한 문장 구간을 마크에 따라 조각내 렌더한다 */
function renderSpan(text: string, sentence: Span, marks: Mark[]) {
  const inside = marks
    .filter((m) => m.start >= sentence.start && m.end <= sentence.end)
    .sort((a, b) => a.start - b.start);

  const nodes: React.ReactNode[] = [];
  let cursor = sentence.start;

  for (const m of inside) {
    if (m.start < cursor) continue; // 겹침 방지
    if (m.start > cursor) nodes.push(text.slice(cursor, m.start));
    const chunk = text.slice(m.start, m.end);
    nodes.push(
      m.kind === "causal" ? (
        <span key={m.start} className="border-b-2 border-mine pb-px">
          {chunk}
        </span>
      ) : (
        <span key={m.start} className="bg-ceded">
          {chunk}
        </span>
      ),
    );
    cursor = m.end;
  }
  if (cursor < sentence.end) nodes.push(text.slice(cursor, sentence.end));

  return nodes;
}
