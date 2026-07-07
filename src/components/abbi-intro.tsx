"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { LetterPose } from "@/components/avatar-viewer";

const AvatarViewer = dynamic(
  () => import("@/components/avatar-viewer").then((m) => m.AvatarViewer),
  { ssr: false },
);

const SEQUENCE = ["H", "A", "L", "O"];
const STEP_MS = 1700;

/* Abbi memperagakan ejaan H A L O berulang. Canvas 3D baru dimuat saat
 * section terlihat supaya landing tetap ringan. */
export function AbbiIntro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [poses, setPoses] = useState<Record<string, LetterPose> | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    fetch(`/poses/alphabet.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then(setPoses)
      .catch(() => setPoses(null));
  }, [visible]);

  useEffect(() => {
    if (!poses) return;
    const id = setInterval(() => {
      setStep((s) => (s + 1) % SEQUENCE.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [poses]);

  return (
    <div ref={rootRef} className="relative">
      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-b from-accent-soft to-background sm:aspect-[4/4.4]">
        {visible && <AvatarViewer pose={poses?.[SEQUENCE[step]] ?? null} />}
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SEQUENCE.map((l, i) => (
          <span
            key={l}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 ${
              i === step && poses
                ? "bg-accent text-white shadow-lg shadow-cyan-900/20"
                : "bg-background text-muted shadow-sm"
            }`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
