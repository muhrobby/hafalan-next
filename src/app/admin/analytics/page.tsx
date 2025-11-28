"use client";

/**
 * Professional Analytics Page
 * Dashboard analytics dengan visualisasi data profesional
 */

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  ArrowLeft,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Target,
  Activity,
  RefreshCw,
  Download,
  GraduationCap,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { TimeRangeFilter, getDateRange } from "@/components/time-range-filter";
import { isWithinInterval, format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Types
interface AnalyticsData {
  userStats: {
    totalUsers: number;
    totalSantri: number;
    totalTeachers: number;
    totalWalis: number;
    activeUsers: number;
    newThisMonth: number;
  };
  hafalanStats: {
    totalRecords: number;
    completedKaca: number;
    waitingRecheck: number;
    inProgress: number;
    avgCompletionRate: number;
    todayRecords: number;
    weeklyRecords: number;
  };
  monthlyProgress: { month: string; completed: number; new: number; recheck: number }[];
  weeklyActivity: { day: string; hafalan: number; recheck: number }[];
  teacherPerformance: {
    name: string;
    santriCount: number;
    completedCount: number;
    efficiency: number;
  }[];
  topSantri: {
    name: string;
    completedKaca: number;
    progress: number;
    lastActivity: string;
  }[];
  juzDistribution: { name: string; value: number }[];
}

// Constants
const CHART_COLORS = {
  primary: "#10b981",
  secondary: "#3b82f6",
  warning: "#f59e0b",
  muted: "#6b7280",
  purple: "#8b5cf6",
};

const STATUS_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.warning,
  CHART_COLORS.secondary,
  CHART_COLORS.muted,
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Stats Card Component
function StatsCard({ title, value, description, icon, trend, color = "default", loading }: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number };
  color?: "default" | "success" | "warning" | "info" | "primary";
  loading?: boolean;
}) {
  const colorClasses = {
    default: "bg-gray-100 text-gray-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-amber-100 text-amber-600",
    info: "bg-blue-100 text-blue-600",
    primary: "bg-emerald-100 text-emerald-600",
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", colorClasses[color])}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-600" : "text-gray-500"
            )}>
              {trend.value > 0 ? <TrendingUp className="h-4 w-4" /> : trend.value < 0 ? <TrendingDown className="h-4 w-4" /> : null}
              <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Progress Ring Component
function ProgressRing({ value, size = 120, strokeWidth = 10, color = CHART_COLORS.primary }: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle className="text-gray-200" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle className="transition-all duration-500 ease-out" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke={color} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{value}%</span>
      </div>
    </div>
  );
}

// Main Component
export default function AdminAnalyticsPage() {
  const { isLoading, isAuthorized } = useRoleGuard({ allowedRoles: ["ADMIN"] });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawData, setRawData] = useState<{ users: any[]; records: any[] }>({ users: [], records: [] });
  const [timeRange, setTimeRange] = useState("this_month");
  const [dateRangeType, setDateRangeType] = useState<"preset" | "custom">("preset");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [usersResponse, hafalanResponse] = await Promise.all([
        fetch("/api/users?limit=500"),
        fetch("/api/hafalan?limit=500"),
      ]);

      if (!usersResponse.ok || !hafalanResponse.ok) throw new Error("Failed to fetch data");

      const [usersData, hafalanData] = await Promise.all([usersResponse.json(), hafalanResponse.json()]);
      setRawData({ users: usersData.data || [], records: hafalanData.data || [] });

      if (showRefresh) toast({ title: "Data Diperbarui", description: "Analytics berhasil dimuat ulang" });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({ title: "Error", description: "Gagal memuat data analytics", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchData();
  }, [isAuthorized, fetchData]);

  const analytics = useMemo((): AnalyticsData => {
    const { users, records } = rawData;
    const dateRange = getDateRange(timeRange, dateRangeType, startDate, endDate);
    const today = new Date();
    const weekAgo = subDays(today, 7);
    
    const filteredRecords = records.filter((r: any) => {
      const recordDate = new Date(r.tanggalSetor);
      return isWithinInterval(recordDate, { start: dateRange.start, end: dateRange.end });
    });

    const todayRecords = records.filter((r: any) => new Date(r.tanggalSetor).toDateString() === today.toDateString());
    const weeklyRecords = records.filter((r: any) => isWithinInterval(new Date(r.tanggalSetor), { start: weekAgo, end: today }));

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const newUsers = users.filter((u: any) => new Date(u.createdAt) >= thisMonthStart);

    const userStats = {
      totalUsers: users.length,
      totalSantri: users.filter((u: any) => u.role === "SANTRI").length,
      totalTeachers: users.filter((u: any) => u.role === "TEACHER").length,
      totalWalis: users.filter((u: any) => u.role === "WALI").length,
      activeUsers: users.filter((u: any) => u.isActive).length,
      newThisMonth: newUsers.length,
    };

    const completedKaca = filteredRecords.filter((r: any) => r.statusKaca === "RECHECK_PASSED").length;
    const avgCompletionRate = filteredRecords.length > 0 ? Math.round((completedKaca / filteredRecords.length) * 100) : 0;

    const hafalanStats = {
      totalRecords: filteredRecords.length,
      completedKaca,
      waitingRecheck: filteredRecords.filter((r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK").length,
      inProgress: filteredRecords.filter((r: any) => r.statusKaca === "PROGRESS").length,
      avgCompletionRate,
      todayRecords: todayRecords.length,
      weeklyRecords: weeklyRecords.length,
    };

    const monthlyMap = new Map<string, { completed: number; new: number; recheck: number }>();
    filteredRecords.forEach((r: any) => {
      const date = new Date(r.tanggalSetor);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = monthlyMap.get(monthKey) || { completed: 0, new: 0, recheck: 0 };
      current.new++;
      if (r.statusKaca === "RECHECK_PASSED") current.completed++;
      if (r.statusKaca === "COMPLETE_WAITING_RECHECK") current.recheck++;
      monthlyMap.set(monthKey, current);
    });

    const monthlyProgress = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, data]) => ({ month: format(new Date(month + "-01"), "MMM", { locale: idLocale }), ...data }));

    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayRecords = records.filter((r: any) => new Date(r.tanggalSetor).toDateString() === date.toDateString());
      weeklyActivity.push({
        day: format(date, "EEE", { locale: idLocale }),
        hafalan: dayRecords.length,
        recheck: dayRecords.filter((r: any) => r.statusKaca === "RECHECK_PASSED").length,
      });
    }

    const teacherMap = new Map<string, { name: string; completedCount: number; totalRecords: number }>();
    filteredRecords.forEach((r: any) => {
      if (r.teacher?.user?.name) {
        const teacherName = r.teacher.user.name;
        const current = teacherMap.get(teacherName) || { name: teacherName, completedCount: 0, totalRecords: 0 };
        current.totalRecords++;
        if (r.statusKaca === "RECHECK_PASSED") current.completedCount++;
        teacherMap.set(teacherName, current);
      }
    });

    const teacherPerformance = Array.from(teacherMap.values())
      .map((t) => ({
        name: t.name,
        santriCount: t.totalRecords,
        completedCount: t.completedCount,
        efficiency: t.totalRecords > 0 ? Math.round((t.completedCount / t.totalRecords) * 100) : 0,
      }))
      .sort((a, b) => b.completedCount - a.completedCount)
      .slice(0, 5);

    const santriMap = new Map<string, { name: string; completedKaca: number; totalRecords: number; lastActivity: Date }>();
    filteredRecords.forEach((r: any) => {
      if (r.santri?.user?.name) {
        const santriName = r.santri.user.name;
        const current = santriMap.get(santriName) || { name: santriName, completedKaca: 0, totalRecords: 0, lastActivity: new Date(0) };
        current.totalRecords++;
        if (r.statusKaca === "RECHECK_PASSED") current.completedKaca++;
        const recordDate = new Date(r.tanggalSetor);
        if (recordDate > current.lastActivity) current.lastActivity = recordDate;
        santriMap.set(santriName, current);
      }
    });

    const topSantri = Array.from(santriMap.values())
      .map((s) => ({
        name: s.name,
        completedKaca: s.completedKaca,
        progress: s.totalRecords > 0 ? Math.round((s.completedKaca / s.totalRecords) * 100) : 0,
        lastActivity: format(s.lastActivity, "d MMM", { locale: idLocale }),
      }))
      .sort((a, b) => b.completedKaca - a.completedKaca)
      .slice(0, 5);

    const juzMap = new Map<number, number>();
    filteredRecords.forEach((r: any) => {
      const juz = r.kaca?.juz || 1;
      juzMap.set(juz, (juzMap.get(juz) || 0) + 1);
    });

    const juzDistribution = Array.from(juzMap.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 10)
      .map(([juz, count]) => ({ name: `Juz ${juz}`, value: count }));

    return { userStats, hafalanStats, monthlyProgress, weeklyActivity, teacherPerformance, topSantri, juzDistribution };
  }, [rawData, timeRange, dateRangeType, startDate, endDate]);

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
    { name: "Lulus Recheck", value: analytics.hafalanStats.completedKaca },
    { name: "Menunggu Recheck", value: analytics.hafalanStats.waitingRecheck },
    { name: "Sedang Proses", value: analytics.hafalanStats.inProgress },
  ].filter((d) => d.value > 0);

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  <Sparkles className="h-3 w-3 mr-1" />Pro
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">Analisis komprehensif sistem hafalan Al-Qur&apos;an</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />Refresh
            </Button>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
          </div>
        </div>

        {/* Time Range Filter */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <TimeRangeFilter value={timeRange} onChange={setTimeRange} dateRangeType={dateRangeType} onDateRangeTypeChange={setDateRangeType} startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} compact={true} />
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Pengguna</TabsTrigger>
            <TabsTrigger value="performance" className="gap-2"><Award className="h-4 w-4" />Performa</TabsTrigger>
            <TabsTrigger value="activity" className="gap-2"><Activity className="h-4 w-4" />Aktivitas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Total Hafalan" value={analytics.hafalanStats.totalRecords} description={`${analytics.hafalanStats.todayRecords} hari ini`} icon={<BookOpen className="h-5 w-5" />} color="primary" loading={loading} />
              <StatsCard title="Lulus Recheck" value={analytics.hafalanStats.completedKaca} description={`${analytics.hafalanStats.avgCompletionRate}% completion rate`} icon={<CheckCircle className="h-5 w-5" />} color="success" loading={loading} />
              <StatsCard title="Menunggu Recheck" value={analytics.hafalanStats.waitingRecheck} icon={<Clock className="h-5 w-5" />} color="warning" loading={loading} />
              <StatsCard title="Sedang Proses" value={analytics.hafalanStats.inProgress} icon={<AlertCircle className="h-5 w-5" />} color="info" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Tingkat Penyelesaian</CardTitle>
                  <CardDescription>Persentase hafalan yang telah lulus recheck</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <ProgressRing value={analytics.hafalanStats.avgCompletionRate} size={160} strokeWidth={12} color={CHART_COLORS.primary} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Distribusi Status Hafalan</CardTitle>
                  <CardDescription>Pembagian status seluruh hafalan dalam periode terpilih</CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <RechartsPieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                          {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="middle" align="right" layout="vertical" formatter={(value) => (<span className="text-sm text-gray-600">{value}</span>)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (<div className="h-[220px] flex items-center justify-center text-gray-500">Belum ada data</div>)}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Progress Bulanan</CardTitle>
                  <CardDescription>Tren hafalan baru vs yang lulus per bulan</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.monthlyProgress.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={analytics.monthlyProgress}>
                        <defs>
                          <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="new" stroke={CHART_COLORS.secondary} fillOpacity={1} fill="url(#colorNew)" name="Hafalan Baru" />
                        <Area type="monotone" dataKey="completed" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorCompleted)" name="Lulus Recheck" />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (<div className="h-[280px] flex items-center justify-center text-gray-500">Belum ada data</div>)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Aktivitas Mingguan</CardTitle>
                  <CardDescription>Hafalan dan recheck 7 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.weeklyActivity.some((d) => d.hafalan > 0) ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={analytics.weeklyActivity} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="hafalan" fill={CHART_COLORS.secondary} name="Total Hafalan" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="recheck" fill={CHART_COLORS.primary} name="Lulus Recheck" radius={[4, 4, 0, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (<div className="h-[280px] flex items-center justify-center text-gray-500">Belum ada aktivitas minggu ini</div>)}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatsCard title="Total User" value={analytics.userStats.totalUsers} description={`${analytics.userStats.newThisMonth} baru bulan ini`} icon={<Users className="h-5 w-5" />} color="primary" loading={loading} />
              <StatsCard title="Santri" value={analytics.userStats.totalSantri} icon={<GraduationCap className="h-5 w-5" />} color="success" loading={loading} />
              <StatsCard title="Guru" value={analytics.userStats.totalTeachers} icon={<Award className="h-5 w-5" />} color="warning" loading={loading} />
              <StatsCard title="Wali" value={analytics.userStats.totalWalis} icon={<Users className="h-5 w-5" />} color="info" loading={loading} />
              <StatsCard title="User Aktif" value={analytics.userStats.activeUsers} icon={<Activity className="h-5 w-5" />} color="primary" loading={loading} />
            </div>

            <Card>
              <CardHeader><CardTitle>Distribusi Pengguna</CardTitle><CardDescription>Perbandingan jumlah pengguna berdasarkan role</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Santri", value: analytics.userStats.totalSantri, fill: CHART_COLORS.primary },
                    { name: "Guru", value: analytics.userStats.totalTeachers, fill: CHART_COLORS.warning },
                    { name: "Wali", value: analytics.userStats.totalWalis, fill: CHART_COLORS.secondary },
                    { name: "Admin", value: analytics.userStats.totalUsers - analytics.userStats.totalSantri - analytics.userStats.totalTeachers - analytics.userStats.totalWalis, fill: CHART_COLORS.purple },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" />Top 5 Guru</CardTitle>
                  <CardDescription>Berdasarkan jumlah hafalan yang dibimbing</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.teacherPerformance.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.teacherPerformance.map((teacher, index) => (
                        <div key={teacher.name} className="flex items-center gap-4">
                          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm", index === 0 ? "bg-amber-100 text-amber-700" : index === 1 ? "bg-gray-100 text-gray-700" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-500")}>{index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{teacher.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500"><span>{teacher.completedCount} lulus</span><span>•</span><span>{teacher.santriCount} total</span></div>
                          </div>
                          <Badge variant="outline" className={cn("font-medium", teacher.efficiency >= 70 ? "border-green-200 bg-green-50 text-green-700" : teacher.efficiency >= 40 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-gray-50 text-gray-700")}>{teacher.efficiency}%</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (<div className="h-[200px] flex items-center justify-center text-gray-500">Belum ada data performa guru</div>)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-emerald-500" />Top 5 Santri</CardTitle>
                  <CardDescription>Berdasarkan jumlah hafalan yang lulus recheck</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.topSantri.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.topSantri.map((santri, index) => (
                        <div key={santri.name} className="flex items-center gap-4">
                          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm", index === 0 ? "bg-emerald-100 text-emerald-700" : index === 1 ? "bg-gray-100 text-gray-700" : index === 2 ? "bg-teal-100 text-teal-700" : "bg-gray-50 text-gray-500")}>{index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{santri.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500"><span>{santri.completedKaca} kaca lulus</span><span>•</span><span>Terakhir: {santri.lastActivity}</span></div>
                          </div>
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{santri.progress}%</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (<div className="h-[200px] flex items-center justify-center text-gray-500">Belum ada data santri</div>)}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Distribusi per Juz</CardTitle><CardDescription>Jumlah hafalan berdasarkan juz yang sedang dipelajari</CardDescription></CardHeader>
              <CardContent>
                {analytics.juzDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.juzDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Jumlah Hafalan" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (<div className="h-[300px] flex items-center justify-center text-gray-500">Belum ada data</div>)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatsCard title="Hafalan Hari Ini" value={analytics.hafalanStats.todayRecords} icon={<Calendar className="h-5 w-5" />} color="primary" loading={loading} />
              <StatsCard title="Hafalan Minggu Ini" value={analytics.hafalanStats.weeklyRecords} icon={<Activity className="h-5 w-5" />} color="info" loading={loading} />
              <StatsCard title="Total Periode Ini" value={analytics.hafalanStats.totalRecords} icon={<Target className="h-5 w-5" />} color="success" loading={loading} />
            </div>

            <Card>
              <CardHeader><CardTitle>Timeline Aktivitas</CardTitle><CardDescription>Aktivitas hafalan dalam 7 hari terakhir</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={analytics.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="hafalan" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={{ fill: CHART_COLORS.secondary, r: 4 }} activeDot={{ r: 6 }} name="Total Hafalan" />
                    <Line type="monotone" dataKey="recheck" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ fill: CHART_COLORS.primary, r: 4 }} activeDot={{ r: 6 }} name="Lulus Recheck" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}