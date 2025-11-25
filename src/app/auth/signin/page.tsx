import type { Metadata } from "next";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Masuk | Aplikasi Hafalan",
  description: "Masuk ke akun hafalan Al-Qur'an Metode 1 Kaca",
};

export default function SignInPage() {
  return <SignInForm />;
}
