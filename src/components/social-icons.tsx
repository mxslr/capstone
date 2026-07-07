import type { SVGProps } from "react";

/* Icon brand social media, digambar segaris dengan gaya lucide (stroke 2, 24px). */

function base(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <path d="M18.9 1.2h3.7l-8.2 9.4 9.6 12.2h-7.6l-5.9-7.7-6.8 7.7H.1l8.8-10L0 1.2h7.8l5.3 7 5.8-7z" />
    </svg>
  );
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v2" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
