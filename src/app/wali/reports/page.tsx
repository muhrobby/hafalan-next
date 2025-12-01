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
import { StatusBadge } from "@/components/ui/status-badge";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileText,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Printer,
  Mail,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import RaportTemplate, {
  RaportPrintActions,
} from "@/components/raport/raport-template";

interface Child {
  id: string;
  name: string;
  nis: string;
}

interface ReportData {
  childName: string;
  childNis: string;
  period: string;
  totalKaca: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheck: number;
  successRate: number;
  hafalanDetails: Array<{
    kacaInfo: string;
    surahName: string;
    pageNumber: number;
    status: string;
    completedVerses: number;
    totalVerses: number;
    tanggalSetor: string;
    teacherName: string;
    catatan?: string;
  }>;
}

export default function WaliReportsPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["WALI"],
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "template">("table");
  const raportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);

        const usersResponse = await fetch("/api/users?role=SANTRI");
        const usersData = await usersResponse.json();

        const waliChildren =
          usersData.data
            ?.filter(
              (user: any) =>
                user.santriProfile?.waliId === session?.user.waliProfile?.id
            )
            .map((user: any) => ({
              id: user.id,
              name: user.name,
              nis: user.santriProfile?.nis || "-",
            })) || [];

        setChildren(waliChildren);

        if (waliChildren.length > 0) {
          setSelectedChild(waliChildren[0].id);
        }
      } catch (error) {
        console.error("Error fetching children:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchChildren();
    }
  }, [session]);

  const generateReport = async () => {
    if (!selectedChild) return;

    try {
      setGenerating(true);

      const usersResponse = await fetch("/api/users?role=SANTRI");
      const usersData = await usersResponse.json();

      const hafalanResponse = await fetch("/api/hafalan?limit=500");
      const hafalanData = await hafalanResponse.json();

      const child = usersData.data?.find((u: any) => u.id === selectedChild);

      if (!child) return;

      let filteredRecords =
        hafalanData.data?.filter(
          (record: any) => record.santriId === child.santriProfile?.id
        ) || [];

      // Filter by period
      if (selectedPeriod !== "all") {
        const now = new Date();
        const startDate = new Date();

        switch (selectedPeriod) {
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "quarter":
            startDate.setMonth(now.getMonth() - 3);
            break;
          case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        filteredRecords = filteredRecords.filter(
          (record: any) => new Date(record.createdAt) >= startDate
        );
      }

      const totalKaca = filteredRecords.length;
      const completedKaca = filteredRecords.filter(
        (r: any) => r.statusKaca === "RECHECK_PASSED"
      ).length;
      const inProgressKaca = filteredRecords.filter(
        (r: any) => r.statusKaca === "PROGRESS"
      ).length;
      const waitingRecheck = filteredRecords.filter(
        (r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK"
      ).length;

      const successRate =
        totalKaca > 0 ? Math.round((completedKaca / totalKaca) * 100) : 0;

      const hafalanDetails = filteredRecords.map((record: any) => {
        const totalVerses = record.kaca.ayatEnd - record.kaca.ayatStart + 1;

        // Calculate completed verses based on status
        let completedVerses = 0;
        if (record.statusKaca === "RECHECK_PASSED") {
          // If already passed recheck, all verses completed (100%)
          completedVerses = totalVerses;
        } else {
          // Count from ayatStatuses where status = LANJUT
          completedVerses =
            record.ayatStatuses?.filter((a: any) => a.status === "LANJUT")
              .length || 0;
        }

        return {
          kacaInfo: `${record.kaca.surahName} (Hal ${record.kaca.pageNumber})`,
          surahName: record.kaca.surahName,
          pageNumber: record.kaca.pageNumber,
          status: record.statusKaca,
          completedVerses,
          totalVerses,
          tanggalSetor: new Date(record.tanggalSetor).toLocaleDateString(
            "id-ID"
          ),
          teacherName: record.teacher?.user?.name || "Unknown",
          catatan: record.catatan,
        };
      });

      const periodLabels: Record<string, string> = {
        all: "Semua Periode",
        week: "7 Hari Terakhir",
        month: "1 Bulan Terakhir",
        quarter: "3 Bulan Terakhir",
        year: "1 Tahun Terakhir",
      };

      setReportData({
        childName: child.name,
        childNis: child.santriProfile?.nis || "-",
        period: periodLabels[selectedPeriod],
        totalKaca,
        completedKaca,
        inProgressKaca,
        waitingRecheck,
        successRate,
        hafalanDetails,
      });
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      generateReport();
    }
  }, [selectedChild, selectedPeriod]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const headers = [
      "Surah",
      "Halaman",
      "Status",
      "Ayat Selesai",
      "Total Ayat",
      "Tanggal Setor",
      "Guru",
      "Catatan",
    ];
    const rows = reportData.hafalanDetails.map((detail) => [
      detail.surahName,
      detail.pageNumber,
      detail.status,
      detail.completedVerses,
      detail.totalVerses,
      detail.tanggalSetor,
      detail.teacherName,
      detail.catatan || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-hafalan-${reportData.childName.replace(
      /\s+/g,
      "-"
    )}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 print:hidden">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/wali">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                Wali: Laporan Hafalan
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Generate dan export laporan progress hafalan anak
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Pengaturan Laporan</CardTitle>
            <CardDescription>
              Pilih anak dan periode untuk generate laporan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Pilih Anak
                </label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih anak" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name} - {child.nis}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Periode
                </label>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Periode</SelectItem>
                    <SelectItem value="week">7 Hari Terakhir</SelectItem>
                    <SelectItem value="month">1 Bulan Terakhir</SelectItem>
                    <SelectItem value="quarter">3 Bulan Terakhir</SelectItem>
                    <SelectItem value="year">1 Tahun Terakhir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print Laporan
              </Button>
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="mt-6">
              <label className="text-sm font-medium mb-2 block">
                Tampilan Laporan
              </label>
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "table" | "template")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="table"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Tampilan Tabel
                  </TabsTrigger>
                  <TabsTrigger
                    value="template"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Raport Profesional
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {reportData && viewMode === "table" && (
          <div className="space-y-6">
            {/* Report Header - Only visible when printing */}
            <div className="hidden print:block">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  LAPORAN HAFALAN AL-QUR'AN
                </h1>
                <p className="text-gray-600">Periode: {reportData.period}</p>
              </div>
            </div>

            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informasi Anak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nama</p>
                    <p className="font-medium">{reportData.childName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">NIS</p>
                    <p className="font-medium">{reportData.childNis}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Periode</p>
                    <p className="font-medium">{reportData.period}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Laporan</p>
                    <p className="font-medium">
                      {new Date().toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
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
                    {reportData.totalKaca}
                  </div>
                  <p className="text-xs text-muted-foreground">Kaca total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Selesai</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.completedKaca}
                  </div>
                  <p className="text-xs text-muted-foreground">Kaca selesai</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Progress
                  </CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.inProgressKaca}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sedang berjalan
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tingkat Keberhasilan
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.successRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">Success rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Records */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Hafalan</CardTitle>
                <CardDescription>
                  Rincian lengkap hafalan per kaca
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>No</TableHead>
                        <TableHead>Surah & Halaman</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress Ayat</TableHead>
                        <TableHead>Tanggal Setor</TableHead>
                        <TableHead>Guru</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.hafalanDetails.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-gray-500 py-8"
                          >
                            Belum ada data hafalan pada periode ini
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportData.hafalanDetails.map((detail, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {detail.kacaInfo}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={detail.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {detail.completedVerses}/{detail.totalVerses}
                                </span>
                                <span className="text-xs text-gray-500">
                                  (
                                  {Math.round(
                                    (detail.completedVerses /
                                      detail.totalVerses) *
                                      100
                                  )}
                                  %)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {detail.tanggalSetor}
                            </TableCell>
                            <TableCell className="text-sm">
                              {detail.teacherName}
                            </TableCell>
                            <TableCell className="text-sm max-w-xs truncate">
                              {detail.catatan || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Footer - Only visible when printing */}
            <div className="hidden print:block mt-12">
              <Separator className="my-8" />
              <div className="flex justify-between text-sm text-gray-600">
                <div>
                  <p>Wali: {session?.user.name}</p>
                  <p>Email: {session?.user.email}</p>
                </div>
                <div className="text-right">
                  <p>Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
                  <p className="mt-2">_____________________</p>
                  <p>Tanda Tangan Wali</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Raport Template View */}
        {reportData && viewMode === "template" && (
          <div className="space-y-4">
            {/* Print Actions */}
            <div className="no-print">
              <RaportPrintActions />
            </div>

            {/* Raport Template */}
            <RaportTemplate
              ref={raportRef}
              studentInfo={{
                name: reportData.childName,
                nis: reportData.childNis,
                parentName: session?.user?.name || "Wali",
              }}
              summary={{
                totalRecords: reportData.totalKaca,
                completedKaca: reportData.completedKaca,
                waitingRecheck: reportData.waitingRecheck,
                inProgress: reportData.inProgressKaca,
                completionRate: reportData.successRate,
              }}
              records={reportData.hafalanDetails.map((detail, index) => ({
                id: `${index}`,
                kacaInfo: detail.kacaInfo,
                juzNumber: 0, // Not available in current data
                status: detail.status,
                tanggalSetor: detail.tanggalSetor,
                completedVerses: detail.completedVerses,
                totalVerses: detail.totalVerses,
                teacherName: detail.teacherName,
                catatan: detail.catatan,
              }))}
              periodLabel={reportData.period}
              periodStart={new Date()}
              periodEnd={new Date()}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
