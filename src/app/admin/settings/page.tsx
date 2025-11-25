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
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Pengaturan
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Konfigurasi sistem aplikasi hafalan
            </p>
          </div>
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
              <div>
                <Label className="text-gray-600">Versi Aplikasi</Label>
                <p className="font-medium">v1.0.0</p>
              </div>
              <div>
                <Label className="text-gray-600">Framework</Label>
                <p className="font-medium">Next.js 15</p>
              </div>
              <div>
                <Label className="text-gray-600">Database</Label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">PostgreSQL</p>
                  <Badge variant="outline" className="text-green-600">
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
              <div className="space-y-0.5">
                <Label>Notifikasi Email</Label>
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
              <div className="space-y-0.5">
                <Label>Auto Recheck Reminder</Label>
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
              <div className="space-y-0.5">
                <Label>Persetujuan Admin</Label>
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
              <div>
                <Label>Backup Terakhir</Label>
                <p className="text-sm text-gray-600">
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
