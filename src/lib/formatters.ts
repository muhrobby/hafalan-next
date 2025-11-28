/**
 * Unified Date & Number Formatters
 *
 * File ini berisi semua fungsi formatting yang digunakan secara konsisten
 * di seluruh aplikasi untuk memastikan tampilan data yang seragam.
 */

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { id } from "date-fns/locale";

// ============================================
// DATE FORMATTERS
// ============================================

/**
 * Parse tanggal dari berbagai format ke Date object
 */
export const parseDate = (
  date: Date | string | null | undefined
): Date | null => {
  if (!date) return null;

  const parsed = typeof date === "string" ? parseISO(date) : date;
  return isValid(parsed) ? parsed : null;
};

/**
 * Format tanggal lengkap: "28 November 2025"
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, "d MMMM yyyy", { locale: id });
};

/**
 * Format tanggal pendek: "28 Nov 2025"
 */
export const formatDateShort = (
  date: Date | string | null | undefined
): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, "d MMM yyyy", { locale: id });
};

/**
 * Format tanggal + waktu: "28 Nov 2025, 14:30"
 */
export const formatDateTime = (
  date: Date | string | null | undefined
): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, "d MMM yyyy, HH:mm", { locale: id });
};

/**
 * Format waktu relatif: "5 menit yang lalu", "2 hari yang lalu"
 */
export const formatRelative = (
  date: Date | string | null | undefined
): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return formatDistanceToNow(parsed, { addSuffix: true, locale: id });
};

/**
 * Format untuk chart label bulan: "Nov '25"
 */
export const formatMonthYear = (
  date: Date | string | null | undefined
): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, "MMM ''yy", { locale: id });
};

/**
 * Format untuk chart label hari: "28 Nov"
 */
export const formatDayMonth = (
  date: Date | string | null | undefined
): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, "d MMM", { locale: id });
};

/**
 * Format untuk periode: "Nov 2025"
 */
export const formatPeriod = (
  date: Date | string | null | undefined
): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, "MMMM yyyy", { locale: id });
};

/**
 * Format hari dalam seminggu: "Senin", "Selasa", dst
 */
export const formatDayName = (
  date: Date | string | null | undefined
): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, "EEEE", { locale: id });
};

/**
 * Format hari singkat: "Sen", "Sel", dst
 */
export const formatDayNameShort = (
  date: Date | string | null | undefined
): string => {
  const parsed = parseDate(date);
  if (!parsed) return "-";
  return format(parsed, "EEE", { locale: id });
};

// ============================================
// NUMBER FORMATTERS
// ============================================

/**
 * Format angka dengan separator ribuan: "1.234.567"
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
};

/**
 * Format persentase: "85,5%"
 */
export const formatPercent = (
  num: number | null | undefined,
  decimals = 0
): string => {
  if (num === null || num === undefined) return "0%";
  return `${num.toFixed(decimals).replace(".", ",")}%`;
};

/**
 * Format nilai dengan satuan singkat: "1.2K", "3.5M"
 */
export const formatCompact = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "0";

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(".", ",")}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(".", ",")}K`;
  }
  return num.toString();
};

/**
 * Hitung persentase dengan safety check
 */
export const calculatePercent = (value: number, total: number): number => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// ============================================
// QURAN SPECIFIC FORMATTERS
// ============================================

/**
 * Format informasi kaca: "Al-Baqarah (Hal. 5)"
 */
export const formatKacaInfo = (
  surahName: string,
  pageNumber: number
): string => {
  return `${surahName} (Hal. ${pageNumber})`;
};

/**
 * Format juz: "Juz 1" atau "Juz 30"
 */
export const formatJuz = (juzNumber: number | null | undefined): string => {
  if (!juzNumber) return "-";
  return `Juz ${juzNumber}`;
};

/**
 * Format rentang ayat: "Ayat 1-10"
 */
export const formatAyatRange = (start: number, end: number): string => {
  return `Ayat ${start}-${end}`;
};

/**
 * Format progress hafalan: "5/10 ayat"
 */
export const formatProgress = (completed: number, total: number): string => {
  return `${completed}/${total} ayat`;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Pluralize kata dalam Bahasa Indonesia
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string
): string => {
  // Bahasa Indonesia umumnya tidak memiliki plural berbeda
  // Tapi bisa digunakan untuk kasus khusus
  return `${count} ${plural && count > 1 ? plural : singular}`;
};

/**
 * Format nama (capitalize first letter of each word)
 */
export const formatName = (name: string | null | undefined): string => {
  if (!name) return "-";
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Truncate text dengan ellipsis
 */
export const truncate = (
  text: string | null | undefined,
  maxLength: number
): string => {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};
