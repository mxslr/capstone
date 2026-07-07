/* Wrapper tipis di atas lucide-react agar seluruh app memakai satu icon pack. */
import type { ComponentType } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Camera,
  Check,
  Hand,
  Menu,
  MessageSquareText,
  Mic,
  PersonStanding,
  RefreshCw,
  ShieldCheck,
  X,
  type LucideProps,
} from "lucide-react";

function make(Icon: ComponentType<LucideProps>) {
  function Wrapped(props: LucideProps) {
    return <Icon size={20} strokeWidth={1.75} aria-hidden="true" {...props} />;
  }
  return Wrapped;
}

export const IconHand = make(Hand);
export const IconCamera = make(Camera);
export const IconAvatar = make(PersonStanding);
export const IconRepeat = make(RefreshCw);
export const IconMic = make(Mic);
export const IconChart = make(BarChart3);
export const IconShield = make(ShieldCheck);
export const IconMessage = make(MessageSquareText);
export const IconArrowRight = make(ArrowRight);
export const IconMenu = make(Menu);
export const IconClose = make(X);
export const IconCheck = make(Check);
export const IconBook = make(BookOpen);
