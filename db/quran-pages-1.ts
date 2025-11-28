/**
 * Data Halaman Al-Quran - Bagian 1 (Juz 1-10, Halaman 1-208)
 * 
 * Berdasarkan Mushaf Madinah standar (604 halaman)
 * Setiap halaman berisi informasi: nomor halaman, surah, ayat awal-akhir, juz
 */

export interface KacaData {
  pageNumber: number;
  surahNumber: number;
  surahName: string;
  ayatStart: number;
  ayatEnd: number;
  juz: number;
  description?: string;
}

// Nama-nama Surah
const surahNames: Record<number, string> = {
  1: "Al-Fatihah",
  2: "Al-Baqarah",
  3: "Ali 'Imran",
  4: "An-Nisa",
  5: "Al-Ma'idah",
  6: "Al-An'am",
  7: "Al-A'raf",
  8: "Al-Anfal",
  9: "At-Taubah",
  10: "Yunus",
  11: "Hud",
  12: "Yusuf",
  13: "Ar-Ra'd",
  14: "Ibrahim",
  15: "Al-Hijr",
  16: "An-Nahl",
  17: "Al-Isra",
  18: "Al-Kahf",
  19: "Maryam",
  20: "Ta-Ha",
  21: "Al-Anbiya",
  22: "Al-Hajj",
  23: "Al-Mu'minun",
  24: "An-Nur",
  25: "Al-Furqan",
  26: "Asy-Syu'ara",
  27: "An-Naml",
  28: "Al-Qasas",
  29: "Al-'Ankabut",
  30: "Ar-Rum",
};

// Juz 1: Halaman 1-21 (Al-Fatihah 1 - Al-Baqarah 141)
export const juz1: KacaData[] = [
  { pageNumber: 1, surahNumber: 1, surahName: "Al-Fatihah", ayatStart: 1, ayatEnd: 7, juz: 1 },
  { pageNumber: 2, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 1, ayatEnd: 5, juz: 1 },
  { pageNumber: 3, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 6, ayatEnd: 16, juz: 1 },
  { pageNumber: 4, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 17, ayatEnd: 24, juz: 1 },
  { pageNumber: 5, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 25, ayatEnd: 30, juz: 1 },
  { pageNumber: 6, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 31, ayatEnd: 38, juz: 1 },
  { pageNumber: 7, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 39, ayatEnd: 48, juz: 1 },
  { pageNumber: 8, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 49, ayatEnd: 57, juz: 1 },
  { pageNumber: 9, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 58, ayatEnd: 62, juz: 1 },
  { pageNumber: 10, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 63, ayatEnd: 71, juz: 1 },
  { pageNumber: 11, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 72, ayatEnd: 78, juz: 1 },
  { pageNumber: 12, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 79, ayatEnd: 84, juz: 1 },
  { pageNumber: 13, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 85, ayatEnd: 89, juz: 1 },
  { pageNumber: 14, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 90, ayatEnd: 96, juz: 1 },
  { pageNumber: 15, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 97, ayatEnd: 105, juz: 1 },
  { pageNumber: 16, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 106, ayatEnd: 112, juz: 1 },
  { pageNumber: 17, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 113, ayatEnd: 120, juz: 1 },
  { pageNumber: 18, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 121, ayatEnd: 126, juz: 1 },
  { pageNumber: 19, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 127, ayatEnd: 133, juz: 1 },
  { pageNumber: 20, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 134, ayatEnd: 140, juz: 1 },
  { pageNumber: 21, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 141, ayatEnd: 141, juz: 1 },
];

// Juz 2: Halaman 22-41 (Al-Baqarah 142-252)
export const juz2: KacaData[] = [
  { pageNumber: 22, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 142, ayatEnd: 147, juz: 2 },
  { pageNumber: 23, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 148, ayatEnd: 153, juz: 2 },
  { pageNumber: 24, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 154, ayatEnd: 163, juz: 2 },
  { pageNumber: 25, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 164, ayatEnd: 170, juz: 2 },
  { pageNumber: 26, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 171, ayatEnd: 177, juz: 2 },
  { pageNumber: 27, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 178, ayatEnd: 182, juz: 2 },
  { pageNumber: 28, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 183, ayatEnd: 188, juz: 2 },
  { pageNumber: 29, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 189, ayatEnd: 196, juz: 2 },
  { pageNumber: 30, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 197, ayatEnd: 203, juz: 2 },
  { pageNumber: 31, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 204, ayatEnd: 211, juz: 2 },
  { pageNumber: 32, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 212, ayatEnd: 216, juz: 2 },
  { pageNumber: 33, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 217, ayatEnd: 221, juz: 2 },
  { pageNumber: 34, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 222, ayatEnd: 227, juz: 2 },
  { pageNumber: 35, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 228, ayatEnd: 232, juz: 2 },
  { pageNumber: 36, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 233, ayatEnd: 235, juz: 2 },
  { pageNumber: 37, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 236, ayatEnd: 239, juz: 2 },
  { pageNumber: 38, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 240, ayatEnd: 245, juz: 2 },
  { pageNumber: 39, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 246, ayatEnd: 249, juz: 2 },
  { pageNumber: 40, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 250, ayatEnd: 252, juz: 2 },
  { pageNumber: 41, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 253, ayatEnd: 253, juz: 2 },
];

// Juz 3: Halaman 42-62 (Al-Baqarah 253 - Ali 'Imran 92)
export const juz3: KacaData[] = [
  { pageNumber: 42, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 253, ayatEnd: 256, juz: 3 },
  { pageNumber: 43, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 257, ayatEnd: 260, juz: 3 },
  { pageNumber: 44, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 261, ayatEnd: 264, juz: 3 },
  { pageNumber: 45, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 265, ayatEnd: 269, juz: 3 },
  { pageNumber: 46, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 270, ayatEnd: 274, juz: 3 },
  { pageNumber: 47, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 275, ayatEnd: 280, juz: 3 },
  { pageNumber: 48, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 281, ayatEnd: 283, juz: 3 },
  { pageNumber: 49, surahNumber: 2, surahName: "Al-Baqarah", ayatStart: 284, ayatEnd: 286, juz: 3 },
  { pageNumber: 50, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 1, ayatEnd: 9, juz: 3 },
  { pageNumber: 51, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 10, ayatEnd: 15, juz: 3 },
  { pageNumber: 52, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 16, ayatEnd: 22, juz: 3 },
  { pageNumber: 53, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 23, ayatEnd: 30, juz: 3 },
  { pageNumber: 54, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 31, ayatEnd: 38, juz: 3 },
  { pageNumber: 55, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 39, ayatEnd: 45, juz: 3 },
  { pageNumber: 56, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 46, ayatEnd: 53, juz: 3 },
  { pageNumber: 57, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 54, ayatEnd: 62, juz: 3 },
  { pageNumber: 58, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 63, ayatEnd: 71, juz: 3 },
  { pageNumber: 59, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 72, ayatEnd: 79, juz: 3 },
  { pageNumber: 60, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 80, ayatEnd: 85, juz: 3 },
  { pageNumber: 61, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 86, ayatEnd: 92, juz: 3 },
  { pageNumber: 62, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 93, ayatEnd: 93, juz: 3 },
];

// Juz 4: Halaman 62-81 (Ali 'Imran 93 - An-Nisa 23)
export const juz4: KacaData[] = [
  { pageNumber: 62, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 93, ayatEnd: 101, juz: 4 },
  { pageNumber: 63, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 102, ayatEnd: 109, juz: 4 },
  { pageNumber: 64, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 110, ayatEnd: 115, juz: 4 },
  { pageNumber: 65, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 116, ayatEnd: 122, juz: 4 },
  { pageNumber: 66, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 123, ayatEnd: 132, juz: 4 },
  { pageNumber: 67, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 133, ayatEnd: 141, juz: 4 },
  { pageNumber: 68, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 142, ayatEnd: 148, juz: 4 },
  { pageNumber: 69, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 149, ayatEnd: 154, juz: 4 },
  { pageNumber: 70, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 155, ayatEnd: 163, juz: 4 },
  { pageNumber: 71, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 164, ayatEnd: 171, juz: 4 },
  { pageNumber: 72, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 172, ayatEnd: 180, juz: 4 },
  { pageNumber: 73, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 181, ayatEnd: 187, juz: 4 },
  { pageNumber: 74, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 188, ayatEnd: 195, juz: 4 },
  { pageNumber: 75, surahNumber: 3, surahName: "Ali 'Imran", ayatStart: 196, ayatEnd: 200, juz: 4 },
  { pageNumber: 76, surahNumber: 4, surahName: "An-Nisa", ayatStart: 1, ayatEnd: 6, juz: 4 },
  { pageNumber: 77, surahNumber: 4, surahName: "An-Nisa", ayatStart: 7, ayatEnd: 11, juz: 4 },
  { pageNumber: 78, surahNumber: 4, surahName: "An-Nisa", ayatStart: 12, ayatEnd: 14, juz: 4 },
  { pageNumber: 79, surahNumber: 4, surahName: "An-Nisa", ayatStart: 15, ayatEnd: 19, juz: 4 },
  { pageNumber: 80, surahNumber: 4, surahName: "An-Nisa", ayatStart: 20, ayatEnd: 23, juz: 4 },
  { pageNumber: 81, surahNumber: 4, surahName: "An-Nisa", ayatStart: 24, ayatEnd: 24, juz: 4 },
];

// Juz 5: Halaman 82-101 (An-Nisa 24-147)
export const juz5: KacaData[] = [
  { pageNumber: 82, surahNumber: 4, surahName: "An-Nisa", ayatStart: 24, ayatEnd: 28, juz: 5 },
  { pageNumber: 83, surahNumber: 4, surahName: "An-Nisa", ayatStart: 29, ayatEnd: 33, juz: 5 },
  { pageNumber: 84, surahNumber: 4, surahName: "An-Nisa", ayatStart: 34, ayatEnd: 38, juz: 5 },
  { pageNumber: 85, surahNumber: 4, surahName: "An-Nisa", ayatStart: 39, ayatEnd: 45, juz: 5 },
  { pageNumber: 86, surahNumber: 4, surahName: "An-Nisa", ayatStart: 46, ayatEnd: 52, juz: 5 },
  { pageNumber: 87, surahNumber: 4, surahName: "An-Nisa", ayatStart: 53, ayatEnd: 59, juz: 5 },
  { pageNumber: 88, surahNumber: 4, surahName: "An-Nisa", ayatStart: 60, ayatEnd: 65, juz: 5 },
  { pageNumber: 89, surahNumber: 4, surahName: "An-Nisa", ayatStart: 66, ayatEnd: 74, juz: 5 },
  { pageNumber: 90, surahNumber: 4, surahName: "An-Nisa", ayatStart: 75, ayatEnd: 80, juz: 5 },
  { pageNumber: 91, surahNumber: 4, surahName: "An-Nisa", ayatStart: 81, ayatEnd: 87, juz: 5 },
  { pageNumber: 92, surahNumber: 4, surahName: "An-Nisa", ayatStart: 88, ayatEnd: 92, juz: 5 },
  { pageNumber: 93, surahNumber: 4, surahName: "An-Nisa", ayatStart: 93, ayatEnd: 95, juz: 5 },
  { pageNumber: 94, surahNumber: 4, surahName: "An-Nisa", ayatStart: 96, ayatEnd: 101, juz: 5 },
  { pageNumber: 95, surahNumber: 4, surahName: "An-Nisa", ayatStart: 102, ayatEnd: 106, juz: 5 },
  { pageNumber: 96, surahNumber: 4, surahName: "An-Nisa", ayatStart: 107, ayatEnd: 114, juz: 5 },
  { pageNumber: 97, surahNumber: 4, surahName: "An-Nisa", ayatStart: 115, ayatEnd: 121, juz: 5 },
  { pageNumber: 98, surahNumber: 4, surahName: "An-Nisa", ayatStart: 122, ayatEnd: 128, juz: 5 },
  { pageNumber: 99, surahNumber: 4, surahName: "An-Nisa", ayatStart: 129, ayatEnd: 135, juz: 5 },
  { pageNumber: 100, surahNumber: 4, surahName: "An-Nisa", ayatStart: 136, ayatEnd: 141, juz: 5 },
  { pageNumber: 101, surahNumber: 4, surahName: "An-Nisa", ayatStart: 142, ayatEnd: 147, juz: 5 },
];

// Juz 6: Halaman 102-121 (An-Nisa 148 - Al-Ma'idah 81)
export const juz6: KacaData[] = [
  { pageNumber: 102, surahNumber: 4, surahName: "An-Nisa", ayatStart: 148, ayatEnd: 154, juz: 6 },
  { pageNumber: 103, surahNumber: 4, surahName: "An-Nisa", ayatStart: 155, ayatEnd: 162, juz: 6 },
  { pageNumber: 104, surahNumber: 4, surahName: "An-Nisa", ayatStart: 163, ayatEnd: 170, juz: 6 },
  { pageNumber: 105, surahNumber: 4, surahName: "An-Nisa", ayatStart: 171, ayatEnd: 176, juz: 6 },
  { pageNumber: 106, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 1, ayatEnd: 3, juz: 6 },
  { pageNumber: 107, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 4, ayatEnd: 6, juz: 6 },
  { pageNumber: 108, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 7, ayatEnd: 11, juz: 6 },
  { pageNumber: 109, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 12, ayatEnd: 15, juz: 6 },
  { pageNumber: 110, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 16, ayatEnd: 20, juz: 6 },
  { pageNumber: 111, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 21, ayatEnd: 26, juz: 6 },
  { pageNumber: 112, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 27, ayatEnd: 32, juz: 6 },
  { pageNumber: 113, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 33, ayatEnd: 37, juz: 6 },
  { pageNumber: 114, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 38, ayatEnd: 43, juz: 6 },
  { pageNumber: 115, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 44, ayatEnd: 48, juz: 6 },
  { pageNumber: 116, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 49, ayatEnd: 53, juz: 6 },
  { pageNumber: 117, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 54, ayatEnd: 59, juz: 6 },
  { pageNumber: 118, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 60, ayatEnd: 66, juz: 6 },
  { pageNumber: 119, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 67, ayatEnd: 72, juz: 6 },
  { pageNumber: 120, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 73, ayatEnd: 78, juz: 6 },
  { pageNumber: 121, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 79, ayatEnd: 82, juz: 6 },
];

// Juz 7: Halaman 122-141 (Al-Ma'idah 82 - Al-An'am 110)
export const juz7: KacaData[] = [
  { pageNumber: 122, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 82, ayatEnd: 89, juz: 7 },
  { pageNumber: 123, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 90, ayatEnd: 95, juz: 7 },
  { pageNumber: 124, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 96, ayatEnd: 100, juz: 7 },
  { pageNumber: 125, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 101, ayatEnd: 106, juz: 7 },
  { pageNumber: 126, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 107, ayatEnd: 114, juz: 7 },
  { pageNumber: 127, surahNumber: 5, surahName: "Al-Ma'idah", ayatStart: 115, ayatEnd: 120, juz: 7 },
  { pageNumber: 128, surahNumber: 6, surahName: "Al-An'am", ayatStart: 1, ayatEnd: 9, juz: 7 },
  { pageNumber: 129, surahNumber: 6, surahName: "Al-An'am", ayatStart: 10, ayatEnd: 18, juz: 7 },
  { pageNumber: 130, surahNumber: 6, surahName: "Al-An'am", ayatStart: 19, ayatEnd: 28, juz: 7 },
  { pageNumber: 131, surahNumber: 6, surahName: "Al-An'am", ayatStart: 29, ayatEnd: 37, juz: 7 },
  { pageNumber: 132, surahNumber: 6, surahName: "Al-An'am", ayatStart: 38, ayatEnd: 44, juz: 7 },
  { pageNumber: 133, surahNumber: 6, surahName: "Al-An'am", ayatStart: 45, ayatEnd: 53, juz: 7 },
  { pageNumber: 134, surahNumber: 6, surahName: "Al-An'am", ayatStart: 54, ayatEnd: 60, juz: 7 },
  { pageNumber: 135, surahNumber: 6, surahName: "Al-An'am", ayatStart: 61, ayatEnd: 70, juz: 7 },
  { pageNumber: 136, surahNumber: 6, surahName: "Al-An'am", ayatStart: 71, ayatEnd: 79, juz: 7 },
  { pageNumber: 137, surahNumber: 6, surahName: "Al-An'am", ayatStart: 80, ayatEnd: 90, juz: 7 },
  { pageNumber: 138, surahNumber: 6, surahName: "Al-An'am", ayatStart: 91, ayatEnd: 95, juz: 7 },
  { pageNumber: 139, surahNumber: 6, surahName: "Al-An'am", ayatStart: 96, ayatEnd: 101, juz: 7 },
  { pageNumber: 140, surahNumber: 6, surahName: "Al-An'am", ayatStart: 102, ayatEnd: 110, juz: 7 },
  { pageNumber: 141, surahNumber: 6, surahName: "Al-An'am", ayatStart: 111, ayatEnd: 111, juz: 7 },
];

// Juz 8: Halaman 142-161 (Al-An'am 111 - Al-A'raf 87)
export const juz8: KacaData[] = [
  { pageNumber: 142, surahNumber: 6, surahName: "Al-An'am", ayatStart: 111, ayatEnd: 119, juz: 8 },
  { pageNumber: 143, surahNumber: 6, surahName: "Al-An'am", ayatStart: 120, ayatEnd: 126, juz: 8 },
  { pageNumber: 144, surahNumber: 6, surahName: "Al-An'am", ayatStart: 127, ayatEnd: 135, juz: 8 },
  { pageNumber: 145, surahNumber: 6, surahName: "Al-An'am", ayatStart: 136, ayatEnd: 142, juz: 8 },
  { pageNumber: 146, surahNumber: 6, surahName: "Al-An'am", ayatStart: 143, ayatEnd: 147, juz: 8 },
  { pageNumber: 147, surahNumber: 6, surahName: "Al-An'am", ayatStart: 148, ayatEnd: 154, juz: 8 },
  { pageNumber: 148, surahNumber: 6, surahName: "Al-An'am", ayatStart: 155, ayatEnd: 160, juz: 8 },
  { pageNumber: 149, surahNumber: 6, surahName: "Al-An'am", ayatStart: 161, ayatEnd: 165, juz: 8 },
  { pageNumber: 150, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 1, ayatEnd: 11, juz: 8 },
  { pageNumber: 151, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 12, ayatEnd: 23, juz: 8 },
  { pageNumber: 152, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 24, ayatEnd: 31, juz: 8 },
  { pageNumber: 153, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 32, ayatEnd: 39, juz: 8 },
  { pageNumber: 154, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 40, ayatEnd: 47, juz: 8 },
  { pageNumber: 155, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 48, ayatEnd: 54, juz: 8 },
  { pageNumber: 156, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 55, ayatEnd: 64, juz: 8 },
  { pageNumber: 157, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 65, ayatEnd: 72, juz: 8 },
  { pageNumber: 158, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 73, ayatEnd: 79, juz: 8 },
  { pageNumber: 159, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 80, ayatEnd: 84, juz: 8 },
  { pageNumber: 160, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 85, ayatEnd: 87, juz: 8 },
  { pageNumber: 161, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 88, ayatEnd: 88, juz: 8 },
];

// Juz 9: Halaman 162-181 (Al-A'raf 88 - Al-Anfal 40)
export const juz9: KacaData[] = [
  { pageNumber: 162, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 88, ayatEnd: 96, juz: 9 },
  { pageNumber: 163, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 97, ayatEnd: 105, juz: 9 },
  { pageNumber: 164, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 106, ayatEnd: 121, juz: 9 },
  { pageNumber: 165, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 122, ayatEnd: 131, juz: 9 },
  { pageNumber: 166, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 132, ayatEnd: 141, juz: 9 },
  { pageNumber: 167, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 142, ayatEnd: 149, juz: 9 },
  { pageNumber: 168, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 150, ayatEnd: 156, juz: 9 },
  { pageNumber: 169, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 157, ayatEnd: 163, juz: 9 },
  { pageNumber: 170, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 164, ayatEnd: 171, juz: 9 },
  { pageNumber: 171, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 172, ayatEnd: 179, juz: 9 },
  { pageNumber: 172, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 180, ayatEnd: 187, juz: 9 },
  { pageNumber: 173, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 188, ayatEnd: 195, juz: 9 },
  { pageNumber: 174, surahNumber: 7, surahName: "Al-A'raf", ayatStart: 196, ayatEnd: 206, juz: 9 },
  { pageNumber: 175, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 1, ayatEnd: 9, juz: 9 },
  { pageNumber: 176, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 10, ayatEnd: 18, juz: 9 },
  { pageNumber: 177, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 19, ayatEnd: 28, juz: 9 },
  { pageNumber: 178, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 29, ayatEnd: 37, juz: 9 },
  { pageNumber: 179, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 38, ayatEnd: 40, juz: 9 },
  { pageNumber: 180, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 41, ayatEnd: 41, juz: 9 },
  { pageNumber: 181, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 42, ayatEnd: 42, juz: 9 },
];

// Juz 10: Halaman 182-201 (Al-Anfal 41 - At-Taubah 92)
export const juz10: KacaData[] = [
  { pageNumber: 182, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 41, ayatEnd: 48, juz: 10 },
  { pageNumber: 183, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 49, ayatEnd: 57, juz: 10 },
  { pageNumber: 184, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 58, ayatEnd: 66, juz: 10 },
  { pageNumber: 185, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 67, ayatEnd: 74, juz: 10 },
  { pageNumber: 186, surahNumber: 8, surahName: "Al-Anfal", ayatStart: 75, ayatEnd: 75, juz: 10 },
  { pageNumber: 187, surahNumber: 9, surahName: "At-Taubah", ayatStart: 1, ayatEnd: 8, juz: 10 },
  { pageNumber: 188, surahNumber: 9, surahName: "At-Taubah", ayatStart: 9, ayatEnd: 15, juz: 10 },
  { pageNumber: 189, surahNumber: 9, surahName: "At-Taubah", ayatStart: 16, ayatEnd: 22, juz: 10 },
  { pageNumber: 190, surahNumber: 9, surahName: "At-Taubah", ayatStart: 23, ayatEnd: 29, juz: 10 },
  { pageNumber: 191, surahNumber: 9, surahName: "At-Taubah", ayatStart: 30, ayatEnd: 34, juz: 10 },
  { pageNumber: 192, surahNumber: 9, surahName: "At-Taubah", ayatStart: 35, ayatEnd: 40, juz: 10 },
  { pageNumber: 193, surahNumber: 9, surahName: "At-Taubah", ayatStart: 41, ayatEnd: 48, juz: 10 },
  { pageNumber: 194, surahNumber: 9, surahName: "At-Taubah", ayatStart: 49, ayatEnd: 57, juz: 10 },
  { pageNumber: 195, surahNumber: 9, surahName: "At-Taubah", ayatStart: 58, ayatEnd: 65, juz: 10 },
  { pageNumber: 196, surahNumber: 9, surahName: "At-Taubah", ayatStart: 66, ayatEnd: 72, juz: 10 },
  { pageNumber: 197, surahNumber: 9, surahName: "At-Taubah", ayatStart: 73, ayatEnd: 79, juz: 10 },
  { pageNumber: 198, surahNumber: 9, surahName: "At-Taubah", ayatStart: 80, ayatEnd: 86, juz: 10 },
  { pageNumber: 199, surahNumber: 9, surahName: "At-Taubah", ayatStart: 87, ayatEnd: 92, juz: 10 },
  { pageNumber: 200, surahNumber: 9, surahName: "At-Taubah", ayatStart: 93, ayatEnd: 93, juz: 10 },
  { pageNumber: 201, surahNumber: 9, surahName: "At-Taubah", ayatStart: 94, ayatEnd: 94, juz: 10 },
];

// Export semua juz 1-10
export const quranPagesJuz1to10: KacaData[] = [
  ...juz1,
  ...juz2,
  ...juz3,
  ...juz4,
  ...juz5,
  ...juz6,
  ...juz7,
  ...juz8,
  ...juz9,
  ...juz10,
];
