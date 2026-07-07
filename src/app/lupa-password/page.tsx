import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Lupa password",
  description: "Atur ulang password akun SAPA dengan kode OTP yang dikirim ke email.",
};

export default function LupaPasswordPage() {
  return <ResetForm />;
}
