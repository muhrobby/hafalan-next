/**
 * Index file untuk data halaman Al-Quran
 * Menggabungkan semua juz dari file terpisah
 */

import { KacaData, quranPagesJuz1to10 } from "./quran-pages-1";
import { quranPagesJuz11to20 } from "./quran-pages-2";
import { quranPagesJuz21to30 } from "./quran-pages-3";

// Export type
export type { KacaData };

// Export semua data halaman Al-Quran (604 halaman)
export const allQuranPages: KacaData[] = [
  ...quranPagesJuz1to10,
  ...quranPagesJuz11to20,
  ...quranPagesJuz21to30,
];

// Helper: Get pages by juz
export function getPagesByJuz(juz: number): KacaData[] {
  return allQuranPages.filter((page) => page.juz === juz);
}

// Helper: Get pages by surah number
export function getPagesBySurah(surahNumber: number): KacaData[] {
  return allQuranPages.filter((page) => page.surahNumber === surahNumber);
}

// Helper: Get unique page numbers (some pages appear in multiple entries)
export function getUniquePages(): KacaData[] {
  const seen = new Set<number>();
  return allQuranPages.filter((page) => {
    if (seen.has(page.pageNumber)) return false;
    seen.add(page.pageNumber);
    return true;
  });
}

// Statistics
export const quranStats = {
  totalPages: 604,
  totalJuz: 30,
  totalSurah: 114,
};
