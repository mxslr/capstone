import type { SVGProps } from "react";

/* Simbol SAPA: gelombang sapaan, satu gerakan lambaian yang mengalir. */
export function SapaMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="sapa-wave" x1="4" y1="24" x2="28" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E7490" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <path
        d="M4 19.5C7.5 11.5 11 11.5 14 16C17 20.5 20.5 20.5 24 12.5"
        stroke="url(#sapa-wave)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M13 25.5C15.5 21.5 18 21.5 20.5 24"
        stroke="#22D3EE"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="27.2" cy="7.6" r="2.4" fill="#22D3EE" />
    </svg>
  );
}

export function SapaLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SapaMark className="h-7 w-7" />
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">
        SAPA
      </span>
    </span>
  );
}
