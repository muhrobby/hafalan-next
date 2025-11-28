"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  User,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
} from "lucide-react";

interface SantriData {
  id: string;
  name: string;
  email: string;
  nis: string;
  dateOfBirth: string;
  placeOfBirth: string;
  totalKaca: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheckKaca: number;
  completionPercentage: number;
  waliName?: string;
}

interface HafalanDetail {
  id: string;
  kacaInfo: string;
  status: string;
  completedVerses: number;
  totalVerses: number;
  tanggalSetor: string;
  lastUpdated: string;
}

export default function TeacherSantriPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["TEACHER"],
  });
  const { toast } = useToast();
  const [santriList, setSantriList] = useState<SantriData[]>([]);
  const [filteredSantri, setFilteredSantri] = useState<SantriData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSantri, setSelectedSantri] = useState<SantriData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [hafalanDetails, setHafalanDetails] = useState<HafalanDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSantri: 0,
    activeSantri: 0,
    avgCompletion: 0,
  });

  useEffect(() => {
    if (isAuthorized && session?.user?.id) {
      fetchSantriList();
    }
  }, [isAuthorized, session]);

  useEffect(() => {
    filterSantri();
  }, [searchTerm, santriList]);

  const fetchSantriList = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/users?role=SANTRI&teacherId=${session?.user?.id}`
      );

      if (!response.ok) throw new Error("Failed to fetch santri");

      const result = await response.json();
      const data = result.data || [];

      // Process santri data
      const processedSantri: SantriData[] = data.map((user: any) => {
        const profile = user.santriProfile;
        // API already calculates these stats correctly
        const totalKaca = profile?.totalKaca || 0;
        const completedKaca = profile?.completedKaca || 0;
        const inProgressKaca = profile?.inProgressKaca || 0;
        const waitingRecheckKaca = profile?.waitingRecheckKaca || 0;

        return {
          id: profile?.id || user.id, // Use santriProfile.id for hafalan queries
          name: user.name,
          email: user.email,
          nis: profile?.nis || "-",
          dateOfBirth: profile?.dateOfBirth
            ? new Date(profile.dateOfBirth).toLocaleDateString("id-ID")
            : "-",
          placeOfBirth: profile?.placeOfBirth || "-",
          totalKaca,
          completedKaca,
          inProgressKaca,
          waitingRecheckKaca,
          completionPercentage:
            totalKaca > 0 ? Math.round((completedKaca / totalKaca) * 100) : 0,
          waliName: profile?.wali?.user?.name || "-",
        };
      });

      setSantriList(processedSantri);

      // Calculate stats
      const totalSantri = processedSantri.length;
      const activeSantri = processedSantri.filter(
        (s) => s.inProgressKaca > 0 || s.waitingRecheckKaca > 0
      ).length;
      const avgCompletion =
        totalSantri > 0
          ? Math.round(
              processedSantri.reduce(
                (sum, s) => sum + s.completionPercentage,
                0
              ) / totalSantri
            )
          : 0;

      setStats({
        totalSantri,
        activeSantri,
        avgCompletion,
      });
    } catch (error) {
      console.error("Error fetching santri:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data santri. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSantri = () => {
    if (!searchTerm.trim()) {
      setFilteredSantri(santriList);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = santriList.filter(
      (santri) =>
        santri.name.toLowerCase().includes(term) ||
        santri.nis.toLowerCase().includes(term) ||
        santri.email.toLowerCase().includes(term)
    );
    setFilteredSantri(filtered);
  };

  const fetchHafalanDetails = async (santriProfileId: string) => {
    try {
      setLoadingDetails(true);
      // Use santriId parameter - API will filter correctly
      const response = await fetch(`/api/hafalan?santriId=${santriProfileId}`);

      if (!response.ok) throw new Error("Failed to fetch hafalan details");

      const result = await response.json();
      const data = result.data || [];

      const details: HafalanDetail[] = data.map((hafalan: any) => {
        const totalVerses = hafalan.kaca.ayatEnd - hafalan.kaca.ayatStart + 1;

        // Calculate completed verses based on status
        let completedVerses = 0;
        if (hafalan.statusKaca === "RECHECK_PASSED") {
          // If already passed recheck, all verses are completed (100%)
          completedVerses = totalVerses;
        } else {
          // Otherwise count from ayatStatuses where status = LANJUT
          completedVerses =
            hafalan.ayatStatuses?.filter((a: any) => a.status === "LANJUT")
              .length || 0;
        }

        return {
          id: hafalan.id,
          kacaInfo: `${hafalan.kaca.surahName} - Hal ${hafalan.kaca.pageNumber} (${hafalan.kaca.ayatStart}-${hafalan.kaca.ayatEnd})`,
          status: hafalan.statusKaca,
          completedVerses,
          totalVerses,
          tanggalSetor: new Date(hafalan.tanggalSetor).toLocaleDateString(
            "id-ID",
            { day: "numeric", month: "long", year: "numeric" }
          ),
          lastUpdated: new Date(hafalan.updatedAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        };
      });

      setHafalanDetails(details);
    } catch (error) {
      console.error("Error fetching hafalan details:", error);
      toast({
        title: "Error",
        description: "Gagal memuat riwayat hafalan. Silakan coba lagi.",
        variant: "destructive",
      });
      setHafalanDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetail = (santri: SantriData) => {
    setSelectedSantri(santri);
    setShowDetailModal(true);
    fetchHafalanDetails(santri.id);
  };

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data santri...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Teacher: Data Santri
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Kelola dan pantau progress santri bimbingan Anda
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Santri
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalSantri}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Santri Aktif
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.activeSantri}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Rata-rata Progress
                  </p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {stats.avgCompletion}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">
                Daftar Santri Bimbingan
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama, NIS, atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nama</TableHead>
                    <TableHead className="min-w-[100px]">NIS</TableHead>
                    <TableHead className="min-w-20 text-center">
                      Total
                    </TableHead>
                    <TableHead className="min-w-20 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Selesai</span>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-20 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-blue-600" />
                        <span>Progress</span>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-20 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        <span>Recheck</span>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      Progress Bar
                    </TableHead>
                    <TableHead className="min-w-[120px]">Wali</TableHead>
                    <TableHead className="min-w-[100px] text-center">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSantri.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-gray-500"
                      >
                        {searchTerm
                          ? "Tidak ada santri yang cocok dengan pencarian"
                          : "Belum ada santri yang dibimbing"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSantri.map((santri) => (
                      <TableRow key={santri.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{santri.name}</p>
                            <p className="text-xs text-gray-500">
                              {santri.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">
                            {santri.nis}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-gray-900">
                            {santri.totalKaca}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {santri.completedKaca}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {santri.inProgressKaca}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            {santri.waitingRecheckKaca}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress
                              value={santri.completionPercentage}
                              className="h-2.5"
                            />
                            <p className="text-xs font-semibold text-gray-700 text-right">
                              {santri.completionPercentage}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{santri.waliName}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(santri)}
                            className="w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Santri - {selectedSantri?.name}</DialogTitle>
            <DialogDescription>
              Informasi lengkap dan riwayat hafalan santri
            </DialogDescription>
          </DialogHeader>

          {selectedSantri && (
            <div className="space-y-4">
              {/* Santri Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Santri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500">NIS</p>
                        <p className="font-medium">{selectedSantri.nis}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium">{selectedSantri.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Tanggal Lahir</p>
                        <p className="font-medium">
                          {selectedSantri.dateOfBirth}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Tempat Lahir</p>
                        <p className="font-medium">
                          {selectedSantri.placeOfBirth}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500">Wali</p>
                        <p className="font-medium">{selectedSantri.waliName}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedSantri.totalKaca}
                      </p>
                      <p className="text-xs text-gray-600">Total Kaca</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedSantri.completedKaca}
                      </p>
                      <p className="text-xs text-gray-600">Kaca Selesai</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedSantri.inProgressKaca}
                      </p>
                      <p className="text-xs text-gray-600">Dalam Progress</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {selectedSantri.waitingRecheckKaca}
                      </p>
                      <p className="text-xs text-gray-600">Menunggu Recheck</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hafalan Records */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Riwayat Hafalan</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDetails ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">
                        Memuat riwayat hafalan...
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[250px] sm:h-[300px] pr-4">
                      {hafalanDetails.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          Belum ada data hafalan
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {hafalanDetails.map((record) => {
                            const progressPercentage =
                              record.totalVerses > 0
                                ? Math.round(
                                    (record.completedVerses /
                                      record.totalVerses) *
                                      100
                                  )
                                : 0;
                            const borderColor =
                              record.status === "RECHECK_PASSED"
                                ? "border-l-green-500"
                                : record.status === "COMPLETE_WAITING_RECHECK"
                                ? "border-l-amber-500"
                                : "border-l-blue-500";

                            return (
                              <Card
                                key={record.id}
                                className={`border-l-4 ${borderColor}`}
                              >
                                <CardContent className="pt-4">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-base">
                                        {record.kacaInfo}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-3 w-3 text-gray-500" />
                                        <p className="text-xs text-gray-600">
                                          Disetor: {record.tanggalSetor}
                                        </p>
                                      </div>
                                    </div>
                                    <StatusBadge status={record.status} />
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">
                                        Progress Hafalan Ayat
                                      </p>
                                      <Progress
                                        value={progressPercentage}
                                        className="h-2.5 mt-1"
                                      />
                                      <div className="flex items-center justify-between mt-1">
                                        <p className="text-xs text-gray-600">
                                          {record.completedVerses} /{" "}
                                          {record.totalVerses} ayat
                                        </p>
                                        <p className="text-xs font-semibold text-gray-700">
                                          {progressPercentage}%
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">
                                        Terakhir Diupdate
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <p className="text-sm font-medium text-gray-900">
                                          {record.lastUpdated}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
