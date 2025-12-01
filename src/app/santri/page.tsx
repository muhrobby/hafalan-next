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
  Target,
  Clock,
  CheckCircle,
  Award,
  ArrowRight,
  Sparkles,
  User,
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
import { LinearProgressCard } from "@/components/analytics/progress-gauge";

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
        const hafalanResponse = await fetch(
          `/api/hafalan?santriId=${session?.user.santriProfile?.id}&limit=500`
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

  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="SANTRI">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="SANTRI">
        <DashboardSkeleton />
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
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Santri"
          subtitle="Terus semangat dalam menghafal Al-Qur'an. Istiqomah adalah kunci!"
          userName={session?.user.name}
          userRole="SANTRI"
          showGreeting={true}
          showDateTime={true}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Total Kaca"
            value={hafalanSummary.totalKaca}
            description="Kaca dipelajari"
            icon={<BookOpen className="h-5 w-5" />}
            color="info"
          />
          <StatsCard
            title="Selesai"
            value={hafalanSummary.completedKaca}
            description="Kaca selesai recheck"
            icon={<CheckCircle className="h-5 w-5" />}
            color="success"
          />
          <StatsCard
            title="Sedang Dihafal"
            value={hafalanSummary.inProgressKaca}
            description="Kaca dalam proses"
            icon={<Clock className="h-5 w-5" />}
            color="warning"
          />
          <StatsCard
            title="Progress Total"
            value={`${overallProgress}%`}
            description="Tingkat penyelesaian"
            icon={<TrendingUp className="h-5 w-5" />}
            color="primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {hafalanSummary.currentKaca && (
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-600" />
                    Fokus Kaca Saat Ini
                  </CardTitle>
                  <CardDescription>
                    Fokus pada kaca ini hingga selesai
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-emerald-900">
                        {hafalanSummary.currentKaca.surahName}
                      </h3>
                      <p className="text-sm text-emerald-700">
                        Halaman {hafalanSummary.currentKaca.pageNumber} | Ayat{" "}
                        {hafalanSummary.currentKaca.ayatStart} -{" "}
                        {hafalanSummary.currentKaca.ayatEnd}
                      </p>
                    </div>
                    <Badge className="bg-emerald-600 hover:bg-emerald-700">
                      {hafalanSummary.currentKaca.progress}% Selesai
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">Progress Ayat</span>
                      <span className="font-medium text-emerald-900">
                        {hafalanSummary.currentKaca.progress}%
                      </span>
                    </div>
                    <Progress
                      value={hafalanSummary.currentKaca.progress}
                      className="h-3"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-white/60 border border-emerald-100">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
                      <p className="text-sm text-emerald-800">
                        Tips: Fokus pada satu ayat hingga lancar, kemudian
                        lanjut ke ayat berikutnya. Kualitas lebih penting dari
                        kecepatan.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Menu Cepat
              </h2>
              <QuickActionGrid columns={2}>
                <QuickActionCard
                  title="Hafalan Saya"
                  description="Lihat semua progress hafalan"
                  icon={<BookOpen className="h-5 w-5" />}
                  href="/santri/hafalan"
                  color="emerald"
                />
                <QuickActionCard
                  title="Progress Detail"
                  description="Analisis progress per surah"
                  icon={<TrendingUp className="h-5 w-5" />}
                  href="/santri/progress"
                  color="blue"
                />
                <QuickActionCard
                  title="Edit Profil"
                  description="Update data pribadi"
                  icon={<User className="h-5 w-5" />}
                  href="/santri/profile"
                  color="purple"
                />
              </QuickActionGrid>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Aktivitas Terbaru</CardTitle>
                  <CardDescription>Riwayat hafalan terakhir</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/santri/hafalan">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <RecentActivityTable
                  activities={recentActivity}
                  showSantriName={false}
                  showTeacherName={false}
                  emptyMessage="Belum ada aktivitas hafalan. Mulai hafalan kaca pertama!"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <LinearProgressCard
              title="Progress Keseluruhan"
              value={overallProgress}
              color="success"
              description={`${hafalanSummary.completedKaca} dari ${hafalanSummary.totalKaca} kaca selesai`}
            />

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
                    {hafalanSummary.completedKaca}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">
                      Menunggu Recheck
                    </span>
                  </div>
                  <span className="font-bold text-amber-600">
                    {hafalanSummary.waitingRecheck}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Dalam Proses</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {hafalanSummary.inProgressKaca}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <Award className="h-10 w-10 mx-auto text-amber-300" />
                  <blockquote className="text-sm italic">
                    "Sesungguhnya yang paling baik di antara kamu adalah orang
                    yang belajar Al-Qur'an dan mengajarkannya."
                  </blockquote>
                  <p className="text-xs text-emerald-200">- HR. Bukhari</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
