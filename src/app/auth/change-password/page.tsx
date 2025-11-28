"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "Minimal 8 karakter", validator: (p) => p.length >= 8 },
  {
    label: "Mengandung huruf kapital (A-Z)",
    validator: (p) => /[A-Z]/.test(p),
  },
  { label: "Mengandung huruf kecil (a-z)", validator: (p) => /[a-z]/.test(p) },
  { label: "Mengandung angka (0-9)", validator: (p) => /[0-9]/.test(p) },
];

export default function ChangePasswordPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check if password meets all requirements
  const passwordStrength = passwordRequirements.filter((req) =>
    req.validator(newPassword)
  ).length;
  const passwordProgress =
    (passwordStrength / passwordRequirements.length) * 100;
  const isPasswordValid = passwordStrength === passwordRequirements.length;
  const doPasswordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;

  // Redirect if not authenticated or doesn't need to change password
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // If user doesn't need to change password, redirect to dashboard
    if (!session.user.mustChangePassword) {
      const redirectPath = getRedirectPath(session.user.role);
      router.push(redirectPath);
    }
  }, [session, status, router]);

  const getRedirectPath = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "TEACHER":
        return "/teacher";
      case "WALI":
        return "/wali";
      case "SANTRI":
        return "/santri";
      default:
        return "/";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password belum memenuhi semua persyaratan");
      return;
    }

    if (!doPasswordsMatch) {
      setError("Password dan konfirmasi tidak sama");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengubah password");
      }

      // Update session to reflect password change
      await update({ mustChangePassword: false });

      toast({
        title: "Password Berhasil Diubah",
        description: "Silakan login kembali dengan password baru Anda.",
      });

      // Redirect to appropriate dashboard
      const redirectPath = getRedirectPath(session?.user.role || "");
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If session exists but doesn't need password change, show nothing while redirecting
  if (session && !session.user.mustChangePassword) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Ubah Password</CardTitle>
            <CardDescription className="mt-2">
              Demi keamanan akun Anda, silakan buat password baru yang kuat
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Alert */}
            <Alert className="bg-amber-50 border-amber-200">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Ini adalah login pertama Anda. Silakan buat password baru yang
                aman.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Kekuatan Password
                    </span>
                    <span
                      className={`font-medium ${
                        passwordProgress === 100
                          ? "text-emerald-600"
                          : passwordProgress >= 75
                          ? "text-amber-600"
                          : passwordProgress >= 50
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordProgress === 100
                        ? "Kuat"
                        : passwordProgress >= 75
                        ? "Cukup"
                        : passwordProgress >= 50
                        ? "Sedang"
                        : "Lemah"}
                    </span>
                  </div>
                  <Progress
                    value={passwordProgress}
                    className={`h-2 ${
                      passwordProgress === 100
                        ? "[&>div]:bg-emerald-500"
                        : passwordProgress >= 75
                        ? "[&>div]:bg-amber-500"
                        : passwordProgress >= 50
                        ? "[&>div]:bg-orange-500"
                        : "[&>div]:bg-red-500"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Persyaratan Password:
              </p>
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {req.validator(newPassword) ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  )}
                  <span
                    className={
                      req.validator(newPassword)
                        ? "text-emerald-700"
                        : "text-slate-500"
                    }
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  {doPasswordsMatch ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-600">Password cocok</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Password tidak cocok</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!isPasswordValid || !doPasswordsMatch || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Simpan Password Baru
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
