import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun KawanTuli dan mulai belajar BISINDO.",
};

export default function DaftarPage() {
  return <RegisterForm />;
}
