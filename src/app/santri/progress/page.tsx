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
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";
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
  const { session, isLoading, isAuthorized } = useRoleGuard({
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

        // Calculate statistics
        const completedKaca = records.filter(
          (r: any) => r.statusKaca === "RECHECK_PASSED"
        ).length;
        const waitingRecheck = records.filter(
          (r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK"
        ).length;
        const inProgressKaca = records.filter(
          (r: any) => r.statusKaca === "PROGRESS"
        ).length;

        // Calculate monthly progress
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

        // Calculate juz progress
        const juzMap = new Map<number, { completed: number; total: number }>();
        records.forEach((r: any) => {
          const juz = r.kaca?.juz || 1;
          const current = juzMap.get(juz) || { completed: 0, total: 0 };
          current.total++;
          if (r.statusKaca === "RECHECK_PASSED") {
            current.completed++;
          }
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

    fetchProgress();
  }, [toast]);

  const overallProgress =
    progressData.totalKaca > 0
      ? Math.round((progressData.completedKaca / progressData.totalKaca) * 100)
      : 0;

  const pieData = [
    { name: "Lulus", value: progressData.completedKaca },
    { name: "Menunggu Recheck", value: progressData.waitingRecheck },
    { name: "Sedang Proses", value: progressData.inProgressKaca },
  ].filter((d) => d.value > 0);

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

  return (
    <DashboardLayout role="SANTRI">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/santri">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Progress Hafalan
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Pantau perkembangan hafalan Al-Quran Anda
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progress Keseluruhan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-600">
                  {overallProgress}%
                </span>
                <Badge variant="outline">
                  {progressData.completedKaca} dari {progressData.totalKaca}{" "}
                  kaca
                </Badge>
              </div>
              <Progress value={overallProgress} className="h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.completedKaca}
                  </p>
                  <p className="text-xs text-gray-600">Kaca Lulus</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.waitingRecheck}
                  </p>
                  <p className="text-xs text-gray-600">Menunggu Recheck</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.inProgressKaca}
                  </p>
                  <p className="text-xs text-gray-600">Sedang Proses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.totalKaca}
                  </p>
                  <p className="text-xs text-gray-600">Total Kaca</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Monthly Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Bulanan</CardTitle>
              <CardDescription>
                Jumlah kaca yang lulus per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressData.monthlyProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={progressData.monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Status</CardTitle>
              <CardDescription>Pembagian status hafalan</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Juz Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress per Juz</CardTitle>
            <CardDescription>
              Perkembangan hafalan berdasarkan juz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {progressData.juzProgress.length > 0 ? (
              <div className="space-y-3">
                {progressData.juzProgress.map((juz) => (
                  <div key={juz.juz}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Juz {juz.juz}</span>
                      <span className="text-xs text-gray-600">
                        {juz.completed}/{juz.total} kaca
                      </span>
                    </div>
                    <Progress
                      value={(juz.completed / juz.total) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Belum ada data progress
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
