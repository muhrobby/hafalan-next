"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Palette,
  Menu,
  Save,
  RotateCcw,
  BookOpen,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";

interface AppSettings {
  id: string;
  brandName: string;
  brandTagline: string;
  logoUrl: string | null;
  primaryColor: string;
}

const defaultSettings: AppSettings = {
  id: "app_settings",
  brandName: "Hafalan Al-Qur'an",
  brandTagline: "Metode 1 Kaca",
  logoUrl: null,
  primaryColor: "#059669",
};

const colorPresets = [
  { name: "Emerald", value: "#059669" },
  { name: "Blue", value: "#2563eb" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Rose", value: "#e11d48" },
  { name: "Amber", value: "#d97706" },
  { name: "Teal", value: "#0d9488" },
];

export default function AdminBrandSettingsPage() {
  const { isLoading: authLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchSettings();
    }
  }, [isAuthorized]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat pengaturan",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast({
        title: "Berhasil",
        description: "Pengaturan berhasil disimpan",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan pengaturan",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (authLoading || !isAuthorized) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/admin/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-heading">
              Pengaturan Brand & Menu
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Kustomisasi tampilan dan menu aplikasi
            </p>
          </div>
          {hasChanges && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200"
            >
              Belum Disimpan
            </Badge>
          )}
        </div>

        <Tabs defaultValue="brand" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="brand" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Brand & Tampilan</span>
              <span className="sm:hidden">Brand</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">Visibilitas Menu</span>
              <span className="sm:hidden">Menu</span>
            </TabsTrigger>
          </TabsList>

          {/* Brand Settings Tab */}
          <TabsContent value="brand" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Identitas Brand
                </CardTitle>
                <CardDescription>
                  Kustomisasi nama, tagline, logo, dan warna brand aplikasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo URL */}
                <div className="space-y-2">
                  <Label htmlFor="logoUrl" className="text-sm font-medium">
                    URL Logo (PNG/JPG)
                  </Label>
                  <Input
                    id="logoUrl"
                    value={settings.logoUrl || ""}
                    onChange={(e) =>
                      updateSetting("logoUrl", e.target.value || null)
                    }
                    placeholder="https://example.com/logo.png atau /logo.png"
                    className="max-w-md"
                  />
                  <p className="text-xs text-gray-500">
                    Masukkan URL logo (disarankan format PNG dengan background
                    transparan). Bisa menggunakan path relatif seperti{" "}
                    <code className="bg-gray-100 px-1 rounded">/logo.png</code>{" "}
                    jika logo ada di folder public.
                  </p>
                  {settings.logoUrl && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg inline-block">
                      <p className="text-xs text-gray-500 mb-2">
                        Preview Logo:
                      </p>
                      <img
                        src={settings.logoUrl}
                        alt="Logo preview"
                        className="max-h-16 max-w-32 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Brand Name */}
                <div className="space-y-2">
                  <Label htmlFor="brandName" className="text-sm font-medium">
                    Nama Brand / Aplikasi
                  </Label>
                  <Input
                    id="brandName"
                    value={settings.brandName}
                    onChange={(e) => updateSetting("brandName", e.target.value)}
                    placeholder="Hafalan Al-Qur'an"
                    className="max-w-md"
                  />
                  <p className="text-xs text-gray-500">
                    Nama ini akan tampil di header dan halaman login
                  </p>
                </div>

                <Separator />

                {/* Brand Tagline */}
                <div className="space-y-2">
                  <Label htmlFor="brandTagline" className="text-sm font-medium">
                    Tagline
                  </Label>
                  <Input
                    id="brandTagline"
                    value={settings.brandTagline}
                    onChange={(e) =>
                      updateSetting("brandTagline", e.target.value)
                    }
                    placeholder="Metode 1 Kaca"
                    className="max-w-md"
                  />
                  <p className="text-xs text-gray-500">
                    Deskripsi singkat tentang aplikasi
                  </p>
                </div>

                <Separator />

                {/* Primary Color */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Warna Utama</Label>
                  <div className="flex flex-wrap gap-3">
                    {colorPresets.map((color) => (
                      <button
                        key={color.value}
                        onClick={() =>
                          updateSetting("primaryColor", color.value)
                        }
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          settings.primaryColor === color.value
                            ? "border-gray-900 ring-2 ring-offset-2 ring-gray-400"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          updateSetting("primaryColor", e.target.value)
                        }
                        className="w-10 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) =>
                          updateSetting("primaryColor", e.target.value)
                        }
                        placeholder="#059669"
                        className="w-28 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Preview */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Preview Brand</Label>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      {settings.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt={settings.brandName}
                          className="w-12 h-12 rounded-xl object-contain bg-white p-1 border"
                          onError={(e) => {
                            // Fallback to icon if image fails
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg font-heading">
                          {settings.brandName || "Nama Brand"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {settings.brandTagline || "Tagline"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      style={{ backgroundColor: settings.primaryColor }}
                      className="text-white hover:opacity-90"
                    >
                      Contoh Tombol
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Visibility Tab */}
          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="h-5 w-5" />
                  Konfigurasi Menu
                </CardTitle>
                <CardDescription>
                  Pengaturan visibilitas menu untuk semua role pengguna
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">
                    📝 Konfigurasi Menu di Frontend
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Untuk mengubah visibilitas menu, edit file konfigurasi
                    berikut:
                  </p>
                  <code className="block bg-blue-100 text-blue-800 text-xs p-2 rounded font-mono mb-3">
                    src/config/app-config.ts
                  </code>
                  <p className="text-sm text-blue-700 mb-2">
                    Pada file tersebut, Anda dapat:
                  </p>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>
                      Mengubah{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        enabled: true/false
                      </code>{" "}
                      untuk menampilkan/menyembunyikan menu
                    </li>
                    <li>Mengubah label dan urutan menu</li>
                    <li>Menambah menu baru per role</li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Daftar Menu Aktif per Role
                  </Label>

                  {/* Admin Menus */}
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-2 text-emerald-700">
                      ADMIN
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Dashboard</Badge>
                      <Badge variant="outline">Manajemen User</Badge>
                      <Badge variant="outline">Data Santri</Badge>
                      <Badge variant="outline">Data Guru</Badge>
                      <Badge variant="outline">Rekap Hafalan</Badge>
                      <Badge variant="outline">Cek Progress Santri</Badge>
                      <Badge variant="outline">Analytics</Badge>
                      <Badge variant="outline">Pengaturan</Badge>
                    </div>
                  </div>

                  {/* Teacher Menus */}
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-2 text-blue-700">
                      TEACHER (Guru)
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Dashboard</Badge>
                      <Badge variant="outline">Santri Saya</Badge>
                      <Badge variant="outline">Input Hafalan</Badge>
                      <Badge variant="outline">Recheck Hafalan</Badge>
                      <Badge variant="outline">Cek Progress Santri</Badge>
                      <Badge variant="outline">Raport Santri</Badge>
                    </div>
                  </div>

                  {/* Wali Menus */}
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-2 text-orange-700">
                      WALI (Orang Tua)
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Dashboard</Badge>
                      <Badge variant="outline">Anak Saya</Badge>
                      <Badge variant="outline">Progress Hafalan</Badge>
                      <Badge variant="outline">Laporan</Badge>
                    </div>
                  </div>

                  {/* Santri Menus */}
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-2 text-purple-700">
                      SANTRI
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Dashboard</Badge>
                      <Badge variant="outline">Hafalan Saya</Badge>
                      <Badge variant="outline">Progress</Badge>
                      <Badge variant="outline">Profil</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset ke Default
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
