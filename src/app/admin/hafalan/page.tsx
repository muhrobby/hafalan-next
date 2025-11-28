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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Search,
  Download,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime, parseDate } from "@/lib/formatters";
import { useRoleGuard } from "@/hooks/use-role-guard";
import {
  usePagination,
  DataTablePagination,
} from "@/components/data-table-pagination";

interface HafalanRecord {
  id: string;
  santriId: string;
  kacaId: string;
  tanggalSetor: string;
  statusKaca: string;
  santri: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    nis: string;
  };
  kaca: {
    id: string;
    pageNumber: number;
    juz: number;
    surahName: string;
  };
  ayatStatuses: Array<{
    id: string;
    ayatNumber: number;
    status: string;
  }>;
  recheckRecords?: Array<{
    id: string;
    status: string;
    recheckedAt: string;
    allPassed: boolean;
    catatan?: string;
    recheckedBy?: string;
  }>;
  teacher?: {
    user: {
      name: string;
    };
  };
  catatan?: string;
  completedVerses?: string;
  history?: Array<{
    teacher: {
      user: {
        name: string;
      };
    };
    date: string;
    catatan?: string;
    completedVerses?: string;
  }>;
}

export default function AdminHafalanPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HafalanRecord | null>(
    null
  );
  const [records, setRecords] = useState<HafalanRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HafalanRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [juzFilter, setJuzFilter] = useState("all");

  // helper: safely parse completedVerses which may be a JSON string or already an array
  const parseCompletedVerses = (val?: string | any): any[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val as string) || [];
    } catch (e) {
      return [];
    }
  };

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(filteredRecords.length, 10);

  const paginatedRecords = paginateData(filteredRecords);

  // Reset page when filters change
  useEffect(() => {
    handlePageChange(1);
  }, [searchTerm, statusFilter, juzFilter]);

  const fetchHafalan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/hafalan?limit=500");
      if (!response.ok) {
        throw new Error("Failed to fetch hafalan records");
      }
      const data = await response.json();
      setRecords(data.data || []);
      setFilteredRecords(data.data || []);
    } catch (error) {
      console.error("Error fetching hafalan:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data hafalan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthorized) {
      fetchHafalan();
    }
  }, [isAuthorized, fetchHafalan]);

  useEffect(() => {
    let filtered = records;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.santri.user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          record.santri.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.kaca.surahName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (record) => record.statusKaca === statusFilter
      );
    }

    // Filter by juz
    if (juzFilter !== "all") {
      filtered = filtered.filter(
        (record) => record.kaca.juz === parseInt(juzFilter)
      );
    }

    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, juzFilter, records]);

  // Calculate paginated records
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayRecords = filteredRecords.slice(startIndex, endIndex);

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

  const exportToCSV = () => {
    const headers = [
      "Tanggal",
      "NIS",
      "Nama Santri",
      "Juz",
      "Halaman",
      "Surah",
      "Total Ayat",
      "Ayat Lancar",
      "Status",
      "Recheck",
    ];

    const rows = filteredRecords.map((record) => {
      const totalAyat = record.ayatStatuses?.length || 0;
      const lancar = (record.ayatStatuses || []).filter(
        (a) => a.status === "LANCAR"
      ).length;

      return [
        formatDate(record.tanggalSetor),
        record.santri.nis,
        record.santri.user.name,
        record.kaca.juz,
        record.kaca.pageNumber,
        record.kaca.surahName,
        totalAyat,
        lancar,
        record.statusKaca,
        record.recheckRecords?.length || 0,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `hafalan_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateProgress = () => {
    const total = records.length;
    const completed = records.filter(
      (r) => r.statusKaca === "RECHECK_PASSED"
    ).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data hafalan...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Data Hafalan
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Monitor dan kelola progress hafalan santri
            </p>
          </div>
          <Link href="/teacher/hafalan/input" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <BookOpen className="h-4 w-4 mr-2" />
              Input Hafalan
            </Button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hafalan</p>
                  <p className="text-2xl font-bold">{records.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selesai</p>
                  <p className="text-2xl font-bold">
                    {
                      records.filter((r) => r.statusKaca === "RECHECK_PASSED")
                        .length
                    }
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{calculateProgress()}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bulan Ini</p>
                  <p className="text-2xl font-bold">
                    {
                      records.filter((r) => {
                        const recordDate = parseDate(r.tanggalSetor);
                        const now = new Date();
                        return (
                          recordDate &&
                          recordDate.getMonth() === now.getMonth() &&
                          recordDate.getFullYear() === now.getFullYear()
                        );
                      }).length
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Filter & Pencarian
            </CardTitle>
            <CardDescription className="text-sm">
              Gunakan filter untuk menemukan data hafalan tertentu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama santri, NIS, atau surah..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="PROGRESS">Sedang Hafalan</SelectItem>
                      <SelectItem value="COMPLETE_WAITING_RECHECK">
                        Menunggu Recheck
                      </SelectItem>
                      <SelectItem value="RECHECK_PASSED">
                        Recheck Lulus
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-0">
                  <Select value={juzFilter} onValueChange={setJuzFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Juz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Juz</SelectItem>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(
                        (juz) => (
                          <SelectItem key={juz} value={juz.toString()}>
                            Juz {juz}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Daftar Hafalan ({filteredRecords.length})
            </CardTitle>
            <CardDescription className="text-sm">
              Riwayat hafalan seluruh santri di sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Tanggal</TableHead>
                    <TableHead className="min-w-[150px]">Santri</TableHead>
                    <TableHead className="min-w-[120px]">Guru</TableHead>
                    <TableHead className="min-w-20">Halaman</TableHead>
                    <TableHead className="min-w-[120px]">Surah</TableHead>
                    <TableHead className="min-w-[140px]">Progress</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-20">Recheck</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRecords.map((record) => {
                    const totalAyat = record.ayatStatuses.length;
                    const lancar = record.ayatStatuses.filter(
                      (a) => a.status === "LANCAR"
                    ).length;
                    const percentage =
                      totalAyat > 0
                        ? Math.round((lancar / totalAyat) * 100)
                        : 0;

                    return (
                      <TableRow
                        key={record.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <TableCell className="text-sm">
                          {formatDate(record.tanggalSetor)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {record.santri.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              NIS: {record.santri.nis}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {Array.from(
                                new Set(
                                  [
                                    record.teacher?.user?.name,
                                    ...(record.history?.map(
                                      (h) => h.teacher?.user?.name
                                    ) || []),
                                  ].filter(Boolean)
                                )
                              ).join(", ") || "Unknown"}
                            </div>
                            {record.history && record.history.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +{record.history.length} riwayat
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              Hal. {record.kaca.pageNumber}
                            </div>
                            <div className="text-muted-foreground">
                              Juz {record.kaca.juz}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.kaca.surahName}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {lancar}/{totalAyat} ayat ({percentage}%)
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.statusKaca} />
                        </TableCell>
                        <TableCell>
                          {record.recheckRecords &&
                          record.recheckRecords.length > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700"
                            >
                              {record.recheckRecords.length}x
                            </Badge>
                          ) : record.history && record.history.length > 0 ? (
                            <Badge
                              variant="secondary"
                              className="bg-amber-50 text-amber-700 border-amber-200"
                            >
                              {record.history.length} edit
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada data hafalan yang ditemukan</p>
                  <p className="text-sm">
                    Coba ubah filter atau kata pencarian.
                  </p>
                </div>
              )}

              {filteredRecords.length > 0 && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredRecords.length}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
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
                Perjalanan hafalan {selectedRecord?.santri.user.name} untuk{" "}
                {selectedRecord?.kaca.surahName} (Hal.{" "}
                {selectedRecord?.kaca.pageNumber})
              </DialogDescription>
            </DialogHeader>

            {/* Summary Card */}
            {selectedRecord && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        Total Update
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {(selectedRecord.history?.length || 0) + 1}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        Guru Terlibat
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {
                          new Set(
                            [
                              selectedRecord.teacher?.user.name,
                              ...(selectedRecord.history?.map(
                                (h) => h.teacher.user.name
                              ) || []),
                            ].filter(Boolean)
                          ).size
                        }
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Recheck</div>
                      <div className="text-2xl font-bold text-green-700">
                        {selectedRecord.recheckRecords?.length || 0}x
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Status</div>
                      <div className="text-xs mt-1">
                        <StatusBadge status={selectedRecord.statusKaca} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <ScrollArea className="h-[300px] md:h-[400px] pr-2 md:pr-4">
              <div className="space-y-6">
                {/* Initial Record */}
                {selectedRecord && (
                  <div className="relative pl-6 border-l-2 border-gray-200 pb-6 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white" />
                    <div className="mb-1 text-sm text-gray-500">
                      {formatDateTime(selectedRecord.tanggalSetor)}
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-800">
                            Hafalan Dimulai
                          </span>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {Array.from(
                            new Set(
                              [
                                selectedRecord.teacher?.user?.name,
                                ...(selectedRecord.history?.map(
                                  (h) => h.teacher?.user?.name
                                ) || []),
                              ].filter(Boolean)
                            )
                          ).join(", ") || "-"}
                        </Badge>
                      </div>
                      {selectedRecord.catatan && (
                        <div className="bg-white/80 p-2 rounded mb-2">
                          <p className="text-sm text-gray-700 italic">
                            💬 "{selectedRecord.catatan}"
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-700 font-medium">
                          Progress Awal:{" "}
                          {
                            parseCompletedVerses(selectedRecord.completedVerses)
                              .length
                          }{" "}
                          ayat
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {selectedRecord.statusKaca || "-"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Updates - Sort by date ascending for chronological order */}
                {selectedRecord?.history && selectedRecord.history.length > 0
                  ? [...selectedRecord.history]
                      .sort(
                        (a, b) =>
                          (parseDate(a.date)?.getTime() || 0) -
                          (parseDate(b.date)?.getTime() || 0)
                      )
                      .map((hist, idx, sortedHistory) => {
                        const prevVerses =
                          idx === 0
                            ? parseCompletedVerses(
                                selectedRecord.completedVerses
                              ).length
                            : parseCompletedVerses(
                                sortedHistory[idx - 1].completedVerses
                              ).length;
                        const currentVerses = parseCompletedVerses(
                          hist.completedVerses
                        ).length;
                        const verseDiff = currentVerses - prevVerses;

                        return (
                          <div
                            key={idx}
                            className="relative pl-6 border-l-2 border-gray-200 pb-6 last:pb-0"
                          >
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 border-4 border-white" />
                            <div className="mb-1 text-sm text-gray-500 flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(hist.date)}
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-amber-600" />
                                  <span className="font-semibold text-amber-800">
                                    Update Hafalan #{idx + 1}
                                  </span>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                  {hist.teacher?.user?.name || "Unknown"}
                                </Badge>
                              </div>
                              {hist.catatan && (
                                <div className="bg-white/80 p-2 rounded mb-3">
                                  <p className="text-sm text-gray-700 italic">
                                    💬 "{hist.catatan}"
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/60 p-2 rounded">
                                  <div className="text-gray-500 mb-1">
                                    Progress Total
                                  </div>
                                  <div className="font-bold text-amber-700 text-lg">
                                    {currentVerses} ayat
                                  </div>
                                </div>
                                <div className="bg-white/60 p-2 rounded">
                                  <div className="text-gray-500 mb-1">
                                    Penambahan
                                  </div>
                                  <div
                                    className={`font-bold text-lg ${
                                      verseDiff > 0
                                        ? "text-green-600"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {verseDiff > 0
                                      ? `+${verseDiff}`
                                      : verseDiff}{" "}
                                    ayat
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  : null}

                {/* Recheck Records */}
                {selectedRecord?.recheckRecords &&
                selectedRecord.recheckRecords.length > 0
                  ? selectedRecord.recheckRecords.map((recheck, idx) => (
                      <div
                        key={`recheck-${idx}`}
                        className="relative pl-6 border-l-2 border-gray-200 pb-6 last:pb-0"
                      >
                        <div
                          className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white ${
                            recheck.allPassed ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <div className="mb-1 text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(recheck.recheckedAt)}
                        </div>
                        <div
                          className={`p-4 rounded-lg border shadow-sm ${
                            recheck.allPassed
                              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                              : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {recheck.allPassed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span
                                className={`font-semibold ${
                                  recheck.allPassed
                                    ? "text-green-800"
                                    : "text-red-800"
                                }`}
                              >
                                {recheck.allPassed
                                  ? "✅ Recheck Lulus"
                                  : "❌ Perlu Perbaikan"}
                              </span>
                            </div>
                            <Badge
                              variant={
                                recheck.allPassed ? "default" : "destructive"
                              }
                              className={
                                recheck.allPassed ? "bg-green-600" : ""
                              }
                            >
                              Recheck #{idx + 1}
                            </Badge>
                          </div>
                          {recheck.catatan && (
                            <div className="bg-white/80 p-2 rounded">
                              <p className="text-sm text-gray-700 italic">
                                💬 "{recheck.catatan}"
                              </p>
                            </div>
                          )}
                          {recheck.recheckedBy && (
                            <div className="mt-2 text-xs text-gray-600">
                              Dicek oleh:{" "}
                              <span className="font-medium">
                                {recheck.recheckedBy}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
