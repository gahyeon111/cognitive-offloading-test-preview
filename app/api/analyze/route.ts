import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SCHEMA, SYSTEM, buildInput, parseBody, toReport } from "@/lib/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Vercel 기본 함수 타임아웃은 10초라 리포트 생성이 그냥 끊긴다 */
export const maxDuration = 60;

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-nano";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    // 키가 없으면 클라이언트가 목업 폴백으로 넘어간다.
    return NextResponse.json({ error: "no_api_key" }, { status: 503 });
  }

  let parsed = null;
  try {
    parsed = parseBody(await req.json());
  } catch {
    parsed = null;
  }
  if (!parsed) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 45_000,
    maxRetries: 1,
  });

  try {
    /* 첫 실제 호출에서 파라미터 오류가 나면 이 블록만 고치면 된다.
       확인 순서: model 문자열 → reasoning.effort 지원 여부 → text.format 형태. */
    const res = await client.responses.create({
      model: MODEL,
      instructions: SYSTEM,
      input: buildInput(parsed),
      max_output_tokens: 6000,
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: "cognitive_offloading_report",
          strict: true,
          schema: SCHEMA as unknown as Record<string, unknown>,
        },
      },
      store: false,
    });

    if (res.status === "incomplete") {
      console.error("[analyze] incomplete:", res.incomplete_details);
      return NextResponse.json({ error: "incomplete" }, { status: 502 });
    }

    const report = toReport(JSON.parse(res.output_text));
    return NextResponse.json({ report });
  } catch (err) {
    console.error("[analyze] failed:", err);
    return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
  }
}
