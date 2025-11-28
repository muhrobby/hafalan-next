"use client";

import { useRoleGuard } from "@/hooks/use-role-guard";
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
  Clock,
  ArrowRight,
  Eye,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PageHeader,
  DashboardSkeleton,
  QuickActionCard,
  QuickActionGrid,
} from "@/components/dashboard";
import { StatsCard } from "@/components/analytics";

interface Child {
  id: string;
  name: string;
  nis: string;
  totalHafalan: number;
  completedKaca: number;
  lastActivity: string;
}

interface ProgressSummary {
  totalChildren: number;
  activeHafalan: number;
  completedThisMonth: number;
  averageProgress: number;
}

export default function WaliDashboard() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["WALI"],
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary>({
    totalChildren: 0,
    activeHafalan: 0,
    completedThisMonth: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildrenData = async () => {
      try {
        const usersResponse = await fetch(
          `/api/users?role=SANTRI&waliId=${session?.user.waliProfile?.id}`
        );
        const usersData = await usersResponse.json();

        const childrenWithProgress = (usersData.data || []).map(
          (child: any) => ({
            id: child.id,
            name: child.name,
            nis: child.santriProfile?.nis || "",
            totalHafalan: child.totalKaca || 0,
            completedKaca: child.completedKaca || 0,
            lastActivity: child.lastActivityAt
              ? new Date(child.lastActivityAt).toLocaleDateString("id-ID")
              : "Belum ada",
          })
        );

        setChildren(childrenWithProgress);

        const totalChildren = childrenWithProgress.length;
        const activeHafalan = childrenWithProgress.reduce(
          (sum: number, child: Child) => sum + child.totalHafalan,
          0
        );
        const completedThisMonth = childrenWithProgress.reduce(
          (sum: number, child: Child) => sum + child.completedKaca,
          0
        );
        const averageProgress =
          totalChildren > 0
            ? Math.round((completedThisMonth / (activeHafalan || 1)) * 100)
            : 0;

        setProgressSummary({
          totalChildren,
          activeHafalan,
          completedThisMonth,
          averageProgress,
        });
      } catch (error) {
        console.error("Error fetching children data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchChildrenData();
    }
  }, [session]);

  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="WALI">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="WALI">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="WALI">
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Wali"
          subtitle="Pantau perkembangan hafalan anak-anak Anda dengan mudah"
          userName={session?.user.name}
          userRole="WALI"
          showGreeting={true}
          showDateTime={true}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Jumlah Anak"
            value={progressSummary.totalChildren}
            description="Anak terdaftar"
            icon={<Users className="h-5 w-5" />}
            color="info"
          />
          <StatsCard
            title="Hafalan Aktif"
            value={progressSummary.activeHafalan}
            description="Total kaca dipelajari"
            icon={<BookOpen className="h-5 w-5" />}
            color="primary"
          />
          <StatsCard
            title="Kaca Selesai"
            value={progressSummary.completedThisMonth}
            description="Selesai recheck"
            icon={<CheckCircle className="h-5 w-5" />}
            color="success"
          />
          <StatsCard
            title="Rata-rata Progress"
            value={`${progressSummary.averageProgress}%`}
            description="Tingkat penyelesaian"
            icon={<TrendingUp className="h-5 w-5" />}
            color="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    Progress Anak
                  </CardTitle>
                  <CardDescription>
                    Lihat perkembangan hafalan masing-masing anak
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/wali/children">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Belum ada anak yang terdaftar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {children.map((child) => {
                      const progress =
                        child.totalHafalan > 0
                          ? Math.round(
                              (child.completedKaca / child.totalHafalan) * 100
                            )
                          : 0;
                      return (
                        <div
                          key={child.id}
                          className="p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {child.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                NIS: {child.nis}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-emerald-600">
                                {child.completedKaca}/{child.totalHafalan} Kaca
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Aktivitas: {child.lastActivity}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Progress
                              </span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Menu Cepat
              </h2>
              <QuickActionGrid columns={2}>
                <QuickActionCard
                  title="Lihat Anak"
                  description="Detail progress masing-masing anak"
                  icon={<Users className="h-5 w-5" />}
                  href="/wali/children"
                  color="emerald"
                />
                <QuickActionCard
                  title="Progress Hafalan"
                  description="Analisis perkembangan hafalan"
                  icon={<TrendingUp className="h-5 w-5" />}
                  href="/wali/progress"
                  color="blue"
                />
                <QuickActionCard
                  title="Laporan"
                  description="Unduh raport anak"
                  icon={<FileText className="h-5 w-5" />}
                  href="/wali/reports"
                  color="purple"
                />
                <QuickActionCard
                  title="Lihat Detail"
                  description="Cari santri tertentu"
                  icon={<Eye className="h-5 w-5" />}
                  href="/raport/download"
                  color="amber"
                />
              </QuickActionGrid>
            </div>
          </div>

          <div className="space-y-6">
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
                    <span className="text-sm font-medium">Selesai Recheck</span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {progressSummary.completedThisMonth}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Hafalan</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {progressSummary.activeHafalan}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">Dalam Proses</span>
                  </div>
                  <span className="font-bold text-amber-600">
                    {progressSummary.activeHafalan -
                      progressSummary.completedThisMonth}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Rata-rata Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600">
                    {progressSummary.averageProgress}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tingkat penyelesaian semua anak
                  </p>
                </div>
                <Progress
                  value={progressSummary.averageProgress}
                  className="h-3"
                />
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
                      Tips untuk Wali
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Berikan dukungan dan motivasi kepada anak-anak Anda.
                      Muraja'ah bersama di rumah dapat membantu memperkuat hafalan.
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
