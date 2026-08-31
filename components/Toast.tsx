"use client";

import { useEffect } from "react";

export default function Toast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(id);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[76px] z-50 flex justify-center px-5"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-[400px] bg-ink px-4 py-2.5 text-[13px] leading-normal text-white">
        {message}
      </div>
    </div>
  );
}
