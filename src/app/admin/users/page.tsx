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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Users,
  UserPlus,
  Trash2,
  Search,
  GraduationCap,
  Shield,
  Home,
  UserCheck,
  Key,
  AlertCircle,
  ExternalLink,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useMemo } from "react";
import { showAlert, confirmDelete } from "@/lib/alert";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usePagination,
  DataTablePagination,
} from "@/components/data-table-pagination";
import CreateAdminDialog from "./create-admin-dialog";
import ResetPasswordDialog from "./reset-password-dialog";
import EditUserDialog from "./edit-user-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  teacherProfile?: {
    id: string;
    nip: string;
    phone: string;
    santris: Array<any>;
    teacherAssignments?: Array<any>;
  };
  waliProfile?: {
    id: string;
    phone: string;
    occupation: string;
    santris: Array<any>;
  };
  santriProfile?: {
    id: string;
    nis: string;
    phone: string;
    gender: string;
    teacherAssignments?: Array<any>;
  };
}

export default function AdminUserManagement() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      showAlert.error("Error", "Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
    }
  }, [isAuthorized, fetchUsers]);

  // Filtered users - memoized computation
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "ALL" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Pagination - moved before early return to comply with React hooks rules
  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(filteredUsers.length, 10);

  const paginatedUsers = paginateData(filteredUsers);

  // Reset to page 1 when filters change
  useEffect(() => {
    handlePageChange(1);
  }, [searchQuery, selectedRole]);

  // Loading state - after all hooks
  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      showAlert.success("Berhasil", "Status pengguna berhasil diubah");

      fetchUsers();
    } catch (error) {
      showAlert.error("Error", "Gagal mengubah status pengguna");
    }
  };

  const handleDeleteUser = async (
    userId: string,
    userName: string,
    userRole: string
  ) => {
    const roleText = userRole === "ADMIN" ? "admin" : "pengguna";
    const confirmed = await confirmDelete(
      userName,
      `Hapus ${roleText} ${userName}? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      showAlert.success("Berhasil", `${userName} berhasil dihapus`);

      fetchUsers();
    } catch (error) {
      showAlert.error("Error", "Gagal menghapus pengguna");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="w-4 h-4" />;
      case "TEACHER":
        return <GraduationCap className="w-4 h-4" />;
      case "WALI":
        return <Home className="w-4 h-4" />;
      case "SANTRI":
        return <UserCheck className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "TEACHER":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "WALI":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "SANTRI":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "";
    }
  };

  const getRoleLink = (role: string) => {
    switch (role) {
      case "TEACHER":
        return "/admin/guru";
      case "SANTRI":
        return "/admin/santri";
      default:
        return null;
    }
  };

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === "ADMIN").length,
    teacher: users.filter((u) => u.role === "TEACHER").length,
    wali: users.filter((u) => u.role === "WALI").length,
    santri: users.filter((u) => u.role === "SANTRI").length,
    active: users.filter((u) => u.isActive).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 shrink-0" />
              <span className="truncate">Manajemen Pengguna</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Kelola akses dan status pengguna sistem
            </p>
          </div>
          <Button
            onClick={() => setIsCreateAdminDialogOpen(true)}
            className="bg-red-600 hover:bg-red-700 w-full md:w-auto"
          >
            <Shield className="w-4 h-4 mr-2" />
            Tambah Admin
          </Button>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Catatan:</strong> Untuk menambah Santri gunakan{" "}
            <Link href="/admin/santri" className="underline font-medium">
              halaman Data Santri
            </Link>
            , untuk menambah Guru gunakan{" "}
            <Link href="/admin/guru" className="underline font-medium">
              halaman Data Guru
            </Link>
            . Halaman ini fokus untuk manajemen akses user (reset password,
            suspend akun, dll).
          </AlertDescription>
        </Alert>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Admin</p>
                <p className="text-2xl font-bold text-red-600">{stats.admin}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Guru</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.teacher}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Wali</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.wali}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Santri</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.santri}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.active}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs
                value={selectedRole}
                onValueChange={setSelectedRole}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-5 w-full md:w-auto">
                  <TabsTrigger value="ALL">Semua</TabsTrigger>
                  <TabsTrigger value="ADMIN">Admin</TabsTrigger>
                  <TabsTrigger value="TEACHER">Guru</TabsTrigger>
                  <TabsTrigger value="WALI">Wali</TabsTrigger>
                  <TabsTrigger value="SANTRI">Santri</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna ({filteredUsers.length})</CardTitle>
            <CardDescription>
              {selectedRole === "ALL"
                ? "Menampilkan semua pengguna"
                : `Menampilkan pengguna dengan role ${selectedRole}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada pengguna ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Info</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Status
                          <span
                            className="text-xs text-gray-500 cursor-help"
                            title="Status Aktif = user dapat login. Non-Aktif = akun ditangguhkan."
                          >
                            ℹ️
                          </span>
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            <span className="flex items-center gap-1">
                              {getRoleIcon(user.role)}
                              {user.role}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.role === "TEACHER" && user.teacherProfile && (
                              <>
                                <p className="text-gray-600">
                                  NIP: {user.teacherProfile.nip}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {user.teacherProfile.teacherAssignments
                                    ?.length || 0}{" "}
                                  santri
                                </p>
                              </>
                            )}
                            {user.role === "WALI" && user.waliProfile && (
                              <>
                                <p className="text-gray-600">
                                  {user.waliProfile.occupation || "-"}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {user.waliProfile.santris?.length || 0} santri
                                </p>
                              </>
                            )}
                            {user.role === "SANTRI" && user.santriProfile && (
                              <>
                                <p className="text-gray-600">
                                  NIS: {user.santriProfile.nis}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {user.santriProfile.teacherAssignments
                                    ?.length || 0}{" "}
                                  guru
                                </p>
                              </>
                            )}
                            {user.role === "ADMIN" && (
                              <p className="text-gray-500 text-xs">
                                Administrator
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={() =>
                                handleToggleStatus(user.id, user.isActive)
                              }
                            />
                            <span
                              className={`text-xs font-medium ${
                                user.isActive
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {user.isActive ? "Aktif" : "Non-Aktif"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit User */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Pengguna"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditUserDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>

                            {/* Reset Password */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Reset Password"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsResetPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="w-4 h-4 mr-1" />
                              Reset
                            </Button>

                            {/* Link to detail page */}
                            {getRoleLink(user.role) && (
                              <Link href={getRoleLink(user.role)!}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Lihat di halaman khusus"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Detail
                                </Button>
                              </Link>
                            )}

                            {/* Delete User */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteUser(user.id, user.name, user.role)
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={`Hapus ${user.role}`}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Hapus
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
                  totalItems={filteredUsers.length}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Admin Dialog */}
      <CreateAdminDialog
        open={isCreateAdminDialogOpen}
        onOpenChange={setIsCreateAdminDialogOpen}
        onSuccess={() => {
          fetchUsers();
        }}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
        user={selectedUser}
        onSuccess={() => {
          fetchUsers();
        }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
        user={selectedUser}
        onSuccess={() => {
          fetchUsers();
        }}
      />
    </DashboardLayout>
  );
}
