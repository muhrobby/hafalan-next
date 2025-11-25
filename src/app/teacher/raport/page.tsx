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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Download,
  ArrowLeft,
  Target,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarIcon,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRoleGuard } from "@/hooks/use-role-guard";

interface Santri {
  id: string;
  name: string;
  nis: string;
}

interface HafalanRecord {
  id: string;
  santriName: string;
  kacaInfo: string;
  status: string;
  tanggalSetor: string;
  completedVerses: number;
  totalVerses: number;
  teacherName?: string;
  catatan?: string;
  history?: {
    teacherName: string;
    date: string;
    catatan?: string;
    completedVerses?: string;
  }[];
  recheckRecords?: {
    recheckedBy: string;
    recheckDate: string;
    allPassed: boolean;
    catatan?: string;
  }[];
}

interface AnalyticsData {
  monthlyProgress: Array<{
    month: string;
    completed: number;
    inProgress: number;
  }>;
  surahProgress: Array<{
    surahName: string;
    completedAyats: number;
    totalAyats: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  summaryStats: {
    totalKaca: number;
    completedKaca: number;
    averageProgress: number;
    activeSantri: number;
  };
}

export default function TeacherRaport() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["TEACHER"],
  });
  const [loading, setLoading] = useState(true);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PROGRESS: {
        label: "Sedang Hafalan",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
      },
      COMPLETE_WAITING_RECHECK: {
        label: "Menunggu Recheck",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: AlertCircle,
      },
      RECHECK_PASSED: {
        label: "Recheck Lulus",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };
  const [selectedSantri, setSelectedSantri] = useState("all");
  const [timeRange, setTimeRange] = useState("3months");
  const [dateRangeType, setDateRangeType] = useState<"preset" | "custom">(
    "preset"
  );
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedRecord, setSelectedRecord] = useState<HafalanRecord | null>(
    null
  );
  const [santris, setSantris] = useState<Santri[]>([]);
  const [hafalanRecords, setHafalanRecords] = useState<HafalanRecord[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    monthlyProgress: [],
    surahProgress: [],
    statusDistribution: [],
    summaryStats: {
      totalKaca: 0,
      completedKaca: 0,
      averageProgress: 0,
      activeSantri: 0,
    },
  });

  // Calculate date range based on preset or custom dates
  const getDateRange = useMemo(() => {
    const now = new Date();

    if (dateRangeType === "custom" && startDate && endDate) {
      return {
        start: startOfDay(startDate),
        end: endOfDay(endDate),
        label: `${format(startDate, "d MMM yyyy", {
          locale: idLocale,
        })} - ${format(endDate, "d MMM yyyy", { locale: idLocale })}`,
      };
    }

    switch (timeRange) {
      case "today":
        return {
          start: startOfDay(now),
          end: endOfDay(now),
          label: "Hari Ini",
        };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return {
          start: startOfDay(yesterday),
          end: endOfDay(yesterday),
          label: "Kemarin",
        };
      case "this_week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
          label: "Minggu Ini",
        };
      case "last_week":
        const lastWeek = subDays(now, 7);
        return {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
          label: "Minggu Lalu",
        };
      case "this_month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: "Bulan Ini",
        };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
          label: "Bulan Lalu",
        };
      case "1month":
        return {
          start: subMonths(now, 1),
          end: now,
          label: "1 Bulan Terakhir",
        };
      case "3months":
        return {
          start: subMonths(now, 3),
          end: now,
          label: "3 Bulan Terakhir",
        };
      case "6months":
        return {
          start: subMonths(now, 6),
          end: now,
          label: "6 Bulan Terakhir",
        };
      case "this_year":
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
          label: "Tahun Ini",
        };
      case "all":
        return {
          start: new Date(2020, 0, 1),
          end: now,
          label: "Semua Waktu",
        };
      default:
        return {
          start: subMonths(now, 3),
          end: now,
          label: "3 Bulan Terakhir",
        };
    }
  }, [timeRange, dateRangeType, startDate, endDate]);

  useEffect(() => {
    const fetchRaportData = async () => {
      try {
        setLoading(true);

        const teacherId = session?.user.teacherProfile?.id;

        // Fetch teacher's santris - API filters by teacherId
        const usersResponse = await fetch(
          `/api/users?role=SANTRI&teacherId=${teacherId}`
        );
        const usersData = await usersResponse.json();

        const teacherSantris =
          usersData.data?.map((user: any) => ({
            id: user.santriProfile?.id || user.id,
            name: user.name,
            nis: user.santriProfile?.nis || "",
          })) || [];

        setSantris(teacherSantris);

        // Fetch hafalan records for this teacher's santris
        const hafalanResponse = await fetch(
          `/api/hafalan?teacherId=${teacherId}&limit=100`
        );
        const hafalanData = await hafalanResponse.json();

        const records =
          hafalanData.data.map((record: any) => {
            const completedVerses = JSON.parse(record.completedVerses);
            const totalVerses = record.kaca.ayatEnd - record.kaca.ayatStart + 1;

            return {
              id: record.id,
              santriName: record.santri.user.name,
              kacaInfo: `${record.kaca.surahName} (Hal. ${record.kaca.pageNumber})`,
              status: record.statusKaca,
              tanggalSetor: record.tanggalSetor,
              completedVerses: completedVerses.length,
              totalVerses,
              teacherName: record.teacher?.user?.name || "Unknown",
              catatan: record.catatan,
              history:
                record.history?.map((h: any) => ({
                  teacherName: h.teacher.user.name,
                  date: h.date,
                  catatan: h.catatan,
                  completedVerses: h.completedVerses,
                })) || [],
              recheckRecords: record.recheckRecords || [],
            };
          }) || [];

        setHafalanRecords(records);

        // Generate analytics data with the current date range
        const analytics = generateAnalyticsData(records, selectedSantri);
        setAnalyticsData(analytics);
      } catch (error) {
        console.error("Error fetching raport data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchRaportData();
    }
  }, [
    session,
    selectedSantri,
    timeRange,
    dateRangeType,
    startDate,
    endDate,
    getDateRange,
  ]);

  const generateAnalyticsData = (
    records: HafalanRecord[],
    santriFilter: string
  ): AnalyticsData => {
    // Filter records based on santri selection
    let filteredRecords =
      santriFilter === "all"
        ? records
        : records.filter((r) => r.santriName === santriFilter);

    // Filter by date range
    const dateRange = getDateRange;
    const timeFilteredRecords = filteredRecords.filter((record) => {
      const recordDate = new Date(record.tanggalSetor);
      return isWithinInterval(recordDate, {
        start: dateRange.start,
        end: dateRange.end,
      });
    });

    // Use time filtered records for stats
    filteredRecords = timeFilteredRecords;

    // Calculate months between start and end date
    const monthsDiff = Math.max(
      1,
      Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )
    );
    const monthsBack = Math.min(monthsDiff, 12); // Cap at 12 months

    // Monthly progress data
    const monthlyProgress: {
      month: string;
      completed: number;
      inProgress: number;
    }[] = [];

    const now = dateRange.end;
    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
      });

      const monthRecords = filteredRecords.filter((record) => {
        const recordDate = new Date(record.tanggalSetor);
        return (
          recordDate.getMonth() === monthDate.getMonth() &&
          recordDate.getFullYear() === monthDate.getFullYear()
        );
      });

      monthlyProgress.push({
        month: monthName,
        completed: monthRecords.filter((r) => r.status === "RECHECK_PASSED")
          .length,
        inProgress: monthRecords.filter((r) => r.status === "PROGRESS").length,
      });
    }

    // Surah progress data
    const surahMap = new Map();
    filteredRecords.forEach((record) => {
      const surahName = record.kacaInfo.split(" (")[0];
      if (!surahMap.has(surahName)) {
        surahMap.set(surahName, { completedAyats: 0, totalAyats: 0 });
      }
      const surah = surahMap.get(surahName);
      surah.completedAyats += record.completedVerses;
      surah.totalAyats += record.totalVerses;
    });

    const surahProgress = Array.from(surahMap.entries())
      .map(([surahName, data]) => ({
        surahName,
        completedAyats: data.completedAyats,
        totalAyats: data.totalAyats,
        percentage: Math.round((data.completedAyats / data.totalAyats) * 100),
      }))
      .sort((a, b) => b.completedAyats - a.completedAyats)
      .slice(0, 10);

    // Status distribution
    const statusCounts = {
      PROGRESS: 0,
      COMPLETE_WAITING_RECHECK: 0,
      RECHECK_PASSED: 0,
    };

    filteredRecords.forEach((record) => {
      statusCounts[record.status as keyof typeof statusCounts]++;
    });

    const statusDistribution = [
      { name: "Progress", value: statusCounts.PROGRESS, color: "#fbbf24" },
      {
        name: "Menunggu Recheck",
        value: statusCounts.COMPLETE_WAITING_RECHECK,
        color: "#60a5fa",
      },
      { name: "Selesai", value: statusCounts.RECHECK_PASSED, color: "#34d399" },
    ].filter((item) => item.value > 0);

    // Summary stats
    const summaryStats = {
      totalKaca: filteredRecords.length,
      completedKaca: statusCounts.RECHECK_PASSED,
      averageProgress:
        filteredRecords.length > 0
          ? Math.round(
              (statusCounts.RECHECK_PASSED / filteredRecords.length) * 100
            )
          : 0,
      activeSantri: new Set(filteredRecords.map((r) => r.santriName)).size,
    };

    return {
      monthlyProgress,
      surahProgress,
      statusDistribution,
      summaryStats,
    };
  };

  // Authorization check
  if (isLoading) {
    return (
      <DashboardLayout role="TEACHER">
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
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const COLORS = ["#34d399", "#60a5fa", "#fbbf24"];

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 md:gap-4">
          <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/teacher">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                Teacher: Raport Santri
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Analisis lengkap progress hafalan santri
              </p>
            </div>
          </div>

          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Santri Filter */}
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium">Santri</Label>
                <Select
                  value={selectedSantri}
                  onValueChange={setSelectedSantri}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih santri..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Santri</SelectItem>
                    {santris.map((santri) => (
                      <SelectItem key={santri.id} value={santri.name}>
                        {santri.name} ({santri.nis})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range Type */}
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium">Tipe Filter Waktu</Label>
                <Select
                  value={dateRangeType}
                  onValueChange={(val: "preset" | "custom") => {
                    setDateRangeType(val);
                    if (val === "preset") {
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preset">Preset Waktu</SelectItem>
                    <SelectItem value="custom">Pilih Tanggal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preset Time Range */}
              {dateRangeType === "preset" && (
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Rentang Waktu</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hari Ini</SelectItem>
                      <SelectItem value="yesterday">Kemarin</SelectItem>
                      <SelectItem value="this_week">Minggu Ini</SelectItem>
                      <SelectItem value="last_week">Minggu Lalu</SelectItem>
                      <SelectItem value="this_month">Bulan Ini</SelectItem>
                      <SelectItem value="last_month">Bulan Lalu</SelectItem>
                      <SelectItem value="1month">1 Bulan Terakhir</SelectItem>
                      <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
                      <SelectItem value="6months">6 Bulan Terakhir</SelectItem>
                      <SelectItem value="this_year">Tahun Ini</SelectItem>
                      <SelectItem value="all">Semua Waktu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Date Range */}
              {dateRangeType === "custom" && (
                <>
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium">Tanggal Mulai</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate
                            ? format(startDate, "d MMMM yyyy", {
                                locale: idLocale,
                              })
                            : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium">Tanggal Akhir</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate
                            ? format(endDate, "d MMMM yyyy", {
                                locale: idLocale,
                              })
                            : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          disabled={(date) =>
                            startDate ? date < startDate : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>

            {/* Active Filter Display */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {getDateRange.label}
              </Badge>
              {selectedSantri !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedSantri}
                </Badge>
              )}
              <span className="text-xs text-gray-500 ml-auto">
                {format(getDateRange.start, "d MMM yyyy", { locale: idLocale })}{" "}
                - {format(getDateRange.end, "d MMM yyyy", { locale: idLocale })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kaca</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.summaryStats.totalKaca}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedSantri === "all" ? "Semua santri" : selectedSantri}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Kaca Selesai
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.summaryStats.completedKaca}
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.summaryStats.totalKaca > 0
                  ? Math.round(
                      (analyticsData.summaryStats.completedKaca /
                        analyticsData.summaryStats.totalKaca) *
                        100
                    )
                  : 0}
                % completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Progress Rata-rata
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.summaryStats.averageProgress}%
              </div>
              <Progress
                value={analyticsData.summaryStats.averageProgress}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Santri Aktif
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.summaryStats.activeSantri}
              </div>
              <p className="text-xs text-muted-foreground">
                Dari {santris.length} total santri
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Progress Bulanan</TabsTrigger>
            <TabsTrigger value="surah">Progress per Surah</TabsTrigger>
            <TabsTrigger value="status">Distribusi Status</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Hafalan per Bulan</CardTitle>
                <CardDescription>
                  Tren pencapaian hafalan santri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#34d399" name="Selesai" />
                    <Bar dataKey="inProgress" fill="#fbbf24" name="Progress" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="surah" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress per Surah</CardTitle>
                <CardDescription>
                  10 surah dengan progress tertinggi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.surahProgress.map((surah, index) => (
                    <div
                      key={surah.surahName}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{surah.surahName}</span>
                          <Badge variant="outline">{index + 1}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {surah.completedAyats} / {surah.totalAyats} ayat
                          </span>
                          <span>{surah.percentage}%</span>
                        </div>
                        <Progress value={surah.percentage} className="mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Status</CardTitle>
                  <CardDescription>
                    Persentase status hafalan saat ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.statusDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detail Status</CardTitle>
                  <CardDescription>Jumlah record per status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.statusDistribution.map((status) => (
                      <div
                        key={status.name}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: status.color }}
                          ></div>
                          <span className="font-medium">{status.name}</span>
                        </div>
                        <Badge variant="outline">{status.value} kaca</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Hafalan yang baru saja dicatat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hafalanRecords.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{record.santriName}</p>
                    <p className="text-sm text-gray-600">{record.kacaInfo}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {new Date(record.tanggalSetor).toLocaleDateString(
                            "id-ID"
                          )}
                        </p>
                        <span className="text-xs text-gray-300">•</span>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {record.teacherName}
                        </p>
                      </div>
                      {record.history && record.history.length > 0 && (
                        <div className="text-[10px] text-gray-400 flex flex-wrap gap-1 items-center">
                          <Clock className="h-3 w-3" />
                          <span>Riwayat:</span>
                          {Array.from(
                            new Set(
                              record.history
                                .filter(
                                  (h) => h.teacherName !== record.teacherName
                                )
                                .map((h) => h.teacherName)
                            )
                          ).map((name, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] px-1 py-0 h-4"
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium">
                      {record.completedVerses}/{record.totalVerses} ayat
                    </div>
                    <div className="mt-1">{getStatusBadge(record.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={!!selectedRecord}
          onOpenChange={(open) => !open && setSelectedRecord(null)}
        >
          <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">
                Detail Riwayat Hafalan
              </DialogTitle>
              <DialogDescription className="text-sm">
                Perjalanan hafalan {selectedRecord?.santriName} untuk{" "}
                {selectedRecord?.kacaInfo}
              </DialogDescription>
            </DialogHeader>

            {/* Summary Card */}
            {selectedRecord && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Progress</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {selectedRecord.completedVerses}/
                        {selectedRecord.totalVerses}
                      </div>
                      <div className="text-[10px] text-gray-500">ayat</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        Total Update
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {(selectedRecord.history?.length || 0) + 1}
                      </div>
                      <div className="text-[10px] text-gray-500">kali</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        Guru Terlibat
                      </div>
                      <div className="text-2xl font-bold text-amber-700">
                        {
                          new Set(
                            [
                              selectedRecord.teacherName,
                              ...(selectedRecord.history?.map(
                                (h) => h.teacherName
                              ) || []),
                            ].filter(Boolean)
                          ).size
                        }
                      </div>
                      <div className="text-[10px] text-gray-500">orang</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Recheck</div>
                      <div className="text-2xl font-bold text-green-700">
                        {selectedRecord.recheckRecords?.length || 0}x
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {selectedRecord.recheckRecords?.some((r) => r.allPassed)
                          ? "✓ Lulus"
                          : ""}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <ScrollArea className="h-[300px] md:h-[400px] pr-2 md:pr-4">
              <div className="space-y-6">
                {/* Initial Record */}
                <div className="relative pl-6 border-l-2 border-gray-200 pb-6 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white" />
                  <div className="mb-1 text-sm text-gray-500">
                    {selectedRecord &&
                      new Date(selectedRecord.tanggalSetor).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-700">
                        Hafalan Dimulai
                      </span>
                      <Badge variant="outline">
                        {selectedRecord?.teacherName}
                      </Badge>
                    </div>
                    {selectedRecord?.catatan && (
                      <p className="text-sm text-gray-600 italic mb-2">
                        "{selectedRecord.catatan}"
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      Status Awal: {selectedRecord?.status}
                    </div>
                  </div>
                </div>

                {/* History Updates */}
                {selectedRecord?.history?.map((hist, idx) => (
                  <div
                    key={idx}
                    className="relative pl-6 border-l-2 border-gray-200 pb-6 last:pb-0"
                  >
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 border-4 border-white" />
                    <div className="mb-1 text-sm text-gray-500">
                      {new Date(hist.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-amber-700">
                          Update Hafalan
                        </span>
                        <Badge variant="outline">{hist.teacherName}</Badge>
                      </div>
                      {hist.catatan && (
                        <p className="text-sm text-gray-600 italic mb-2">
                          "{hist.catatan}"
                        </p>
                      )}
                      <div className="text-xs text-gray-500">
                        Progress:{" "}
                        {hist.completedVerses
                          ? JSON.parse(hist.completedVerses).length
                          : 0}{" "}
                        ayat lancar
                      </div>
                    </div>
                  </div>
                ))}

                {/* Recheck Records */}
                {selectedRecord?.recheckRecords?.map((recheck, idx) => (
                  <div
                    key={`recheck-${idx}`}
                    className="relative pl-6 border-l-2 border-gray-200 pb-6 last:pb-0"
                  >
                    <div
                      className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white ${
                        recheck.allPassed ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div className="mb-1 text-sm text-gray-500">
                      {new Date(recheck.recheckDate).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg border ${
                        recheck.allPassed
                          ? "bg-green-50 border-green-100"
                          : "bg-red-50 border-red-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`font-medium ${
                            recheck.allPassed
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {recheck.allPassed
                            ? "Recheck Lulus"
                            : "Recheck Perlu Perbaikan"}
                        </span>
                      </div>
                      {recheck.catatan && (
                        <p className="text-sm text-gray-600 italic">
                          "{recheck.catatan}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
