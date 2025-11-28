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
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Eye,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { StatsCard } from "@/components/analytics/stats-card";
import { PageHeaderSimple, DashboardSkeleton } from "@/components/dashboard";

interface HafalanRecord {
  id: string;
  kacaId: string;
  status: string;
  completedVerses: number[];
  tanggalSetor: string;
  catatan?: string;
  kaca: {
    id: string;
    pageNumber: number;
    juz: number;
    surahName: string;
    ayatStart: number;
    ayatEnd: number;
  };
  recheckRecords?: {
    id: string;
    status: string;
    failedAyats: string;
    catatan?: string;
    createdAt: string;
  }[];
}

export default function SantriHafalanPage() {
  const { isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["SANTRI"],
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<HafalanRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HafalanRecord | null>(null);

  useEffect(() => {
    const fetchHafalan = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/hafalan?limit=100");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        const formattedRecords = (data.data || []).map((record: any) => ({
          id: record.id,
          kacaId: record.kacaId,
          status: record.statusKaca,
          completedVerses: JSON.parse(record.completedVerses || "[]"),
          tanggalSetor: record.tanggalSetor,
          catatan: record.catatan,
          kaca: record.kaca,
          recheckRecords: record.recheckRecords,
        }));

        setRecords(formattedRecords);
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
    };

    if (isAuthorized) fetchHafalan();
  }, [toast, isAuthorized]);

  const calculateProgress = (record: HafalanRecord) => {
    if (record.status === "RECHECK_PASSED") return 100;
    const totalVerses = record.kaca.ayatEnd - record.kaca.ayatStart + 1;
    return Math.round((record.completedVerses.length / totalVerses) * 100);
  };

  // Stats calculation
  const stats = {
    total: records.length,
    passed: records.filter((r) => r.status === "RECHECK_PASSED").length,
    waiting: records.filter((r) => r.status === "COMPLETE_WAITING_RECHECK").length,
    progress: records.filter((r) => r.status === "PROGRESS").length,
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout role="SANTRI">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!isAuthorized) return null;

  return (
    <DashboardLayout role="SANTRI">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/santri">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <PageHeaderSimple
            title="Hafalan Saya"
            subtitle="Lihat semua riwayat hafalan yang telah disetorkan"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Kaca"
            value={stats.total}
            icon={BookOpen}
            gradient="from-slate-600 to-slate-700"
            description="Semua hafalan"
          />
          <StatsCard
            title="Lulus Recheck"
            value={stats.passed}
            icon={CheckCircle2}
            gradient="from-emerald-500 to-emerald-600"
            description="Hafalan selesai"
          />
          <StatsCard
            title="Menunggu Recheck"
            value={stats.waiting}
            icon={Clock}
            gradient="from-amber-500 to-amber-600"
            description="Perlu direview"
          />
          <StatsCard
            title="Sedang Proses"
            value={stats.progress}
            icon={Loader2}
            gradient="from-blue-500 to-blue-600"
            description="Dalam progress"
          />
        </div>

        {/* Hafalan List */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Daftar Hafalan</CardTitle>
                <CardDescription>
                  Semua kaca hafalan yang telah disetorkan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {records.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Belum Ada Hafalan
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Belum ada hafalan yang disetorkan. Mulai setorkan hafalan pertamamu!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border hover:shadow-sm transition-all"
                  >
                    <div className="hidden sm:flex shrink-0 w-12 h-12 bg-emerald-100 rounded-lg items-center justify-center">
                      <span className="text-lg font-bold text-emerald-600">
                        {record.kaca.juz}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {record.kaca.surahName}
                        </h3>
                        <StatusBadge status={record.status} />
                      </div>
                      <p className="text-sm text-gray-600">
                        Hal {record.kaca.pageNumber} • Juz {record.kaca.juz} • Ayat {record.kaca.ayatStart}-{record.kaca.ayatEnd}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress
                          value={calculateProgress(record)}
                          className="h-1.5 flex-1 max-w-[200px]"
                        />
                        <span className="text-xs font-medium text-gray-500">
                          {calculateProgress(record)}%
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRecord(record)}
                      className="shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog
          open={!!selectedRecord}
          onOpenChange={() => setSelectedRecord(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Detail Hafalan
              </DialogTitle>
              <DialogDescription>
                {selectedRecord?.kaca.surahName} - Halaman {selectedRecord?.kaca.pageNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                    <StatusBadge status={selectedRecord.status} />
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Progress</h4>
                    <Progress
                      value={calculateProgress(selectedRecord)}
                      className="h-2"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedRecord.completedVerses.length} dari{" "}
                      {selectedRecord.kaca.ayatEnd - selectedRecord.kaca.ayatStart + 1} ayat selesai
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      Tanggal Setor
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedRecord.tanggalSetor).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  {selectedRecord.catatan && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        Catatan
                      </h4>
                      <p className="text-sm text-gray-600">{selectedRecord.catatan}</p>
                    </div>
                  )}

                  {selectedRecord.recheckRecords && selectedRecord.recheckRecords.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Riwayat Recheck
                      </h4>
                      <div className="space-y-2">
                        {selectedRecord.recheckRecords.map((recheck) => (
                          <div
                            key={recheck.id}
                            className={`p-3 rounded-lg border ${
                              recheck.status === "PASSED"
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            <p className="font-medium text-sm">
                              {recheck.status === "PASSED" ? "✅ Lulus" : "❌ Perlu Ulang"}
                            </p>
                            {recheck.catatan && (
                              <p className="text-sm text-gray-600 mt-1">{recheck.catatan}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(recheck.createdAt).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
