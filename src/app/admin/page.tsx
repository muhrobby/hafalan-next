"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  BookOpen,
  TrendingUp,
  Settings,
  UserCheck,
  CheckCircle,
  GraduationCap,
  Activity,
  BarChart3,
  Shield,
  Database,
  Server,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import {
  PageHeader,
  DashboardSkeleton,
  QuickActionCard,
  QuickActionGrid,
} from "@/components/dashboard";
import { StatsCard } from "@/components/analytics";

interface SystemStats {
  totalUsers: number;
  totalSantri: number;
  totalTeachers: number;
  totalWalis: number;
  totalHafalanRecords: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheck: number;
}

interface UserDistribution {
  role: string;
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

export default function AdminDashboard() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalSantri: 0,
    totalTeachers: 0,
    totalWalis: 0,
    totalHafalanRecords: 0,
    completedKaca: 0,
    inProgressKaca: 0,
    waitingRecheck: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const [usersResponse, hafalanResponse] = await Promise.all([
          fetch("/api/users?limit=500"),
          fetch("/api/hafalan?limit=500"),
        ]);

        const usersData = await usersResponse.json();
        const hafalanData = await hafalanResponse.json();

        const users = usersData.data || [];
        const hafalanRecords = hafalanData.data || [];

        setStats({
          totalUsers: users.length,
          totalSantri: users.filter((u: any) => u.role === "SANTRI").length,
          totalTeachers: users.filter((u: any) => u.role === "TEACHER").length,
          totalWalis: users.filter((u: any) => u.role === "WALI").length,
          totalHafalanRecords: hafalanRecords.length,
          completedKaca: hafalanRecords.filter(
            (r: any) => r.statusKaca === "RECHECK_PASSED"
          ).length,
          inProgressKaca: hafalanRecords.filter(
            (r: any) => r.statusKaca === "PROGRESS"
          ).length,
          waitingRecheck: hafalanRecords.filter(
            (r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK"
          ).length,
        });
      } catch (error) {
        console.error("Error fetching system data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session && isAuthorized) {
      fetchSystemData();
    }
  }, [session, isAuthorized]);

  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="ADMIN">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const userDistribution: UserDistribution[] = [
    {
      role: "ADMIN",
      label: "Administrator",
      count: 1,
      color: "bg-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      role: "TEACHER",
      label: "Guru Tahfidz",
      count: stats.totalTeachers,
      color: "bg-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      role: "SANTRI",
      label: "Santri",
      count: stats.totalSantri,
      color: "bg-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      role: "WALI",
      label: "Wali Santri",
      count: stats.totalWalis,
      color: "bg-amber-600",
      bgColor: "bg-amber-100",
    },
  ];

  const completionRate =
    stats.totalHafalanRecords > 0
      ? Math.round((stats.completedKaca / stats.totalHafalanRecords) * 100)
      : 0;

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Dashboard Administrator"
          subtitle="Kelola sistem hafalan Al-Qur'an dengan mudah dan efisien"
          userName={session?.user.name}
          userRole="ADMIN"
          showGreeting={true}
          showDateTime={true}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Total Pengguna"
            value={stats.totalUsers}
            description="Semua pengguna aktif"
            icon={<Users className="h-5 w-5" />}
            color="info"
          />
          <StatsCard
            title="Total Santri"
            value={stats.totalSantri}
            description="Santri terdaftar"
            icon={<GraduationCap className="h-5 w-5" />}
            color="primary"
          />
          <StatsCard
            title="Total Hafalan"
            value={stats.totalHafalanRecords}
            description="Record hafalan"
            icon={<BookOpen className="h-5 w-5" />}
            color="success"
          />
          <StatsCard
            title="Kaca Selesai"
            value={stats.completedKaca}
            description={`${completionRate}% completion rate`}
            icon={<CheckCircle className="h-5 w-5" />}
            color="success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Distribution */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Distribusi Pengguna
              </CardTitle>
              <CardDescription>
                Breakdown pengguna berdasarkan peran dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {userDistribution.map((item) => {
                  const percentage =
                    stats.totalUsers > 0
                      ? Math.round((item.count / stats.totalUsers) * 100)
                      : 0;
                  return (
                    <div key={item.role} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${item.color}`}
                          />
                          <span className="font-medium text-gray-900">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {item.count}
                          </span>
                          <span className="text-gray-500">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Hafalan Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                Status Hafalan
              </CardTitle>
              <CardDescription>
                Ringkasan status hafalan saat ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">
                    Selesai
                  </span>
                </div>
                <span className="text-lg font-bold text-emerald-600">
                  {stats.completedKaca}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Berlangsung
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {stats.inProgressKaca}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">
                    Menunggu Recheck
                  </span>
                </div>
                <span className="text-lg font-bold text-amber-600">
                  {stats.waitingRecheck}
                </span>
              </div>

              {/* Completion Rate */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Tingkat Penyelesaian
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {completionRate}%
                  </span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Menu Cepat
          </h2>
          <QuickActionGrid columns={3}>
            <QuickActionCard
              title="Manajemen User"
              description="Kelola semua pengguna sistem"
              icon={<Users className="h-5 w-5" />}
              href="/admin/users"
              color="purple"
            />
            <QuickActionCard
              title="Data Santri"
              description="Lihat dan kelola data santri"
              icon={<GraduationCap className="h-5 w-5" />}
              href="/admin/santri"
              color="emerald"
            />
            <QuickActionCard
              title="Data Guru"
              description="Kelola guru tahfidz"
              icon={<UserCheck className="h-5 w-5" />}
              href="/admin/guru"
              color="blue"
            />
            <QuickActionCard
              title="Rekap Hafalan"
              description="Lihat semua record hafalan"
              icon={<BookOpen className="h-5 w-5" />}
              href="/admin/hafalan"
              color="emerald"
            />
            <QuickActionCard
              title="Analytics"
              description="Analisis dan statistik lengkap"
              icon={<BarChart3 className="h-5 w-5" />}
              href="/admin/analytics"
              color="amber"
            />
            <QuickActionCard
              title="Pengaturan"
              description="Konfigurasi sistem"
              icon={<Settings className="h-5 w-5" />}
              href="/admin/settings"
              color="rose"
            />
          </QuickActionGrid>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Status Sistem
            </CardTitle>
            <CardDescription>
              Monitoring kesehatan sistem secara real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="p-2 rounded-full bg-emerald-100">
                  <Database className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Database</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm text-emerald-600">Terhubung</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="p-2 rounded-full bg-blue-100">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Authentication</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm text-blue-600">Aktif</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                <div className="p-2 rounded-full bg-purple-100">
                  <Server className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">API Services</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-sm text-purple-600">Berjalan</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
