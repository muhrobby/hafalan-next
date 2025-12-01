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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  User,
  BookOpen,
  Calendar,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Target,
  TrendingUp,
  FileText,
  History,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { showAlert } from "@/lib/alert";
import { useDebounce } from "@/hooks/use-debounce";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { DataTablePagination } from "@/components/data-table-pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/formatters";

interface Santri {
  id: string;
  name: string;
  nis: string;
  userId: string;
  teacherName?: string;
  waliName?: string;
  totalHafalan: number;
  completedHafalan: number;
  currentKaca?: {
    id: string;
    pageNumber: number;
    surahName: string;
    status: string;
    completedVerses: number;
    totalVerses: number;
  };
}

interface HafalanRecord {
  id: string;
  kacaInfo: string;
  pageNumber: number;
  surahName: string;
  juzNumber: number;
  ayatStart: number;
  ayatEnd: number;
  status: string;
  tanggalSetor: string;
  completedVerses: number;
  completedVersesArray: number[]; // Array of ayat numbers that are completed
  totalVerses: number;
  teacherName: string;
  catatan?: string;
  history: {
    teacherName: string;
    date: string;
    catatan?: string;
    completedVerses?: string;
  }[];
  recheckRecords: {
    recheckedBy: string;
    recheckDate: string;
    allPassed: boolean;
    catatan?: string;
  }[];
}

interface SantriDetail {
  santri: Santri;
  hafalanRecords: HafalanRecord[];
  nextKaca?: {
    id: string;
    pageNumber: number;
    surahName: string;
    juzNumber: number;
    ayatStart: number;
    ayatEnd: number;
  };
  progress: {
    totalKaca: number;
    completedKaca: number;
    inProgressKaca: number;
    waitingRecheckKaca: number;
    progressPercentage: number;
  };
}

export default function TeacherSantriLookup() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["TEACHER"],
  });
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [santris, setSantris] = useState<Santri[]>([]);
  const [filteredSantris, setFilteredSantris] = useState<Santri[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<SantriDetail | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch all santris on mount
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchSantris = async () => {
      try {
        setLoading(true);
        const teacherId = session?.user?.id;

        const response = await fetch(
          `/api/users?role=SANTRI&teacherId=${teacherId}`
        );
        const data = await response.json();

        if (data.error) {
          showAlert.error("Error", data.error);
          return;
        }

        const santriList: Santri[] =
          data.data?.map((user: any) => ({
            id: user.santriProfile?.id || user.id,
            name: user.name,
            nis: user.santriProfile?.nis || "-",
            userId: user.id,
            teacherName: user.santriProfile?.teacher?.user?.name,
            teacherAssignments:
              user.santriProfile?.teacherAssignments?.map((ta: any) => ({
                id: ta.teacher?.id || ta.id,
                teacherName: ta.teacher?.user?.name || "-",
              })) || [],
            waliName: user.santriProfile?.wali?.user?.name,
            totalHafalan: 0,
            completedHafalan: 0,
          })) || [];

        setSantris(santriList);
        setFilteredSantris(santriList);
      } catch (error) {
        console.error("Error fetching santris:", error);
        showAlert.error("Error", "Gagal memuat data santri");
      } finally {
        setLoading(false);
      }
    };

    fetchSantris();
  }, [isAuthorized, session]);

  // Filter santris based on search
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredSantris(santris);
      setCurrentPage(1); // Reset to first page
      return;
    }

    setSearchLoading(true);
    const query = debouncedSearch.toLowerCase();
    const filtered = santris.filter(
      (santri) =>
        santri.name.toLowerCase().includes(query) ||
        santri.nis.toLowerCase().includes(query)
    );
    setFilteredSantris(filtered);
    setCurrentPage(1); // Reset to first page
    setSearchLoading(false);
  }, [debouncedSearch, santris]);

  // Fetch santri detail
  const fetchSantriDetail = useCallback(async (santri: Santri) => {
    try {
      setDetailLoading(true);
      setDialogOpen(true);

      // Fetch hafalan records for this santri
      const hafalanResponse = await fetch(
        `/api/hafalan?santriId=${santri.id}&limit=500`
      );
      const hafalanData = await hafalanResponse.json();

      if (hafalanData.error) {
        showAlert.error("Error", hafalanData.error);
        return;
      }

      const records: HafalanRecord[] =
        hafalanData.data?.map((record: any) => {
          const completedVersesArray: number[] = JSON.parse(
            record.completedVerses || "[]"
          );
          const totalVerses = record.kaca.ayatEnd - record.kaca.ayatStart + 1;

          return {
            id: record.id,
            kacaInfo: `${record.kaca.surahName} (Hal. ${record.kaca.pageNumber})`,
            pageNumber: record.kaca.pageNumber,
            surahName: record.kaca.surahName,
            juzNumber: record.kaca.juz, // Field di database adalah 'juz' bukan 'juzNumber'
            ayatStart: record.kaca.ayatStart,
            ayatEnd: record.kaca.ayatEnd,
            status: record.statusKaca,
            tanggalSetor: record.tanggalSetor,
            completedVerses: completedVersesArray.length,
            completedVersesArray, // Store the actual array of completed ayat numbers
            totalVerses,
            teacherName: record.teacher?.user?.name || "Unknown",
            catatan: record.catatan,
            history:
              record.history?.map((h: any) => ({
                teacherName: h.teacher?.user?.name || "Unknown",
                date: h.date,
                catatan: h.catatan,
                completedVerses: h.completedVerses,
              })) || [],
            recheckRecords:
              record.recheckRecords?.map((r: any) => ({
                recheckedBy: r.recheckedByName || "Unknown",
                recheckDate: r.recheckDate,
                allPassed: r.allPassed,
                catatan: r.catatan,
              })) || [],
          };
        }) || [];

      // Calculate progress
      const completedKaca = records.filter(
        (r) => r.status === "RECHECK_PASSED"
      ).length;
      const inProgressKaca = records.filter(
        (r) => r.status === "PROGRESS"
      ).length;
      const waitingRecheckKaca = records.filter(
        (r) => r.status === "COMPLETE_WAITING_RECHECK"
      ).length;

      // Fetch next kaca suggestion
      let nextKaca;

      // First check for in-progress or waiting-recheck kaca (priority)
      const inProgressRecord = records.find(
        (r) =>
          r.status === "PROGRESS" || r.status === "COMPLETE_WAITING_RECHECK"
      );

      if (inProgressRecord) {
        // If there's an in-progress or waiting-recheck record, show that
        nextKaca = {
          id: inProgressRecord.id,
          pageNumber: inProgressRecord.pageNumber,
          surahName: inProgressRecord.surahName,
          juzNumber: inProgressRecord.juzNumber,
          ayatStart: inProgressRecord.ayatStart,
          ayatEnd: inProgressRecord.ayatEnd,
        };
      } else if (records.length > 0) {
        // Get the highest page number that's completed
        const completedPages = records
          .filter((r) => r.status === "RECHECK_PASSED")
          .map((r) => r.pageNumber);
        const maxCompletedPage =
          completedPages.length > 0 ? Math.max(...completedPages) : 0;

        // Fetch next kaca after the last completed
        const kacaResponse = await fetch(
          `/api/kaca?pageNumber=${maxCompletedPage + 1}&limit=1`
        );
        const kacaData = await kacaResponse.json();

        if (kacaData.data?.length > 0) {
          const kaca = kacaData.data[0];
          nextKaca = {
            id: kaca.id,
            pageNumber: kaca.pageNumber,
            surahName: kaca.surahName,
            juzNumber: kaca.juz || 0,
            ayatStart: kaca.ayatStart,
            ayatEnd: kaca.ayatEnd,
          };
        }
      } else {
        // No records yet, suggest first kaca
        const kacaResponse = await fetch(`/api/kaca?pageNumber=1&limit=1`);
        const kacaData = await kacaResponse.json();

        if (kacaData.data?.length > 0) {
          const kaca = kacaData.data[0];
          nextKaca = {
            id: kaca.id,
            pageNumber: kaca.pageNumber,
            surahName: kaca.surahName,
            juzNumber: kaca.juz || 0,
            ayatStart: kaca.ayatStart,
            ayatEnd: kaca.ayatEnd,
          };
        }
      }

      setSelectedSantri({
        santri,
        hafalanRecords: records.sort(
          (a, b) =>
            new Date(b.tanggalSetor).getTime() -
            new Date(a.tanggalSetor).getTime()
        ),
        nextKaca,
        progress: {
          totalKaca: records.length,
          completedKaca,
          inProgressKaca,
          waitingRecheckKaca,
          progressPercentage:
            records.length > 0
              ? Math.round((completedKaca / records.length) * 100)
              : 0,
        },
      });
    } catch (error) {
      console.error("Error fetching santri detail:", error);
      showAlert.error("Error", "Gagal memuat detail santri");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Show loading while checking authorization
  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
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

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
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
                Teacher: Cek Progress Santri
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Cari santri dan lihat detail hafalan serta progress mereka
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Cari Santri
            </CardTitle>
            <CardDescription>
              Masukkan nama atau NIS santri untuk melihat detail hafalan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan nama atau NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Santri List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Santri</CardTitle>
            <CardDescription>
              {filteredSantris.length} santri ditemukan
              {searchQuery && ` untuk pencarian "${searchQuery}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredSantris.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? "Tidak ada santri yang cocok dengan pencarian"
                  : "Belum ada santri yang terdaftar"}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filteredSantris
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((santri) => (
                      <div
                        key={santri.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {santri.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              NIS: {santri.nis}
                            </p>
                            {/* Show all assigned teachers when available */}
                            {((santri.teacherAssignments &&
                              santri.teacherAssignments.length > 0) ||
                              santri.teacherName) && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(santri.teacherAssignments || [])
                                  .map((ta) => ta.teacherName)
                                  .filter(Boolean)
                                  .map((tName, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Pengajar: {tName}
                                    </Badge>
                                  ))}
                                {!santri.teacherAssignments?.length &&
                                  santri.teacherName && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Pengajar: {santri.teacherName}
                                    </Badge>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => fetchSantriDetail(santri)}
                          className="w-full sm:w-auto"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Lihat Detail
                        </Button>
                      </div>
                    ))}
                </div>

                {/* Pagination */}
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredSantris.length / pageSize)}
                  totalItems={filteredSantris.length}
                  pageSize={pageSize}
                  onPageChange={(page) => setCurrentPage(page)}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Detail Progress Hafalan
              </DialogTitle>
              <DialogDescription>
                {selectedSantri?.santri.name} - NIS:{" "}
                {selectedSantri?.santri.nis}
              </DialogDescription>
            </DialogHeader>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12 flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : selectedSantri ? (
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-6 py-6">
                  {/* Progress Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="bg-emerald-50 border-emerald-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-2xl font-bold text-emerald-700">
                              {selectedSantri.progress.completedKaca}
                            </p>
                            <p className="text-xs text-emerald-600">Selesai</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold text-blue-700">
                              {selectedSantri.progress.inProgressKaca}
                            </p>
                            <p className="text-xs text-blue-600">Progress</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <div>
                            <p className="text-2xl font-bold text-amber-700">
                              {selectedSantri.progress.waitingRecheckKaca}
                            </p>
                            <p className="text-xs text-amber-600">Recheck</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-2xl font-bold text-purple-700">
                              {selectedSantri.progress.progressPercentage}%
                            </p>
                            <p className="text-xs text-purple-600">Progress</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Next Kaca / Current Target */}
                  {/* {selectedSantri.nextKaca && (
                    <Card className="border-2 border-emerald-200 bg-emerald-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-emerald-600" />
                          Hafalan Selanjutnya / Target Saat Ini
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-xl font-bold text-emerald-700">
                              Halaman {selectedSantri.nextKaca.pageNumber}
                            </p>
                            <p className="text-gray-600">
                              {selectedSantri.nextKaca.surahName} (Juz{" "}
                              {selectedSantri.nextKaca.juzNumber})
                            </p>
                            <p className="text-sm text-gray-500">
                              Ayat {selectedSantri.nextKaca.ayatStart} -{" "}
                              {selectedSantri.nextKaca.ayatEnd}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-600">
                            <ArrowRight className="h-5 w-5" />
                            <span className="font-medium">
                              Lanjutkan hafalan ini
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )} */}

                  <Separator />

                  {/* Hafalan History */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Riwayat Hafalan
                    </h3>

                    {selectedSantri.hafalanRecords.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        Belum ada riwayat hafalan
                      </div>
                    ) : (
                      <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="list">Daftar</TabsTrigger>
                          <TabsTrigger value="table">Tabel</TabsTrigger>
                        </TabsList>

                        <TabsContent value="list" className="mt-4">
                          <ScrollArea className="h-[50vh] md:h-[400px] pr-4">
                            <div className="space-y-3">
                              {selectedSantri.hafalanRecords.map((record) => (
                                <Card key={record.id} className="border">
                                  <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <BookOpen className="h-4 w-4 text-emerald-600" />
                                          <span className="font-medium">
                                            Halaman {record.pageNumber}
                                          </span>
                                          <StatusBadge status={record.status} />
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {record.surahName} (Juz{" "}
                                          {record.juzNumber})
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Ayat {record.ayatStart} -{" "}
                                          {record.ayatEnd}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(record.tanggalSetor)}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {record.teacherName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium">
                                          {record.completedVerses} /{" "}
                                          {record.totalVerses} ayat
                                        </p>
                                        <Progress
                                          value={
                                            (record.completedVerses /
                                              record.totalVerses) *
                                            100
                                          }
                                          className="w-24 mt-1"
                                        />
                                      </div>
                                    </div>

                                    {/* Detail Ayat Section */}
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                      <p className="text-xs font-medium text-gray-700 mb-2">
                                        Detail Ayat (Halaman {record.pageNumber}
                                        ):
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {Array.from(
                                          {
                                            length:
                                              record.ayatEnd -
                                              record.ayatStart +
                                              1,
                                          },
                                          (_, i) => record.ayatStart + i
                                        ).map((ayatNum) => {
                                          const isCompleted =
                                            record.completedVersesArray.includes(
                                              ayatNum
                                            );
                                          return (
                                            <div
                                              key={ayatNum}
                                              className={`
                                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors
                                                ${
                                                  isCompleted
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                                    : "bg-red-50 text-red-600 border-red-200"
                                                }
                                              `}
                                              title={
                                                isCompleted
                                                  ? `Ayat ${ayatNum} - Lancar`
                                                  : `Ayat ${ayatNum} - Belum Lancar`
                                              }
                                            >
                                              {ayatNum}
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></div>
                                          Lancar
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <div className="w-3 h-3 rounded-full bg-red-50 border border-red-200"></div>
                                          Belum Lancar
                                        </span>
                                      </div>
                                    </div>

                                    {record.catatan && (
                                      <div className="mt-3 p-2 bg-amber-50 rounded text-sm border border-amber-200">
                                        <span className="font-medium text-amber-800">
                                          Catatan:
                                        </span>{" "}
                                        <span className="text-amber-700">
                                          {record.catatan}
                                        </span>
                                      </div>
                                    )}

                                    {record.recheckRecords.length > 0 && (
                                      <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs font-medium text-gray-600 mb-2">
                                          Riwayat Recheck:
                                        </p>
                                        <div className="space-y-1">
                                          {record.recheckRecords.map(
                                            (recheck, idx) => (
                                              <div
                                                key={idx}
                                                className="text-xs flex items-center gap-2"
                                              >
                                                {recheck.allPassed ? (
                                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                ) : (
                                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                                )}
                                                <span>
                                                  {formatDate(
                                                    recheck.recheckDate
                                                  )}
                                                </span>
                                                <span>
                                                  oleh {recheck.recheckedBy}
                                                </span>
                                                {recheck.catatan && (
                                                  <span className="text-gray-500">
                                                    - {recheck.catatan}
                                                  </span>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="table" className="mt-4">
                          <div className="border rounded-lg overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Halaman</TableHead>
                                  <TableHead>Surah</TableHead>
                                  <TableHead>Juz</TableHead>
                                  <TableHead>Ayat</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Tanggal</TableHead>
                                  <TableHead>Progress</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedSantri.hafalanRecords.map((record) => (
                                  <TableRow key={record.id}>
                                    <TableCell className="font-medium">
                                      {record.pageNumber}
                                    </TableCell>
                                    <TableCell>{record.surahName}</TableCell>
                                    <TableCell>{record.juzNumber}</TableCell>
                                    <TableCell>
                                      {record.ayatStart}-{record.ayatEnd}
                                    </TableCell>
                                    <TableCell>
                                      <StatusBadge
                                        status={record.status}
                                        size="sm"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(record.tanggalSetor)}
                                    </TableCell>
                                    <TableCell>
                                      {record.completedVerses}/
                                      {record.totalVerses}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
