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
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  BookMarked,
  FileText,
  Download,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { showAlert } from "@/lib/alert";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface Kaca {
  id: string;
  pageNumber: number;
  surahNumber: number;
  surahName: string;
  ayatStart: number;
  ayatEnd: number;
  juz: number;
  description?: string;
}

interface KacaFormData {
  pageNumber: number;
  surahNumber: number;
  surahName: string;
  ayatStart: number;
  ayatEnd: number;
  juz: number;
  description?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Surah list for dropdown
const SURAH_LIST = [
  { number: 1, name: "Al-Fatihah" },
  { number: 2, name: "Al-Baqarah" },
  { number: 3, name: "Ali 'Imran" },
  { number: 4, name: "An-Nisa'" },
  { number: 5, name: "Al-Ma'idah" },
  { number: 6, name: "Al-An'am" },
  { number: 7, name: "Al-A'raf" },
  { number: 8, name: "Al-Anfal" },
  { number: 9, name: "At-Taubah" },
  { number: 10, name: "Yunus" },
  { number: 11, name: "Hud" },
  { number: 12, name: "Yusuf" },
  { number: 13, name: "Ar-Ra'd" },
  { number: 14, name: "Ibrahim" },
  { number: 15, name: "Al-Hijr" },
  { number: 16, name: "An-Nahl" },
  { number: 17, name: "Al-Isra'" },
  { number: 18, name: "Al-Kahf" },
  { number: 19, name: "Maryam" },
  { number: 20, name: "Ta Ha" },
  { number: 21, name: "Al-Anbiya'" },
  { number: 22, name: "Al-Hajj" },
  { number: 23, name: "Al-Mu'minun" },
  { number: 24, name: "An-Nur" },
  { number: 25, name: "Al-Furqan" },
  { number: 26, name: "Asy-Syu'ara'" },
  { number: 27, name: "An-Naml" },
  { number: 28, name: "Al-Qasas" },
  { number: 29, name: "Al-'Ankabut" },
  { number: 30, name: "Ar-Rum" },
  { number: 31, name: "Luqman" },
  { number: 32, name: "As-Sajdah" },
  { number: 33, name: "Al-Ahzab" },
  { number: 34, name: "Saba'" },
  { number: 35, name: "Fatir" },
  { number: 36, name: "Ya Sin" },
  { number: 37, name: "As-Saffat" },
  { number: 38, name: "Sad" },
  { number: 39, name: "Az-Zumar" },
  { number: 40, name: "Gafir" },
  { number: 41, name: "Fussilat" },
  { number: 42, name: "Asy-Syura" },
  { number: 43, name: "Az-Zukhruf" },
  { number: 44, name: "Ad-Dukhan" },
  { number: 45, name: "Al-Jasiyah" },
  { number: 46, name: "Al-Ahqaf" },
  { number: 47, name: "Muhammad" },
  { number: 48, name: "Al-Fath" },
  { number: 49, name: "Al-Hujurat" },
  { number: 50, name: "Qaf" },
  { number: 51, name: "Az-Zariyat" },
  { number: 52, name: "At-Tur" },
  { number: 53, name: "An-Najm" },
  { number: 54, name: "Al-Qamar" },
  { number: 55, name: "Ar-Rahman" },
  { number: 56, name: "Al-Waqi'ah" },
  { number: 57, name: "Al-Hadid" },
  { number: 58, name: "Al-Mujadalah" },
  { number: 59, name: "Al-Hasyr" },
  { number: 60, name: "Al-Mumtahanah" },
  { number: 61, name: "As-Saff" },
  { number: 62, name: "Al-Jumu'ah" },
  { number: 63, name: "Al-Munafiqun" },
  { number: 64, name: "At-Tagabun" },
  { number: 65, name: "At-Talaq" },
  { number: 66, name: "At-Tahrim" },
  { number: 67, name: "Al-Mulk" },
  { number: 68, name: "Al-Qalam" },
  { number: 69, name: "Al-Haqqah" },
  { number: 70, name: "Al-Ma'arij" },
  { number: 71, name: "Nuh" },
  { number: 72, name: "Al-Jinn" },
  { number: 73, name: "Al-Muzzammil" },
  { number: 74, name: "Al-Muddassir" },
  { number: 75, name: "Al-Qiyamah" },
  { number: 76, name: "Al-Insan" },
  { number: 77, name: "Al-Mursalat" },
  { number: 78, name: "An-Naba'" },
  { number: 79, name: "An-Nazi'at" },
  { number: 80, name: "'Abasa" },
  { number: 81, name: "At-Takwir" },
  { number: 82, name: "Al-Infitar" },
  { number: 83, name: "Al-Mutaffifin" },
  { number: 84, name: "Al-Insyiqaq" },
  { number: 85, name: "Al-Buruj" },
  { number: 86, name: "At-Tariq" },
  { number: 87, name: "Al-A'la" },
  { number: 88, name: "Al-Gasyiyah" },
  { number: 89, name: "Al-Fajr" },
  { number: 90, name: "Al-Balad" },
  { number: 91, name: "Asy-Syams" },
  { number: 92, name: "Al-Lail" },
  { number: 93, name: "Ad-Duha" },
  { number: 94, name: "Asy-Syarh" },
  { number: 95, name: "At-Tin" },
  { number: 96, name: "Al-'Alaq" },
  { number: 97, name: "Al-Qadr" },
  { number: 98, name: "Al-Bayyinah" },
  { number: 99, name: "Az-Zalzalah" },
  { number: 100, name: "Al-'Adiyat" },
  { number: 101, name: "Al-Qari'ah" },
  { number: 102, name: "At-Takasur" },
  { number: 103, name: "Al-'Asr" },
  { number: 104, name: "Al-Humazah" },
  { number: 105, name: "Al-Fil" },
  { number: 106, name: "Quraisy" },
  { number: 107, name: "Al-Ma'un" },
  { number: 108, name: "Al-Kausar" },
  { number: 109, name: "Al-Kafirun" },
  { number: 110, name: "An-Nasr" },
  { number: 111, name: "Al-Lahab" },
  { number: 112, name: "Al-Ikhlas" },
  { number: 113, name: "Al-Falaq" },
  { number: 114, name: "An-Nas" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AdminKacaPage() {
  const { isAuthorized, isLoading: authLoading } = useRoleGuard(["ADMIN"]);

  // State
  const [kacaList, setKacaList] = useState<Kaca[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJuz, setFilterJuz] = useState<string>("");
  const [filterSurah, setFilterSurah] = useState<string>("");

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedKaca, setSelectedKaca] = useState<Kaca | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<KacaFormData>({
    pageNumber: 1,
    surahNumber: 1,
    surahName: "Al-Fatihah",
    ayatStart: 1,
    ayatEnd: 7,
    juz: 1,
    description: "",
  });

  // Fetch kaca data
  const fetchKaca = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filterJuz) params.append("juz", filterJuz);
      if (filterSurah) params.append("surah", filterSurah);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/kaca?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setKacaList(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showAlert.error("Error", "Gagal memuat data kaca");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filterJuz, filterSurah, searchQuery]);

  useEffect(() => {
    if (isAuthorized) {
      fetchKaca();
    }
  }, [isAuthorized, fetchKaca]);

  // Stats
  const stats = useMemo(() => {
    return {
      totalPages: pagination.total,
      totalJuz: 30,
      currentShowing: kacaList.length,
    };
  }, [pagination.total, kacaList.length]);

  // Handle form submit - Create
  const handleCreate = async () => {
    setFormLoading(true);
    try {
      const response = await fetch("/api/kaca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert.success("Berhasil", "Kaca baru berhasil ditambahkan");
        resetForm();
        setIsCreateDialogOpen(false);
        fetchKaca();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal menambah kaca");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form submit - Update
  const handleUpdate = async () => {
    if (!selectedKaca) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/kaca/${selectedKaca.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert.success("Berhasil", "Data kaca berhasil diperbarui");
        resetForm();
        setIsEditDialogOpen(false);
        fetchKaca();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal memperbarui kaca");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedKaca) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/kaca/${selectedKaca.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        showAlert.success("Berhasil", "Kaca berhasil dihapus");
        setIsDeleteDialogOpen(false);
        setSelectedKaca(null);
        fetchKaca();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      showAlert.error("Error", error.message || "Gagal menghapus kaca");
    } finally {
      setFormLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      pageNumber: 1,
      surahNumber: 1,
      surahName: "Al-Fatihah",
      ayatStart: 1,
      ayatEnd: 7,
      juz: 1,
      description: "",
    });
    setSelectedKaca(null);
  };

  // Open edit dialog
  const openEditDialog = (kaca: Kaca) => {
    setSelectedKaca(kaca);
    setFormData({
      pageNumber: kaca.pageNumber,
      surahNumber: kaca.surahNumber,
      surahName: kaca.surahName,
      ayatStart: kaca.ayatStart,
      ayatEnd: kaca.ayatEnd,
      juz: kaca.juz,
      description: kaca.description || "",
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (kaca: Kaca) => {
    setSelectedKaca(kaca);
    setIsDeleteDialogOpen(true);
  };

  // Handle surah change
  const handleSurahChange = (value: string) => {
    const surahNumber = parseInt(value);
    const surah = SURAH_LIST.find((s) => s.number === surahNumber);
    if (surah) {
      setFormData((prev) => ({
        ...prev,
        surahNumber: surah.number,
        surahName: surah.name,
      }));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterJuz("");
    setFilterSurah("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const changePageSize = (size: number) => {
    setPagination((prev) => ({ ...prev, limit: size, page: 1 }));
  };

  if (authLoading) {
    return (
      <DashboardLayout
        title="Manajemen Kaca"
        description="Loading..."
        userRole="ADMIN"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <DashboardLayout
      title="Manajemen Kaca"
      description="Kelola data halaman Al-Qur'an (Kaca)"
      userRole="ADMIN"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Total Kaca
              </CardTitle>
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {stats.totalPages}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Halaman Al-Qur&apos;an
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Juz
              </CardTitle>
              <BookMarked className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {stats.totalJuz}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Juz dalam Al-Qur&apos;an
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Ditampilkan
              </CardTitle>
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                {stats.currentShowing}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                dari {stats.totalPages} kaca
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Data Kaca Al-Qur&apos;an
                </CardTitle>
                <CardDescription>
                  Kelola halaman mushaf Al-Qur&apos;an (604 halaman standar)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchKaca}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      resetForm();
                    }
                    setIsCreateDialogOpen(open);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Kaca
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Tambah Kaca Baru</DialogTitle>
                      <DialogDescription>
                        Tambahkan halaman Al-Qur&apos;an baru ke database
                      </DialogDescription>
                    </DialogHeader>
                    <KacaForm
                      formData={formData}
                      setFormData={setFormData}
                      onSurahChange={handleSurahChange}
                      loading={formLoading}
                    />
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={formLoading}
                      >
                        Batal
                      </Button>
                      <Button onClick={handleCreate} disabled={formLoading}>
                        {formLoading && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Simpan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama surah..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Filter Juz */}
                <Select
                  value={filterJuz}
                  onValueChange={(value) => {
                    setFilterJuz(value === "all" ? "" : value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Pilih Juz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Juz</SelectItem>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                      <SelectItem key={juz} value={juz.toString()}>
                        Juz {juz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filter Surah */}
                <Select
                  value={filterSurah}
                  onValueChange={(value) => {
                    setFilterSurah(value === "all" ? "" : value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih Surah" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">Semua Surah</SelectItem>
                    {SURAH_LIST.map((surah) => (
                      <SelectItem
                        key={surah.number}
                        value={surah.number.toString()}
                      >
                        {surah.number}. {surah.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(searchQuery || filterJuz || filterSurah) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {(filterJuz || filterSurah) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    Filter aktif:
                  </span>
                  {filterJuz && (
                    <Badge variant="secondary" className="gap-1">
                      Juz {filterJuz}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFilterJuz("")}
                      />
                    </Badge>
                  )}
                  {filterSurah && (
                    <Badge variant="secondary" className="gap-1">
                      {
                        SURAH_LIST.find(
                          (s) => s.number.toString() === filterSurah
                        )?.name
                      }
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFilterSurah("")}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[80px]">Halaman</TableHead>
                    <TableHead className="w-[60px]">Juz</TableHead>
                    <TableHead>Surah</TableHead>
                    <TableHead className="w-[120px]">Ayat</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Deskripsi
                    </TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-8" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : kacaList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-8 w-8" />
                          <p>Tidak ada data kaca</p>
                          {(searchQuery || filterJuz || filterSurah) && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={clearFilters}
                            >
                              Reset filter
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    kacaList.map((kaca) => (
                      <TableRow key={kaca.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {kaca.pageNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {kaca.juz}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {kaca.surahName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Surah ke-{kaca.surahNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {kaca.ayatStart} - {kaca.ayatEnd}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {kaca.description || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openEditDialog(kaca)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(kaca)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => changePageSize(parseInt(value))}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  per halaman
                </span>
              </div>

              {/* Pagination info and controls */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Halaman {pagination.page} dari {pagination.totalPages} (
                  {pagination.total} data)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(1)}
                    disabled={pagination.page === 1 || loading}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={
                      pagination.page === pagination.totalPages || loading
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(pagination.totalPages)}
                    disabled={
                      pagination.page === pagination.totalPages || loading
                    }
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              resetForm();
            }
            setIsEditDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Kaca</DialogTitle>
              <DialogDescription>
                Ubah data halaman Al-Qur&apos;an #{selectedKaca?.pageNumber}
              </DialogDescription>
            </DialogHeader>
            <KacaForm
              formData={formData}
              setFormData={setFormData}
              onSurahChange={handleSurahChange}
              loading={formLoading}
              isEdit
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={formLoading}
              >
                Batal
              </Button>
              <Button onClick={handleUpdate} disabled={formLoading}>
                {formLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Perbarui
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Kaca?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus kaca halaman{" "}
                <strong>{selectedKaca?.pageNumber}</strong> (
                {selectedKaca?.surahName})?
                <br />
                <br />
                <span className="text-destructive">
                  Perhatian: Jika kaca ini memiliki data hafalan terkait,
                  penghapusan akan gagal.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={formLoading}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={formLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {formLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

// Form Component
interface KacaFormProps {
  formData: KacaFormData;
  setFormData: React.Dispatch<React.SetStateAction<KacaFormData>>;
  onSurahChange: (value: string) => void;
  loading: boolean;
  isEdit?: boolean;
}

function KacaForm({
  formData,
  setFormData,
  onSurahChange,
  loading,
  isEdit,
}: KacaFormProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pageNumber">Nomor Halaman</Label>
          <Input
            id="pageNumber"
            type="number"
            min={1}
            max={604}
            value={formData.pageNumber}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                pageNumber: parseInt(e.target.value) || 1,
              }))
            }
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="juz">Juz</Label>
          <Select
            value={formData.juz.toString()}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, juz: parseInt(value) }))
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Juz" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                <SelectItem key={juz} value={juz.toString()}>
                  Juz {juz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="surah">Surah</Label>
        <Select
          value={formData.surahNumber.toString()}
          onValueChange={onSurahChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Surah" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {SURAH_LIST.map((surah) => (
              <SelectItem key={surah.number} value={surah.number.toString()}>
                {surah.number}. {surah.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ayatStart">Ayat Awal</Label>
          <Input
            id="ayatStart"
            type="number"
            min={1}
            value={formData.ayatStart}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                ayatStart: parseInt(e.target.value) || 1,
              }))
            }
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ayatEnd">Ayat Akhir</Label>
          <Input
            id="ayatEnd"
            type="number"
            min={1}
            value={formData.ayatEnd}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                ayatEnd: parseInt(e.target.value) || 1,
              }))
            }
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi (Opsional)</Label>
        <Textarea
          id="description"
          placeholder="Contoh: Al-Baqarah 1-5"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          disabled={loading}
          rows={2}
        />
      </div>
    </div>
  );
}
