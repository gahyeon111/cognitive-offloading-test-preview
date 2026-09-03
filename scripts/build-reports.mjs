/**
 * content/reports/*.md → content/reports/generated.ts
 *
 * 원고는 사람이 .md 로 쓰고, 앱은 생성된 .ts 를 import 한다.
 * 결과 페이지가 클라이언트 컴포넌트라 런타임에 fs 를 못 읽기 때문이다.
 * `npm run build` 가 prebuild 로 이 스크립트를 먼저 돌린다.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "content/reports";
const OUT = join(DIR, "generated.ts");

/** .md 의 snake_case key → 코드의 TypeKey */
const KEY_MAP = {
  captain: "captain",
  first_officer: "firstOfficer",
  glider: "glider",
  passenger: "passenger",
  mechanic: "mechanic",
  controller: "controller",
  climber: "climber",
  drifter: "drifter",
};

const EXPECTED_CODE = {
  captain: "HHH",
  firstOfficer: "HHL",
  glider: "HLH",
  passenger: "HLL",
  mechanic: "LHH",
  controller: "LHL",
  climber: "LLH",
  drifter: "LLL",
};

const fail = (msg) => {
  console.error(`[build-reports] ${msg}`);
  process.exit(1);
};

function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) fail(`${file}: frontmatter 없음`);
  const out = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta: out, body: raw.slice(m[0].length) };
}

/** '### id' 블록들을 key: value 로 파싱 */
function parseBlocks(section, file, prefix) {
  const out = [];
  const re = /^###\s+(\S+)\s*$/gm;
  const heads = [...section.matchAll(re)];
  heads.forEach((h, i) => {
    const start = h.index + h[0].length;
    const end = i + 1 < heads.length ? heads[i + 1].index : section.length;
    const chunk = section.slice(start, end);
    const fields = {};
    // 값이 여러 줄로 이어질 수 있으므로 다음 필드 키를 만날 때까지 이어붙인다
    let current = null;
    for (const line of chunk.split("\n")) {
      const m = line.match(/^(title|body|action):\s*(.*)$/);
      if (m) {
        current = m[1];
        fields[current] = m[2];
      } else if (current && line.trim()) {
        fields[current] += " " + line.trim();
      }
    }
    if (!fields.title || !fields.body) {
      fail(`${file}: ${h[1]} 에 title 또는 body 가 없음`);
    }
    out.push({ id: h[1], ...fields });
    if (!h[1].startsWith(prefix)) fail(`${file}: ${h[1]} 은 ${prefix}* 여야 함`);
  });
  return out;
}

function parseFile(file) {
  const raw = readFileSync(join(DIR, file), "utf8");
  const { meta, body } = parseFrontmatter(raw, file);

  const typeKey = KEY_MAP[meta.key];
  if (!typeKey) fail(`${file}: 알 수 없는 key '${meta.key}'`);
  if (meta.code !== EXPECTED_CODE[typeKey]) {
    fail(`${file}: code 불일치 — ${meta.code}, 기대값 ${EXPECTED_CODE[typeKey]}`);
  }
  if (!["reduce", "increase"].includes(meta.routineDirection)) {
    fail(`${file}: routineDirection 은 reduce 또는 increase 여야 함`);
  }

  const sIdx = body.indexOf("## scenarios");
  const rIdx = body.indexOf("## routine");
  if (sIdx < 0 || rIdx < 0) fail(`${file}: '## scenarios' 또는 '## routine' 없음`);

  const scenarios = parseBlocks(body.slice(sIdx, rIdx), file, "s");
  const routine = parseBlocks(body.slice(rIdx), file, "w");

  if (scenarios.length !== 3) fail(`${file}: 취약 시나리오가 ${scenarios.length}편 (3편이어야 함)`);
  if (routine.length !== 4) fail(`${file}: 루틴이 ${routine.length}주 (4주여야 함)`);
  for (const w of routine) {
    if (!w.action) fail(`${file}: ${w.id} 에 action 이 없음`);
  }

  return {
    typeKey,
    number: Number(meta.number),
    name: meta.name,
    line: meta.line,
    tone: meta.tone,
    routineDirection: meta.routineDirection,
    scenarios: scenarios.map(({ title, body }) => ({ title, body })),
    routine: routine.map(({ title, body, action }, i) => ({
      week: `${i + 1}주차`,
      title,
      body,
      action,
    })),
  };
}

const files = readdirSync(DIR)
  .filter((f) => /^type_\d+_.+\.md$/.test(f))
  .sort();

if (files.length !== 8) fail(`원고가 ${files.length}편 (8편이어야 함)`);

const parsed = files.map(parseFile);

// 원고와 코드가 어긋나면 빌드를 세운다. 유형명이 두 곳에 있으면 반드시 갈린다.
const scoring = readFileSync("lib/scoring.ts", "utf8");
for (const p of parsed) {
  const re = new RegExp(
    `${p.typeKey}: \\{ code: "([^"]+)", name: "([^"]+)", line: "([^"]+)" \\}`,
  );
  const m = scoring.match(re);
  if (!m) fail(`lib/scoring.ts 에서 ${p.typeKey} 를 찾지 못함`);
  if (m[1] !== EXPECTED_CODE[p.typeKey]) fail(`${p.typeKey}: scoring.ts 의 code 가 ${m[1]}`);
  if (m[2] !== p.name) fail(`${p.typeKey}: 유형명 불일치 — 원고 "${p.name}" vs scoring.ts "${m[2]}"`);
  if (m[3] !== p.line) fail(`${p.typeKey}: 한 줄 불일치 — 원고 "${p.line}" vs scoring.ts "${m[3]}"`);
}
const seen = new Set(parsed.map((p) => p.typeKey));
if (seen.size !== 8) fail("유형이 중복됐거나 빠졌음");

const q = (s) => JSON.stringify(s);
const body = parsed
  .map(
    (p) => `  ${p.typeKey}: {
    number: ${p.number},
    name: ${q(p.name)},
    line: ${q(p.line)},
    tone: ${q(p.tone)},
    routineDirection: ${q(p.routineDirection)},
    image: "/types/type_${String(p.number).padStart(2, "0")}_${files[p.number - 1].replace(/^type_\d+_/, "").replace(/\.md$/, "")}.png",
    scenarios: [
${p.scenarios.map((s) => `      { title: ${q(s.title)}, body: ${q(s.body)} },`).join("\n")}
    ],
    routine: [
${p.routine.map((r) => `      { week: ${q(r.week)}, title: ${q(r.title)}, body: ${q(r.body)}, action: ${q(r.action)} },`).join("\n")}
    ],
  },`,
  )
  .join("\n");

writeFileSync(
  OUT,
  `// 자동 생성됨 — 직접 고치지 말 것.
// 원본은 content/reports/*.md 이고, scripts/build-reports.mjs 가 만든다.
// 다시 만들려면: npm run reports

import type { TypeKey } from "@/lib/scoring";

export type Scenario = { title: string; body: string };
export type RoutineWeek = {
  week: string;
  title: string;
  body: string;
  action: string;
};
export type TypeReport = {
  number: number;
  name: string;
  line: string;
  /** 섹션 01 톤 가이드 */
  tone: string;
  /** 위탁 高는 줄이는 처방, 低는 늘리는 처방 */
  routineDirection: "reduce" | "increase";
  image: string;
  scenarios: Scenario[];
  routine: RoutineWeek[];
};

export const TYPE_REPORTS: Record<TypeKey, TypeReport> = {
${body}
};
`,
);

console.log(`[build-reports] ${files.length}편 → ${OUT}`);
for (const p of parsed) {
  console.log(`  ${p.typeKey.padEnd(13)} ${p.name} · 시나리오 ${p.scenarios.length} · 루틴 ${p.routine.length} · ${p.routineDirection}`);
}
