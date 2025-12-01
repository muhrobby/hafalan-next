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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Users,
  CheckCircle,
  AlertCircle,
  Save,
  ArrowLeft,
  Clock,
  Lock,
  Pause,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showAlert } from "@/lib/alert";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { useKacaData, useJuzList } from "@/hooks/use-kaca-data";
import { usePartialHafalan, PartialHafalan } from "@/hooks/use-partial-hafalan";
import { PartialHafalanDialog } from "@/components/partial-hafalan-dialog";
import {
  PartialHafalanAlert,
  CompletedPartialAlert,
} from "@/components/partial-hafalan-alert";

interface Santri {
  id: string;
  name: string;
  nis: string;
}

interface Kaca {
  id: string;
  pageNumber: number;
  surahName: string;
  surahNumber: number;
  ayatStart: number;
  ayatEnd: number;
  juz: number;
}

interface AyatItem {
  number: number;
  text: string;
  checked: boolean;
  previousStatus?: "LANJUT" | "ULANG";
}

interface HafalanAyatStatus {
  ayatNumber: number;
  status: "LANJUT" | "ULANG";
}

interface HafalanRecordSummary {
  id: string;
  kacaId: string;
  kaca: Kaca;
  completedVerses: number[];
  ayatStatuses: HafalanAyatStatus[];
  statusKaca: "PROGRESS" | "COMPLETE_WAITING_RECHECK" | "RECHECK_PASSED";
  tanggalSetor: string;
  catatan?: string;
  teacher?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
}

const statusLabelMap: Record<HafalanRecordSummary["statusKaca"], string> = {
  PROGRESS: "Sedang hafal",
  COMPLETE_WAITING_RECHECK: "Menunggu recheck",
  RECHECK_PASSED: "Recheck selesai",
};

export default function TeacherInputHafalan() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["TEACHER"],
  });
  const router = useRouter();

  // State declarations - MUST be before hooks that depend on them
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState("");
  const [selectedKaca, setSelectedKaca] = useState("");
  const [selectedJuz, setSelectedJuz] = useState("");
  const [catatan, setCatatan] = useState("");
  const [santris, setSantris] = useState<Santri[]>([]);

  // Use cached kaca data - this prevents fetching 604 records on every page load
  const {
    kacas,
    filteredKacas,
    isLoading: kacaLoading,
    getKacaById,
    getNextKaca,
  } = useKacaData({ juz: selectedJuz ? parseInt(selectedJuz) : undefined });
  const { juzList } = useJuzList();
  const [selectedKacaData, setSelectedKacaData] = useState<Kaca | null>(null);
  const [ayatList, setAyatList] = useState<AyatItem[]>([]);
  const [santriRecords, setSantriRecords] = useState<HafalanRecordSummary[]>(
    []
  );
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [pendingRecord, setPendingRecord] =
    useState<HafalanRecordSummary | null>(null);
  const [nextKacaOption, setNextKacaOption] = useState<Kaca | null>(null);
  const [sequenceHint, setSequenceHint] = useState(
    "Pilih santri untuk melihat urutan setoran"
  );
  const [recordFetchError, setRecordFetchError] = useState("");
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [completingPartial, setCompletingPartial] = useState<string | null>(
    null
  );
  // State for tracking unsaved changes after completing partial
  const [hasUnsavedPartialComplete, setHasUnsavedPartialComplete] =
    useState(false);
  const [justCompletedPartials, setJustCompletedPartials] = useState<
    PartialHafalan[]
  >([]);
  // State for editing existing partial (continue flow)
  const [editingPartial, setEditingPartial] = useState<PartialHafalan | null>(
    null
  );

  // Partial hafalan hook
  const {
    partials,
    isLoading: partialsLoading,
    fetchPartials,
    createPartial,
    updatePartial,
    deletePartial,
    completePartial,
    getActivePartialsForKaca,
    getCompletedPartialsForKaca,
    getRecentlyCompletedPartials,
    getUnsavedCompletedPartials,
    hasActivePartialForAyat,
    getActivePartialForAyat,
    getLowestActivePartialAyat,
  } = usePartialHafalan({
    santriId: selectedSantri || undefined,
    autoFetch: true,
  });

  const fetchSantriRecords = useCallback(
    async (santriId: string, signal?: AbortSignal) => {
      setRecordFetchError("");
      setRecordsLoading(true);
      try {
        const response = await fetch(
          `/api/hafalan?santriId=${santriId}&limit=200`,
          { signal }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || "Gagal memuat riwayat setoran");
        }

        const payload = await response.json();
        if (signal?.aborted) return;

        const parsedRecords: HafalanRecordSummary[] = (payload.data || []).map(
          (record: any) => ({
            id: record.id,
            kacaId: record.kacaId,
            kaca: record.kaca,
            statusKaca: record.statusKaca as HafalanRecordSummary["statusKaca"],
            completedVerses: Array.isArray(record.completedVerses)
              ? record.completedVerses
              : JSON.parse(record.completedVerses || "[]"),
            ayatStatuses: record.ayatStatuses || [],
            tanggalSetor: record.tanggalSetor,
            catatan: record.catatan,
          })
        );

        setSantriRecords(parsedRecords);
      } catch (error: any) {
        if (signal?.aborted) return;
        console.error("Error fetching santri records:", error);
        setSantriRecords([]);
        setRecordFetchError(error.message || "Gagal memuat riwayat setoran");
      } finally {
        if (signal?.aborted) return;
        setRecordsLoading(false);
      }
    },
    []
  );

  // Fetch santri data only - kaca data is handled by useKacaData hook
  useEffect(() => {
    const fetchSantriData = async () => {
      try {
        setLoading(true);

        // Fetch teacher's santris
        const usersResponse = await fetch("/api/users?role=SANTRI");
        const usersData = await usersResponse.json();

        const teacherId = session?.user.teacherProfile?.id;

        const teacherSantris =
          usersData.data
            ?.filter((user: any) => {
              // Check both primary teacher (teacherId) and teacher assignments
              const isPrimaryTeacher =
                user.santriProfile?.teacherId === teacherId;
              const hasAssignment =
                user.santriProfile?.teacherAssignments?.some(
                  (assignment: any) => assignment.teacherId === teacherId
                );
              return isPrimaryTeacher || hasAssignment;
            })
            .map((user: any) => ({
              id: user.santriProfile?.id || user.id,
              name: user.name,
              nis: user.santriProfile?.nis || "",
            })) || [];

        setSantris(teacherSantris);
      } catch (err) {
        console.error("Error fetching santri data:", err);
        showAlert.error(
          "Error",
          "Gagal memuat data santri. Silakan coba lagi."
        );
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchSantriData();
    }
  }, [session]);

  useEffect(() => {
    if (!selectedSantri) {
      setSantriRecords([]);
      setPendingRecord(null);
      setNextKacaOption(null);
      setSequenceHint("Pilih santri untuk melihat urutan setoran");
      setRecordFetchError("");
      setRecordsLoading(false);
      return;
    }

    const controller = new AbortController();
    fetchSantriRecords(selectedSantri, controller.signal);

    return () => controller.abort();
  }, [selectedSantri, fetchSantriRecords]);

  useEffect(() => {
    if (!selectedSantri) {
      setPendingRecord(null);
      setNextKacaOption(null);
      setSequenceHint("Pilih santri untuk melihat urutan setoran");
      setSelectedKaca("");
      return;
    }

    if (kacas.length === 0) {
      setPendingRecord(null);
      setNextKacaOption(null);
      setSequenceHint("Memuat daftar kaca...");
      setSelectedKaca("");
      return;
    }

    let pending: HafalanRecordSummary | null = null;
    let nextTarget: Kaca | null = null;

    for (const kaca of kacas) {
      const record = santriRecords.find((r) => r.kacaId === kaca.id);

      if (record) {
        if (record.statusKaca === "RECHECK_PASSED") {
          continue;
        }
        pending = record;
        nextTarget = kaca;
        break;
      }

      nextTarget = kaca;
      break;
    }

    setPendingRecord(pending);
    setNextKacaOption(nextTarget);

    if (pending) {
      setSequenceHint(
        `Santri sedang menghafal Kaca ${pending.kaca.pageNumber} (${pending.kaca.surahName}). Pastikan recheck selesai sebelum lanjut.`
      );
      setSelectedKaca(pending.kacaId);
      return;
    }

    if (nextTarget) {
      setSequenceHint(
        `Silakan mulai Kaca ${nextTarget.pageNumber} (${nextTarget.surahName}).`
      );
      setSelectedKaca(nextTarget.id);
      return;
    }

    setSequenceHint("Semua kaca telah tercatat selesai.");
    setSelectedKaca("");
  }, [kacas, santriRecords, selectedSantri]);

  // Track locally checked ayats that haven't been saved yet
  // This persists across useEffect rebuilds
  const [locallyCheckedAyats, setLocallyCheckedAyats] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (!selectedKaca) {
      setSelectedKacaData(null);
      setAyatList([]);
      return;
    }

    const kaca = kacas.find((k) => k.id === selectedKaca) || null;
    setSelectedKacaData(kaca);

    if (!kaca) {
      setAyatList([]);
      return;
    }

    const existingRecord = santriRecords.find(
      (record) => record.kacaId === selectedKaca
    );
    const lanjurAyats = new Set(
      existingRecord?.ayatStatuses
        .filter((ayat) => ayat.status === "LANJUT")
        .map((ayat) => ayat.ayatNumber) || []
    );

    const ayats: AyatItem[] = [];
    for (let i = kaca.ayatStart; i <= kaca.ayatEnd; i++) {
      // Merge saved LANJUT status with locally checked ayats
      const isSavedLanjut = lanjurAyats.has(i);
      const isLocallyChecked = locallyCheckedAyats.has(i);
      ayats.push({
        number: i,
        text: `Ayat ${i}`,
        checked: isSavedLanjut || isLocallyChecked,
        previousStatus: isSavedLanjut ? "LANJUT" : "ULANG",
      });
    }

    setAyatList(ayats);
  }, [selectedKaca, kacas, santriRecords, locallyCheckedAyats]);

  // Helper: Check if ayat is locked
  // - Partial ayat: LOCKED - harus diselesaikan via "Selesaikan" dulu
  // - Sequential lock: LOCKED - ayat setelah partial tidak bisa dicentang
  // Setelah partial selesai: ayat otomatis tercentang & unlock, bisa simpan langsung atau tambah ayat lain
  const getAyatLockType = (
    ayatNumber: number
  ): "partial" | "sequential" | null => {
    if (!selectedKaca) return null;

    // Check if this ayat has an active partial - LOCK it
    // User harus klik "Selesaikan" untuk menyelesaikan partial
    const hasPartial = hasActivePartialForAyat(selectedKaca, ayatNumber);
    if (hasPartial) {
      return "partial"; // LOCKED - harus selesaikan partial dulu
    }

    // Check sequential lock: if there's a partial below this ayat, lock this one
    const lowestPartialAyat = getLowestActivePartialAyat(selectedKaca);
    if (lowestPartialAyat !== null && ayatNumber > lowestPartialAyat) {
      return "sequential";
    }

    return null;
  };

  // Handler: Complete partial and auto-check ayat
  const handleCompletePartial = async (
    partialId: string,
    ayatNumber: number
  ) => {
    try {
      setCompletingPartial(partialId);

      const completedPartialData = await completePartial(partialId);

      // Auto-check the ayat in local state
      setAyatList((prev) =>
        prev.map((ayat) =>
          ayat.number === ayatNumber ? { ...ayat, checked: true } : ayat
        )
      );

      // Track that we have unsaved changes
      setHasUnsavedPartialComplete(true);
      setJustCompletedPartials((prev) => [...prev, completedPartialData]);

      // Refresh partials
      await fetchPartials();

      // IMPORTANT: Refresh santriRecords because completing partial
      // auto-creates/updates hafalan_record on the backend
      await fetchSantriRecords(selectedSantri);

      showAlert.success(
        "Partial Selesai",
        `Ayat ${ayatNumber} telah diselesaikan. Jangan lupa SIMPAN jika ada ayat lain yang ingin dicatat!`
      );
    } catch (error: any) {
      showAlert.error(
        "Gagal",
        error.message || "Gagal menyelesaikan partial hafalan."
      );
    } finally {
      setCompletingPartial(null);
    }
  };

  // Handler: Continue/Update partial (untuk lanjutkan progress tanpa selesaikan)
  const handleContinuePartial = (partial: PartialHafalan) => {
    setEditingPartial(partial);
    setShowPartialDialog(true);
  };

  // Handler: Delete partial
  const handleDeletePartial = async (partialId: string) => {
    try {
      await deletePartial(partialId);
      await fetchPartials();

      showAlert.success("Berhasil", "Partial hafalan telah dihapus.");
    } catch (error: any) {
      showAlert.error(
        "Gagal",
        error.message || "Gagal menghapus partial hafalan."
      );
    }
  };

  // Handler: Close partial dialog
  const handleClosePartialDialog = () => {
    setShowPartialDialog(false);
    setEditingPartial(null);
  };

  const handleAyatChange = (ayatNumber: number, checked: boolean) => {
    const lockType = getAyatLockType(ayatNumber);
    // Block BOTH partial and sequential locks
    // Partial harus diselesaikan via tombol "Selesaikan" dulu
    if (lockType) return;

    setAyatList((prev) =>
      prev.map((ayat) =>
        ayat.number === ayatNumber ? { ...ayat, checked } : ayat
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    // Skip both partial and sequential locked ayats
    setAyatList((prev) =>
      prev.map((ayat) => {
        const lockType = getAyatLockType(ayat.number);
        if (lockType) return ayat; // Keep locked unchanged
        return { ...ayat, checked };
      })
    );
  };

  // Core save function that accepts ayat numbers directly
  const saveHafalanWithAyats = async (checkedAyatNumbers: number[]) => {
    if (!selectedSantri || !selectedKaca) {
      showAlert.error(
        "Validasi Gagal",
        "Silakan pilih santri dan kaca terlebih dahulu."
      );
      return;
    }

    if (checkedAyatNumbers.length === 0) {
      showAlert.error(
        "Validasi Gagal",
        "Silakan pilih minimal satu ayat yang sudah dihafal."
      );
      return;
    }

    const allowedIds = new Set<string>();
    if (pendingRecord) allowedIds.add(pendingRecord.kacaId);
    if (nextKacaOption) allowedIds.add(nextKacaOption.id);

    if (!allowedIds.has(selectedKaca)) {
      showAlert.error(
        "Validasi Gagal",
        "Santri belum siap untuk kaca tersebut. Lengkapi kaca sebelumnya terlebih dahulu."
      );
      return;
    }

    try {
      setSubmitting(true);

      const existingRecord = santriRecords.find(
        (record) => record.kacaId === selectedKaca
      );
      const response = await fetch(
        existingRecord ? `/api/hafalan/${existingRecord.id}` : "/api/hafalan",
        {
          method: existingRecord ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            existingRecord
              ? {
                  completedVerses: checkedAyatNumbers,
                  catatan: catatan || undefined,
                }
              : {
                  santriId: selectedSantri,
                  kacaId: selectedKaca,
                  completedVerses: checkedAyatNumbers,
                  catatan: catatan || undefined,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan hafalan");
      }

      const successMessage = existingRecord
        ? "Perubahan hafalan berhasil disimpan."
        : "Setoran hafalan tersimpan, lanjutkan recheck saat semua ayat sudah lancar.";

      showAlert.success("Berhasil", successMessage);

      // Reset catatan field and unsaved changes tracking
      setCatatan("");
      setHasUnsavedPartialComplete(false);
      setJustCompletedPartials([]);

      // Refresh data - this will trigger useEffect to rebuild ayatList with new data
      await fetchSantriRecords(selectedSantri);

      // Scroll to top to show updated status
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      showAlert.error(
        "Error",
        err.message || "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const checkedAyats = ayatList
      .filter((ayat) => ayat.checked)
      .map((ayat) => ayat.number);

    if (checkedAyats.length === 0) {
      showAlert.error(
        "Tidak Ada Ayat",
        "Pilih minimal satu ayat untuk disimpan."
      );
      return;
    }

    // Get active partials for this kaca
    const activePartials = selectedKaca
      ? getActivePartialsForKaca(selectedKaca)
      : [];

    // Check if any checked ayat has an active partial
    const partialsToComplete = activePartials.filter((p) =>
      checkedAyats.includes(p.ayatNumber)
    );

    // Check for partials that are NOT being saved (ayat not checked)
    const unhandledPartials = activePartials.filter(
      (p) => !checkedAyats.includes(p.ayatNumber)
    );

    // If there are partials for unchecked ayats, warn user
    if (unhandledPartials.length > 0) {
      showAlert.error(
        "Ada Partial Belum Selesai",
        `Ayat ${unhandledPartials
          .map((p) => p.ayatNumber)
          .join(
            ", "
          )} masih ada partial aktif. Centang ayat tersebut atau selesaikan partial-nya terlebih dahulu.`
      );
      return;
    }

    setSubmitting(true);

    try {
      // Auto-complete partials for checked ayats
      for (const partial of partialsToComplete) {
        await completePartial(partial.id);
      }

      // Refresh partials and records if we completed any
      if (partialsToComplete.length > 0) {
        await fetchPartials();
        await fetchSantriRecords(selectedSantri);
      }

      // Now save the hafalan
      await saveHafalanWithAyats(checkedAyats);
    } catch (err: any) {
      showAlert.error(
        "Error",
        err.message || "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const checkedCount = ayatList.filter((ayat) => ayat.checked).length;
  const totalCount = ayatList.length;
  const isComplete = checkedCount === totalCount && totalCount > 0;
  const allowedKacaIds = new Set<string>();
  if (pendingRecord) allowedKacaIds.add(pendingRecord.kacaId);
  if (nextKacaOption) allowedKacaIds.add(nextKacaOption.id);
  const selectDisabled =
    !allowedKacaIds.size || !selectedSantri || recordsLoading;
  const currentRecord = santriRecords.find(
    (record) => record.kacaId === selectedKaca
  );
  const santriFlowInfo = (() => {
    if (pendingRecord?.statusKaca === "COMPLETE_WAITING_RECHECK") {
      return {
        title: `Santri sudah selesai pada Kaca ${pendingRecord.kaca.pageNumber}`,
        description:
          "Semua ayat telah bernilai lancar, saatnya membawa santri ke halaman Recheck untuk menandai akhir sesi.",
        badge: "Menunggu Recheck",
        badgeVariant: "destructive" as const,
        actionLabel: "Buka Recheck",
        actionHref: "/teacher/hafalan/recheck",
      };
    }

    if (pendingRecord) {
      return {
        title: `Santri sedang menghafal Kaca ${pendingRecord.kaca.pageNumber}`,
        description:
          "Lengkapi ayat-ayat yang sudah lancar, lalu simpan untuk memperbarui status setoran.",
        badge: "Sedang Hafal",
        badgeVariant: "secondary" as const,
      };
    }

    if (nextKacaOption) {
      return {
        title: `Target berikutnya: Kaca ${nextKacaOption.pageNumber}`,
        description:
          "Pilih kaca ini dan beri tanda pada ayat-ayat yang sudah lancar untuk memulai setoran baru.",
        badge: "Siap Setoran",
        badgeVariant: "default" as const,
      };
    }

    return {
      title: "Semua kaca sudah tercatat",
      description:
        "Kalau ada perubahan hafalan, buka Recheck atau Input Hafalan agar status terus terjaga.",
      badge: "Tuntas",
      badgeVariant: "outline" as const,
      actionLabel: "Lihat Recheck",
      actionHref: "/teacher/hafalan/recheck",
    };
  })();
  const highlightedKaca =
    pendingRecord?.kaca || nextKacaOption || selectedKacaData || null;
  const highlightedKacaLabel = highlightedKaca
    ? `Kaca ${highlightedKaca.pageNumber} · ${highlightedKaca.surahName}`
    : "Belum ada data kaca";
  const lastSetorLabel = pendingRecord?.tanggalSetor
    ? new Date(pendingRecord.tanggalSetor).toLocaleDateString("id-ID")
    : "Belum ada setoran";
  const totalLancarAyat = pendingRecord?.completedVerses.length ?? 0;
  const needsRecheck = pendingRecord?.statusKaca === "COMPLETE_WAITING_RECHECK";
  const lastCatatan =
    pendingRecord?.catatan ||
    "Belum ada catatan tambahan pada setoran terakhir.";
  const isEditing = Boolean(currentRecord);
  const submitLabel = isEditing ? "Perbarui Hafalan" : "Simpan Hafalan";
  const canSubmit =
    !!selectedSantri &&
    !!selectedKaca &&
    allowedKacaIds.has(selectedKaca) &&
    checkedCount > 0 &&
    !submitting;

  // Get recently completed partials for display
  const recentlyCompletedPartials = selectedKaca
    ? getRecentlyCompletedPartials(selectedKaca, 60) // Within last 60 minutes
    : [];

  // Get unsaved completed partials - partials that are COMPLETED but ayat not saved in hafalan_ayat_statuses
  // This detects when guru forgot to save hafalan after completing partial in previous session
  const savedAyatNumbers =
    currentRecord?.ayatStatuses
      ?.filter((s) => s.status === "LANJUT")
      .map((s) => s.ayatNumber) || [];

  const unsavedCompletedPartials = selectedKaca
    ? getUnsavedCompletedPartials(selectedKaca, savedAyatNumbers)
    : [];

  // Handler: Restore ayat checks from unsaved completed partials AND auto-save
  const handleRestoreAyatChecks = async (ayatNumbers: number[]) => {
    // Get currently checked ayats and merge with new ones from unsaved partials
    const currentlyCheckedAyats = ayatList
      .filter((ayat) => ayat.checked)
      .map((ayat) => ayat.number);

    // Combine current checked ayats with the unsaved partial ayats
    const allAyatsToSave = [
      ...new Set([...currentlyCheckedAyats, ...ayatNumbers]),
    ];

    // Update the checkbox state for UI
    setAyatList((prev) =>
      prev.map((ayat) =>
        ayatNumbers.includes(ayat.number) ? { ...ayat, checked: true } : ayat
      )
    );

    // Directly save with the combined ayat numbers
    await saveHafalanWithAyats(allAyatsToSave);
  };

  // Calculate current step for progress indicator
  const getCurrentStep = () => {
    if (!selectedSantri) return 1;
    if (!selectedKaca) return 2;
    if (checkedCount === 0) return 3;
    return 4;
  };

  const currentStep = getCurrentStep();

  // Authorization check
  if (isLoading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect via useRoleGuard
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-4 md:space-y-6 w-full">
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/teacher">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              Teacher: Input Hafalan
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Catat progress hafalan santri dengan Metode 1 Kaca
            </p>
          </div>
        </div>

        {/* Progress Stepper - Responsive */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 md:pt-6">
            {/* Mobile: Vertical Stepper */}
            <div className="flex flex-col gap-4 md:hidden">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep >= 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Pilih Santri
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedSantri ? "✓ Sudah dipilih" : "Belum dipilih"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep >= 2
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Pilih Kaca
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedKaca ? "✓ Sudah dipilih" : "Belum dipilih"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep >= 3
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Tandai Ayat
                  </p>
                  <p className="text-xs text-gray-600">
                    {checkedCount > 0
                      ? `✓ ${checkedCount} ayat dipilih`
                      : "Belum ada"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep >= 4
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  4
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Simpan</p>
                  <p className="text-xs text-gray-600">
                    {canSubmit ? "✓ Siap disimpan" : "Belum siap"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tablet & Desktop: Horizontal Stepper */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep >= 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  1
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Pilih Santri
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedSantri ? "✓ Sudah dipilih" : "Belum dipilih"}
                  </p>
                </div>
              </div>

              <div className="h-0.5 w-8 lg:w-16 bg-gray-300"></div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep >= 2
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  2
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Pilih Kaca
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedKaca ? "✓ Sudah dipilih" : "Belum dipilih"}
                  </p>
                </div>
              </div>

              <div className="h-0.5 w-8 lg:w-16 bg-gray-300"></div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep >= 3
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  3
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Tandai Ayat
                  </p>
                  <p className="text-xs text-gray-600">
                    {checkedCount > 0
                      ? `✓ ${checkedCount} ayat dipilih`
                      : "Belum ada"}
                  </p>
                </div>
              </div>

              <div className="h-0.5 w-8 lg:w-16 bg-gray-300"></div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep >= 4
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  4
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Simpan</p>
                  <p className="text-xs text-gray-600">
                    {canSubmit ? "✓ Siap disimpan" : "Belum siap"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contextual Help */}
        {!selectedSantri && (
          <Alert className="bg-blue-50 border-blue-200">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Langkah 1:</strong> Pilih santri terlebih dahulu untuk
              melihat riwayat hafalan dan kaca yang dapat dipilih.
            </AlertDescription>
          </Alert>
        )}

        {selectedSantri && !selectedKaca && (
          <Alert className="bg-amber-50 border-amber-200">
            <BookOpen className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>Langkah 2:</strong> Pilih kaca (halaman) yang akan dicatat
              hari ini. Sistem akan otomatis menampilkan kaca yang bisa dipilih
              berdasarkan progress santri.
            </AlertDescription>
          </Alert>
        )}

        {selectedKaca && checkedCount === 0 && (
          <Alert className="bg-purple-50 border-purple-200">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-900">
              <strong>Langkah 3:</strong> Tandai ayat yang sudah lancar dihafal.
              Centang semua ayat yang sudah dikuasai santri hari ini.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pilih Santri
                </CardTitle>
                <CardDescription>
                  Pilih santri yang akan dicatat hafalannya
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <Select
                    value={selectedSantri}
                    onValueChange={setSelectedSantri}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih santri..." />
                    </SelectTrigger>
                    <SelectContent>
                      {santris.map((santri) => (
                        <SelectItem key={santri.id} value={santri.id}>
                          {santri.name} ({santri.nis})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Pilih Kaca
                </CardTitle>
                <CardDescription>
                  Pilih halaman (kaca) yang sedang dihafal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    {/* Filter Juz */}
                    <div className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground">
                        Filter Juz
                      </Label>
                      <Select
                        value={selectedJuz}
                        onValueChange={(value) => {
                          setSelectedJuz(value);
                          setSelectedKaca("");
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Semua Juz (1-30)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Juz (1-30)</SelectItem>
                          {Array.from({ length: 30 }, (_, i) => i + 1).map(
                            (juz) => (
                              <SelectItem key={juz} value={juz.toString()}>
                                Juz {juz}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pilih Kaca */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">
                          Halaman Kaca
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {selectedJuz && selectedJuz !== "all"
                            ? `${
                                kacas.filter(
                                  (k) => k.juz === parseInt(selectedJuz)
                                ).length
                              } halaman`
                            : `${kacas.length} halaman total`}
                        </span>
                      </div>
                      <Select
                        disabled={selectDisabled}
                        value={selectedKaca}
                        onValueChange={setSelectedKaca}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedSantri
                                ? "Pilih santri terlebih dahulu"
                                : recordsLoading
                                ? "Memuat riwayat..."
                                : !allowedKacaIds.size
                                ? "Tunggu urutan hafalan..."
                                : "Pilih kaca..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {kacas
                            .filter(
                              (kaca) =>
                                !selectedJuz ||
                                selectedJuz === "all" ||
                                kaca.juz === parseInt(selectedJuz)
                            )
                            .map((kaca) => {
                              const isAllowed = allowedKacaIds.has(kaca.id);
                              return (
                                <SelectItem
                                  key={kaca.id}
                                  value={kaca.id}
                                  disabled={!isAllowed}
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={
                                        isAllowed ? "default" : "outline"
                                      }
                                      className={`w-10 justify-center text-xs ${
                                        isAllowed
                                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                          : ""
                                      }`}
                                    >
                                      {kaca.pageNumber}
                                    </Badge>
                                    <span className="font-medium">
                                      {kaca.surahName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Ayat {kaca.ayatStart}-{kaca.ayatEnd}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs ml-auto"
                                    >
                                      Juz {kaca.juz}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedSantri && (
            <>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-700 flex-1">
                    {sequenceHint}
                  </p>
                  {recordsLoading && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="h-3 w-3 animate-spin rounded-full border border-slate-500 border-t-transparent" />
                      Memuat riwayat
                    </span>
                  )}
                </div>
                {pendingRecord && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <Badge
                      variant="secondary"
                      className="px-2 py-0.5 text-[11px]"
                    >
                      {statusLabelMap[pendingRecord.statusKaca]}
                    </Badge>
                    {pendingRecord.teacher?.user?.name && (
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 border-blue-200"
                      >
                        👨‍🏫 {pendingRecord.teacher.user.name}
                      </Badge>
                    )}
                    <span>
                      Setoran terakhir:{" "}
                      {new Date(pendingRecord.tanggalSetor).toLocaleDateString(
                        "id-ID"
                      )}{" "}
                      · {pendingRecord.completedVerses.length} ayat lancar
                    </span>
                  </div>
                )}
                {recordFetchError && (
                  <p className="mt-2 text-xs text-destructive">
                    {recordFetchError}
                  </p>
                )}
              </div>

              {/* Simplified Status Card - Combined Info */}
              <Card className="border border-slate-100 bg-white w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold">
                      Status Hafalan
                    </CardTitle>
                    <Badge variant={santriFlowInfo.badgeVariant || "secondary"}>
                      {santriFlowInfo.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-lg font-bold text-slate-700">
                        {highlightedKaca?.pageNumber || "-"}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Kaca
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-lg font-bold text-emerald-600">
                        {totalLancarAyat}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Ayat Lancar
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-lg font-bold text-slate-700">
                        {lastSetorLabel !== "Belum ada setoran"
                          ? new Date(
                              pendingRecord?.tanggalSetor || ""
                            ).getDate() +
                            "/" +
                            (new Date(
                              pendingRecord?.tanggalSetor || ""
                            ).getMonth() +
                              1)
                          : "-"}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Terakhir
                      </p>
                    </div>
                  </div>

                  {/* Action Guidance */}
                  <div className="border-t pt-3">
                    <p className="text-sm text-slate-600 mb-2">
                      {santriFlowInfo.description}
                    </p>
                    {santriFlowInfo.actionHref &&
                      santriFlowInfo.actionLabel && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={santriFlowInfo.actionHref}>
                            {santriFlowInfo.actionLabel}
                          </Link>
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedKacaData && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Detail Kaca & Pemilihan Ayat</CardTitle>
                <CardDescription>
                  Pilih ayat yang sudah lancar dihafal oleh santri
                </CardDescription>
                {currentRecord && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge
                      variant="outline"
                      className="px-2 py-0.5 text-[11px]"
                    >
                      {statusLabelMap[currentRecord.statusKaca]}
                    </Badge>
                    {currentRecord.teacher?.user?.name && (
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 border-blue-200"
                      >
                        👨‍🏫 {currentRecord.teacher.user.name}
                      </Badge>
                    )}
                    <span>
                      Setoran terakhir:{" "}
                      {new Date(currentRecord.tanggalSetor).toLocaleDateString(
                        "id-ID"
                      )}{" "}
                      · {currentRecord.completedVerses.length} ayat lancar
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Kaca Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Halaman:</span>
                      <p className="text-gray-600">
                        {selectedKacaData.pageNumber}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Surah:</span>
                      <p className="text-gray-600">
                        {selectedKacaData.surahName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Ayat:</span>
                      <p className="text-gray-600">
                        {selectedKacaData.ayatStart} -{" "}
                        {selectedKacaData.ayatEnd}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Juz:</span>
                      <p className="text-gray-600">{selectedKacaData.juz}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Progress Summary with Prominent Partial Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      Progress: {checkedCount} / {totalCount} ayat
                    </span>
                    <Badge variant={isComplete ? "default" : "secondary"}>
                      {isComplete ? "Kaca Selesai" : "Progress"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Prominent Partial Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPartialDialog(true)}
                      className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Catat Partial Hafalan
                    </Button>
                    <div className="flex items-center gap-2 ml-2">
                      <Checkbox
                        id="select-all"
                        checked={checkedCount === totalCount && totalCount > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all" className="text-sm">
                        Pilih Semua
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Partial Hafalan Alert with Actions */}
                {selectedKaca &&
                  getActivePartialsForKaca(selectedKaca).length > 0 && (
                    <PartialHafalanAlert
                      partials={getActivePartialsForKaca(selectedKaca)}
                      kacaInfo={
                        selectedKacaData
                          ? {
                              pageNumber: selectedKacaData.pageNumber,
                              surahName: selectedKacaData.surahName,
                            }
                          : undefined
                      }
                      onComplete={handleCompletePartial}
                      onContinue={handleContinuePartial}
                      onDelete={handleDeletePartial}
                      showActions={true}
                    />
                  )}

                {/* CRITICAL: Unsaved Completed Partials from previous session */}
                {!hasUnsavedPartialComplete &&
                  unsavedCompletedPartials.length > 0 && (
                    <CompletedPartialAlert
                      completedPartials={unsavedCompletedPartials}
                      hasUnsavedChanges={true}
                      isPreviousSessionUnsaved={true}
                      onRestoreAyatChecks={handleRestoreAyatChecks}
                      onSaveHafalan={() => {
                        const submitBtn =
                          document.getElementById("submit-hafalan-btn");
                        if (submitBtn) submitBtn.click();
                      }}
                    />
                  )}

                {/* Unsaved Changes Alert after completing partial (current session) */}
                {hasUnsavedPartialComplete &&
                  justCompletedPartials.length > 0 && (
                    <CompletedPartialAlert
                      completedPartials={justCompletedPartials}
                      hasUnsavedChanges={true}
                      onRestoreAyatChecks={handleRestoreAyatChecks}
                    />
                  )}

                {/* Recently Completed Partials Info (already saved) */}
                {!hasUnsavedPartialComplete &&
                  unsavedCompletedPartials.length === 0 &&
                  recentlyCompletedPartials.length > 0 && (
                    <CompletedPartialAlert
                      completedPartials={recentlyCompletedPartials}
                      hasUnsavedChanges={false}
                    />
                  )}

                {/* Ayat List with Lock States */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {ayatList.map((ayat) => {
                    const wasLancar = ayat.previousStatus === "LANJUT";
                    const lockType = getAyatLockType(ayat.number);
                    // BOTH partial and sequential are disabled/locked
                    const isDisabled = lockType !== null;
                    const hasPartial = lockType === "partial";
                    const isSequentialLock = lockType === "sequential";
                    const activePartial = hasPartial
                      ? getActivePartialForAyat(selectedKaca, ayat.number)
                      : null;

                    return (
                      <div
                        key={ayat.number}
                        className={`flex items-start space-x-2 p-3 border rounded-lg transition-colors ${
                          isSequentialLock
                            ? "border-gray-300 bg-gray-50 opacity-60"
                            : hasPartial
                            ? "border-amber-300 bg-amber-50"
                            : wasLancar
                            ? "border-emerald-200 bg-emerald-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Checkbox
                          id={`ayat-${ayat.number}`}
                          checked={ayat.checked}
                          disabled={isDisabled}
                          onCheckedChange={(checked) =>
                            handleAyatChange(ayat.number, checked as boolean)
                          }
                        />
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor={`ayat-${ayat.number}`}
                              className={`text-sm font-semibold ${
                                isDisabled
                                  ? hasPartial
                                    ? "text-amber-700 cursor-not-allowed"
                                    : "text-gray-400 cursor-not-allowed"
                                  : wasLancar
                                  ? "text-emerald-600 cursor-pointer"
                                  : "text-gray-600 cursor-pointer"
                              }`}
                            >
                              {ayat.text}
                            </Label>
                            {hasPartial && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300"
                              >
                                <Lock className="h-2.5 w-2.5 mr-0.5" />
                                {activePartial?.percentage || 0}%
                              </Badge>
                            )}
                            {isSequentialLock && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-300"
                              >
                                <Pause className="h-2.5 w-2.5 mr-0.5" />
                                Menunggu
                              </Badge>
                            )}
                          </div>
                          {wasLancar && !isDisabled && (
                            <span className="text-[10px] uppercase text-emerald-600">
                              Lancar sebelumnya
                            </span>
                          )}
                          {hasPartial && activePartial && (
                            <span
                              className="text-[10px] text-amber-600 block truncate max-w-full"
                              title={activePartial.progress}
                            >
                              {activePartial.progress.length > 25
                                ? activePartial.progress.substring(0, 25) +
                                  "..."
                                : activePartial.progress}
                            </span>
                          )}
                          {isSequentialLock && (
                            <span className="text-[10px] text-gray-500">
                              Selesaikan partial di atas
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="catatan">Catatan Guru (Opsional)</Label>
                  <Textarea
                    id="catatan"
                    placeholder="Masukkan catatan atau feedback untuk santri..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={3}
                  />
                  {currentRecord?.catatan && (
                    <p className="mt-2 text-xs italic text-slate-500">
                      Catatan terakhir: {currentRecord.catatan}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedKacaData && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">
                      Ringkasan Setoran
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>
                          {santris.find((s) => s.id === selectedSantri)?.name}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <span>
                          {selectedKacaData.surahName} (Hal.{" "}
                          {selectedKacaData.pageNumber})
                        </span>
                      </div>
                      <div className="h-4 w-px bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">
                          {checkedCount} ayat lancar
                        </span>
                      </div>
                    </div>
                    {!canSubmit && (
                      <p className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {checkedCount === 0
                          ? "Minimal 1 ayat harus ditandai"
                          : "Lengkapi semua field yang diperlukan"}
                      </p>
                    )}
                  </div>
                  <Button
                    id="submit-hafalan-btn"
                    type="submit"
                    disabled={!canSubmit}
                    size="lg"
                    className="min-w-40 bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        {submitLabel}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        {/* Partial Hafalan Dialog */}
        {selectedKacaData && (
          <PartialHafalanDialog
            open={showPartialDialog}
            onOpenChange={handleClosePartialDialog}
            santriId={selectedSantri}
            kacaId={selectedKaca}
            kacaInfo={{
              pageNumber: selectedKacaData.pageNumber,
              surahName: selectedKacaData.surahName,
              ayatStart: selectedKacaData.ayatStart,
              ayatEnd: selectedKacaData.ayatEnd,
            }}
            availableAyats={ayatList
              .filter((a) => !a.checked)
              .map((a) => a.number)}
            suggestedAyat={
              // Suggest the first unchecked ayat (next ayat to memorize)
              ayatList.find((a) => !a.checked)?.number
            }
            activePartials={getActivePartialsForKaca(selectedKaca)}
            editingPartial={editingPartial}
            onSave={async (data) => {
              await createPartial({
                santriId: selectedSantri,
                kacaId: selectedKaca,
                ...data,
              });
              showAlert.success(
                "Berhasil",
                `Partial hafalan ayat ${data.ayatNumber} tersimpan`
              );
              await fetchPartials();
            }}
            onUpdate={async (id, data) => {
              await updatePartial(id, data);
              showAlert.success(
                "Berhasil",
                "Progress partial berhasil diupdate"
              );
              await fetchPartials();
            }}
            onDelete={async (id) => {
              await deletePartial(id);
              showAlert.success("Berhasil", "Partial hafalan dihapus");
              await fetchPartials();
            }}
            onComplete={async (id) => {
              await completePartial(id);
              showAlert.success("Berhasil", "Partial hafalan ditandai selesai");
              await fetchPartials();
              await fetchSantriRecords(selectedSantri);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
