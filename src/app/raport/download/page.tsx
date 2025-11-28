"use client";

import { Suspense } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Download,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  User,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useSession } from "next-auth/react";

interface HafalanDetail {
  id: string;
  surahName: string;
  pageNumber: number;
  juz: number;
  ayatStart: number;
  ayatEnd: number;
  tanggalSetor: string;
  tanggalSelesai?: string;
  status: string;
  teacherName: string;
  completedVerses: number[];
  recheckHistory: {
    date: string;
    teacherName: string;
    allPassed: boolean;
    failedAyats: number[];
    catatan?: string;
  }[];
}

interface SantriRaport {
  santriId: string;
  santriName: string;
  nis: string;
  teacherName: string;
  totalKaca: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheckKaca: number;
  hafalanDetails: HafalanDetail[];
}

export default function RaportDownloadPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout role="TEACHER">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </DashboardLayout>
      }
    >
      <RaportDownloadContent />
    </Suspense>
  );
}

function RaportDownloadContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const santriIdParam = searchParams.get("santriId");
  const [loading, setLoading] = useState(true);
  const [santris, setSantris] = useState<
    { id: string; name: string; nis: string }[]
  >([]);
  const [selectedSantriId, setSelectedSantriId] = useState(santriIdParam || "");
  const [raportData, setRaportData] = useState<SantriRaport | null>(null);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const userRole = session?.user?.role;

  // Determine back URL based on role
  const getBackUrl = () => {
    switch (userRole) {
      case "ADMIN":
        return "/admin";
      case "TEACHER":
        return "/teacher/raport";
      case "WALI":
        return "/wali";
      default:
        return "/";
    }
  };

  useEffect(() => {
    const fetchSantris = async () => {
      try {
        let url = "/api/users?role=SANTRI";

        // For teacher, filter by their santris
        if (userRole === "TEACHER" && session?.user?.teacherProfile?.id) {
          url += `&teacherId=${session.user.teacherProfile.id}`;
        }
        // For wali, filter by their children
        else if (userRole === "WALI" && session?.user?.waliProfile?.id) {
          url += `&waliId=${session.user.waliProfile.id}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        const santriList =
          data.data?.map((user: any) => ({
            id: user.santriProfile?.id || user.id,
            name: user.name,
            nis: user.santriProfile?.nis || "-",
          })) || [];

        setSantris(santriList);

        // Auto-select if only one santri or if santriId is provided
        if (
          santriIdParam &&
          santriList.some((s: any) => s.id === santriIdParam)
        ) {
          setSelectedSantriId(santriIdParam);
        } else if (santriList.length === 1) {
          setSelectedSantriId(santriList[0].id);
        }
      } catch (error) {
        console.error("Error fetching santris:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchSantris();
    }
  }, [session, userRole, santriIdParam]);

  useEffect(() => {
    const fetchRaportData = async () => {
      if (!selectedSantriId) {
        setRaportData(null);
        return;
      }

      try {
        setGenerating(true);

        // Fetch hafalan records for this santri
        const hafalanResponse = await fetch(
          `/api/hafalan?santriId=${selectedSantriId}&limit=500`
        );
        const hafalanData = await hafalanResponse.json();

        if (!hafalanData.data || hafalanData.data.length === 0) {
          setRaportData(null);
          setGenerating(false);
          return;
        }

        const firstRecord = hafalanData.data[0];
        const santriName = firstRecord.santri?.user?.name || "Unknown";
        const nis = firstRecord.santri?.nis || "-";

        const hafalanDetails: HafalanDetail[] = hafalanData.data.map(
          (record: any) => {
            const completedVerses = JSON.parse(record.completedVerses || "[]");

            // Get last successful recheck date as completion date
            const successfulRecheck = record.recheckRecords?.find(
              (r: any) => r.allPassed
            );

            return {
              id: record.id,
              surahName: record.kaca?.surahName || "-",
              pageNumber: record.kaca?.pageNumber || 0,
              juz: record.kaca?.juz || 0,
              ayatStart: record.kaca?.ayatStart || 0,
              ayatEnd: record.kaca?.ayatEnd || 0,
              tanggalSetor: record.tanggalSetor,
              tanggalSelesai: successfulRecheck?.recheckDate || null,
              status: record.statusKaca,
              teacherName: record.teacher?.user?.name || "-",
              completedVerses,
              recheckHistory: (record.recheckRecords || []).map((rr: any) => ({
                date: rr.recheckDate,
                teacherName: rr.recheckedByName || "-",
                allPassed: rr.allPassed,
                failedAyats:
                  typeof rr.failedAyats === "string"
                    ? JSON.parse(rr.failedAyats || "[]")
                    : rr.failedAyats || [],
                catatan: rr.catatan,
              })),
            };
          }
        );

        // Sort by juz and page number
        hafalanDetails.sort((a, b) => {
          if (a.juz !== b.juz) return a.juz - b.juz;
          return a.pageNumber - b.pageNumber;
        });

        // Calculate stats
        const totalKaca = hafalanDetails.length;
        const completedKaca = hafalanDetails.filter(
          (h) => h.status === "RECHECK_PASSED"
        ).length;
        const inProgressKaca = hafalanDetails.filter(
          (h) => h.status === "PROGRESS"
        ).length;
        const waitingRecheckKaca = hafalanDetails.filter(
          (h) => h.status === "COMPLETE_WAITING_RECHECK"
        ).length;

        // Get teacher name from first record
        const teacherName = hafalanDetails[0]?.teacherName || "-";

        setRaportData({
          santriId: selectedSantriId,
          santriName,
          nis,
          teacherName,
          totalKaca,
          completedKaca,
          inProgressKaca,
          waitingRecheckKaca,
          hafalanDetails,
        });
      } catch (error) {
        console.error("Error fetching raport data:", error);
      } finally {
        setGenerating(false);
      }
    };

    fetchRaportData();
  }, [selectedSantriId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // For now, use print-to-PDF functionality
    window.print();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "d MMM yyyy", { locale: idLocale });
  };

  if (loading) {
    return (
      <DashboardLayout role={userRole as any}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={userRole as any}>
      <div className="space-y-6">
        {/* Header - Hidden in print */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 print:hidden">
          <div className="flex items-start gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href={getBackUrl()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Download Raport Hafalan
              </h1>
              <p className="text-gray-600">
                Generate dan download raport hafalan santri dalam format PDF
              </p>
            </div>
          </div>
        </div>

        {/* Santri Selector - Hidden in print */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Pilih Santri
            </CardTitle>
            <CardDescription>
              Pilih santri untuk melihat dan download raport hafalan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 max-w-md">
                <Label className="mb-2 block">Santri</Label>
                <Select
                  value={selectedSantriId}
                  onValueChange={setSelectedSantriId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih santri..." />
                  </SelectTrigger>
                  <SelectContent>
                    {santris.map((santri) => (
                      <SelectItem key={santri.id} value={santri.id}>
                        {santri.name} ({santri.nis})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {raportData && (
                <div className="flex gap-2 items-end">
                  <Button onClick={handlePrint} variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button onClick={handleDownloadPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Raport Content */}
        {generating ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="text-gray-600">Generating raport...</p>
            </div>
          </div>
        ) : raportData ? (
          <div ref={printRef} className="print:p-8">
            {/* Raport Header */}
            <Card className="mb-6 print:shadow-none print:border-2">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    RAPORT HAFALAN AL-QUR'AN
                  </h1>
                  <p className="text-gray-600">Metode 1 Kaca</p>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-32 text-gray-600">Nama Santri</span>
                      <span className="font-medium">
                        : {raportData.santriName}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-600">NIS</span>
                      <span className="font-medium">: {raportData.nis}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-32 text-gray-600">
                        Guru Pembimbing
                      </span>
                      <span className="font-medium">
                        : {raportData.teacherName}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-600">Tanggal Cetak</span>
                      <span className="font-medium">
                        :{" "}
                        {format(new Date(), "d MMMM yyyy", {
                          locale: idLocale,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {raportData.totalKaca}
                    </p>
                    <p className="text-sm text-gray-600">Total Kaca</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {raportData.completedKaca}
                    </p>
                    <p className="text-sm text-green-600">Selesai</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-700">
                      {raportData.waitingRecheckKaca}
                    </p>
                    <p className="text-sm text-amber-600">Menunggu Recheck</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">
                      {raportData.inProgressKaca}
                    </p>
                    <p className="text-sm text-blue-600">Sedang Hafalan</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detail Table */}
            <Card className="print:shadow-none print:border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detail Progress Hafalan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Surah / Halaman</TableHead>
                      <TableHead>Juz</TableHead>
                      <TableHead>Ayat</TableHead>
                      <TableHead>Tanggal Setor</TableHead>
                      <TableHead>Tanggal Selesai</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="print:hidden">Recheck</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {raportData.hafalanDetails.map((hafalan, index) => (
                      <TableRow key={hafalan.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{hafalan.surahName}</p>
                            <p className="text-sm text-gray-500">
                              Halaman {hafalan.pageNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{hafalan.juz}</TableCell>
                        <TableCell>
                          {hafalan.ayatStart} - {hafalan.ayatEnd}
                        </TableCell>
                        <TableCell>
                          {formatDate(hafalan.tanggalSetor)}
                        </TableCell>
                        <TableCell>
                          {formatDate(hafalan.tanggalSelesai)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={hafalan.status} />
                        </TableCell>
                        <TableCell className="print:hidden">
                          {hafalan.recheckHistory.length > 0 ? (
                            <div className="text-sm">
                              <p>{hafalan.recheckHistory.length}x recheck</p>
                              {hafalan.recheckHistory[0]?.allPassed ? (
                                <span className="text-green-600 text-xs">
                                  Lulus
                                </span>
                              ) : (
                                <span className="text-amber-600 text-xs">
                                  {hafalan.recheckHistory[0]?.failedAyats
                                    ?.length || 0}{" "}
                                  ayat ulang
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Footer - Print only */}
            <div className="hidden print:block mt-8 text-center text-sm text-gray-500">
              <Separator className="my-4" />
              <p>
                Dicetak pada{" "}
                {format(new Date(), "EEEE, d MMMM yyyy 'pukul' HH:mm", {
                  locale: idLocale,
                })}
              </p>
              <p className="mt-1">Aplikasi Hafalan Al-Qur'an - Metode 1 Kaca</p>
            </div>
          </div>
        ) : selectedSantriId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
              <BookOpen className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Tidak ada data hafalan</p>
              <p className="text-sm">
                Santri ini belum memiliki record hafalan
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
              <User className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Pilih Santri</p>
              <p className="text-sm">
                Pilih santri untuk melihat raport hafalan
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-8,
          .print\\:p-8 * {
            visibility: visible;
          }
          .print\\:p-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
