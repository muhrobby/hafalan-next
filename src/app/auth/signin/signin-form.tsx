"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BookOpen, Eye, EyeOff, Shield, Users } from "lucide-react";
import { useBranding } from "@/hooks/use-branding";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { branding } = useBranding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if the error is about inactive account
        if (result.error.includes("tidak aktif")) {
          setError(result.error);
        } else {
          setError("Email atau password salah");
        }
      } else {
        const session = await getSession();
        if (session) {
          // Check if user must change password first
          if (session.user.mustChangePassword) {
            router.push("/auth/change-password");
            return;
          }

          switch (session.user.role) {
            case "ADMIN":
              router.push("/admin");
              break;
            case "TEACHER":
              router.push("/teacher");
              break;
            case "WALI":
              router.push("/wali");
              break;
            case "SANTRI":
              router.push("/santri");
              break;
            default:
              router.push("/");
          }
        }
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic primary color from branding
  const primaryColor = branding.primaryColor || "#059669";

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Info */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-12"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}99 100%)`,
        }}
      >
        {/* Top - Logo & Brand */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            {branding.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt={branding.brandName}
                width={56}
                height={56}
                className="rounded-xl bg-white/10 p-1"
              />
            ) : (
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">
                {branding.brandName}
              </h1>
              <p className="text-white/80 text-sm">{branding.brandTagline}</p>
            </div>
          </div>
        </div>

        {/* Middle - Feature Highlights */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Sistem Manajemen
              <br />
              <span className="text-white/90">Hafalan Al-Qur&apos;an</span>
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              Platform digital untuk memantau dan mengelola perkembangan hafalan
              santri dengan metode 1 kaca yang teruji efektif.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Tracking Hafalan</h3>
                <p className="text-white/60 text-sm">
                  Pantau progres per ayat & halaman
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Multi Role</h3>
                <p className="text-white/60 text-sm">
                  Admin, Guru, Wali, dan Santri
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Aman & Terpercaya</h3>
                <p className="text-white/60 text-sm">
                  Data tersimpan dengan aman
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - Footer */}
        <div className="text-white/50 text-sm">
          © {new Date().getFullYear()} {branding.brandName}. All rights
          reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={branding.brandName}
                  width={64}
                  height={64}
                  className="rounded-xl"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {branding.brandName}
            </h1>
            <p className="text-gray-600 mt-1">{branding.brandTagline}</p>
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">
                Selamat Datang
              </CardTitle>
              <CardDescription className="text-center">
                Masuk ke akun Anda untuk melanjutkan
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50"
                  >
                    <AlertDescription className="text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-gray-50/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 bg-gray-50/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: primaryColor,
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>
              </CardContent>
            </form>
          </Card>

          {/* Demo Accounts - Only show in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-800 mb-2 text-center">
                🔐 Akun Demo (Development)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-amber-700">
                <div className="bg-white/50 rounded px-2 py-1.5">
                  <span className="font-medium">Admin:</span>
                  <br />
                  admin@hafalan.com
                </div>
                <div className="bg-white/50 rounded px-2 py-1.5">
                  <span className="font-medium">Teacher:</span>
                  <br />
                  teacher@hafalan.com
                </div>
                <div className="bg-white/50 rounded px-2 py-1.5">
                  <span className="font-medium">Wali:</span>
                  <br />
                  wali@hafalan.com
                </div>
                <div className="bg-white/50 rounded px-2 py-1.5">
                  <span className="font-medium">Santri:</span>
                  <br />
                  santri@hafalan.com
                </div>
              </div>
              <p className="text-xs text-amber-600 text-center mt-2">
                Password: <span className="font-mono">[role]123</span>
              </p>
            </div>
          )}

          {/* Footer - Mobile */}
          <p className="lg:hidden text-center text-gray-400 text-xs mt-8">
            © {new Date().getFullYear()} {branding.brandName}
          </p>
        </div>
      </div>
    </div>
  );
}
