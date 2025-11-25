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
import {
  BookOpen,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Users,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";

interface RecheckRecord {
  id: string;
  santriName: string;
  kacaInfo: string;
  surahName: string;
  pageNumber: number;
  ayatStart: number;
  ayatEnd: number;
  completedVerses: number[];
  status: string;
  tanggalSetor: string;
  catatan?: string;
  teacherName?: string; // Guru yang input hafalan original
  daysSinceSetor?: number; // Berapa hari sejak setoran
}

export default function TeacherRecheckHafalan() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["TEACHER"],
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recheckRecords, setRecheckRecords] = useState<RecheckRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecheckRecord | null>(
    null
  );
  const [recheckData, setRecheckData] = useState({
    allPassed: false,
    failedAyats: [] as number[],
    catatan: "",
  });

  useEffect(() => {
    const fetchRecheckData = async () => {
      try {
        setLoading(true);

        const teacherId = session?.user.teacherProfile?.id;

        // Fetch hafalan records that need recheck for this teacher's santris
        // API automatically filters by teacherId and status
        const hafalanResponse = await fetch(
          `/api/hafalan?teacherId=${teacherId}&status=COMPLETE_WAITING_RECHECK&limit=50`
        );
        const hafalanData = await hafalanResponse.json();

        const records =
          hafalanData.data
            ?.filter(
              (record: any) => record.statusKaca === "COMPLETE_WAITING_RECHECK"
            )
            .map((record: any) => {
              const completedVerses = JSON.parse(record.completedVerses);
              const setorDate = new Date(record.tanggalSetor);
              const now = new Date();
              const daysSinceSetor = Math.floor(
                (now.getTime() - setorDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              return {
                id: record.id,
                santriName: record.santri.user.name,
                kacaInfo: `${record.kaca.surahName} (Hal. ${record.kaca.pageNumber})`,
                surahName: record.kaca.surahName,
                pageNumber: record.kaca.pageNumber,
                ayatStart: record.kaca.ayatStart,
                ayatEnd: record.kaca.ayatEnd,
                completedVerses,
                status: record.statusKaca,
                tanggalSetor: record.tanggalSetor,
                catatan: record.catatan,
                teacherName: record.teacher?.user?.name,
                daysSinceSetor,
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
    };

    if (session) {
      fetchRecheckData();
    }
  }, [session]);

  const handleSelectRecord = (record: RecheckRecord) => {
    setSelectedRecord(record);
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
        allPassed:
          failedAyats.length === 0 && !checked
            ? false
            : failedAyats.length === 0,
      };
    });
  };

  const handleSelectAllPassed = (passed: boolean) => {
    setRecheckData((prev) => ({
      ...prev,
      allPassed: passed,
      failedAyats: passed
        ? []
        : Array.from(
            { length: selectedRecord!.ayatEnd - selectedRecord!.ayatStart + 1 },
            (_, i) => selectedRecord!.ayatStart + i
          ),
    }));
  };

  const handleSubmitRecheck = async () => {
    if (!selectedRecord) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/hafalan/${selectedRecord.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        description: "Recheck berhasil disimpan!",
      });

      // Remove the record from the list and reset form
      setRecheckRecords((prev) =>
        prev.filter((r) => r.id !== selectedRecord.id)
      );
      setSelectedRecord(null);
      setRecheckData({
        allPassed: false,
        failedAyats: [],
        catatan: "",
      });
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
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/teacher">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Teacher: Recheck Hafalan
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Periksa ulang hafalan santri yang sudah menyelesaikan satu kaca
            </p>
          </div>
          {recheckRecords.length > 0 && (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="text-center px-3 md:px-4 py-2 bg-blue-50 rounded-lg">
                <p className="text-xl md:text-2xl font-bold text-blue-700">
                  {recheckRecords.length}
                </p>
                <p className="text-[10px] md:text-xs text-blue-600">Total</p>
              </div>
              <div className="text-center px-3 md:px-4 py-2 bg-amber-50 rounded-lg">
                <p className="text-xl md:text-2xl font-bold text-amber-700">
                  {
                    recheckRecords.filter(
                      (r) => r.daysSinceSetor && r.daysSinceSetor > 3
                    ).length
                  }
                </p>
                <p className="text-[10px] md:text-xs text-amber-600">
                  Prioritas
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:grid lg:grid-cols-1 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-6 w-full">
          {/* Daftar Recheck */}
          <Card className="h-full flex flex-col w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Menunggu Recheck
              </CardTitle>
              <CardDescription>
                {recheckRecords.length} kaca perlu dicek ulang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              {recheckRecords.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recheckRecords.map((record) => (
                    <div
                      key={record.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRecord?.id === record.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelectRecord(record)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{record.santriName}</h3>
                            {record.teacherName && (
                              <Badge
                                variant="outline"
                                className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                              >
                                👨‍🏫 {record.teacherName}
                              </Badge>
                            )}
                            {record.daysSinceSetor !== undefined &&
                              record.daysSinceSetor > 3 && (
                                <Badge
                                  variant="outline"
                                  className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  🔔 {record.daysSinceSetor} hari lalu
                                </Badge>
                              )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {record.kacaInfo}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(record.tanggalSetor).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {record.completedVerses.length} ayat
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            record.daysSinceSetor && record.daysSinceSetor > 3
                              ? "ml-2 bg-amber-50 text-amber-700 border-amber-200"
                              : "ml-2"
                          }
                        >
                          {record.daysSinceSetor && record.daysSinceSetor > 3
                            ? "Prioritas"
                            : "Menunggu"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada hafalan yang perlu dicek ulang</p>
                  <p className="text-sm">
                    Semua hafalan sudah dalam kondisi baik.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Recheck */}
          {selectedRecord && (
            <Card id="recheck-form" className="h-full flex flex-col w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Form Recheck
                    </CardTitle>
                    <CardDescription>
                      Periksa hafalan {selectedRecord.santriName}
                    </CardDescription>
                  </div>
                  {selectedRecord.teacherName && (
                    <Badge
                      variant="outline"
                      className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Diinput oleh: {selectedRecord.teacherName}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {/* Contextual Help */}
                <Alert className="bg-purple-50 border-purple-200">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    <strong>Cara Recheck:</strong> Dengarkan santri membaca
                    seluruh kaca. Jika semua lancar, centang "Semua Ayat
                    Lancar". Jika ada yang masih perlu diulang, tandai ayat yang
                    perlu diulang.
                  </AlertDescription>
                </Alert>
                {/* Detail Kaca */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Detail Kaca</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Santri:</span>
                      <p className="text-gray-600">
                        {selectedRecord.santriName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Halaman:</span>
                      <p className="text-gray-600">
                        {selectedRecord.pageNumber}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Surah:</span>
                      <p className="text-gray-600">
                        {selectedRecord.surahName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Ayat:</span>
                      <p className="text-gray-600">
                        {selectedRecord.ayatStart} - {selectedRecord.ayatEnd}
                      </p>
                    </div>
                  </div>
                  {selectedRecord.catatan && (
                    <div className="mt-3">
                      <span className="font-medium">Catatan Sebelumnya:</span>
                      <p className="text-sm text-gray-600 italic">
                        {selectedRecord.catatan}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recheck Ayat */}
                <div>
                  <h4 className="font-medium mb-3">Pemeriksaan Ayat</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">
                        Status Keseluruhan
                      </span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="all-passed"
                          checked={recheckData.allPassed}
                          onCheckedChange={(checked) =>
                            handleSelectAllPassed(checked as boolean)
                          }
                        />
                        <Label htmlFor="all-passed" className="text-sm">
                          Semua Lancar
                        </Label>
                      </div>
                    </div>

                    {!recheckData.allPassed && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {Array.from(
                          {
                            length:
                              selectedRecord.ayatEnd -
                              selectedRecord.ayatStart +
                              1,
                          },
                          (_, i) => {
                            const ayatNumber = selectedRecord.ayatStart + i;
                            const isCompleted =
                              selectedRecord.completedVerses.includes(
                                ayatNumber
                              );
                            const isFailed =
                              recheckData.failedAyats.includes(ayatNumber);

                            return (
                              <div
                                key={ayatNumber}
                                className="flex items-center justify-between p-2 border rounded"
                              >
                                <span className="text-sm">
                                  Ayat {ayatNumber} {isCompleted && "✓"}
                                </span>
                                {isCompleted && (
                                  <Checkbox
                                    checked={!isFailed}
                                    onCheckedChange={(checked) =>
                                      handleAyatCheck(
                                        ayatNumber,
                                        checked as boolean
                                      )
                                    }
                                  />
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Catatan Recheck */}
                <div>
                  <Label htmlFor="recheck-catatan">
                    Catatan Recheck (Opsional)
                  </Label>
                  <Textarea
                    id="recheck-catatan"
                    placeholder="Masukkan catatan atau feedback untuk santri..."
                    value={recheckData.catatan}
                    onChange={(e) =>
                      setRecheckData((prev) => ({
                        ...prev,
                        catatan: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Card className="bg-linear-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900">
                          Hasil Recheck
                        </h3>
                        <p className="text-sm text-gray-700">
                          {recheckData.allPassed ? (
                            <span className="flex items-center gap-2 text-green-700">
                              <CheckCircle className="h-4 w-4" />
                              Santri sudah lancar semua ayat. Kaca akan ditandai
                              selesai.
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-amber-700">
                              <AlertCircle className="h-4 w-4" />
                              {recheckData.failedAyats.length > 0
                                ? `${recheckData.failedAyats.length} ayat perlu diulang.`
                                : "Pilih status recheck atau tandai ayat yang perlu diulang."}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedRecord(null)}
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleSubmitRecheck}
                          disabled={submitting}
                          size="lg"
                          className={
                            recheckData.allPassed
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              {recheckData.allPassed ? (
                                <>
                                  <CheckCircle className="mr-2 h-5 w-5" />
                                  Tandai Selesai
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-5 w-5" />
                                  Simpan Recheck
                                </>
                              )}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-blue-50 border-blue-200 w-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-900">
              Kenapa Recheck Penting
            </CardTitle>
            <CardDescription>
              Validasi kelancaran dan tajwid sebelum menutup kaca menjaga
              kualitas hafalan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 text-sm text-blue-800">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <p>
                Recheck menjadi jaminan bahwa santri membaca dengan benar,
                menghindari miskomunikasi, dan memberikan feedback yang
                mendorong kemajuan.
              </p>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                • Pastikan seluruh ayat diulang untuk memeriksa tajwid dan
                kelancaran.
              </li>
              <li>
                • Tandai ayat yang perlu perbaikan agar guru dan santri tahu
                fokusnya.
              </li>
              <li>
                • Catat insight agar pengingat besok lebih terarah dan
                memotivasi.
              </li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/teacher/hafalan/input">Catat Setoran Baru</Link>
              </Button>
              {selectedRecord && (
                <Button variant="secondary" size="sm" asChild>
                  <Link href="#recheck-form">Mulai Recheck</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
