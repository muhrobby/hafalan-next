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
  Edit,
  Trash2,
  Search,
  GraduationCap,
  Shield,
  Home,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateUserWizard from "./create-user-wizard";
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
    isActive?: boolean;
  };
  waliProfile?: {
    id: string;
    phone: string;
    occupation: string;
    santris: Array<any>;
    isActive?: boolean;
  };
  santriProfile?: {
    id: string;
    nis: string;
    phone: string;
    gender: string;
    teacherId?: string;
    waliId?: string;
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
      teacher: {
        id: string;
        user: { name: string; email: string };
      };
    }>;
    isActive?: boolean;
  };
}

export default function AdminUserManagement() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
    }
  }, [isAuthorized, fetchUsers]);

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

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: "Berhasil",
        description: "Status pengguna berhasil diubah",
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status pengguna",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Hapus pengguna ${userName}?`)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      toast({
        title: "Berhasil",
        description: `${userName} berhasil dihapus`,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "ALL" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

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

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === "ADMIN").length,
    teacher: users.filter((u) => u.role === "TEACHER").length,
    wali: users.filter((u) => u.role === "WALI").length,
    santri: users.filter((u) => u.role === "SANTRI").length,
    active: users.filter((u) => u.isActive).length,
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
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
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 shrink-0" />
              <span className="truncate">Manajemen Pengguna</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Kelola semua pengguna sistem hafalan
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>

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
          <Card>
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
                            title="Status Aktif = user dapat login dan menggunakan sistem. Status Non-Aktif = akun ditangguhkan sementara tanpa menghapus data."
                          >
                            ℹ️
                          </span>
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
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
                                  {user.teacherProfile.santris?.length || 0}{" "}
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
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteUser(user.id, user.name)
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Wizard Dialog */}
      <CreateUserWizard
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          fetchUsers();
          toast({
            title: "Berhasil",
            description: "Pengguna baru berhasil ditambahkan",
          });
        }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        onSuccess={() => {
          fetchUsers();
          toast({
            title: "Berhasil",
            description: "Data pengguna berhasil diupdate",
          });
        }}
      />
    </DashboardLayout>
  );
}
