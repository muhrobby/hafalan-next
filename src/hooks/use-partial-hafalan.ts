"use client";

import { useState, useEffect, useCallback } from "react";

export interface PartialHafalan {
  id: string;
  santriId: string;
  teacherId: string | null;
  kacaId: string;
  ayatNumber: number;
  progress: string;
  percentage: number | null;
  tanggalSetor: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  catatan: string | null;
  completedInRecordId: string | null;
  createdAt: string;
  updatedAt: string;
  santri?: {
    id: string;
    user: {
      name: string;
      email?: string;
    };
  };
  teacher?: {
    id: string;
    user: {
      name: string;
    };
  } | null;
  kaca?: {
    id: string;
    pageNumber: number;
    surahName: string;
    ayatStart: number;
    ayatEnd: number;
    juz: number;
  };
}

interface UsePartialHafalanOptions {
  santriId?: string;
  kacaId?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  autoFetch?: boolean;
}

interface UsePartialHafalanReturn {
  partials: PartialHafalan[];
  isLoading: boolean;
  error: string | null;
  fetchPartials: () => Promise<void>;
  createPartial: (data: CreatePartialData) => Promise<PartialHafalan>;
  updatePartial: (
    id: string,
    data: UpdatePartialData
  ) => Promise<PartialHafalan>;
  deletePartial: (id: string) => Promise<void>;
  completePartial: (id: string) => Promise<PartialHafalan>;
  getActivePartialsForKaca: (kacaId: string) => PartialHafalan[];
  hasActivePartialForAyat: (kacaId: string, ayatNumber: number) => boolean;
  getActivePartialForAyat: (kacaId: string, ayatNumber: number) => PartialHafalan | undefined;
  getLowestActivePartialAyat: (kacaId: string) => number | null;
}

interface CreatePartialData {
  santriId: string;
  kacaId: string;
  ayatNumber: number;
  progress: string;
  percentage?: number;
  catatan?: string;
}

interface UpdatePartialData {
  progress?: string;
  percentage?: number;
  status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  catatan?: string;
}

export function usePartialHafalan(
  options: UsePartialHafalanOptions = {}
): UsePartialHafalanReturn {
  const { santriId, kacaId, status, autoFetch = true } = options;

  const [partials, setPartials] = useState<PartialHafalan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPartials = useCallback(async () => {
    if (!santriId) {
      setPartials([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("santriId", santriId);
      if (kacaId) params.append("kacaId", kacaId);
      if (status) params.append("status", status);

      const response = await fetch(`/api/hafalan/partial?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch partial hafalan");
      }

      const data = await response.json();
      setPartials(data.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      console.error("Error fetching partial hafalan:", err);
    } finally {
      setIsLoading(false);
    }
  }, [santriId, kacaId, status]);

  const createPartial = useCallback(
    async (data: CreatePartialData): Promise<PartialHafalan> => {
      const response = await fetch("/api/hafalan/partial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create partial hafalan");
      }

      const created = await response.json();
      setPartials((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updatePartial = useCallback(
    async (id: string, data: UpdatePartialData): Promise<PartialHafalan> => {
      const response = await fetch(`/api/hafalan/partial/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update partial hafalan");
      }

      const updated = await response.json();
      setPartials((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    []
  );

  const deletePartial = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/hafalan/partial/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete partial hafalan");
    }

    setPartials((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const completePartial = useCallback(
    async (id: string): Promise<PartialHafalan> => {
      return updatePartial(id, { status: "COMPLETED" });
    },
    [updatePartial]
  );

  const getActivePartialsForKaca = useCallback(
    (targetKacaId: string): PartialHafalan[] => {
      return partials.filter(
        (p) => p.kacaId === targetKacaId && p.status === "IN_PROGRESS"
      );
    },
    [partials]
  );

  const hasActivePartialForAyat = useCallback(
    (targetKacaId: string, ayatNumber: number): boolean => {
      return partials.some(
        (p) =>
          p.kacaId === targetKacaId &&
          p.ayatNumber === ayatNumber &&
          p.status === "IN_PROGRESS"
      );
    },
    [partials]
  );

  // Get active partial for specific ayat
  const getActivePartialForAyat = useCallback(
    (targetKacaId: string, ayatNumber: number): PartialHafalan | undefined => {
      return partials.find(
        (p) =>
          p.kacaId === targetKacaId &&
          p.ayatNumber === ayatNumber &&
          p.status === "IN_PROGRESS"
      );
    },
    [partials]
  );

  // Get the lowest ayat number that has active partial (for sequential lock)
  const getLowestActivePartialAyat = useCallback(
    (targetKacaId: string): number | null => {
      const activePartials = partials.filter(
        (p) => p.kacaId === targetKacaId && p.status === "IN_PROGRESS"
      );
      if (activePartials.length === 0) return null;
      return Math.min(...activePartials.map((p) => p.ayatNumber));
    },
    [partials]
  );

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && santriId) {
      fetchPartials();
    }
  }, [autoFetch, santriId, fetchPartials]);

  return {
    partials,
    isLoading,
    error,
    fetchPartials,
    createPartial,
    updatePartial,
    deletePartial,
    completePartial,
    getActivePartialsForKaca,
    hasActivePartialForAyat,
    getActivePartialForAyat,
    getLowestActivePartialAyat,
  };
}
