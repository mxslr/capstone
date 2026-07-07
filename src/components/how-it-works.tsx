"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/*
 * Alur cara kerja dengan stickman animasi.
 * Tiga adegan berjalan terus, sorotan kartu berpindah 1 -> 2 -> 3
 * mengikuti titik yang bergerak di garis alur.
 */

const STICK = "#0f172a";
const ACCENT = "#0e7490";
const BRIGHT = "#22d3ee";

function SceneCamera() {
  return (
    <svg viewBox="0 0 240 200" className="h-40 w-full" aria-hidden="true">
      {/* stickman */}
      <g stroke={STICK} strokeWidth="5" strokeLinecap="round" fill="none">
        <circle cx="78" cy="62" r="14" />
        <path d="M78 76V132" />
        <path d="M78 132L60 172" />
        <path d="M78 132L96 172" />
        <path d="M78 92L56 116" />
      </g>
      {/* lengan menekan tombol */}
      <g className="s1-arm" stroke={STICK} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M78 92L108 100L128 96" />
      </g>
      {/* monitor dengan kamera */}
      <g stroke={ACCENT} strokeWidth="4" strokeLinecap="round" fill="none">
        <rect x="138" y="62" width="66" height="48" rx="8" />
        <path d="M171 110V126" />
        <path d="M155 126H187" />
      </g>
      <circle className="s1-lens" cx="171" cy="86" r="7" fill={ACCENT} />
      <circle className="s1-ring" cx="171" cy="86" r="14" stroke={BRIGHT} strokeWidth="3" fill="none" />
    </svg>
  );
}

function SceneSign() {
  return (
    <svg viewBox="0 0 240 200" className="h-40 w-full" aria-hidden="true">
      <g stroke={STICK} strokeWidth="5" strokeLinecap="round" fill="none">
        <circle cx="112" cy="66" r="14" />
        <path d="M112 80V136" />
        <path d="M112 136L94 176" />
        <path d="M112 136L130 176" />
        <path d="M112 96L88 74" />
      </g>
      {/* lengan yang melambai */}
      <g className="s2-arm" stroke={STICK} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M112 96L140 78L152 56" />
      </g>
      {/* titik landmark di sekitar tangan */}
      <g fill={BRIGHT}>
        <circle className="s2-dot" cx="158" cy="46" r="4" />
        <circle className="s2-dot" cx="170" cy="54" r="4" />
        <circle className="s2-dot" cx="166" cy="38" r="4" />
        <circle className="s2-dot" cx="178" cy="44" r="4" />
        <circle className="s2-dot" cx="150" cy="36" r="4" />
      </g>
      <g className="s2-check" opacity="0">
        <circle cx="190" cy="80" r="14" fill={ACCENT} />
        <path d="M183 80l5 5 9-10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

function SceneRepeat() {
  return (
    <svg viewBox="0 0 240 200" className="h-40 w-full" aria-hidden="true">
      <g stroke={STICK} strokeWidth="5" strokeLinecap="round" fill="none">
        <circle cx="82" cy="66" r="14" />
        <path d="M82 80V136" />
        <path d="M82 136L64 176" />
        <path d="M82 136L100 176" />
        <path d="M82 96L60 120" />
        <path d="M82 96L112 106" />
      </g>
      {/* kartu huruf */}
      <rect x="138" y="66" width="52" height="64" rx="10" fill="#ecfeff" stroke={ACCENT} strokeWidth="3" />
      <text className="s3-letter s3-l0" x="164" y="108" textAnchor="middle" fontSize="34" fontWeight="700" fill={ACCENT}>R</text>
      <text className="s3-letter s3-l1" x="164" y="108" textAnchor="middle" fontSize="34" fontWeight="700" fill={ACCENT} opacity="0">J</text>
      <text className="s3-letter s3-l2" x="164" y="108" textAnchor="middle" fontSize="34" fontWeight="700" fill={ACCENT} opacity="0">W</text>
      {/* panah berputar */}
      <g className="s3-arrow">
        <path
          d="M164 46a52 52 0 0 1 52 52"
          stroke={BRIGHT}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M212 88l6 12-14-2" fill={BRIGHT} stroke="none" />
      </g>
    </svg>
  );
}

const steps = [
  {
    scene: SceneCamera,
    title: "Nyalakan kamera",
    body: "Satu klik untuk mulai. Semua pemrosesan terjadi di perangkatmu.",
  },
  {
    scene: SceneSign,
    title: "Peragakan isyarat",
    body: "21 titik tanganmu terbaca dan umpan balik muncul saat itu juga.",
  },
  {
    scene: SceneRepeat,
    title: "Ulangi yang sulit",
    body: "Huruf yang sering keliru kembali lebih dulu di kuis harianmu.",
  },
];

export function HowItWorks() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      /* adegan 1: tombol ditekan, lensa berkedip, ring pulse */
      gsap.to(".s1-arm", {
        rotation: 6,
        svgOrigin: "78 92",
        duration: 0.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      gsap.fromTo(
        ".s1-ring",
        { scale: 0.5, opacity: 1, svgOrigin: "171 86" },
        { scale: 1.6, opacity: 0, duration: 1.4, repeat: -1, ease: "power1.out" },
      );

      /* adegan 2: lambaian tangan + titik landmark muncul bergantian */
      gsap.to(".s2-arm", {
        rotation: 16,
        svgOrigin: "112 96",
        duration: 0.45,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      gsap.fromTo(
        ".s2-dot",
        { opacity: 0, scale: 0.4 },
        {
          opacity: 1,
          scale: 1,
          transformOrigin: "center",
          duration: 0.35,
          stagger: { each: 0.12, repeat: -1, yoyo: true, repeatDelay: 0.6 },
        },
      );
      gsap.fromTo(
        ".s2-check",
        { opacity: 0, scale: 0.6, svgOrigin: "190 80" },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          repeat: -1,
          yoyo: true,
          repeatDelay: 1.2,
          ease: "back.out(2)",
        },
      );

      /* adegan 3: panah memutar + huruf berganti */
      gsap.to(".s3-arrow", {
        rotation: 360,
        svgOrigin: "164 98",
        duration: 2.4,
        repeat: -1,
        ease: "none",
      });
      const letters = gsap.timeline({ repeat: -1 });
      [".s3-l0", ".s3-l1", ".s3-l2"].forEach((sel, i, arr) => {
        const next = arr[(i + 1) % arr.length];
        letters
          .to(sel, { opacity: 0, duration: 0.25 }, `+=1.1`)
          .to(next, { opacity: 1, duration: 0.25 }, "<");
      });

      /* alur 1 -> 2 -> 3: titik berjalan dan kartu aktif berpindah */
      const cards = gsap.utils.toArray<HTMLElement>("[data-step]");
      const runner = root.querySelector<HTMLElement>(".flow-runner");
      const setActive = (idx: number) => () => {
        cards.forEach((c, i) => c.setAttribute("data-active", i === idx ? "true" : "false"));
      };
      const flow = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
      flow.call(setActive(0));
      if (runner) {
        flow
          .fromTo(runner, { left: "16.66%" }, { left: "50%", duration: 1.6, ease: "power1.inOut", delay: 1.6 })
          .call(setActive(1))
          .to(runner, { left: "83.33%", duration: 1.6, ease: "power1.inOut", delay: 1.6 })
          .call(setActive(2))
          .to(runner, { opacity: 0, duration: 0.3, delay: 1.6 })
          .set(runner, { left: "16.66%" })
          .to(runner, { opacity: 1, duration: 0.3 });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {/* garis alur di belakang kartu, hanya desktop */}
      <div className="absolute left-[16.66%] right-[16.66%] top-1/2 hidden -translate-y-1/2 border-t-2 border-dashed border-accent-bright/50 sm:block" aria-hidden="true" />
      <div
        className="flow-runner absolute top-1/2 hidden h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_6px_rgba(34,211,238,0.25)] sm:block"
        style={{ left: "16.66%" }}
        aria-hidden="true"
      />
      <ol className="relative grid gap-5 sm:grid-cols-3 sm:gap-6">
        {steps.map((step, i) => (
          <li
            key={step.title}
            data-step={i}
            data-active={i === 0 ? "true" : "false"}
            className="rounded-2xl border border-border bg-background p-6 transition-all duration-300 data-[active=true]:-translate-y-1 data-[active=true]:border-accent-bright data-[active=true]:shadow-xl data-[active=true]:shadow-cyan-900/10"
          >
            <step.scene />
            <p className="mt-4 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-base font-medium">{step.title}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
