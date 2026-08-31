"use client";

import { PAGE_SIZE, QUESTIONS, SCALE_LABELS } from "@/lib/questions";

type Props = {
  page: number;
  answers: Record<number, number>;
  onAnswer: (id: number, value: number) => void;
};

export default function SurveyStep({ page, answers, onAnswer }: Props) {
  const items = QUESTIONS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSelect(id: number, value: number) {
    onAnswer(id, value);
    const nextId = id + 1;
    window.setTimeout(() => {
      const el = document.getElementById(`q-${nextId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        document
          .getElementById("survey-end")
          ?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 120);
  }

  return (
    <div className="pt-6">
      <p className="text-[13px] text-muted">
        떠오르는 대로 고르십시오. 정답은 없습니다.
      </p>

      <div className="mt-4 space-y-3">
        {items.map((q) => {
          const value = answers[q.id];
          return (
            <fieldset
              key={q.id}
              id={`q-${q.id}`}
              className="scroll-mt-28 border border-line bg-surface p-4"
            >
              <legend className="sr-only">{q.text}</legend>

              <div className="flex gap-2.5">
                <span className="tabular pt-px text-[13px] text-muted">
                  {q.code.slice(1)}
                </span>
                <p className="flex-1 text-[15px] leading-[1.6]">{q.text}</p>
              </div>

              <div className="mt-4 flex border border-line">
                {[1, 2, 3, 4, 5].map((v) => {
                  const selected = value === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={selected}
                      aria-label={SCALE_LABELS[v - 1]}
                      onClick={() => handleSelect(q.id, v)}
                      className={[
                        "tabular h-11 flex-1 border-line text-[15px] transition-colors duration-150",
                        v > 1 ? "border-l" : "",
                        selected
                          ? "bg-mine font-semibold text-white"
                          : "bg-surface text-muted",
                      ].join(" ")}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex justify-between text-[13px] text-muted">
                <span>{SCALE_LABELS[0]}</span>
                <span>{SCALE_LABELS[4]}</span>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div id="survey-end" className="h-2" />
    </div>
  );
}
