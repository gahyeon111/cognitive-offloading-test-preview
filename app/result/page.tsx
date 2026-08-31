"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Gauge from "@/components/Gauge";
import Toast from "@/components/Toast";
import { AXIS_LABEL, type Axis } from "@/lib/questions";
import { buildHeadline } from "@/lib/headline";
import { requestReport } from "@/lib/reportClient";
import {
  clearResult,
  loadResult,
  saveResult,
  type StoredResult,
} from "@/lib/storage";
import { TYPES, bottomPercent, topPercent } from "@/lib/scoring";

const AXES: Axis[] = ["OFF", "VER", "GEN", "ANX"];

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredResult | null>(null);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** 리포트 생성은 결제(unlock) 시점에만 일어난다 — §0 비용 누수 차단 */
  const [loadingReport, setLoadingReport] = useState(false);

  const unlock = useCallback(async () => {
    setModal(false);
    const stored = loadResult();
    if (!stored || stored.report) return; // 이미 만들어 뒀으면 재호출하지 않는다
    setLoadingReport(true);
    const { report, source } = await requestReport(
      stored.scores,
      stored.type,
      stored.taskA,
      stored.taskB,
    );
    const next = { ...stored, report, source };
    saveResult(next);
    setData(next);
    setLoadingReport(false);
  }, []);

  useEffect(() => {
    const stored = loadResult();
    if (!stored) {
      router.replace("/");
      return;
    }
    setData(stored);
    setReady(true);
  }, [router]);

  if (!ready || !data) return null;

  const { scores, taskA, type, report } = data;
  const t = TYPES[type];
  const uniqueRatio = Math.round(taskA.uniqueTokenRatio * 100);
  const headline = buildHeadline({ scores, type });
  const unlocked = !!report;

  return (
    <main className="flex min-h-dvh flex-col pb-10">
      <div className="mx-auto w-full max-w-[440px] px-5 md:max-w-[560px]">
        <div className="flex items-baseline justify-between border-b border-line pt-12 pb-3 text-[13px] text-muted">
          <span>인지 위탁 검사 · 결과</span>
          <span className="tabular">
            {data.source ? (data.source === "llm" ? "분석" : "템플릿") : "계측"}{" "}
            · {new Date(data.createdAt).toLocaleDateString("ko-KR")}
          </span>
        </div>

        {/* 1. 유형 */}
        <section className="pt-10">
          <p className="text-[13px] text-muted">당신의 유형</p>
          <h1 className="font-report mt-2 text-[32px] leading-[1.35]">
            {t.name}
          </h1>
          <p className="mt-2 text-[17px] leading-[1.7]">{t.line}</p>
        </section>

        {/* 2. 4개 지표 */}
        <section className="mt-10 border border-line bg-surface p-5">
          <p className="mb-5 text-[13px] text-muted">지표</p>
          <div className="space-y-5">
            {AXES.map((axis, i) => {
              const v = scores[axis];
              const p = bottomPercent(v);
              return (
                <div key={axis}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[15px]">{AXIS_LABEL[axis]}</span>
                    <span className="tabular text-[15px] font-semibold">
                      {Math.round(v)}
                    </span>
                  </div>
                  <Gauge value={v} animate delay={i * 90} />
                  <p className="tabular mt-1.5 text-[13px] text-muted">
                    {p >= 50 ? `상위 ${topPercent(v)}%` : `하위 ${p}%`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. 결정적 한 줄 */}
        <section className="mt-8 border-2 border-ink bg-surface p-5">
          <p className="text-[13px] text-muted">결정적 한 줄</p>
          <p className="font-report mt-3 text-[22px] leading-[1.6] whitespace-pre-line">
            {headline}
          </p>
        </section>

        {/* 4. 과제 A 요약 */}
        <p className="tabular mt-6 text-[15px] text-muted">
          3분 동안 {taskA.charCount}자, 서로 다른 단어 {uniqueRatio}%
        </p>

        {/* 5. 페이월 / 유료 구간 */}
        {loadingReport ? (
          <section
            className="mt-8 border border-line bg-surface p-5"
            aria-busy="true"
          >
            <p className="text-[13px] text-muted">리포트를 만드는 중</p>
            <div className="mt-4 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-[10px] w-1/3 bg-ceded" />
                  <div className="h-[10px] w-full bg-ceded" />
                  <div className="h-[10px] w-4/5 bg-ceded" />
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[13px] leading-[1.7] text-muted">
              당신이 쓴 글을 읽고 있습니다. 20초쯤 걸립니다.
            </p>
          </section>
        ) : !unlocked ? (
          <section className="mt-8 border border-line bg-surface p-5">
            <p className="text-[13px] text-muted">잠긴 항목</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              {[
                "축별 상세 해석 4편",
                "당신이 쓴 글의 실제 분석 (어휘·문장 구조)",
                "같은 유형이 6개월 뒤 겪는 변화",
                "4주 회복 루틴",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-ceded">·</span>
                  <span className="text-muted">{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={loadingReport}
              onClick={() => setModal(true)}
              className="mt-5 h-[52px] w-full bg-mine text-[15px] font-semibold text-white disabled:bg-ceded"
            >
              {loadingReport ? "리포트를 만드는 중" : "전체 리포트 보기 · 3,900원"}
            </button>
          </section>
        ) : (
          <>
            <section className="mt-10">
              <h2 className="font-report text-[22px]">축별 상세 해석</h2>
              <div className="mt-4 space-y-3">
                {report.sections.map((s) => (
                  <article
                    key={s.title}
                    className="border border-line bg-surface p-5"
                  >
                    <h3 className="text-[17px] font-semibold">{s.title}</h3>
                    <p className="mt-3 text-[15px] leading-[1.8]">{s.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-report text-[22px]">당신이 쓴 글의 실제 분석</h2>
              <article className="mt-4 border border-line bg-surface p-5">
                <h3 className="text-[17px] font-semibold">
                  {report.writingAnalysis.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.8]">
                  {report.writingAnalysis.body}
                </p>
                <p className="tabular mt-4 border-t border-line pt-3 text-[13px] text-muted">
                  {taskA.charCount}자 · 서로 다른 단어 {uniqueRatio}%
                </p>
              </article>
            </section>

            <section className="mt-10">
              <h2 className="font-report text-[22px]">
                같은 유형이 6개월 뒤 겪는 변화
              </h2>
              <article className="mt-4 border border-line bg-surface p-5">
                <h3 className="text-[17px] font-semibold">
                  {report.sixMonths.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.8]">
                  {report.sixMonths.body}
                </p>
              </article>
            </section>

            <section className="mt-10">
              <h2 className="font-report text-[22px]">4주 회복 루틴</h2>
              <ol className="mt-4 divide-y divide-line border-y border-line">
                {report.routine.map((r) => (
                  <li key={r.week} className="py-4">
                    <div className="flex gap-3">
                      <span className="tabular w-12 shrink-0 text-[13px] text-muted">
                        {r.week}
                      </span>
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold">{r.title}</p>
                        <p className="mt-1.5 text-[15px] leading-[1.8] text-muted">
                          {r.body}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        {/* 하단 */}
        <div className="mt-10 space-y-3">
          <button
            type="button"
            onClick={() => {
              clearResult();
              router.push("/test");
            }}
            className="h-[52px] w-full border border-line bg-surface text-[15px]"
          >
            다시 검사하기
          </button>
          <button
            type="button"
            onClick={() => setToast("준비 중입니다")}
            className="h-[52px] w-full border border-line bg-surface text-[15px]"
          >
            결과 이미지 저장
          </button>
        </div>

        <p className="mt-8 text-[13px] leading-[1.7] text-muted">
          이 검사는 의학적 진단이 아니며 재미와 자기 점검을 위한 도구입니다.
        </p>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-5 pb-5"
          role="dialog"
          aria-modal="true"
          onClick={() => setModal(false)}
        >
          <div
            className="w-full max-w-[440px] border border-line bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[17px] leading-[1.7]">
              PoC 버전이라 결제는 아직 열려 있지 않습니다.
            </p>
            <button
              type="button"
              onClick={() => setModal(false)}
              className="mt-5 h-[52px] w-full bg-mine text-[15px] font-semibold text-white"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={unlock}
              className="mt-3 w-full text-[13px] text-muted underline"
            >
              개발용으로 열어보기
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
