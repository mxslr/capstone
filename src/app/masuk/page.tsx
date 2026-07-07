import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun KawanTuli untuk melanjutkan belajar BISINDO.",
};

export default function MasukPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
