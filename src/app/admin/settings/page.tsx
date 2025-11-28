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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  ArrowLeft,
  Bell,
  Shield,
  Database,
  Info,
  Palette,
  Menu,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";

export default function AdminSettingsPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoRecheck: false,
    requireApproval: true,
  });

  const handleSaveSettings = () => {
    toast({
      title: "Pengaturan Disimpan",
      description: "Pengaturan sistem berhasil diperbarui",
    });
  };

  // Show loading while checking authorization
  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-heading">
              Pengaturan
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Konfigurasi sistem aplikasi hafalan
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/settings/brand">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-emerald-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-100">
                      <Palette className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Brand & Tampilan</h3>
                      <p className="text-sm text-gray-500">Kustomisasi nama, warna, dan logo</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings/brand">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-emerald-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Menu className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Visibilitas Menu</h3>
                      <p className="text-sm text-gray-500">Tampilkan/sembunyikan menu</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-gray-600 text-sm">Versi Aplikasi</Label>
                <p className="font-medium">v1.0.0</p>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-600 text-sm">Framework</Label>
                <p className="font-medium">Next.js 15</p>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-600 text-sm">Database</Label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">PostgreSQL</p>
                  <Badge variant="outline" className="text-green-600 bg-green-50">
                    Connected
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Pengaturan Notifikasi
            </CardTitle>
            <CardDescription>
              Konfigurasi notifikasi untuk pengguna sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Notifikasi Email</Label>
                <p className="text-sm text-gray-600">
                  Kirim notifikasi melalui email kepada wali
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Auto Recheck Reminder</Label>
                <p className="text-sm text-gray-600">
                  Ingatkan guru untuk melakukan recheck otomatis
                </p>
              </div>
              <Switch
                checked={settings.autoRecheck}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoRecheck: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Pengaturan Keamanan
            </CardTitle>
            <CardDescription>
              Konfigurasi keamanan dan akses pengguna
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Persetujuan Admin</Label>
                <p className="text-sm text-gray-600">
                  Memerlukan persetujuan admin untuk menghapus data
                </p>
              </div>
              <Switch
                checked={settings.requireApproval}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requireApproval: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Pengaturan Database
            </CardTitle>
            <CardDescription>Backup dan maintenance database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-gray-600 text-sm">Backup Terakhir</Label>
                <p className="font-medium text-sm">
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full md:w-auto">
                  <Database className="h-4 w-4 mr-2" />
                  Backup Manual
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="w-full md:w-auto">
            <Settings className="h-4 w-4 mr-2" />
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
