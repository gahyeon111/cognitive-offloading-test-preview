/** 텍스트 지표. 순수 함수만 둔다. */

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** lo~hi 구간을 0~1로 정규화 */
export const norm = (x: number, lo: number, hi: number) =>
  clamp((x - lo) / (hi - lo), 0, 1);

const CAUSAL =
  /때문|그래서|따라서|왜냐|그러므로|덕분|탓|대신|반면|그런데도|불구하고|우선|결국/g;

/** 100자당 인과 접속 표현 횟수 */
export function causalDensity(text: string): number {
  const charCount = text.trim().length;
  if (!charCount) return 0;
  return (text.match(CAUSAL)?.length ?? 0) / (charCount / 100);
}

/** 인과 표현이 실제로 나타난 위치 — 모듈 4 하이라이트용 */
export function causalMatches(text: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (const m of text.matchAll(CAUSAL)) {
    if (m.index === undefined) continue;
    out.push({ start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export function tokenize(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * MATTR — 길이에 비의존적인 어휘 다양성.
 * v1의 TTR은 짧은 글에서 항상 1.0이 나와 폐기했다.
 */
export function mattr(tokens: string[], w = 25): number {
  if (!tokens.length) return 0;
  if (tokens.length < w) return new Set(tokens).size / tokens.length;
  let sum = 0;
  for (let i = 0; i + w <= tokens.length; i++) {
    sum += new Set(tokens.slice(i, i + w)).size / w;
  }
  return sum / (tokens.length - w + 1);
}

export function avgSentenceLength(text: string): number {
  const charCount = text.trim().length;
  const sentences = text.split(/[.!?]/).filter((s) => s.trim()).length || 1;
  return charCount / sentences;
}

function ngrams(s: string, n: number): Set<string> {
  const c = s.replace(/\s/g, "");
  return new Set(
    Array.from({ length: Math.max(0, c.length - n + 1) }, (_, i) =>
      c.slice(i, i + n),
    ),
  );
}

/** b가 a의 표현을 얼마나 가져다 썼는가 (0~1) */
export function ngramOverlap(a: string, b: string, n: number): number {
  const A = ngrams(a, n);
  const B = ngrams(b, n);
  if (!B.size) return 0;
  return [...B].filter((x) => A.has(x)).length / B.size;
}

/**
 * 과제 B 함정 탐지. 지문에는 전자계산기 보급 시기가 1990년대로 잘못 적혀 있다
 * (실제로는 1970년대 초). 언급만 하면 0.5, 틀렸다고 짚으면 1.
 */
export function trapScore(summary: string): 0 | 0.5 | 1 {
  const mentions = /계산기|전자계산기|1990|1970|70년대|90년대|연도|시기/.test(
    summary,
  );
  const flags = /틀렸|아닌|잘못|오류|이상|사실이|맞지|아님/.test(summary);
  if (mentions && flags) return 1;
  if (mentions) return 0.5;
  return 0;
}

/** 과제 A 글쓰기 행동 지표 */
export type TypingMetrics = {
  startDelayMs: number;
  pauseCount: number;
  deleteRatio: number;
};

export type Span = { start: number; end: number };

/** 공백으로 나눈 어절의 위치 */
function tokenSpans(text: string): (Span & { token: string })[] {
  const out: (Span & { token: string })[] = [];
  const re = /\S+/g;
  for (const m of text.matchAll(re)) {
    if (m.index === undefined) continue;
    out.push({ token: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * 두 번 이상 나온 어절의 위치 — 모듈 4 하이라이트용.
 * 조사가 붙으면 다른 어절로 세므로 완전히 같은 형태만 반복으로 본다.
 */
export function repeatedTokenSpans(text: string): Span[] {
  const spans = tokenSpans(text).filter((s) => s.token.length >= 2);
  const counts = new Map<string, number>();
  for (const s of spans) counts.set(s.token, (counts.get(s.token) ?? 0) + 1);
  return spans
    .filter((s) => (counts.get(s.token) ?? 0) >= 2)
    .map(({ start, end }) => ({ start, end }));
}

/** 문장 단위로 자른 위치. 문장 부호가 없으면 전체가 한 문장이다. */
export function sentenceSpans(text: string): Span[] {
  const out: Span[] = [];
  const re = /[^.!?]+[.!?]*/g;
  for (const m of text.matchAll(re)) {
    if (m.index === undefined || !m[0].trim()) continue;
    out.push({ start: m.index, end: m.index + m[0].length });
  }
  return out.length ? out : text.trim() ? [{ start: 0, end: text.length }] : [];
}
