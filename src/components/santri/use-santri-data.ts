/**
 * Custom hook for santri data fetching
 * Provides unified data access for Admin and Teacher views
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { Teacher, Santri, SantriDetail, HafalanRecord } from "./types";

interface UseSantriDataOptions {
  /** Whether to fetch teacher list (Admin only) */
  fetchTeachers?: boolean;
  /** Current teacher ID filter (Teacher role) */
  teacherId?: string;
}

interface UseSantriDataReturn {
  // State
  teachers: Teacher[];
  santriList: Santri[];
  selectedTeacher: string;
  searchQuery: string;
  selectedSantri: SantriDetail | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  error: string | null;

  // Actions
  setSelectedTeacher: (id: string) => void;
  setSearchQuery: (query: string) => void;
  selectSantri: (id: string | null) => void;
  refreshSantriDetail: () => Promise<void>;
  resetError: () => void;
}

// Helper to transform API response to our types
function transformSantri(apiData: any): Santri {
  return {
    id: apiData.id,
    name: apiData.name,
    email: apiData.email,
    angkatan: apiData.santriProfile?.angkatan ?? null,
    isActive: apiData.santriProfile?.isActive ?? true,
    teacher: apiData.santriProfile?.teacher
      ? {
          id: apiData.santriProfile.teacher.id,
          name: apiData.santriProfile.teacher.user?.name ?? null,
          email: apiData.santriProfile.teacher.user?.email ?? "",
        }
      : null,
  };
}

function transformTeacher(apiData: any): Teacher {
  return {
    id: apiData.teacherProfile?.id ?? apiData.id,
    name: apiData.name,
    email: apiData.email,
  };
}

function transformHafalanRecord(apiData: any): HafalanRecord {
  return {
    id: apiData.id,
    kacaId: apiData.kacaId,
    status: apiData.statusKaca,
    nilai: apiData.nilai ?? null,
    notes: apiData.catatan ?? null,
    createdAt: apiData.tanggalSetor ?? apiData.createdAt,
    updatedAt: apiData.updatedAt,
    teacher: apiData.teacher
      ? {
          id: apiData.teacher.id,
          name: apiData.teacher.user?.name ?? null,
          email: apiData.teacher.user?.email ?? "",
        }
      : null,
    recheckTeacher: apiData.recheckTeacher
      ? {
          id: apiData.recheckTeacher.id,
          name: apiData.recheckTeacher.user?.name ?? null,
          email: apiData.recheckTeacher.user?.email ?? "",
        }
      : null,
    kaca: {
      id: apiData.kaca?.id ?? apiData.kacaId,
      surahName: apiData.kaca?.surahName ?? apiData.kacaInfo ?? "Unknown",
      juz: apiData.kaca?.juz ?? apiData.juzNumber ?? 0,
      pageNumber: apiData.kaca?.pageNumber ?? apiData.pageNumber ?? 0,
    },
  };
}

export function useSantriData(
  options: UseSantriDataOptions = {}
): UseSantriDataReturn {
  const { fetchTeachers = false, teacherId } = options;

  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSantri, setSelectedSantri] = useState<SantriDetail | null>(
    null
  );
  const [selectedSantriId, setSelectedSantriId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch teachers (Admin only)
  useEffect(() => {
    if (!fetchTeachers) return;

    async function loadTeachers() {
      try {
        const response = await fetch("/api/users?role=TEACHER&limit=100");
        if (response.ok) {
          const data = await response.json();
          const teacherList = (data.data || data || []).map(transformTeacher);
          setTeachers(teacherList);
        }
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    }

    loadTeachers();
  }, [fetchTeachers]);

  // Fetch santri list
  useEffect(() => {
    async function loadSantri() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ role: "SANTRI", limit: "100" });

        // Apply teacher filter
        const effectiveTeacherId =
          teacherId ||
          (selectedTeacher !== "all" ? selectedTeacher : undefined);
        if (effectiveTeacherId) {
          params.append("teacherId", effectiveTeacherId);
        }

        // Apply search filter
        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }

        const response = await fetch(`/api/users?${params}`);
        if (!response.ok) throw new Error("Failed to fetch santri");

        const data = await response.json();
        const santriData = (data.data || data || []).map(transformSantri);
        setSantriList(santriData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching santri");
        console.error("Error fetching santri:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSantri();
  }, [selectedTeacher, debouncedSearch, teacherId]);

  // Fetch santri detail
  const fetchSantriDetail = useCallback(
    async (santriId: string) => {
      if (!santriId) return;

      setIsLoadingDetail(true);
      setError(null);

      try {
        // Find santri from list first
        const santriFromList = santriList.find((s) => s.id === santriId);

        // Fetch hafalan data - using santriProfile ID if available
        const hafalanParams = new URLSearchParams({ limit: "100" });
        // Note: API uses santriProfile.id, not user.id
        const hafalanResponse = await fetch(`/api/hafalan?${hafalanParams}`);
        if (!hafalanResponse.ok)
          throw new Error("Failed to fetch hafalan data");
        const hafalanData = await hafalanResponse.json();

        // Filter records for this santri
        const allRecords = hafalanData.data || [];
        const santriRecords = allRecords.filter(
          (r: any) =>
            r.santri?.userId === santriId || r.santri?.user?.id === santriId
        );

        // Transform records
        const transformedRecords = santriRecords.map(transformHafalanRecord);

        // Calculate progress
        const completedCount = transformedRecords.filter(
          (r) => r.status === "RECHECK_PASSED"
        ).length;

        // Fetch kaca for total count and next kaca
        const kacaResponse = await fetch("/api/kaca?limit=700");
        const kacaData = (await kacaResponse.ok)
          ? await kacaResponse.json()
          : { data: [] };
        const allKaca = kacaData.data || kacaData || [];
        const totalKaca = allKaca.length || 604;

        // Find next kaca
        const completedKacaIds = new Set(
          transformedRecords
            .filter((r) => r.status === "RECHECK_PASSED")
            .map((r) => r.kacaId)
        );

        const nextKaca = allKaca.find((k: any) => !completedKacaIds.has(k.id));

        const detail: SantriDetail = {
          id: santriId,
          name: santriFromList?.name ?? null,
          email: santriFromList?.email ?? "",
          angkatan: santriFromList?.angkatan ?? null,
          isActive: santriFromList?.isActive ?? true,
          teacher: santriFromList?.teacher ?? null,
          hafalan: transformedRecords,
          progress: {
            completed: completedCount,
            total: totalKaca,
            percentage:
              totalKaca > 0
                ? Math.round((completedCount / totalKaca) * 100)
                : 0,
          },
          nextKaca: nextKaca
            ? {
                id: nextKaca.id,
                surahName: nextKaca.surahName,
                juz: nextKaca.juz,
                pageNumber: nextKaca.pageNumber,
              }
            : null,
        };

        setSelectedSantri(detail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching detail");
        console.error("Error fetching santri detail:", err);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [santriList]
  );

  // Effect to fetch detail when santri is selected
  useEffect(() => {
    if (selectedSantriId) {
      fetchSantriDetail(selectedSantriId);
    } else {
      setSelectedSantri(null);
    }
  }, [selectedSantriId, fetchSantriDetail]);

  // Refresh current santri detail
  const refreshSantriDetail = useCallback(async () => {
    if (selectedSantriId) {
      await fetchSantriDetail(selectedSantriId);
    }
  }, [selectedSantriId, fetchSantriDetail]);

  return {
    teachers,
    santriList,
    selectedTeacher,
    searchQuery,
    selectedSantri,
    isLoading,
    isLoadingDetail,
    error,
    setSelectedTeacher,
    setSearchQuery,
    selectSantri: setSelectedSantriId,
    refreshSantriDetail,
    resetError: () => setError(null),
  };
}
