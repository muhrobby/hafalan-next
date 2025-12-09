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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  GraduationCap,
  Home,
  UserCheck,
  Eye,
  Download,
  UserPlus,
  Upload,
  Trash2,
  Edit,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SantriDetailModal } from "./santri-detail-modal";
import CreateSantriDialog from "./create-santri-dialog";
import BulkUploadSantriDialog from "./bulk-upload-santri-dialog";
import { showAlert, confirmDelete } from "@/lib/alert";
import { useRoleGuard } from "@/hooks/use-role-guard";
import {
  usePagination,
  DataTablePagination,
} from "@/components/data-table-pagination";

interface Teacher {
  id: string;
  nip: string;
  user: {
    name: string;
    email: string | null;
  };
}

interface Wali {
  id: string;
  user: {
    name: string;
  };
}

interface SantriProfile {
  id: string;
  nis: string;
  phone: string;
  birthDate: string | null;
  birthPlace: string | null;
  gender: string;
  address: string | null;
  isActive: boolean;
  teacher?: {
    id: string;
    user: { name: string };
  };
  wali?: {
    id: string;
    user: { name: string };
  };
  teacherAssignments?: Array<{
    id: string;
    teacherId: string;
    teacher: Teacher;
  }>;
}

interface Santri {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  santriProfile: SantriProfile;
}

export default function AdminSantriPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const [loading, setLoading] = useState(true);
  const [santris, setSantris] = useState<Santri[]>([]);
  const [filteredSantris, setFilteredSantris] = useState<Santri[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  const fetchSantris = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users?role=SANTRI&limit=500");
      if (!response.ok) {
        throw new Error("Failed to fetch santris");
      }
      const data = await response.json();
      setSantris(data.data || []);
      setFilteredSantris(data.data || []);
    } catch (err) {
      console.error("Error fetching santris:", err);
      showAlert.error("Error", "Gagal memuat data santri");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchSantris();
    }
  }, [isAuthorized, fetchSantris]);

  useEffect(() => {
    let filtered = santris;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (santri) =>
          santri.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          santri.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          santri.santriProfile?.nis
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by gender
    if (genderFilter !== "all") {
      filtered = filtered.filter(
        (santri) => santri.santriProfile?.gender === genderFilter
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((santri) =>
        statusFilter === "active" ? santri.isActive : !santri.isActive
      );
    }

    setFilteredSantris(filtered);
  }, [searchTerm, genderFilter, statusFilter, santris]);

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(filteredSantris.length, 10);

  const paginatedSantris = paginateData(filteredSantris);

  // Reset to page 1 when filters change
  useEffect(() => {
    handlePageChange(1);
  }, [searchTerm, genderFilter, statusFilter]);

  const handleToggleStatus = async (santri: Santri, checked: boolean) => {
    try {
      const response = await fetch(`/api/users/${santri.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: checked,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengubah status");
      }

      await fetchSantris();
      showAlert.success(
        "Berhasil",
        `Status santri ${santri.name} berhasil diubah menjadi ${
          checked ? "aktif" : "tidak aktif"
        }`
      );
    } catch (err: any) {
      showAlert.error(
        "Error",
        err.message || "Terjadi kesalahan saat mengubah status"
      );
    }
  };

  const handleDeleteSantri = async (santri: Santri) => {
    const confirmed = await confirmDelete(
      santri.name,
      `Hapus santri ${santri.name}? Semua data hafalan santri ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${santri.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus santri");
      }

      showAlert.success("Berhasil", `Santri ${santri.name} berhasil dihapus`);

      fetchSantris();
    } catch (err: any) {
      showAlert.error("Error", err.message || "Gagal menghapus santri");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "NIS",
      "Nama",
      "Email",
      "Gender",
      "Telepon",
      "Guru Pembimbing",
      "Wali",
      "Status",
      "Bergabung",
    ];

    const rows = filteredSantris.map((santri) => [
      santri.santriProfile?.nis || "",
      santri.name,
      santri.email,
      santri.santriProfile?.gender === "MALE" ? "Laki-laki" : "Perempuan",
      santri.santriProfile?.phone || "",
      santri.santriProfile?.teacherAssignments
        ?.map((a) => a.teacher.user.name)
        .join("; ") ||
        santri.santriProfile?.teacher?.user.name ||
        "-",
      santri.santriProfile?.wali?.user.name || "-",
      santri.isActive ? "Aktif" : "Nonaktif",
      new Date(santri.createdAt).toLocaleDateString("id-ID"),
    ]);

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
      `santri_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data santri...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Data Santri
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Kelola data santri dan informasi terkait
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsBulkUploadDialogOpen(true)}
              className="flex-1 md:flex-none"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Santri
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
            <CardDescription>
              Gunakan filter untuk menemukan santri tertentu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama, email, atau NIS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48">
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Jenis Kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Gender</SelectItem>
                    <SelectItem value="MALE">Laki-laki</SelectItem>
                    <SelectItem value="FEMALE">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Santri</p>
                  <p className="text-2xl font-bold">{santris.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Santri Aktif</p>
                  <p className="text-2xl font-bold">
                    {santris.filter((s) => s.isActive).length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Laki-laki</p>
                  <p className="text-2xl font-bold">
                    {
                      santris.filter((s) => s.santriProfile?.gender === "MALE")
                        .length
                    }
                  </p>
                </div>
                <Users className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Perempuan</p>
                  <p className="text-2xl font-bold">
                    {
                      santris.filter(
                        (s) => s.santriProfile?.gender === "FEMALE"
                      ).length
                    }
                  </p>
                </div>
                <Users className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Santri ({filteredSantris.length})</CardTitle>
            <CardDescription>
              Informasi lengkap semua santri di sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Santri</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Guru Pembimbing</TableHead>
                    <TableHead>Wali</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSantris.map((santri) => (
                    <TableRow key={santri.id}>
                      <TableCell className="font-mono text-sm">
                        {santri.santriProfile?.nis || "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {santri.name}
                            {!santri.isActive && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] px-1 py-0 h-5"
                              >
                                Nonaktif
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {santri.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            santri.santriProfile?.gender === "MALE"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {santri.santriProfile?.gender === "MALE"
                            ? "Laki-laki"
                            : "Perempuan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {santri.santriProfile?.phone || "-"}
                      </TableCell>
                      <TableCell>
                        {santri.santriProfile?.teacherAssignments &&
                        santri.santriProfile.teacherAssignments.length > 0 ? (
                          <div className="space-y-1">
                            {santri.santriProfile.teacherAssignments.map(
                              (assignment) => (
                                <div
                                  key={assignment.id}
                                  className="text-sm flex items-center gap-1"
                                >
                                  <GraduationCap className="h-3 w-3" />
                                  {assignment.teacher.user.name}
                                </div>
                              )
                            )}
                          </div>
                        ) : santri.santriProfile?.teacher ? (
                          <div className="text-sm flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {santri.santriProfile.teacher.user.name}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Belum ada
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {santri.santriProfile?.wali ? (
                          <div className="text-sm flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {santri.santriProfile.wali.user.name}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Belum ada
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={santri.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleStatus(santri, checked)
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {santri.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSantri(santri);
                              setIsDetailModalOpen(true);
                            }}
                            title="Detail Santri"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteSantri(santri)}
                            title="Hapus Santri"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredSantris.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada santri yang ditemukan</p>
                  <p className="text-sm">
                    Coba ubah filter atau kata pencarian.
                  </p>
                </div>
              )}

              {filteredSantris.length > 0 && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredSantris.length}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Santri Detail Modal */}
      <SantriDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        santri={selectedSantri}
        onUpdate={() => {
          fetchSantris();
        }}
      />

      {/* Create Santri Dialog */}
      <CreateSantriDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          fetchSantris();
        }}
      />

      {/* Bulk Upload Santri Dialog */}
      <BulkUploadSantriDialog
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
        onSuccess={() => {
          fetchSantris();
        }}
      />
    </DashboardLayout>
  );
}
