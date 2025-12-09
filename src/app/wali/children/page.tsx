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
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Users,
  Search,
  Eye,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Child {
  id: string;
  santriId: string;
  name: string;
  nis: string;
  email: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  address?: string;
  phone?: string;
  joinDate: string;
  totalHafalan: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheck: number;
  teachers: Array<{
    id: string;
    name: string;
    nip: string;
  }>;
  lastActivity: string;
}

interface HafalanDetail {
  id: string;
  kacaInfo: string;
  surahName: string;
  pageNumber: number;
  completedVerses: number;
  totalVerses: number;
  status: string;
  tanggalSetor: string;
  teacherName: string;
  catatan?: string;
}

export default function WaliChildrenPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["WALI"],
  });
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childHafalanDetails, setChildHafalanDetails] = useState<
    HafalanDetail[]
  >([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);

        // Fetch children for this wali - API already filters by waliId and calculates stats
        const usersResponse = await fetch(
          `/api/users?role=SANTRI&waliId=${session?.user.waliProfile?.id}`
        );
        const usersData = await usersResponse.json();

        // Process each child's data
        const processedChildren = (usersData.data || []).map((child: any) => {
          // Stats are already calculated by API
          const totalHafalan = child.santriProfile?.totalKaca || 0;
          const completedKaca = child.santriProfile?.completedKaca || 0;
          const inProgressKaca = child.santriProfile?.inProgressKaca || 0;
          const waitingRecheck = child.santriProfile?.waitingRecheckKaca || 0;

          const lastActivity = child.santriProfile?.lastActivityAt
            ? new Date(child.santriProfile.lastActivityAt).toLocaleDateString(
                "id-ID"
              )
            : "Belum ada";

          // Get assigned teachers
          const teachers =
            child.santriProfile?.teacherAssignments?.map((assignment: any) => ({
              id: assignment.teacher.id,
              name: assignment.teacher.user.name,
              nip: assignment.teacher.nip || "-",
            })) || [];

          return {
            id: child.id,
            santriId: child.santriProfile?.id,
            name: child.name,
            nis: child.santriProfile?.nis || "-",
            email: child.email,
            gender: child.santriProfile?.gender || "-",
            birthDate: child.santriProfile?.birthDate
              ? new Date(child.santriProfile.birthDate).toLocaleDateString(
                  "id-ID"
                )
              : "-",
            birthPlace: child.santriProfile?.birthPlace || "-",
            address: child.santriProfile?.address,
            phone: child.santriProfile?.phone,
            joinDate: child.santriProfile?.joinDate
              ? new Date(child.santriProfile.joinDate).toLocaleDateString(
                  "id-ID"
                )
              : "-",
            totalHafalan,
            completedKaca,
            inProgressKaca,
            waitingRecheck,
            teachers,
            lastActivity,
          };
        });

        setChildren(processedChildren);
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

  const handleViewDetails = async (child: Child) => {
    setSelectedChild(child);
    setShowDetailModal(true);

    try {
      // Fetch detailed hafalan records for this child
      const hafalanResponse = await fetch(
        `/api/hafalan?santriId=${child.santriId}&limit=500`
      );
      const hafalanData = await hafalanResponse.json();

      const childRecords =
        hafalanData.data?.map((record: any) => {
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
            id: record.id,
            kacaInfo: `${record.kaca.surahName} (Hal ${record.kaca.pageNumber})`,
            surahName: record.kaca.surahName,
            pageNumber: record.kaca.pageNumber,
            completedVerses,
            totalVerses,
            status: record.statusKaca,
            tanggalSetor: new Date(record.tanggalSetor).toLocaleDateString(
              "id-ID"
            ),
            teacherName: record.teacher?.user?.name || "Unknown",
            catatan: record.catatan,
          };
        }) || [];

      setChildHafalanDetails(childRecords);
    } catch (error) {
      console.error("Error fetching child hafalan details:", error);
    }
  };

  const filteredChildren = children.filter(
    (child) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.nis.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/wali">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Kembali</span>
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                Wali: Data Anak
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Kelola dan pantau data lengkap anak didik
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anak</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
              <p className="text-xs text-muted-foreground">Anak didik</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Hafalan
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.reduce((sum, child) => sum + child.totalHafalan, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Kaca total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.reduce((sum, child) => sum + child.completedKaca, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Kaca selesai</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.reduce((sum, child) => sum + child.inProgressKaca, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Sedang berjalan</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Anak</CardTitle>
            <CardDescription>
              Daftar lengkap anak didik beserta progress hafalannya
            </CardDescription>
          </CardHeader>
          <CardContent>
            {children.length === 0 && !searchQuery ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Belum ada anak terdaftar
                </h3>
                <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                  Anda belum memiliki anak yang terdaftar sebagai santri.
                  Silakan hubungi admin untuk pendaftaran.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari nama atau NIS..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>Nama</TableHead>
                        <TableHead>NIS</TableHead>
                        <TableHead>Guru Pengajar</TableHead>
                        <TableHead className="text-center">
                          Total Hafalan
                        </TableHead>
                        <TableHead className="text-center">Selesai</TableHead>
                        <TableHead className="text-center">Progress</TableHead>
                        <TableHead>Aktivitas Terakhir</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChildren.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center text-gray-500 py-8"
                          >
                            Tidak ada data yang sesuai pencarian
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredChildren.map((child) => (
                          <TableRow
                            key={child.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              {child.name}
                            </TableCell>
                            <TableCell>{child.nis}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {child.teachers.length > 0 ? (
                                  child.teachers.map((teacher) => (
                                    <Badge
                                      key={teacher.id}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {teacher.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    Belum ada guru
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {child.totalHafalan}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                {child.completedKaca}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {child.inProgressKaca}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-600">
                              {child.lastActivity}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(child)}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Hafalan - {selectedChild?.name}</DialogTitle>
            <DialogDescription>
              Riwayat lengkap hafalan dan progress anak
            </DialogDescription>
          </DialogHeader>

          {selectedChild && (
            <div className="space-y-4">
              {/* Child Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Anak</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">NIS</p>
                      <p className="font-medium">{selectedChild.nis}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{selectedChild.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tempat, Tanggal Lahir</p>
                      <p className="font-medium">
                        {selectedChild.birthPlace}, {selectedChild.birthDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Jenis Kelamin</p>
                      <p className="font-medium">{selectedChild.gender}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tanggal Bergabung</p>
                      <p className="font-medium">{selectedChild.joinDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Guru Pengajar</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedChild.teachers.map((teacher) => (
                          <Badge
                            key={teacher.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {teacher.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {selectedChild.completedKaca}
                      </p>
                      <p className="text-xs text-gray-600">Kaca Selesai</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedChild.inProgressKaca}
                      </p>
                      <p className="text-xs text-gray-600">Sedang Progress</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {selectedChild.waitingRecheck}
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
                  <ScrollArea className="h-[250px] sm:h-[300px] pr-4">
                    {childHafalanDetails.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Belum ada data hafalan
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {childHafalanDetails.map((record) => (
                          <div
                            key={record.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium">
                                  {record.kacaInfo}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Guru: {record.teacherName}
                                </p>
                              </div>
                              <StatusBadge status={record.status} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3">
                              <div>
                                <p className="text-gray-500">Progress Ayat</p>
                                <Progress
                                  value={
                                    (record.completedVerses /
                                      record.totalVerses) *
                                    100
                                  }
                                  className="h-2 mt-1"
                                />
                                <p className="text-xs text-gray-600 mt-1">
                                  {record.completedVerses} /{" "}
                                  {record.totalVerses} ayat
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Tanggal Setor</p>
                                <p className="font-medium">
                                  {record.tanggalSetor}
                                </p>
                              </div>
                            </div>
                            {record.catatan && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-gray-500">
                                  Catatan:
                                </p>
                                <p className="text-sm">{record.catatan}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
