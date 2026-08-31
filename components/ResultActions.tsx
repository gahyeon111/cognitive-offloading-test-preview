"use client";

import { useState } from "react";
import { canvasToBlob, drawShareCard } from "@/lib/shareCard";
import type { Scores, TypeKey } from "@/lib/scoring";
import { TYPES } from "@/lib/scoring";

export default function ResultActions({
  scores,
  type,
  headline,
  onToast,
}: {
  scores: Scores;
  type: TypeKey;
  headline: string;
  onToast: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function makeFile() {
    const canvas = await drawShareCard(scores, type, headline);
    const blob = await canvasToBlob(canvas);
    if (!blob) throw new Error("canvas toBlob failed");
    // 파일명은 ASCII로 둔다 — Chromium이 blob 다운로드에서 비ASCII 이름을
    // 버리고 'download'로 저장해 버린다.
    return new File([blob], `cognitive-offloading-${TYPES[type].code}.png`, {
      type: "image/png",
    });
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const file = await makeFile();
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      // DOM에 붙이지 않으면 일부 브라우저가 download 속성을 무시한다
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 즉시 해제하면 다운로드가 취소될 수 있다
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      onToast("이미지를 만들지 못했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      const file = await makeFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "인지 위탁 검사" });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        onToast("링크를 복사했습니다");
      }
    } catch (err) {
      // 사용자가 공유 시트를 닫은 경우는 오류가 아니다
      if ((err as Error)?.name !== "AbortError") {
        onToast("공유하지 못했습니다");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="h-[52px] w-full border border-line bg-surface text-[15px] disabled:text-muted"
      >
        결과 이미지 저장
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={share}
        className="h-[52px] w-full border border-line bg-surface text-[15px] disabled:text-muted"
      >
        공유하기
      </button>
    </div>
  );
}
