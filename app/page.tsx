import Link from "next/link";
import Gauge from "@/components/Gauge";
import { LANDING } from "@/content/copy";

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-[440px] flex-1 px-5">
        <div className="flex items-baseline justify-between border-b border-line pt-12 pb-3">
          <span className="text-[13px] text-muted">인지 위탁 검사</span>
          <span className="tabular text-[13px] text-muted">v2.0</span>
        </div>

        <h1 className="font-report mt-10 text-[32px] leading-[1.4] tracking-[-0.01em]">
          AI가 똑똑해지는 동안
          <br />
          당신은 무엇을 잃었습니까
        </h1>

        <p className="mt-6 text-[17px] leading-[1.7]">
          이 검사는 당신이 얼마나 AI를 쓰는지 묻지 않습니다.
          <br />
          AI 없이 무엇이 남아 있는지를 직접 재봅니다.
        </p>

        <section className="mt-12 border border-line bg-surface p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[13px] text-muted">잔존 게이지</span>
            <span className="tabular text-[13px] text-muted">측정 전</span>
          </div>

          <Gauge value={62} animate delay={260} />

          <div className="mt-3 flex justify-between text-[13px]">
            <span className="text-mine">남아 있는 것</span>
            <span className="text-muted">넘긴 것</span>
          </div>

          <p className="mt-5 border-t border-line pt-4 text-[13px] leading-[1.7] text-muted">
            이 막대 하나가 검사 내내 따라옵니다. 문항에 답할수록, 과제를 끝낼수록
            눈금은 당신의 실제 값으로 바뀝니다.
          </p>
        </section>

        <ul className="mt-8 divide-y divide-line border-y border-line text-[15px]">
          {LANDING.steps.map(([step, label]) => (
            <li key={step} className="flex justify-between py-3.5">
              <span className="text-muted">{step}</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 pb-8 text-[13px] text-muted">
          {LANDING.meta}
        </p>
      </div>

      <div className="sticky bottom-0 bg-ground pb-5">
        <div className="mx-auto w-full max-w-[440px] px-5">
          <Link
            href="/test"
            className="flex h-[52px] w-full items-center justify-center bg-mine text-[15px] font-semibold text-white"
          >
            검사 시작
          </Link>
        </div>
      </div>
    </main>
  );
}
