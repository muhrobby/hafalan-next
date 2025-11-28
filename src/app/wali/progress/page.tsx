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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  BookOpen,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Award,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { TimeRangeFilter, getDateRange } from "@/components/time-range-filter";
import { isWithinInterval } from "date-fns";

interface Child {
  id: string;
  name: string;
  nis: string;
  totalHafalan: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheck: number;
}

interface ProgressData {
  monthlyProgress: Array<{
    month: string;
    completed: number;
    inProgress: number;
  }>;
  childrenComparison: Array<{
    name: string;
    completed: number;
    inProgress: number;
  }>;
  statusDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  weeklyActivity: Array<{
    day: string;
    setoran: number;
  }>;
}

export default function WaliProgressPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["WALI"],
  });
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("all");
  
  // Time Range Filter State
  const [timeRange, setTimeRange] = useState("this_month");
  const [dateRangeType, setDateRangeType] = useState<"preset" | "custom">("preset");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const [rawHafalanData, setRawHafalanData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<ProgressData>({
    monthlyProgress: [],
    childrenComparison: [],
    statusDistribution: [],
    weeklyActivity: [],
  });

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);

        // Fetch users
        const usersResponse = await fetch("/api/users?role=SANTRI");
        const usersData = await usersResponse.json();

        // Fetch hafalan records
        const hafalanResponse = await fetch("/api/hafalan");
        const hafalanData = await hafalanResponse.json();

        // Filter children for this wali
        const waliChildren =
          usersData.data?.filter(
            (user: any) =>
              user.santriProfile?.waliId === session?.user.waliProfile?.id
          ) || [];

        // Get all records for wali's children
        const allRecords =
          hafalanData.data?.filter((record: any) => {
            const santriId = record.santriId;
            return waliChildren.some(
              (child: any) => child.santriProfile?.id === santriId
            );
          }) || [];

        setRawHafalanData(allRecords);

        const processedChildren = waliChildren.map((child: any) => {
          const childHafalanRecords =
            hafalanData.data?.filter(
              (record: any) => record.santriId === child.santriProfile?.id
            ) || [];

          return {
            id: child.id,
            name: child.name,
            nis: child.santriProfile?.nis || "-",
            totalHafalan: childHafalanRecords.length,
            completedKaca: childHafalanRecords.filter(
              (r: any) => r.statusKaca === "RECHECK_PASSED"
            ).length,
            inProgressKaca: childHafalanRecords.filter(
              (r: any) => r.statusKaca === "PROGRESS"
            ).length,
            waitingRecheck: childHafalanRecords.filter(
              (r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK"
            ).length,
          };
        });

        setChildren(processedChildren);
      } catch (error) {
        console.error("Error fetching progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchProgressData();
    }
  }, [session]);

  // Helper functions - defined before useMemo to avoid hoisting issues
  const calculateMonthlyProgress = (records: any[]) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agt",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const now = new Date();
    const data: Array<{
      month: string;
      completed: number;
      inProgress: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[monthDate.getMonth()];

      const monthRecords = records.filter((record: any) => {
        const recordDate = new Date(record.createdAt);
        return (
          recordDate.getMonth() === monthDate.getMonth() &&
          recordDate.getFullYear() === monthDate.getFullYear()
        );
      });

      data.push({
        month: monthName,
        completed: monthRecords.filter(
          (r: any) => r.statusKaca === "RECHECK_PASSED"
        ).length,
        inProgress: monthRecords.filter((r: any) => r.statusKaca === "PROGRESS")
          .length,
      });
    }

    return data;
  };

  const calculateWeeklyActivity = (records: any[]) => {
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const now = new Date();
    const data: Array<{ day: string; setoran: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const dayRecords = records.filter((record: any) => {
        const recordDate = new Date(record.tanggalSetor);
        return recordDate.toDateString() === date.toDateString();
      });

      data.push({
        day: days[date.getDay()],
        setoran: dayRecords.length,
      });
    }

    return data;
  };

  // Calculate filtered progress data based on time range
  const filteredProgressData = useMemo(() => {
    const dateRange = getDateRange(timeRange, dateRangeType, startDate, endDate);
    
    // Filter records by date range
    const filteredRecords = rawHafalanData.filter((r: any) => {
      const recordDate = new Date(r.tanggalSetor || r.createdAt);
      return isWithinInterval(recordDate, { start: dateRange.start, end: dateRange.end });
    });

    // Monthly progress
    const monthlyData = calculateMonthlyProgress(filteredRecords);

    // Children comparison (filtered)
    const childrenCompData = children.map((child: Child) => {
      const childRecords = filteredRecords.filter((r: any) => {
        // Match by santri profile relationship
        return children.find(c => c.id === child.id);
      });
      const completed = childRecords.filter((r: any) => r.statusKaca === "RECHECK_PASSED").length;
      const inProgress = childRecords.filter((r: any) => r.statusKaca === "PROGRESS").length;
      return {
        name: child.name,
        completed,
        inProgress,
      };
    });

    // Status distribution
    const totalCompleted = filteredRecords.filter((r: any) => r.statusKaca === "RECHECK_PASSED").length;
    const totalInProgress = filteredRecords.filter((r: any) => r.statusKaca === "PROGRESS").length;
    const totalWaiting = filteredRecords.filter((r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK").length;

    const statusDist = [
      { name: "Selesai", value: totalCompleted, color: "#10b981" },
      { name: "Progress", value: totalInProgress, color: "#3b82f6" },
      { name: "Menunggu Recheck", value: totalWaiting, color: "#f59e0b" },
    ];

    // Weekly activity (last 7 days)
    const weeklyData = calculateWeeklyActivity(filteredRecords);

    return {
      monthlyProgress: monthlyData,
      childrenComparison: childrenCompData,
      statusDistribution: statusDist,
      weeklyActivity: weeklyData,
    };
  }, [rawHafalanData, children, timeRange, dateRangeType, startDate, endDate]);

  const getChildData = () => {
    if (selectedChild === "all") {
      return {
        totalHafalan: children.reduce(
          (sum, child) => sum + child.totalHafalan,
          0
        ),
        completedKaca: children.reduce(
          (sum, child) => sum + child.completedKaca,
          0
        ),
        inProgressKaca: children.reduce(
          (sum, child) => sum + child.inProgressKaca,
          0
        ),
        waitingRecheck: children.reduce(
          (sum, child) => sum + child.waitingRecheck,
          0
        ),
      };
    } else {
      const child = children.find((c) => c.id === selectedChild);
      return (
        child || {
          totalHafalan: 0,
          completedKaca: 0,
          inProgressKaca: 0,
          waitingRecheck: 0,
        }
      );
    }
  };

  const currentData = getChildData();
  const progressPercentage =
    currentData.totalHafalan > 0
      ? Math.round((currentData.completedKaca / currentData.totalHafalan) * 100)
      : 0;

  // Authorization check
  if (isLoading) {
    return (
      <DashboardLayout role="WALI">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return null; // useRoleGuard handles redirect
  }

  if (loading) {
    return (
      <DashboardLayout role="WALI">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="WALI">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/wali">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                Wali: Progress Hafalan
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Analisis dan visualisasi progress hafalan anak
              </p>
            </div>
          </div>

          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Pilih Anak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Anak</SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Hafalan
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentData.totalHafalan}
              </div>
              <p className="text-xs text-muted-foreground">Kaca total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currentData.completedKaca}
              </div>
              <p className="text-xs text-muted-foreground">Kaca selesai</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {currentData.inProgressKaca}
              </div>
              <p className="text-xs text-muted-foreground">Sedang berjalan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tingkat Keberhasilan
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressPercentage}%</div>
              <Progress value={progressPercentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="monthly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monthly">Bulanan</TabsTrigger>
            <TabsTrigger value="comparison">Perbandingan</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="weekly">Mingguan</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Progress Hafalan 6 Bulan Terakhir</CardTitle>
                <CardDescription>
                  Grafik perkembangan hafalan per bulan
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredProgressData.monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#10b981" name="Selesai" />
                    <Bar dataKey="inProgress" fill="#3b82f6" name="Progress" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Perbandingan Progress Antar Anak</CardTitle>
                <CardDescription>
                  Visualisasi progress masing-masing anak
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {filteredProgressData.childrenComparison.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Belum ada data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredProgressData.childrenComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completed" fill="#10b981" name="Selesai" />
                      <Bar
                        dataKey="inProgress"
                        fill="#3b82f6"
                        name="Progress"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status Hafalan</CardTitle>
                <CardDescription>
                  Persentase status hafalan keseluruhan
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredProgressData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {filteredProgressData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Setoran 7 Hari Terakhir</CardTitle>
                <CardDescription>
                  Jumlah setoran hafalan per hari
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredProgressData.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="setoran"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Setoran"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Progress per Anak */}
        {selectedChild === "all" && (
          <Card>
            <CardHeader>
              <CardTitle>Detail Progress per Anak</CardTitle>
              <CardDescription>
                Ringkasan progress masing-masing anak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {children.map((child) => {
                  const childProgress =
                    child.totalHafalan > 0
                      ? Math.round(
                          (child.completedKaca / child.totalHafalan) * 100
                        )
                      : 0;

                  return (
                    <div key={child.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{child.name}</h3>
                          <p className="text-sm text-gray-600">
                            NIS: {child.nis}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {childProgress}% Selesai
                        </Badge>
                      </div>

                      <Progress value={childProgress} className="h-2 mb-3" />

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-medium text-lg">
                            {child.totalHafalan}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Selesai</p>
                          <p className="font-medium text-lg text-green-600">
                            {child.completedKaca}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Progress</p>
                          <p className="font-medium text-lg text-blue-600">
                            {child.inProgressKaca}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
