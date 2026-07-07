import type { Metadata } from "next";
import { AccountSettings } from "./account-settings";

export const metadata: Metadata = {
  title: "Pengaturan akun",
  description: "Kelola profil dan password akun SAPA kamu.",
};

export default function AkunPage() {
  return <AccountSettings />;
}
