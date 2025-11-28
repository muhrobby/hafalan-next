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
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Search,
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { RecentActivityTable } from "@/components/recent-activity-table";
import {
  PageHeader,
  DashboardSkeleton,
  QuickActionCard,
  QuickActionGrid,
} from "@/components/dashboard";
import { StatsCard } from "@/components/analytics";

interface DashboardStats {
  totalSantri: number;
  activeHafalan: number;
  completedToday: number;
  pendingRecheck: number;
  collaborativeSantri: number;
  completedThisWeek: number;
}

interface RecentActivity {
  id: string;
  santriName: string;
  kacaInfo: string;
  status: string;
  timestamp: string;
  teacherName?: string;
}

export default function TeacherDashboard() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["TEACHER"],
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalSantri: 0,
    activeHafalan: 0,
    completedToday: 0,
    pendingRecheck: 0,
    collaborativeSantri: 0,
    completedThisWeek: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchDashboardData = async () => {
      try {
        const [santriResponse, hafalanResponse] = await Promise.all([
          fetch(`/api/users?role=SANTRI&teacherId=${session?.user?.id}`),
          fetch("/api/hafalan?limit=10"),
        ]);

        const santriData = await santriResponse.json();
        const hafalanData = await hafalanResponse.json();

        const mySantris = santriData.data || [];
        const totalSantri = mySantris.length;

        const collaborativeSantri = mySantris.filter((user: any) => {
          const assignments = user.santriProfile?.teacherAssignments || [];
          return assignments.length > 1;
        }).length;

        const today = new Date().toISOString().split("T")[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const completedToday =
          hafalanData.data?.filter(
            (record: any) =>
              record.tanggalSetor.startsWith(today) &&
              record.statusKaca === "COMPLETE_WAITING_RECHECK"
          ).length || 0;

        const completedThisWeek =
          hafalanData.data?.filter(
            (record: any) =>
              record.tanggalSetor >= weekAgo &&
              record.statusKaca === "RECHECK_PASSED"
          ).length || 0;

        const pendingRecheck =
          hafalanData.data?.filter(
            (record: any) => record.statusKaca === "COMPLETE_WAITING_RECHECK"
          ).length || 0;

        setStats({
          totalSantri,
          activeHafalan: hafalanData.data?.length || 0,
          completedToday,
          pendingRecheck,
          collaborativeSantri,
          completedThisWeek,
        });

        const activity =
          hafalanData.data?.slice(0, 5).map((record: any) => ({
            id: record.id,
            santriName: record.santri.user.name,
            kacaInfo: `${record.kaca.surahName} (${record.kaca.pageNumber})`,
            status: record.statusKaca,
            timestamp: new Date(record.createdAt).toLocaleDateString("id-ID"),
            teacherName: record.teacher?.user?.name,
          })) || [];

        setRecentActivity(activity);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthorized, session]);

  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="TEACHER">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const weeklyProgress =
    stats.activeHafalan > 0
      ? Math.round((stats.completedThisWeek / stats.activeHafalan) * 100)
      : 0;

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Guru"
          subtitle="Pantau progress hafalan santri dan kelola aktivitas pembelajaran"
          userName={session?.user.name}
          userRole="TEACHER"
          showGreeting={true}
          showDateTime={true}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Total Santri"
            value={stats.totalSantri}
            description="Santri yang Anda ajar"
            icon={<Users className="h-5 w-5" />}
            color="primary"
          />
          <StatsCard
            title="Hafalan Aktif"
            value={stats.activeHafalan}
            description="Sedang berlangsung"
            icon={<BookOpen className="h-5 w-5" />}
            color="info"
          />
          <StatsCard
            title="Selesai Hari Ini"
            value={stats.completedToday}
            description="Hafalan selesai hari ini"
            icon={<CheckCircle className="h-5 w-5" />}
            color="success"
          />
          <StatsCard
            title="Pending Recheck"
            value={stats.pendingRecheck}
            description="Perlu dicek ulang"
            icon={<AlertCircle className="h-5 w-5" />}
            color={stats.pendingRecheck > 0 ? "warning" : "default"}
          />
        </div>

        {stats.collaborativeSantri > 0 && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">
                    Pengajaran Kolaboratif
                  </h3>
                  <p className="text-sm text-blue-700 mt-0.5">
                    Anda mengajar{" "}
                    <span className="font-bold">{stats.collaborativeSantri} santri</span>{" "}
                    bersama guru lain.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="hidden md:flex" asChild>
                  <Link href="/teacher/santri">
                    Lihat Detail
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Aksi Cepat
              </h2>
              <QuickActionGrid columns={2}>
                <QuickActionCard
                  title="Input Hafalan Baru"
                  description="Catat progress hafalan santri"
                  icon={<BookOpen className="h-5 w-5" />}
                  href="/teacher/hafalan/input"
                  color="emerald"
                />
                <QuickActionCard
                  title="Recheck Hafalan"
                  description="Periksa ulang hafalan"
                  icon={<CheckCircle className="h-5 w-5" />}
                  href="/teacher/hafalan/recheck"
                  color="blue"
                  badge={stats.pendingRecheck > 0 ? `${stats.pendingRecheck}` : undefined}
                />
                <QuickActionCard
                  title="Lihat Raport"
                  description="Analisis progress santri"
                  icon={<ClipboardList className="h-5 w-5" />}
                  href="/teacher/raport"
                  color="purple"
                />
                <QuickActionCard
                  title="Cari Santri"
                  description="Cari data santri tertentu"
                  icon={<Search className="h-5 w-5" />}
                  href="/teacher/santri-lookup"
                  color="amber"
                />
              </QuickActionGrid>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    Aktivitas Terbaru
                  </CardTitle>
                  <CardDescription>
                    Hafalan yang baru saja dicatat
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/teacher/santri">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <RecentActivityTable
                  activities={recentActivity}
                  showSantriName={true}
                  showTeacherName={true}
                  emptyMessage="Belum ada aktivitas hafalan terbaru"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Progress Minggu Ini
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600">
                    {stats.completedThisWeek}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hafalan selesai minggu ini
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{weeklyProgress}%</span>
                  </div>
                  <Progress value={weeklyProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Ringkasan Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Selesai</span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {stats.completedThisWeek}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">Perlu Recheck</span>
                  </div>
                  <span className="font-bold text-amber-600">
                    {stats.pendingRecheck}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Aktif</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {stats.activeHafalan}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-emerald-100 shrink-0">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">
                      Tips Hari Ini
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Lakukan recheck secara berkala untuk memastikan hafalan
                      santri tetap kuat.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
