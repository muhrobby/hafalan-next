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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Calendar,
  History,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";

interface RecheckHistoryItem {
  id: string;
  recheckDate: string;
  recheckedByName: string;
  allPassed: boolean;
  failedAyats: number[];
  catatan?: string;
}

interface RecheckRecord {
  id: string;
  santriName: string;
  santriId: string;
  kacaInfo: string;
  surahName: string;
  juzNumber: number;
  pageNumber: number;
  ayatStart: number;
  ayatEnd: number;
  completedVerses: number[];
  status: string;
  tanggalSetor: string;
  catatan?: string;
  teacherName?: string;
  daysSinceSetor?: number;
  recheckHistory: RecheckHistoryItem[];
  lastFailedAyats: number[];
}

export default function TeacherRecheckHafalan() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["TEACHER"],
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recheckRecords, setRecheckRecords] = useState<RecheckRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecheckRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recheckData, setRecheckData] = useState({
    allPassed: false,
    failedAyats: [] as number[],
    catatan: "",
  });

  const fetchRecheckData = useCallback(async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      // Don't filter by teacherId - let the API handle santri assignment filtering
      // This allows teachers to see recheck requests for all their assigned santris
      const hafalanResponse = await fetch(
        `/api/hafalan?status=COMPLETE_WAITING_RECHECK&limit=100`
      );
      const hafalanData = await hafalanResponse.json();

      const records: RecheckRecord[] =
        hafalanData.data
          ?.filter((record: any) => record.statusKaca === "COMPLETE_WAITING_RECHECK")
          .map((record: any) => {
            const completedVerses = JSON.parse(record.completedVerses);
            const setorDate = new Date(record.tanggalSetor);
            const now = new Date();
            const daysSinceSetor = Math.floor(
              (now.getTime() - setorDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Parse recheck history
            const recheckHistory: RecheckHistoryItem[] = (record.recheckRecords || [])
              .map((rr: any) => {
                let failedAyats: number[] = [];
                try {
                  failedAyats = typeof rr.failedAyats === 'string' 
                    ? JSON.parse(rr.failedAyats) 
                    : rr.failedAyats || [];
                } catch {
                  failedAyats = [];
                }
                return {
                  id: rr.id,
                  recheckDate: rr.recheckDate,
                  recheckedByName: rr.recheckedByName || "Unknown",
                  allPassed: rr.allPassed,
                  failedAyats,
                  catatan: rr.catatan,
                };
              })
              .sort((a: RecheckHistoryItem, b: RecheckHistoryItem) => 
                new Date(b.recheckDate).getTime() - new Date(a.recheckDate).getTime()
              );

            // Get failed ayats from last recheck (if any)
            const lastRecheck = recheckHistory[0];
            const lastFailedAyats = lastRecheck?.failedAyats || [];

            return {
              id: record.id,
              santriName: record.santri.user.name,
              santriId: record.santriId,
              kacaInfo: `${record.kaca.surahName} (Hal. ${record.kaca.pageNumber})`,
              surahName: record.kaca.surahName,
              juzNumber: record.kaca.juz || record.kaca.juzNumber || 0,
              pageNumber: record.kaca.pageNumber,
              ayatStart: record.kaca.ayatStart,
              ayatEnd: record.kaca.ayatEnd,
              completedVerses,
              status: record.statusKaca,
              tanggalSetor: record.tanggalSetor,
              catatan: record.catatan,
              teacherName: record.teacher?.user?.name,
              daysSinceSetor,
              recheckHistory,
              lastFailedAyats,
            };
          }) || [];

      setRecheckRecords(records);
    } catch (err) {
      console.error("Error fetching recheck data:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data recheck. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    if (session) {
      fetchRecheckData();
    }
  }, [session, fetchRecheckData]);

  const handleOpenRecheck = (record: RecheckRecord) => {
    setSelectedRecord(record);
    
    // Get all ayats in this page
    const allAyats = Array.from(
      { length: record.ayatEnd - record.ayatStart + 1 },
      (_, i) => record.ayatStart + i
    );
    
    // Determine which ayats need to be rechecked
    // If there was a previous recheck with failed ayats, those are the ones that need checking
    // Otherwise, all ayats need verification
    let ayatsToRecheck: number[];
    
    if (record.lastFailedAyats.length > 0) {
      // Only the failed ayats from last recheck need to be verified
      ayatsToRecheck = record.lastFailedAyats;
    } else {
      // First recheck - all ayats need to be verified
      ayatsToRecheck = allAyats;
    }
    
    // Start with all ayats that need rechecking in failedAyats (unchecked)
    setRecheckData({
      allPassed: false,
      failedAyats: ayatsToRecheck,
      catatan: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setRecheckData({
      allPassed: false,
      failedAyats: [],
      catatan: "",
    });
  };

  const handleAyatCheck = (ayatNumber: number, checked: boolean) => {
    setRecheckData((prev) => {
      const failedAyats = checked
        ? prev.failedAyats.filter((a) => a !== ayatNumber)
        : [...prev.failedAyats, ayatNumber];

      return {
        ...prev,
        failedAyats,
        allPassed: failedAyats.length === 0,
      };
    });
  };

  const handleSelectAllPassed = (passed: boolean) => {
    if (!selectedRecord) return;
    
    const ayatsToCheck = selectedRecord.lastFailedAyats.length > 0
      ? selectedRecord.lastFailedAyats
      : Array.from(
          { length: selectedRecord.ayatEnd - selectedRecord.ayatStart + 1 },
          (_, i) => selectedRecord.ayatStart + i
        );

    setRecheckData((prev) => ({
      ...prev,
      allPassed: passed,
      failedAyats: passed ? [] : ayatsToCheck,
    }));
  };

  const handleSubmitRecheck = async () => {
    if (!selectedRecord) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/hafalan/${selectedRecord.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allPassed: recheckData.allPassed,
          failedAyats: recheckData.failedAyats,
          catatan: recheckData.catatan || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan recheck");
      }

      toast({
        title: "Berhasil",
        description: recheckData.allPassed 
          ? "Recheck lulus! Kaca telah ditandai selesai."
          : `Recheck disimpan. ${recheckData.failedAyats.length} ayat perlu diulang.`,
      });

      handleCloseModal();
      
      // Refresh data
      await fetchRecheckData();
      
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/teacher">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Recheck Hafalan
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Periksa ulang hafalan santri yang sudah menyelesaikan satu kaca
            </p>
          </div>
          {recheckRecords.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-2 bg-blue-50 rounded-lg">
                <p className="text-xl font-bold text-blue-700">{recheckRecords.length}</p>
                <p className="text-[10px] text-blue-600">Total</p>
              </div>
              <div className="text-center px-3 py-2 bg-amber-50 rounded-lg">
                <p className="text-xl font-bold text-amber-700">
                  {recheckRecords.filter((r) => r.daysSinceSetor && r.daysSinceSetor > 3).length}
                </p>
                <p className="text-[10px] text-amber-600">Prioritas</p>
              </div>
            </div>
          )}
        </div>

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Menunggu Recheck
            </CardTitle>
            <CardDescription>
              Klik pada santri untuk memulai recheck hafalan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recheckRecords.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recheckRecords.map((record) => (
                  <Card 
                    key={record.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:border-emerald-300"
                    onClick={() => handleOpenRecheck(record)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{record.santriName}</h3>
                            <p className="text-sm text-gray-600">{record.kacaInfo}</p>
                            {record.juzNumber > 0 && (
                              <p className="text-xs text-gray-500">Juz {record.juzNumber}</p>
                            )}
                          </div>
                          {record.daysSinceSetor !== undefined && record.daysSinceSetor > 3 && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                              Prioritas
                            </Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(record.tanggalSetor).toLocaleDateString("id-ID")}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {record.ayatEnd - record.ayatStart + 1} ayat
                          </span>
                        </div>

                        {/* Recheck History Summary */}
                        {record.recheckHistory.length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center gap-2 text-xs">
                              <History className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500">
                                {record.recheckHistory.length}x recheck
                              </span>
                              {record.lastFailedAyats.length > 0 && (
                                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                                  {record.lastFailedAyats.length} ayat perlu diulang
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Teacher info */}
                        {record.teacherName && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <User className="h-3 w-3" />
                            Diinput oleh {record.teacherName}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Tidak ada hafalan yang perlu dicek ulang</p>
                <p className="text-sm mt-1">Semua hafalan sudah dalam kondisi baik.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/teacher/hafalan/input">Catat Setoran Baru</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-blue-900">
              Tentang Recheck Hafalan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Recheck memastikan santri benar-benar menguasai hafalan sebelum lanjut ke kaca berikutnya</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Centang ayat yang sudah lancar saat santri membaca ulang</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />
                <span>Ayat yang belum lancar akan otomatis tercatat untuk recheck berikutnya</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recheck Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
            <DialogTitle className="text-lg md:text-xl flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-600" />
              Recheck Hafalan
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.santriName} - {selectedRecord?.kacaInfo}
              {selectedRecord?.juzNumber ? ` (Juz ${selectedRecord.juzNumber})` : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <ScrollArea className="flex-1 min-h-0 px-4 sm:px-6 overflow-y-auto">
              <div className="space-y-4 pb-4">
                {/* Summary Card */}
                <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                      <div>
                        <p className="text-xs text-gray-600">Halaman</p>
                        <p className="text-xl font-bold text-emerald-700">{selectedRecord.pageNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Ayat</p>
                        <p className="text-xl font-bold text-blue-700">
                          {selectedRecord.ayatEnd - selectedRecord.ayatStart + 1}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Recheck Ke</p>
                        <p className="text-xl font-bold text-purple-700">
                          {selectedRecord.recheckHistory.length + 1}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Perlu Dicek</p>
                        <p className="text-xl font-bold text-amber-700">
                          {selectedRecord.lastFailedAyats.length > 0 
                            ? selectedRecord.lastFailedAyats.length 
                            : selectedRecord.ayatEnd - selectedRecord.ayatStart + 1}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Previous Recheck Info */}
                {selectedRecord.lastFailedAyats.length > 0 && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Recheck lanjutan:</strong> Santri perlu membaca 1 kaca penuh. 
                      Ayat yang sudah lancar dari recheck sebelumnya ditandai hijau. 
                      Fokus verifikasi pada ayat yang perlu diulang: <strong>{selectedRecord.lastFailedAyats.join(", ")}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Instructions */}
                <Alert className="bg-blue-50 border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Cara Recheck:</strong> Dengarkan santri membaca <strong>1 kaca penuh</strong>, lalu centang ayat yang sudah <strong>LANCAR</strong>. 
                    Ayat yang tidak dicentang akan perlu diulang pada recheck berikutnya.
                  </AlertDescription>
                </Alert>

                <Separator />

                {/* All Passed Checkbox */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="all-passed"
                      checked={recheckData.allPassed}
                      onCheckedChange={(checked) => handleSelectAllPassed(checked as boolean)}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <Label htmlFor="all-passed" className="font-medium text-green-800 cursor-pointer">
                      Semua Ayat Lancar ✓
                    </Label>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Langsung Selesai
                  </Badge>
                </div>

                {/* Ayat Checkboxes - Show ALL ayats */}
                {!recheckData.allPassed && (
                  <div className="space-y-3">
                    {/* Section: Previously Passed Ayats (if any) */}
                    {selectedRecord.lastFailedAyats.length > 0 && (
                      <>
                        <div className="space-y-2">
                          <h4 className="font-medium text-green-700 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Ayat yang Sudah Lancar Sebelumnya:
                          </h4>
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {Array.from(
                              { length: selectedRecord.ayatEnd - selectedRecord.ayatStart + 1 },
                              (_, i) => selectedRecord.ayatStart + i
                            )
                              .filter((ayat) => !selectedRecord.lastFailedAyats.includes(ayat))
                              .map((ayatNumber) => (
                                <div
                                  key={ayatNumber}
                                  className="flex items-center justify-center gap-1 p-2 border rounded-lg bg-green-50 border-green-300"
                                >
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="text-sm text-green-700 font-medium">{ayatNumber}</span>
                                </div>
                              ))}
                          </div>
                          <p className="text-xs text-green-600">
                            ✓ {selectedRecord.ayatEnd - selectedRecord.ayatStart + 1 - selectedRecord.lastFailedAyats.length} ayat sudah lancar dari recheck sebelumnya
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Section: Ayats to Recheck */}
                    <h4 className="font-medium text-gray-700">
                      {selectedRecord.lastFailedAyats.length > 0 
                        ? "Centang Ayat yang Sudah Lancar (perlu diulang):" 
                        : "Centang Ayat yang Lancar:"}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {(selectedRecord.lastFailedAyats.length > 0 
                        ? selectedRecord.lastFailedAyats 
                        : Array.from(
                            { length: selectedRecord.ayatEnd - selectedRecord.ayatStart + 1 },
                            (_, i) => selectedRecord.ayatStart + i
                          )
                      ).map((ayatNumber) => {
                        const isLancar = !recheckData.failedAyats.includes(ayatNumber);
                        return (
                          <div
                            key={ayatNumber}
                            className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                              isLancar
                                ? "bg-green-50 border-green-300"
                                : "bg-amber-50 border-amber-300 hover:border-amber-400"
                            }`}
                            onClick={() => handleAyatCheck(ayatNumber, !isLancar)}
                          >
                            <Checkbox
                              checked={isLancar}
                              onCheckedChange={(checked) => handleAyatCheck(ayatNumber, checked as boolean)}
                              className="data-[state=checked]:bg-green-600"
                            />
                            <span className={`text-sm ${isLancar ? "text-green-700 font-medium" : "text-amber-700"}`}>
                              {ayatNumber}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Progress */}
                    <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">
                        {(selectedRecord.lastFailedAyats.length > 0 
                          ? selectedRecord.lastFailedAyats.length 
                          : selectedRecord.ayatEnd - selectedRecord.ayatStart + 1
                        ) - recheckData.failedAyats.length} dari {
                          selectedRecord.lastFailedAyats.length > 0 
                            ? selectedRecord.lastFailedAyats.length 
                            : selectedRecord.ayatEnd - selectedRecord.ayatStart + 1
                        } ayat lancar
                      </span>
                      <Badge 
                        variant="outline" 
                        className={recheckData.failedAyats.length === 0 
                          ? "bg-green-50 text-green-700 border-green-300" 
                          : "bg-amber-50 text-amber-700 border-amber-300"
                        }
                      >
                        {recheckData.failedAyats.length === 0 
                          ? "Semua Lancar!" 
                          : `${recheckData.failedAyats.length} perlu diulang`
                        }
                      </Badge>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Catatan */}
                <div className="space-y-2">
                  <Label htmlFor="recheck-catatan" className="text-sm font-medium">Catatan Recheck (Opsional)</Label>
                  <Textarea
                    id="recheck-catatan"
                    placeholder="Masukkan catatan atau feedback untuk santri..."
                    value={recheckData.catatan}
                    onChange={(e) => setRecheckData((prev) => ({ ...prev, catatan: e.target.value }))}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Recheck History */}
                {selectedRecord.recheckHistory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                      <History className="h-4 w-4" />
                      Riwayat Recheck Sebelumnya
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                      {selectedRecord.recheckHistory.map((history, index) => {
                        // Calculate passed ayats for this recheck
                        // For the most recent recheck, compare with current lastFailedAyats
                        // For older rechecks, compare with the next recheck's failed ayats
                        const allAyats = Array.from(
                          { length: selectedRecord.ayatEnd - selectedRecord.ayatStart + 1 },
                          (_, i) => selectedRecord.ayatStart + i
                        );
                        
                        // Get the ayats that were being checked in this recheck
                        const previousRecheck = selectedRecord.recheckHistory[index + 1];
                        const ayatsBeingChecked = previousRecheck?.failedAyats.length > 0 
                          ? previousRecheck.failedAyats 
                          : allAyats;
                        
                        // Calculate passed ayats (those not in failedAyats)
                        const passedAyats = ayatsBeingChecked.filter(
                          (ayat) => !history.failedAyats.includes(ayat)
                        );
                        
                        return (
                          <div 
                            key={history.id} 
                            className={`p-3 rounded border text-sm ${
                              history.allPassed 
                                ? "bg-green-50 border-green-200" 
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-600 text-xs">{formatDate(history.recheckDate)}</span>
                              <Badge variant="outline" className={`text-xs ${
                                history.allPassed 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {history.allPassed ? "Semua Lulus" : `${passedAyats.length} lulus, ${history.failedAyats.length} ulang`}
                              </Badge>
                            </div>
                            
                            {/* Show passed and failed ayats */}
                            {!history.allPassed && (
                              <div className="space-y-1 mt-2">
                                {passedAyats.length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-green-600 font-medium">✓ Lancar:</span>
                                    <span className="text-xs text-green-700">{passedAyats.join(", ")}</span>
                                  </div>
                                )}
                                {history.failedAyats.length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-red-600 font-medium">✗ Ulang:</span>
                                    <span className="text-xs text-red-700">{history.failedAyats.join(", ")}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">oleh {history.recheckedByName}</p>
                            {history.catatan && (
                              <p className="text-xs text-gray-600 mt-1 italic border-l-2 border-gray-300 pl-2">"{history.catatan}"</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t mt-auto shrink-0 bg-gray-50/80">
            <div className="text-sm text-gray-500 text-center sm:text-left w-full sm:w-auto">
              {recheckData.allPassed ? (
                <span className="flex items-center justify-center sm:justify-start gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Kaca akan ditandai selesai
                </span>
              ) : recheckData.failedAyats.length > 0 ? (
                <span className="flex items-center justify-center sm:justify-start gap-1 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  {recheckData.failedAyats.length} ayat perlu recheck ulang
                </span>
              ) : (
                <span className="text-gray-400">Centang ayat yang lancar</span>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleCloseModal} className="flex-1 sm:flex-none">
                Batal
              </Button>
              <Button
                onClick={handleSubmitRecheck}
                disabled={submitting}
                className={`flex-1 sm:flex-none ${recheckData.allPassed ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : recheckData.allPassed ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Tandai Selesai
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Simpan Recheck
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
