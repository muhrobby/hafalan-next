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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Home,
  Search,
  Users,
  UserPlus,
  Eye,
  Edit,
  Phone,
  Mail,
  Briefcase,
  Save,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { showAlert, confirmDelete } from "@/lib/alert";
import { useRoleGuard } from "@/hooks/use-role-guard";
import {
  usePagination,
  DataTablePagination,
} from "@/components/data-table-pagination";

interface Santri {
  id: string;
  nis: string;
  user: {
    name: string;
    email: string;
  };
}

interface WaliProfile {
  id: string;
  phone?: string;
  occupation?: string;
  address?: string;
  santris: Santri[];
}

interface Wali {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  waliProfile: WaliProfile | null;
}

// Create Wali Dialog Component
function CreateWaliDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    occupation: "",
    address: "",
  });

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      occupation: "",
      address: "",
    });
  };

  // Handle dialog open/close with form reset
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showAlert.error("Error", "Nama wali harus diisi");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/wali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal membuat wali");
      }

      showAlert.success("Berhasil", "Wali baru berhasil ditambahkan");

      // Reset form, refresh data, and close dialog
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal membuat wali");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Tambah Wali Baru
          </DialogTitle>
          <DialogDescription>Masukkan data wali santri baru</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Masukkan nama lengkap wali"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="email@example.com (opsional)"
            />
          </div>

          <div>
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <Label htmlFor="occupation">Pekerjaan</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, occupation: e.target.value }))
              }
              placeholder="Pekerjaan wali"
            />
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Alamat lengkap"
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Password default: <strong>wali123</strong>. Wali akan diminta
              mengubah password saat login pertama kali.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Wali Dialog Component
function EditWaliDialog({
  open,
  onOpenChange,
  wali,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wali: Wali | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    occupation: "",
    address: "",
    isActive: true,
  });

  useEffect(() => {
    if (open && wali) {
      setFormData({
        name: wali.name || "",
        email: wali.email || "",
        phone: wali.waliProfile?.phone || "",
        occupation: wali.waliProfile?.occupation || "",
        address: wali.waliProfile?.address || "",
        isActive: wali.isActive,
      });
    }
  }, [open, wali]);

  const handleSubmit = async () => {
    if (!wali) return;

    if (!formData.name.trim()) {
      showAlert.error("Error", "Nama tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/wali/${wali.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          occupation: formData.occupation.trim() || undefined,
          address: formData.address.trim() || undefined,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengupdate wali");
      }

      showAlert.success("Berhasil", `Data ${formData.name} berhasil diupdate`);

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal mengupdate wali");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      occupation: "",
      address: "",
      isActive: true,
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  if (!wali) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Data Wali
          </DialogTitle>
          <DialogDescription>
            Perbarui informasi wali {wali.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-name">Nama Lengkap *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="edit-phone">No. Telepon</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <Label htmlFor="edit-occupation">Pekerjaan</Label>
            <Input
              id="edit-occupation"
              value={formData.occupation}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, occupation: e.target.value }))
              }
              placeholder="Pekerjaan"
            />
          </div>

          <div>
            <Label htmlFor="edit-address">Alamat</Label>
            <Input
              id="edit-address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label className="cursor-pointer">
              {formData.isActive ? "Akun Aktif" : "Akun Non-Aktif"}
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              "Menyimpan..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Detail Modal Component
function WaliDetailModal({
  open,
  onOpenChange,
  wali,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wali: Wali | null;
}) {
  if (!wali) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detail Wali
          </DialogTitle>
          <DialogDescription>Informasi lengkap wali santri</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Wali */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Home className="h-4 w-4" />
              Informasi Wali
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nama</p>
                <p className="font-medium">{wali.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{wali.email || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Telepon</p>
                <p className="font-medium">{wali.waliProfile?.phone || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Pekerjaan</p>
                <p className="font-medium">
                  {wali.waliProfile?.occupation || "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Alamat</p>
                <p className="font-medium">
                  {wali.waliProfile?.address || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge variant={wali.isActive ? "default" : "secondary"}>
                  {wali.isActive ? "Aktif" : "Non-Aktif"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Santri yang Diampu */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Santri yang Diampu ({wali.waliProfile?.santris?.length || 0})
            </h4>
            {wali.waliProfile?.santris &&
            wali.waliProfile.santris.length > 0 ? (
              <div className="space-y-2">
                {wali.waliProfile.santris.map((santri) => (
                  <div
                    key={santri.id}
                    className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{santri.user?.name}</p>
                      <p className="text-sm text-gray-500">NIS: {santri.nis}</p>
                    </div>
                    <Badge variant="secondary">Santri</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Belum ada santri yang terhubung</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export default function AdminWaliPage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const [loading, setLoading] = useState(true);
  const [walis, setWalis] = useState<Wali[]>([]);
  const [filteredWalis, setFilteredWalis] = useState<Wali[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWali, setSelectedWali] = useState<Wali | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchWalis = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users?role=WALI&limit=500");
      if (!response.ok) throw new Error("Failed to fetch walis");
      const data = await response.json();

      const walisData = data.data.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        waliProfile: user.waliProfile,
      }));

      setWalis(walisData);
      setFilteredWalis(walisData);
    } catch (error) {
      showAlert.error("Error", "Gagal memuat data wali");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchWalis();
    }
  }, [isAuthorized, fetchWalis]);

  useEffect(() => {
    let filtered = walis;

    if (searchTerm) {
      filtered = filtered.filter(
        (wali) =>
          wali.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wali.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wali.waliProfile?.phone
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((wali) =>
        statusFilter === "active" ? wali.isActive : !wali.isActive
      );
    }

    setFilteredWalis(filtered);
  }, [searchTerm, statusFilter, walis]);

  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(filteredWalis.length, 10);

  const paginatedWalis = paginateData(filteredWalis);

  useEffect(() => {
    handlePageChange(1);
  }, [searchTerm, statusFilter]);

  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleStatus = async (wali: Wali, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/wali/${wali.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      showAlert.success("Berhasil", "Status wali berhasil diubah");

      fetchWalis();
    } catch (error) {
      showAlert.error("Error", "Gagal mengubah status wali");
    }
  };

  const handleDeleteWali = async (wali: Wali) => {
    const confirmed = await confirmDelete(
      wali.name,
      `Apakah Anda yakin ingin menghapus wali "${wali.name}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/wali/${wali.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete wali");
      }

      showAlert.success("Berhasil", `Wali ${wali.name} berhasil dihapus`);

      fetchWalis();
    } catch (error) {
      showAlert.error(
        "Error",
        error instanceof Error ? error.message : "Gagal menghapus wali"
      );
    }
  };

  const stats = {
    total: walis.length,
    active: walis.filter((w) => w.isActive).length,
    inactive: walis.filter((w) => !w.isActive).length,
    withSantri: walis.filter(
      (w) => w.waliProfile?.santris && w.waliProfile.santris.length > 0
    ).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 shrink-0" />
              <span className="truncate">Data Wali</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Kelola data wali santri
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Wali
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Wali</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Home className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wali Aktif</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Non-Aktif</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {stats.inactive}
                  </p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Punya Santri</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.withSantri}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari nama, email, atau telepon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Wali ({filteredWalis.length})</CardTitle>
            <CardDescription>
              Informasi lengkap semua wali santri
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Memuat data...</p>
              </div>
            ) : filteredWalis.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada wali ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
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
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          Pekerjaan
                        </div>
                      </TableHead>
                      <TableHead>Santri</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedWalis.map((wali) => (
                      <TableRow key={wali.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{wali.name}</p>
                            <p className="text-xs text-gray-500">
                              ID: {wali.id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{wali.email || "-"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {wali.waliProfile?.phone || "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {wali.waliProfile?.occupation || "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {wali.waliProfile?.santris?.length || 0} santri
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={wali.isActive}
                              onCheckedChange={(checked) =>
                                handleToggleStatus(wali, checked)
                              }
                            />
                            <span
                              className={`text-xs font-medium ${
                                wali.isActive
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {wali.isActive ? "Aktif" : "Non-Aktif"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWali(wali);
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Lihat
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWali(wali);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteWali(wali)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredWalis.length}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateWaliDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchWalis}
      />

      <EditWaliDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        wali={selectedWali}
        onSuccess={fetchWalis}
      />

      <WaliDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        wali={selectedWali}
      />
    </DashboardLayout>
  );
}
