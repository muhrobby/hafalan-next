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
import {
  GraduationCap,
  Search,
  Users,
  Eye,
  Phone,
  Mail,
  UserPlus,
  Upload,
  Settings,
  Edit,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { showAlert, confirmDelete } from "@/lib/alert";
import { useRoleGuard } from "@/hooks/use-role-guard";
import {
  usePagination,
  DataTablePagination,
} from "@/components/data-table-pagination";
import CreateGuruDialog from "./create-guru-dialog";
import BulkUploadGuruDialog from "./bulk-upload-guru-dialog";
import ManageSantriDialog from "./manage-santri-dialog";
import EditGuruDialog from "./edit-guru-dialog";

interface SantriAssignment {
  id: string;
  santriId: string;
  santri: {
    id: string;
    nis: string;
    user: {
      name: string;
      email: string;
    };
  };
}

interface TeacherProfile {
  id: string;
  nip: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  santris?: Array<{
    id: string;
    nis: string;
    user: { name: string };
  }>;
  teacherAssignments?: SantriAssignment[];
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  teacherProfile: TeacherProfile;
}

export default function AdminGuruPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [isManageSantriDialogOpen, setIsManageSantriDialogOpen] =
    useState(false);
  const [isEditGuruDialogOpen, setIsEditGuruDialogOpen] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users?role=TEACHER");
      if (!response.ok) throw new Error("Failed to fetch teachers");
      const data = await response.json();

      const teachersData = data.data.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        teacherProfile: user.teacherProfile,
      }));

      setTeachers(teachersData);
      setFilteredTeachers(teachersData);
    } catch (error) {
      showAlert.error("Error", "Gagal memuat data guru");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchTeachers();
    }
  }, [isAuthorized, fetchTeachers]);

  useEffect(() => {
    let filtered = teachers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.teacherProfile?.nip
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((teacher) =>
        statusFilter === "active" ? teacher.isActive : !teacher.isActive
      );
    }

    setFilteredTeachers(filtered);
  }, [searchTerm, statusFilter, teachers]);

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(filteredTeachers.length, 10);

  const paginatedTeachers = paginateData(filteredTeachers);

  // Reset to page 1 when filters change
  useEffect(() => {
    handlePageChange(1);
  }, [searchTerm, statusFilter]);

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

  const handleToggleStatus = async (teacher: Teacher, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${teacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      showAlert.success("Berhasil", "Status guru berhasil diubah");

      fetchTeachers();
    } catch (error) {
      showAlert.error("Error", "Gagal mengubah status guru");
    }
  };

  const handleDeleteGuru = async (teacher: Teacher) => {
    const santriCount = getStudentCount(teacher);
    const confirmMessage =
      santriCount > 0
        ? `Guru ${teacher.name} memiliki ${santriCount} santri binaan. Hapus guru ini? Hubungan dengan santri akan dihapus.`
        : `Hapus guru ${teacher.name}? Tindakan ini tidak dapat dibatalkan.`;

    const confirmed = await confirmDelete(teacher.name, confirmMessage);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${teacher.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus guru");
      }

      showAlert.success("Berhasil", `Guru ${teacher.name} berhasil dihapus`);

      fetchTeachers();
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal menghapus guru");
    }
  };

  const getStudentCount = (teacher: Teacher) => {
    const assignments = teacher.teacherProfile?.teacherAssignments || [];
    return assignments.length;
  };

  const stats = {
    total: teachers.length,
    active: teachers.filter((t) => t.isActive).length,
    inactive: teachers.filter((t) => !t.isActive).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 shrink-0" />
              <span className="truncate">Data Guru</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Kelola data guru dan santri binaan
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
              Tambah Guru
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Semua guru terdaftar
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guru Aktif</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground">
                Guru yang sedang aktif
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Guru Non-Aktif
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {stats.inactive}
              </div>
              <p className="text-xs text-muted-foreground">
                Guru yang tidak aktif
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Guru</CardTitle>
            <CardDescription>
              Kelola data guru dan lihat santri yang diajar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama, email, atau NIP guru..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-4">Memuat data...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada guru ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Telepon
                        </div>
                      </TableHead>
                      <TableHead>Santri Diajar</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Status
                          <span
                            className="text-xs text-gray-500 cursor-help"
                            title="Status Aktif = guru dapat mengajar. Status Non-Aktif = guru tidak aktif sementara."
                          >
                            ℹ️
                          </span>
                        </div>
                      </TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-xs text-gray-500">
                              ID: {teacher.id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {teacher.teacherProfile?.nip || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{teacher.email}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {teacher.teacherProfile?.phone || "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {getStudentCount(teacher)} santri
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={teacher.isActive}
                              onCheckedChange={(checked) =>
                                handleToggleStatus(teacher, checked)
                              }
                            />
                            <span
                              className={`text-xs font-medium ${
                                teacher.isActive
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {teacher.isActive ? "Aktif" : "Non-Aktif"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowStudentsModal(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Lihat
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setIsEditGuruDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setIsManageSantriDialogOpen(true);
                              }}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Kelola
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteGuru(teacher)}
                              title="Hapus Guru"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredTeachers.length}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Modal - Quick View */}
        {showStudentsModal && selectedTeacher && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowStudentsModal(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Santri Binaan
                  </h3>
                  <p className="text-sm text-gray-500">
                    Guru: {selectedTeacher.name} (NIP:{" "}
                    {selectedTeacher.teacherProfile?.nip || "-"})
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowStudentsModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-2">
                {selectedTeacher.teacherProfile?.teacherAssignments &&
                selectedTeacher.teacherProfile?.teacherAssignments.length >
                  0 ? (
                  selectedTeacher.teacherProfile?.teacherAssignments.map(
                    (assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {assignment.santri.user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            NIS: {assignment.santri.nis}
                          </p>
                          <p className="text-xs text-gray-400">
                            {assignment.santri.user.email}
                          </p>
                        </div>
                        <Badge variant="secondary">Santri</Badge>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Belum ada santri yang ditugaskan ke guru ini.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setShowStudentsModal(false);
                    setIsManageSantriDialogOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Kelola Santri
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowStudentsModal(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Guru Dialog */}
      <CreateGuruDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          fetchTeachers();
        }}
      />

      {/* Bulk Upload Guru Dialog */}
      <BulkUploadGuruDialog
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
        onSuccess={() => {
          fetchTeachers();
        }}
      />

      {/* Manage Santri Dialog */}
      <ManageSantriDialog
        open={isManageSantriDialogOpen}
        onOpenChange={setIsManageSantriDialogOpen}
        guru={
          selectedTeacher && selectedTeacher.teacherProfile
            ? {
                id: selectedTeacher.id,
                name: selectedTeacher.name,
                nip: selectedTeacher.teacherProfile.nip,
                teacherProfileId: selectedTeacher.teacherProfile.id,
              }
            : null
        }
        onSuccess={() => {
          fetchTeachers();
        }}
      />

      {/* Edit Guru Dialog */}
      <EditGuruDialog
        open={isEditGuruDialogOpen}
        onOpenChange={setIsEditGuruDialogOpen}
        teacher={selectedTeacher}
        onSuccess={() => {
          fetchTeachers();
        }}
      />
    </DashboardLayout>
  );
}
