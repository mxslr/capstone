import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

export function IconHand(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M18 11V6.5a1.5 1.5 0 0 0-3 0V11" />
      <path d="M15 10.5V4.5a1.5 1.5 0 0 0-3 0V10" />
      <path d="M12 10V3.5a1.5 1.5 0 0 0-3 0V11" />
      <path d="M9 11V5.5a1.5 1.5 0 0 0-3 0v7.5" />
      <path d="M6 13l-1.6-1.6a1.4 1.4 0 0 0-2 2L7 18.5A6 6 0 0 0 11.5 21h1A5.5 5.5 0 0 0 18 15.5V11" />
    </svg>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8a2 2 0 0 1 2-2h1.5l1.2-1.8A1 1 0 0 1 8.5 4h7a1 1 0 0 1 .8.4L17.5 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

export function IconAvatar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function IconRepeat(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V10a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function IconMic(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4v16h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-8.5" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3Z" />
      <path d="M9.5 12l2 2 3.5-3.5" />
    </svg>
  );
}

export function IconMessage(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 12a8 8 0 0 1-8 8H4l2-3.2A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </svg>
  );
}
