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
import {
  BarChart3,
  ArrowLeft,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TimeRangeFilter, getDateRange } from "@/components/time-range-filter";
import { isWithinInterval } from "date-fns";

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    totalSantri: number;
    totalTeachers: number;
    totalWalis: number;
    activeUsers: number;
  };
  hafalanStats: {
    totalRecords: number;
    completedKaca: number;
    waitingRecheck: number;
    inProgress: number;
  };
  monthlyProgress: { month: string; completed: number; new: number }[];
  teacherPerformance: {
    name: string;
    santriCount: number;
    avgProgress: number;
  }[];
}

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#6b7280", "#ef4444"];

export default function AdminAnalyticsPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<{ users: any[]; records: any[] }>({
    users: [],
    records: [],
  });
  
  // Time Range Filter State
  const [timeRange, setTimeRange] = useState("this_month");
  const [dateRangeType, setDateRangeType] = useState<"preset" | "custom">("preset");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userStats: {
      totalUsers: 0,
      totalSantri: 0,
      totalTeachers: 0,
      totalWalis: 0,
      activeUsers: 0,
    },
    hafalanStats: {
      totalRecords: 0,
      completedKaca: 0,
      waitingRecheck: 0,
      inProgress: 0,
    },
    monthlyProgress: [],
    teacherPerformance: [],
  });

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        const [usersResponse, hafalanResponse] = await Promise.all([
          fetch("/api/users?limit=500"),
          fetch("/api/hafalan?limit=500"),
        ]);

        if (!usersResponse.ok || !hafalanResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [usersData, hafalanData] = await Promise.all([
          usersResponse.json(),
          hafalanResponse.json(),
        ]);

        setRawData({
          users: usersData.data || [],
          records: hafalanData.data || [],
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data analytics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthorized, toast]);

  // Filter and compute analytics based on time range
  const filteredAnalytics = useMemo(() => {
    const { users, records } = rawData;
    const dateRange = getDateRange(timeRange, dateRangeType, startDate, endDate);
    
    // Filter records by date range
    const filteredRecords = records.filter((r: any) => {
      const recordDate = new Date(r.tanggalSetor);
      return isWithinInterval(recordDate, { start: dateRange.start, end: dateRange.end });
    });

    // User statistics (not filtered by date)
    const userStats = {
      totalUsers: users.length,
      totalSantri: users.filter((u: any) => u.role === "SANTRI").length,
      totalTeachers: users.filter((u: any) => u.role === "TEACHER").length,
      totalWalis: users.filter((u: any) => u.role === "WALI").length,
      activeUsers: users.filter((u: any) => u.isActive).length,
    };

    // Hafalan statistics (filtered)
    const hafalanStats = {
      totalRecords: filteredRecords.length,
      completedKaca: filteredRecords.filter(
        (r: any) => r.statusKaca === "RECHECK_PASSED"
      ).length,
      waitingRecheck: filteredRecords.filter(
        (r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK"
      ).length,
      inProgress: filteredRecords.filter((r: any) => r.statusKaca === "PROGRESS")
        .length,
    };

    // Monthly progress
    const monthlyMap = new Map<
      string,
      { completed: number; new: number }
    >();
    filteredRecords.forEach((r: any) => {
      const date = new Date(r.tanggalSetor);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const current = monthlyMap.get(monthKey) || { completed: 0, new: 0 };
      current.new++;
      if (r.statusKaca === "RECHECK_PASSED") {
        current.completed++;
      }
      monthlyMap.set(monthKey, current);
    });

    const monthlyProgress = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("id-ID", {
          month: "short",
        }),
        completed: data.completed,
        new: data.new,
      }));

    // Teacher performance
    const teacherMap = new Map<
      string,
      { name: string; santriCount: number; completedCount: number }
    >();
    filteredRecords.forEach((r: any) => {
      if (r.teacher?.user?.name) {
        const teacherName = r.teacher.user.name;
        const current = teacherMap.get(teacherName) || {
          name: teacherName,
          santriCount: 0,
          completedCount: 0,
        };
        current.santriCount++;
        if (r.statusKaca === "RECHECK_PASSED") {
          current.completedCount++;
        }
        teacherMap.set(teacherName, current);
      }
    });

    const teacherPerformance = Array.from(teacherMap.values())
      .map((t) => ({
        name: t.name,
        santriCount: t.santriCount,
        avgProgress:
          t.santriCount > 0
            ? Math.round((t.completedCount / t.santriCount) * 100)
            : 0,
      }))
      .slice(0, 5);

    return {
      userStats,
      hafalanStats,
      monthlyProgress,
      teacherPerformance,
    };
  }, [rawData, timeRange, dateRangeType, startDate, endDate]);

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

  const pieData = [
    { name: "Lulus", value: filteredAnalytics.hafalanStats.completedKaca },
    { name: "Menunggu Recheck", value: filteredAnalytics.hafalanStats.waitingRecheck },
    { name: "Sedang Proses", value: filteredAnalytics.hafalanStats.inProgress },
  ].filter((d) => d.value > 0);

  if (loading) {
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
              Analytics
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Analisis dan statistik lengkap sistem hafalan
            </p>
          </div>
        </div>

        {/* Time Range Filter */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <TimeRangeFilter
              value={timeRange}
              onChange={setTimeRange}
              dateRangeType={dateRangeType}
              onDateRangeTypeChange={setDateRangeType}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              compact={true}
            />
          </CardContent>
        </Card>

        {/* User Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredAnalytics.userStats.totalUsers}
                  </p>
                  <p className="text-xs text-gray-600">Total User</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredAnalytics.userStats.totalSantri}
                  </p>
                  <p className="text-xs text-gray-600">Santri</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredAnalytics.userStats.totalTeachers}
                  </p>
                  <p className="text-xs text-gray-600">Guru</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredAnalytics.userStats.totalWalis}
                  </p>
                  <p className="text-xs text-gray-600">Wali</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredAnalytics.userStats.activeUsers}
                  </p>
                  <p className="text-xs text-gray-600">Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hafalan Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {filteredAnalytics.hafalanStats.totalRecords}
                </p>
                <p className="text-sm text-gray-600">Total Hafalan</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {filteredAnalytics.hafalanStats.completedKaca}
                </p>
                <p className="text-sm text-gray-600">Lulus Recheck</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {filteredAnalytics.hafalanStats.waitingRecheck}
                </p>
                <p className="text-sm text-gray-600">Menunggu Recheck</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {filteredAnalytics.hafalanStats.inProgress}
                </p>
                <p className="text-sm text-gray-600">Sedang Proses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Monthly Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Bulanan</CardTitle>
              <CardDescription>
                Hafalan baru vs yang lulus per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAnalytics.monthlyProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={filteredAnalytics.monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="new" fill="#3b82f6" name="Hafalan Baru" />
                    <Bar dataKey="completed" fill="#10b981" name="Lulus" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Status Hafalan</CardTitle>
              <CardDescription>Pembagian status semua hafalan</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
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
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teacher Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performa Guru</CardTitle>
            <CardDescription>
              Top 5 guru berdasarkan jumlah hafalan yang dibimbing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAnalytics.teacherPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredAnalytics.teacherPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar
                    dataKey="santriCount"
                    fill="#3b82f6"
                    name="Jumlah Hafalan"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                Belum ada data performa guru
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
