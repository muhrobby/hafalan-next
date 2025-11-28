"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Kaca {
  id: string;
  pageNumber: number;
  surahName: string;
  surahNumber: number;
  ayatStart: number;
  ayatEnd: number;
  juz: number;
}

// Client-side cache for kaca data
let globalKacaCache: {
  data: Kaca[] | null;
  timestamp: number;
  ttl: number;
} = {
  data: null,
  timestamp: 0,
  ttl: 30 * 60 * 1000, // 30 minutes client cache
};

interface UseKacaDataOptions {
  juz?: number;
  surah?: number;
  search?: string;
  enabled?: boolean;
}

interface UseKacaDataReturn {
  kacas: Kaca[];
  filteredKacas: Kaca[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getKacaById: (id: string) => Kaca | undefined;
  getKacaByPage: (pageNumber: number) => Kaca | undefined;
  getKacasByJuz: (juz: number) => Kaca[];
  getNextKaca: (currentPageNumber: number) => Kaca | undefined;
  getPrevKaca: (currentPageNumber: number) => Kaca | undefined;
}

/**
 * Hook for efficiently fetching and caching kaca data
 * Fetches all 604 kaca once and caches them for reuse
 */
export function useKacaData(
  options: UseKacaDataOptions = {}
): UseKacaDataReturn {
  const { juz, surah, search, enabled = true } = options;

  const [kacas, setKacas] = useState<Kaca[]>(globalKacaCache.data || []);
  const [isLoading, setIsLoading] = useState(!globalKacaCache.data);
  const [error, setError] = useState<string | null>(null);

  const fetchKaca = useCallback(async () => {
    // Check if cache is still valid
    const now = Date.now();
    if (
      globalKacaCache.data &&
      now - globalKacaCache.timestamp < globalKacaCache.ttl
    ) {
      setKacas(globalKacaCache.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/kaca?all=true");

      // Handle unauthorized - user not logged in yet
      if (response.status === 401) {
        // Don't show error, just return empty - user will login first
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch kaca data");
      }

      const data = await response.json();
      const sortedKacas = (data.data || []).sort(
        (a: Kaca, b: Kaca) => a.pageNumber - b.pageNumber
      );

      // Update global cache
      globalKacaCache = {
        data: sortedKacas,
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000,
      };

      setKacas(sortedKacas);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching kaca:", err);
      setError(err.message || "Gagal memuat data kaca");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchKaca();
    }
  }, [enabled, fetchKaca]);

  // Memoized filtered kacas based on options
  const filteredKacas = useMemo(() => {
    let result = kacas;

    if (juz) {
      result = result.filter((k) => k.juz === juz);
    }

    if (surah) {
      result = result.filter((k) => k.surahNumber === surah);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((k) =>
        k.surahName.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [kacas, juz, surah, search]);

  // Utility functions
  const getKacaById = useCallback(
    (id: string) => kacas.find((k) => k.id === id),
    [kacas]
  );

  const getKacaByPage = useCallback(
    (pageNumber: number) => kacas.find((k) => k.pageNumber === pageNumber),
    [kacas]
  );

  const getKacasByJuz = useCallback(
    (targetJuz: number) => kacas.filter((k) => k.juz === targetJuz),
    [kacas]
  );

  const getNextKaca = useCallback(
    (currentPageNumber: number) => {
      const currentIndex = kacas.findIndex(
        (k) => k.pageNumber === currentPageNumber
      );
      if (currentIndex === -1 || currentIndex >= kacas.length - 1)
        return undefined;
      return kacas[currentIndex + 1];
    },
    [kacas]
  );

  const getPrevKaca = useCallback(
    (currentPageNumber: number) => {
      const currentIndex = kacas.findIndex(
        (k) => k.pageNumber === currentPageNumber
      );
      if (currentIndex <= 0) return undefined;
      return kacas[currentIndex - 1];
    },
    [kacas]
  );

  return {
    kacas,
    filteredKacas,
    isLoading,
    error,
    refetch: fetchKaca,
    getKacaById,
    getKacaByPage,
    getKacasByJuz,
    getNextKaca,
    getPrevKaca,
  };
}

/**
 * Get juz list (1-30) with page ranges
 */
export function useJuzList() {
  const { kacas, isLoading } = useKacaData();

  const juzList = useMemo(() => {
    if (kacas.length === 0) return [];

    const juzMap = new Map<
      number,
      { start: number; end: number; count: number }
    >();

    kacas.forEach((kaca) => {
      const existing = juzMap.get(kaca.juz);
      if (existing) {
        existing.start = Math.min(existing.start, kaca.pageNumber);
        existing.end = Math.max(existing.end, kaca.pageNumber);
        existing.count += 1;
      } else {
        juzMap.set(kaca.juz, {
          start: kaca.pageNumber,
          end: kaca.pageNumber,
          count: 1,
        });
      }
    });

    return Array.from(juzMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([juz, data]) => ({
        juz,
        startPage: data.start,
        endPage: data.end,
        pageCount: data.count,
        label: `Juz ${juz} (Hal ${data.start}-${data.end})`,
      }));
  }, [kacas]);

  return { juzList, isLoading };
}

/**
 * Invalidate kaca cache (call after admin updates kaca data)
 */
export function invalidateKacaCache() {
  globalKacaCache = {
    data: null,
    timestamp: 0,
    ttl: 30 * 60 * 1000,
  };
}
