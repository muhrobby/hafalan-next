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
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";

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
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["SANTRI"],
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<HafalanRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HafalanRecord | null>(
    null
  );

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

    fetchHafalan();
  }, [toast]);

  const calculateProgress = (record: HafalanRecord) => {
    if (record.status === "RECHECK_PASSED") return 100;
    const totalVerses = record.kaca.ayatEnd - record.kaca.ayatStart + 1;
    return Math.round((record.completedVerses.length / totalVerses) * 100);
  };

  // Authorization check
  if (isLoading) {
    return (
      <DashboardLayout role="SANTRI">
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
      <DashboardLayout role="SANTRI">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="SANTRI">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/santri">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Hafalan Saya
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Lihat semua riwayat hafalan yang telah disetorkan
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {records.length}
                </p>
                <p className="text-sm text-gray-600">Total Kaca</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {records.filter((r) => r.status === "RECHECK_PASSED").length}
                </p>
                <p className="text-sm text-gray-600">Lulus</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {
                    records.filter(
                      (r) => r.status === "COMPLETE_WAITING_RECHECK"
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-600">Menunggu Recheck</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {records.filter((r) => r.status === "PROGRESS").length}
                </p>
                <p className="text-sm text-gray-600">Sedang Proses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hafalan List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Daftar Hafalan
            </CardTitle>
            <CardDescription>
              Semua kaca hafalan yang telah disetorkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada hafalan yang disetorkan
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">
                          {record.kaca.surahName}
                        </h3>
                        <StatusBadge status={record.status} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Halaman {record.kaca.pageNumber} | Juz {record.kaca.juz}{" "}
                        | Ayat {record.kaca.ayatStart}-{record.kaca.ayatEnd}
                      </p>
                      <div className="mt-2">
                        <Progress
                          value={calculateProgress(record)}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {calculateProgress(record)}% selesai
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRecord(record)}
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
              <DialogTitle>Detail Hafalan</DialogTitle>
              <DialogDescription>
                {selectedRecord?.kaca.surahName} - Halaman{" "}
                {selectedRecord?.kaca.pageNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Status
                    </h4>
                    <div className="mt-1">
                      <StatusBadge status={selectedRecord.status} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Progress
                    </h4>
                    <Progress
                      value={calculateProgress(selectedRecord)}
                      className="h-2 mt-2"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRecord.completedVerses.length} dari{" "}
                      {selectedRecord.kaca.ayatEnd -
                        selectedRecord.kaca.ayatStart +
                        1}{" "}
                      ayat selesai
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Tanggal Setor
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedRecord.tanggalSetor).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  {selectedRecord.catatan && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">
                        Catatan
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedRecord.catatan}
                      </p>
                    </div>
                  )}

                  {selectedRecord.recheckRecords &&
                    selectedRecord.recheckRecords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">
                          Riwayat Recheck
                        </h4>
                        <div className="space-y-2 mt-2">
                          {selectedRecord.recheckRecords.map((recheck) => (
                            <div
                              key={recheck.id}
                              className="p-2 bg-gray-100 rounded text-sm"
                            >
                              <p className="font-medium">
                                {recheck.status === "PASSED"
                                  ? "✅ Lulus"
                                  : "❌ Perlu Ulang"}
                              </p>
                              {recheck.catatan && (
                                <p className="text-gray-600">
                                  {recheck.catatan}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(recheck.createdAt).toLocaleDateString(
                                  "id-ID"
                                )}
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
