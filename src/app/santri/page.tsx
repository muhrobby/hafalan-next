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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  TrendingUp,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  Award,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { RecentActivityTable } from "@/components/recent-activity-table";

interface HafalanSummary {
  totalKaca: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheck: number;
  currentKaca?: {
    id: string;
    surahName: string;
    pageNumber: number;
    ayatStart: number;
    ayatEnd: number;
    progress: number;
  };
}

interface RecentActivity {
  id: string;
  kacaInfo: string;
  status: string;
  timestamp: string;
  catatan?: string;
}

export default function SantriDashboard() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["SANTRI"],
  });
  const [hafalanSummary, setHafalanSummary] = useState<HafalanSummary>({
    totalKaca: 0,
    completedKaca: 0,
    inProgressKaca: 0,
    waitingRecheck: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSantriData = async () => {
      try {
        // Fetch hafalan records for this santri - API filters by santriId
        const hafalanResponse = await fetch(
          `/api/hafalan?santriId=${session?.user.santriProfile?.id}`
        );
        const hafalanData = await hafalanResponse.json();

        const santriRecords = hafalanData.data || [];

        const totalKaca = santriRecords.length;
        const completedKaca = santriRecords.filter(
          (record: any) => record.statusKaca === "RECHECK_PASSED"
        ).length;
        const inProgressKaca = santriRecords.filter(
          (record: any) => record.statusKaca === "PROGRESS"
        ).length;
        const waitingRecheck = santriRecords.filter(
          (record: any) => record.statusKaca === "COMPLETE_WAITING_RECHECK"
        ).length;

        // Find current kaca (the one in progress or waiting recheck)
        const currentRecord = santriRecords.find((record: any) =>
          ["PROGRESS", "COMPLETE_WAITING_RECHECK"].includes(record.statusKaca)
        );

        let currentKaca: HafalanSummary["currentKaca"] = undefined;
        if (currentRecord) {
          const completedVerses = JSON.parse(currentRecord.completedVerses);
          const totalVerses =
            currentRecord.kaca.ayatEnd - currentRecord.kaca.ayatStart + 1;
          const progress = Math.round(
            (completedVerses.length / totalVerses) * 100
          );

          currentKaca = {
            id: currentRecord.id,
            surahName: currentRecord.kaca.surahName,
            pageNumber: currentRecord.kaca.pageNumber,
            ayatStart: currentRecord.kaca.ayatStart,
            ayatEnd: currentRecord.kaca.ayatEnd,
            progress,
          };
        }

        setHafalanSummary({
          totalKaca,
          completedKaca,
          inProgressKaca,
          waitingRecheck,
          currentKaca,
        });

        // Prepare recent activity
        const activity = santriRecords.slice(0, 5).map((record: any) => ({
          id: record.id,
          kacaInfo: `${record.kaca.surahName} (Hal. ${record.kaca.pageNumber})`,
          status: record.statusKaca,
          timestamp: new Date(record.createdAt).toLocaleDateString("id-ID"),
          catatan: record.catatan,
        }));

        setRecentActivity(activity);
      } catch (error) {
        console.error("Error fetching santri data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchSantriData();
    }
  }, [session]);

  // Authorization check
  if (isLoading) {
    return (
      <DashboardLayout role="SANTRI">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect via useRoleGuard
  }

  if (loading) {
    return (
      <DashboardLayout role="SANTRI">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const overallProgress =
    hafalanSummary.totalKaca > 0
      ? Math.round(
          (hafalanSummary.completedKaca / hafalanSummary.totalKaca) * 100
        )
      : 0;

  return (
    <DashboardLayout role="SANTRI">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard Santri
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Selamat datang, {session?.user.name}! Terus semangat dalam menghafal
            Al-Qur'an.
          </p>
        </div>

        {/* Progress Overview - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total Kaca
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {hafalanSummary.totalKaca}
              </div>
              <p className="text-xs text-muted-foreground">Kaca dipelajari</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Selesai
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {hafalanSummary.completedKaca}
              </div>
              <p className="text-xs text-muted-foreground">Kaca selesai</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {hafalanSummary.inProgressKaca}
              </div>
              <p className="text-xs text-muted-foreground">Sedang dihafal</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Progress Total
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {overallProgress}%
              </div>
              <Progress value={overallProgress} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>

        {/* Current Kaca */}
        {hafalanSummary.currentKaca && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                <span>Kaca Saat Ini</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Fokus pada kaca ini hingga selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-base sm:text-lg truncate">
                      {hafalanSummary.currentKaca.surahName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Halaman {hafalanSummary.currentKaca.pageNumber} | Ayat{" "}
                      {hafalanSummary.currentKaca.ayatStart} -{" "}
                      {hafalanSummary.currentKaca.ayatEnd}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs sm:text-sm w-max">
                    {hafalanSummary.currentKaca.progress}% Selesai
                  </Badge>
                </div>

                <Progress
                  value={hafalanSummary.currentKaca.progress}
                  className="h-2 sm:h-3"
                />

                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <p>
                    💡 Tips: Fokus pada satu ayat hingga lancar, kemudian lanjut
                    ke ayat berikutnya.
                  </p>
                  <p>
                    Jangan terburu-buru, kualitas lebih penting dari kecepatan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-base">
                <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="truncate">Hafalan Saya</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Lihat semua progress hafalan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full text-xs sm:text-sm h-9 sm:h-10">
                <Link href="/santri/hafalan">Lihat Hafalan</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-base">
                <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="truncate">Progress Detail</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Analisis progress per surah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="w-full text-xs sm:text-sm h-9 sm:h-10"
              >
                <Link href="/santri/progress">Lihat Progress</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-base">
                <Award className="h-4 w-4 text-purple-600 shrink-0" />
                <span className="truncate">Profil</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Update data pribadi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="w-full text-xs sm:text-sm h-9 sm:h-10"
              >
                <Link href="/santri/profile">Edit Profil</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Aktivitas Terbaru
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Riwayat hafalan terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityTable
              activities={recentActivity}
              showSantriName={false}
              showTeacherName={false}
              emptyMessage="Belum ada aktivitas hafalan. Mulai hafalan kaca pertama Anda hari ini!"
            />
          </CardContent>
        </Card>

        {/* Motivational Quote */}
        <Card className="bg-linear-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-600 mx-auto mb-2 sm:mb-4" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                "Sesungguhnya yang paling baik di antara kamu adalah orang yang
                belajar Al-Qur'an dan mengajarkannya."
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">- HR. Bukhari</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
