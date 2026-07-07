"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/*
 * Tangan 21 titik landmark yang melambai dan berganti pose isyarat
 * (terbuka, huruf V, mengepal) seperti fingerspelling sungguhan.
 * Topologi sama dengan keluaran MediaPipe Hand Landmarker.
 */

type Pose = Array<[number, number]>;

const OPEN: Pose = [
  [150, 270],
  [113, 243],
  [88, 213],
  [72, 185],
  [60, 160],
  [118, 172],
  [108, 130],
  [102, 103],
  [97, 78],
  [145, 165],
  [143, 117],
  [142, 87],
  [141, 58],
  [172, 170],
  [176, 125],
  [179, 97],
  [182, 70],
  [198, 182],
  [207, 147],
  [212, 124],
  [217, 100],
];

/* Mengepal: semua jari terlipat ke arah telapak, ibu jari menyilang. */
const FIST: Pose = [
  [150, 270],
  [115, 241],
  [102, 216],
  [98, 196],
  [112, 180],
  [118, 172],
  [114, 144],
  [116, 166],
  [118, 184],
  [145, 165],
  [143, 136],
  [144, 160],
  [145, 178],
  [172, 170],
  [174, 142],
  [175, 164],
  [175, 182],
  [198, 182],
  [204, 158],
  [206, 176],
  [206, 190],
];

/* Huruf V: telunjuk dan jari tengah terbuka, sisanya terlipat. */
const VSIGN: Pose = [
  [150, 270],
  [114, 242],
  [100, 214],
  [98, 198],
  [118, 192],
  [118, 172],
  [106, 130],
  [98, 102],
  [90, 76],
  [145, 165],
  [148, 116],
  [151, 86],
  [154, 56],
  [172, 170],
  [174, 142],
  [175, 164],
  [175, 182],
  [198, 182],
  [204, 158],
  [206, 176],
  [206, 190],
];

const connections: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const TIPS = new Set([0, 4, 8, 12, 16, 20]);

export function AnimatedHand({ className }: { className?: string }) {
  const groupRef = useRef<SVGGElement>(null);
  const circleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* posisi saat ini, dimutasi oleh tween lalu dipatch langsung ke atribut SVG */
    const current: Pose = OPEN.map(([x, y]) => [x, y]);

    const apply = () => {
      current.forEach(([x, y], i) => {
        const c = circleRefs.current[i];
        if (c) {
          c.setAttribute("cx", String(x));
          c.setAttribute("cy", String(y));
        }
      });
      connections.forEach(([a, b], i) => {
        const l = lineRefs.current[i];
        if (l) {
          l.setAttribute("x1", String(current[a][0]));
          l.setAttribute("y1", String(current[a][1]));
          l.setAttribute("x2", String(current[b][0]));
          l.setAttribute("y2", String(current[b][1]));
        }
      });
    };

    const morphTo = (target: Pose) => {
      const flat: Record<string, number> = {};
      target.forEach(([x, y], i) => {
        flat[`x${i}`] = x;
        flat[`y${i}`] = y;
      });
      const proxy: Record<string, number> = {};
      current.forEach(([x, y], i) => {
        proxy[`x${i}`] = x;
        proxy[`y${i}`] = y;
      });
      return gsap.to(proxy, {
        ...flat,
        duration: 0.7,
        ease: "power2.inOut",
        onUpdate: () => {
          for (let i = 0; i < current.length; i++) {
            current[i][0] = proxy[`x${i}`];
            current[i][1] = proxy[`y${i}`];
          }
          apply();
        },
      });
    };

    const ctx = gsap.context(() => {
      /* lambaian: seluruh tangan berayun di pergelangan */
      gsap.to(group, {
        rotation: 9,
        svgOrigin: "150 270",
        duration: 1.1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      /* pergantian pose isyarat: terbuka -> V -> kepal -> terbuka */
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
      tl.add(morphTo(VSIGN), "+=1.1")
        .add(morphTo(FIST), "+=1.1")
        .add(morphTo(OPEN), "+=1.1");
    }, group);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      viewBox="0 0 300 320"
      className={className}
      role="img"
      aria-label="Tangan 21 titik landmark memperagakan pose isyarat bergantian"
    >
      <g ref={groupRef}>
        {connections.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            x1={OPEN[a][0]}
            y1={OPEN[a][1]}
            x2={OPEN[b][0]}
            y2={OPEN[b][1]}
            stroke="var(--border)"
            strokeWidth={1.5}
          />
        ))}
        {OPEN.map(([x, y], i) => (
          <circle
            key={i}
            ref={(el) => {
              circleRefs.current[i] = el;
            }}
            cx={x}
            cy={y}
            r={i === 0 ? 5 : 3.5}
            fill={TIPS.has(i) ? "var(--accent)" : "var(--background)"}
            stroke="var(--accent)"
            strokeWidth={1.5}
          />
        ))}
      </g>
    </svg>
  );
}
