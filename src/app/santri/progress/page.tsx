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
  ArrowLeft,
  TrendingUp,
  Target,
  Award,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { StatsCard } from "@/components/analytics/stats-card";
import { PageHeaderSimple, DashboardSkeleton } from "@/components/dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ProgressData {
  totalKaca: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheck: number;
  monthlyProgress: { month: string; completed: number }[];
  juzProgress: { juz: number; completed: number; total: number }[];
}

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#6b7280"];

export default function SantriProgressPage() {
  const { isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["SANTRI"],
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData>({
    totalKaca: 0,
    completedKaca: 0,
    inProgressKaca: 0,
    waitingRecheck: 0,
    monthlyProgress: [],
    juzProgress: [],
  });

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/hafalan?limit=200");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        const records = data.data || [];

        const completedKaca = records.filter(
          (r: any) => r.statusKaca === "RECHECK_PASSED"
        ).length;
        const waitingRecheck = records.filter(
          (r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK"
        ).length;
        const inProgressKaca = records.filter(
          (r: any) => r.statusKaca === "PROGRESS"
        ).length;

        const monthlyMap = new Map<string, number>();
        records
          .filter((r: any) => r.statusKaca === "RECHECK_PASSED")
          .forEach((r: any) => {
            const date = new Date(r.tanggalSetor);
            const monthKey = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
          });

        const monthlyProgress = Array.from(monthlyMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-6)
          .map(([month, completed]) => ({
            month: new Date(month + "-01").toLocaleDateString("id-ID", {
              month: "short",
            }),
            completed,
          }));

        const juzMap = new Map<number, { completed: number; total: number }>();
        records.forEach((r: any) => {
          const juz = r.kaca?.juz || 1;
          const current = juzMap.get(juz) || { completed: 0, total: 0 };
          current.total++;
          if (r.statusKaca === "RECHECK_PASSED") current.completed++;
          juzMap.set(juz, current);
        });

        const juzProgress = Array.from(juzMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([juz, data]) => ({
            juz,
            completed: data.completed,
            total: data.total,
          }));

        setProgressData({
          totalKaca: records.length,
          completedKaca,
          inProgressKaca,
          waitingRecheck,
          monthlyProgress,
          juzProgress,
        });
      } catch (error) {
        console.error("Error fetching progress:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data progress",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthorized) fetchProgress();
  }, [toast, isAuthorized]);

  const overallProgress =
    progressData.totalKaca > 0
      ? Math.round((progressData.completedKaca / progressData.totalKaca) * 100)
      : 0;

  const pieData = [
    { name: "Lulus", value: progressData.completedKaca },
    { name: "Menunggu Recheck", value: progressData.waitingRecheck },
    { name: "Sedang Proses", value: progressData.inProgressKaca },
  ].filter((d) => d.value > 0);

  if (isLoading || loading) {
    return (
      <DashboardLayout role="SANTRI">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!isAuthorized) return null;

  return (
    <DashboardLayout role="SANTRI">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/santri">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <PageHeaderSimple
            title="Progress Hafalan"
            subtitle="Pantau perkembangan hafalan Al-Quran Anda"
          />
        </div>

        {/* Overall Progress Card */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Progress Keseluruhan</h3>
                  <p className="text-emerald-100 text-sm">
                    Target pencapaian hafalan
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold">{overallProgress}%</span>
                <p className="text-emerald-100 text-sm mt-1">
                  {progressData.completedKaca} dari {progressData.totalKaca} kaca
                </p>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3 bg-emerald-400/30" />
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Kaca Lulus"
            value={progressData.completedKaca}
            icon={Award}
            gradient="from-emerald-500 to-emerald-600"
            description="Hafalan selesai"
          />
          <StatsCard
            title="Menunggu Recheck"
            value={progressData.waitingRecheck}
            icon={Clock}
            gradient="from-amber-500 to-amber-600"
            description="Perlu direview"
          />
          <StatsCard
            title="Sedang Proses"
            value={progressData.inProgressKaca}
            icon={BookOpen}
            gradient="from-blue-500 to-blue-600"
            description="Dalam hafalan"
          />
          <StatsCard
            title="Total Kaca"
            value={progressData.totalKaca}
            icon={TrendingUp}
            gradient="from-slate-600 to-slate-700"
            description="Semua hafalan"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Progress Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Progress Bulanan</CardTitle>
                  <CardDescription>Jumlah kaca yang lulus per bulan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {progressData.monthlyProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={progressData.monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex flex-col items-center justify-center text-gray-500">
                  <Sparkles className="h-10 w-10 text-gray-300 mb-2" />
                  <p>Belum ada data</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Distribusi Status</CardTitle>
                  <CardDescription>Pembagian status hafalan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex flex-col items-center justify-center text-gray-500">
                  <Sparkles className="h-10 w-10 text-gray-300 mb-2" />
                  <p>Belum ada data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Juz Progress */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Progress per Juz</CardTitle>
                <CardDescription>Perkembangan hafalan berdasarkan juz</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {progressData.juzProgress.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {progressData.juzProgress.map((juz) => {
                  const percent = Math.round((juz.completed / juz.total) * 100);
                  return (
                    <div
                      key={juz.juz}
                      className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-emerald-600">{juz.juz}</span>
                          </div>
                          <span className="font-medium text-gray-900">Juz {juz.juz}</span>
                        </div>
                        <Badge variant={percent === 100 ? "default" : "secondary"} className={percent === 100 ? "bg-emerald-500" : ""}>
                          {percent}%
                        </Badge>
                      </div>
                      <Progress value={percent} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1.5">
                        {juz.completed}/{juz.total} kaca selesai
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Belum Ada Progress
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Mulai setorkan hafalan untuk melihat progress per juz
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
