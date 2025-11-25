import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aplikasi Hafalan Al-Qur'an - Metode 1 Kaca",
  description: "Sistem hafalan Al-Qur'an dengan Metode 1 Kaca yang komprehensif untuk tracking progress santri.",
  keywords: ["Al-Qur'an", "Hafalan", "Metode 1 Kaca", "Santri", "Pendidikan Islam"],
  authors: [{ name: "Tim Pengembang" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Aplikasi Hafalan Al-Qur'an",
    description: "Sistem hafalan Al-Qur'an dengan Metode 1 Kaca",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aplikasi Hafalan Al-Qur'an",
    description: "Sistem hafalan Al-Qur'an dengan Metode 1 Kaca",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
