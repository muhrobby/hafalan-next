import type { Metadata } from "next";
import { Poppins, Inter, Cinzel, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        className={`${poppins.variable} ${inter.variable} ${cinzel.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
