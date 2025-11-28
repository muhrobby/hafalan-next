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
import { RecentActivityTable } from "@/components/recent-activity-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/formatters";

interface Santri {
  id: string;
  name: string;
  nis: string;
}

interface HafalanRecord {
  id: string;
  santriName: string;
  kacaInfo: string;
  juzNumber: number;
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
    recheckedByName: string;
    recheckDate: string;
    allPassed: boolean;
    failedAyats?: number[];
    catatan?: string;
  }[];
}

interface AnalyticsData {
  monthlyProgress: Array<{
    month: string;
    completed: number;
    inProgress: number;
  }>;
  chartProgress: Array<{
    label: string;
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

  const [selectedSantri, setSelectedSantri] = useState("all");
  const [timeRange, setTimeRange] = useState("this_month");
  const [chartGranularity, setChartGranularity] = useState<
    "day" | "week" | "month"
  >("day");
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
    chartProgress: [],
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
              juzNumber: record.kaca.juz || record.kaca.juzNumber || 0,
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
              recheckRecords: (record.recheckRecords || []).map((rr: any) => {
                // Parse failedAyats if it's a JSON string
                let parsedFailedAyats: number[] = [];
                if (rr.failedAyats) {
                  try {
                    parsedFailedAyats =
                      typeof rr.failedAyats === "string"
                        ? JSON.parse(rr.failedAyats)
                        : rr.failedAyats;
                  } catch (e) {
                    parsedFailedAyats = [];
                  }
                }
                return {
                  recheckedBy: rr.recheckedBy,
                  recheckedByName: rr.recheckedByName || "Unknown",
                  recheckDate: rr.recheckDate,
                  allPassed: rr.allPassed,
                  failedAyats: parsedFailedAyats,
                  catatan: rr.catatan,
                };
              }),
            };
          }) || [];

        setHafalanRecords(records);

        // Generate analytics data with the current date range and granularity
        const analytics = generateAnalyticsData(
          records,
          selectedSantri,
          chartGranularity
        );
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
    chartGranularity,
  ]);

  const generateAnalyticsData = (
    records: HafalanRecord[],
    santriFilter: string,
    granularity: "day" | "week" | "month" = "month"
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

    // Generate chart progress based on granularity
    const chartProgress: {
      label: string;
      completed: number;
      inProgress: number;
    }[] = [];

    if (granularity === "day") {
      // Daily data - max 30 days
      const daysDiff = Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const daysBack = Math.min(daysDiff, 30);

      for (let i = daysBack - 1; i >= 0; i--) {
        const dayDate = new Date(dateRange.end);
        dayDate.setDate(dayDate.getDate() - i);
        const dayLabel = dayDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        });

        const dayRecords = filteredRecords.filter((record) => {
          const recordDate = new Date(record.tanggalSetor);
          return recordDate.toDateString() === dayDate.toDateString();
        });

        chartProgress.push({
          label: dayLabel,
          completed: dayRecords.filter((r) => r.status === "RECHECK_PASSED")
            .length,
          inProgress: dayRecords.filter((r) => r.status === "PROGRESS").length,
        });
      }
    } else if (granularity === "week") {
      // Weekly data - max 12 weeks
      const weeksDiff = Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24 * 7)
      );
      const weeksBack = Math.min(weeksDiff, 12);

      for (let i = weeksBack - 1; i >= 0; i--) {
        const weekEnd = new Date(dateRange.end);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);

        const weekLabel = `${weekStart.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        })} - ${weekEnd.toLocaleDateString("id-ID", { day: "2-digit" })}`;

        const weekRecords = filteredRecords.filter((record) => {
          const recordDate = new Date(record.tanggalSetor);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });

        chartProgress.push({
          label: weekLabel,
          completed: weekRecords.filter((r) => r.status === "RECHECK_PASSED")
            .length,
          inProgress: weekRecords.filter((r) => r.status === "PROGRESS").length,
        });
      }
    } else {
      // Monthly data (default)
      const monthsDiff = Math.max(
        1,
        Math.ceil(
          (dateRange.end.getTime() - dateRange.start.getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        )
      );
      const monthsBack = Math.min(monthsDiff, 12);

      const now = dateRange.end;
      for (let i = monthsBack - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = monthDate.toLocaleDateString("id-ID", {
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

        chartProgress.push({
          label: monthLabel,
          completed: monthRecords.filter((r) => r.status === "RECHECK_PASSED")
            .length,
          inProgress: monthRecords.filter((r) => r.status === "PROGRESS")
            .length,
        });
      }
    }

    // Keep monthlyProgress for backward compatibility
    const monthlyProgress = chartProgress.map((p) => ({
      month: p.label,
      completed: p.completed,
      inProgress: p.inProgress,
    }));

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
      chartProgress,
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

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/raport/download">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Link>
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
            <TabsTrigger value="progress">Progress Chart</TabsTrigger>
            <TabsTrigger value="surah">Progress per Surah</TabsTrigger>
            <TabsTrigger value="status">Distribusi Status</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Progress Hafalan</CardTitle>
                    <CardDescription>
                      Tren pencapaian hafalan santri
                    </CardDescription>
                  </div>
                  {/* Chart Granularity Toggle */}
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                    <Button
                      variant={chartGranularity === "day" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setChartGranularity("day")}
                      className="h-7 px-3 text-xs"
                    >
                      Hari
                    </Button>
                    <Button
                      variant={
                        chartGranularity === "week" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setChartGranularity("week")}
                      className="h-7 px-3 text-xs"
                    >
                      Minggu
                    </Button>
                    <Button
                      variant={
                        chartGranularity === "month" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setChartGranularity("month")}
                      className="h-7 px-3 text-xs"
                    >
                      Bulan
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.chartProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={chartGranularity === "day" ? 2 : 0}
                      angle={chartGranularity === "week" ? -45 : 0}
                      textAnchor={
                        chartGranularity === "week" ? "end" : "middle"
                      }
                      height={chartGranularity === "week" ? 60 : 30}
                    />
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

        {/* Recent Activities - Using Table with Pagination */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Hafalan yang baru saja dicatat</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityTable
              activities={hafalanRecords.map((record) => ({
                id: record.id,
                santriName: record.santriName,
                kacaInfo: `${record.kacaInfo}${
                  record.juzNumber > 0 ? ` - Juz ${record.juzNumber}` : ""
                }`,
                status: record.status,
                timestamp: new Date(record.tanggalSetor).toLocaleDateString(
                  "id-ID"
                ),
                teacherName: record.teacherName,
                catatan: record.catatan,
                completedVerses: record.completedVerses,
                totalVerses: record.totalVerses,
                juzNumber: record.juzNumber,
              }))}
              showSantriName={true}
              showTeacherName={true}
              emptyMessage="Belum ada aktivitas hafalan"
            />
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
              {selectedRecord && (
                <div className="space-y-3">
                  {/* Combine and sort all timeline events */}
                  {(() => {
                    type TimelineEvent =
                      | {
                          type: "initial";
                          date: string;
                          data: typeof selectedRecord;
                        }
                      | {
                          type: "history";
                          date: string;
                          data: NonNullable<
                            typeof selectedRecord.history
                          >[number];
                        }
                      | {
                          type: "recheck";
                          date: string;
                          data: NonNullable<
                            typeof selectedRecord.recheckRecords
                          >[number];
                        };

                    // Create timeline array
                    const timelineEvents: TimelineEvent[] = [];

                    // Add initial record
                    timelineEvents.push({
                      type: "initial",
                      date: selectedRecord.tanggalSetor,
                      data: selectedRecord,
                    });

                    // Add history updates
                    if (selectedRecord.history) {
                      selectedRecord.history.forEach((h) => {
                        timelineEvents.push({
                          type: "history",
                          date: h.date,
                          data: h,
                        });
                      });
                    }

                    // Add recheck records
                    if (selectedRecord.recheckRecords) {
                      selectedRecord.recheckRecords.forEach((r) => {
                        timelineEvents.push({
                          type: "recheck",
                          date: r.recheckDate,
                          data: r,
                        });
                      });
                    }

                    // Sort by date ascending (oldest first for timeline)
                    timelineEvents.sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    );

                    return timelineEvents.map((event, idx) => (
                      <div
                        key={`event-${idx}`}
                        className="relative pl-6 border-l-2 border-gray-200 pb-4"
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${
                            event.type === "initial"
                              ? "bg-blue-500"
                              : event.type === "history"
                              ? "bg-amber-500"
                              : event.type === "recheck" &&
                                (
                                  event.data as NonNullable<
                                    typeof selectedRecord.recheckRecords
                                  >[number]
                                ).allPassed
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />

                        {/* Date */}
                        <div className="mb-1.5 text-xs text-gray-500 font-medium">
                          {new Date(event.date).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        {/* Content based on event type */}
                        {event.type === "initial" && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-medium text-blue-700 text-sm">
                                📖 Hafalan Dimulai
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {
                                  (event.data as typeof selectedRecord)
                                    .teacherName
                                }
                              </Badge>
                            </div>
                            <div className="text-xs text-blue-600">
                              Juz{" "}
                              {(event.data as typeof selectedRecord).juzNumber}{" "}
                              • {(event.data as typeof selectedRecord).kacaInfo}
                            </div>
                            {(event.data as typeof selectedRecord).catatan && (
                              <p className="text-xs text-gray-600 italic mt-1.5 bg-white/50 p-2 rounded">
                                "{(event.data as typeof selectedRecord).catatan}
                                "
                              </p>
                            )}
                          </div>
                        )}

                        {event.type === "history" && (
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-medium text-amber-700 text-sm">
                                ✏️ Update Hafalan
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {
                                  (
                                    event.data as NonNullable<
                                      typeof selectedRecord.history
                                    >[number]
                                  ).teacherName
                                }
                              </Badge>
                            </div>
                            {(() => {
                              const histData = event.data as NonNullable<
                                typeof selectedRecord.history
                              >[number];
                              const versesCount = histData.completedVerses
                                ? (() => {
                                    try {
                                      return JSON.parse(
                                        histData.completedVerses
                                      ).length;
                                    } catch {
                                      return 0;
                                    }
                                  })()
                                : 0;
                              return (
                                <div className="text-xs text-amber-600">
                                  {versesCount} ayat dikuasai
                                </div>
                              );
                            })()}
                            {(
                              event.data as NonNullable<
                                typeof selectedRecord.history
                              >[number]
                            ).catatan && (
                              <p className="text-xs text-gray-600 italic mt-1.5 bg-white/50 p-2 rounded">
                                "
                                {
                                  (
                                    event.data as NonNullable<
                                      typeof selectedRecord.history
                                    >[number]
                                  ).catatan
                                }
                                "
                              </p>
                            )}
                          </div>
                        )}

                        {event.type === "recheck" &&
                          (() => {
                            const recheckData = event.data as NonNullable<
                              typeof selectedRecord.recheckRecords
                            >[number];
                            return (
                              <div
                                className={`p-3 rounded-lg border ${
                                  recheckData.allPassed
                                    ? "bg-green-50 border-green-100"
                                    : "bg-red-50 border-red-100"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span
                                    className={`font-medium text-sm ${
                                      recheckData.allPassed
                                        ? "text-green-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {recheckData.allPassed
                                      ? "✅ Recheck Lulus"
                                      : "🔄 Recheck Perlu Perbaikan"}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {recheckData.recheckedByName}
                                  </Badge>
                                </div>
                                {recheckData.failedAyats &&
                                  Array.isArray(recheckData.failedAyats) &&
                                  recheckData.failedAyats.length > 0 && (
                                    <div className="mb-1.5">
                                      <span className="text-xs text-red-600">
                                        Ayat perlu diperbaiki:{" "}
                                      </span>
                                      <span className="text-xs font-medium text-red-700">
                                        {recheckData.failedAyats.join(", ")}
                                      </span>
                                    </div>
                                  )}
                                {recheckData.catatan && (
                                  <p className="text-xs text-gray-600 italic bg-white/50 p-2 rounded">
                                    "{recheckData.catatan}"
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
