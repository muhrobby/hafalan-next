/**
 * Shared types for Santri components
 * Ensures consistency across Admin and Teacher views
 */

export interface Teacher {
  id: string;
  name: string | null;
  email: string;
}

export interface Santri {
  id: string;
  name: string | null;
  email: string;
  angkatan: number | null;
  isActive: boolean;
  teacher: Teacher | null;
}

export interface HafalanRecord {
  id: string;
  kacaId: number;
  status: string;
  nilai: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  recheckTeacher: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  kaca: {
    id: number;
    surahName: string;
    juz: number;
    pageNumber: number;
  };
}

export interface SantriDetail {
  id: string;
  name: string | null;
  email: string;
  angkatan: number | null;
  isActive: boolean;
  teacher: Teacher | null;
  hafalan: HafalanRecord[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  nextKaca: {
    id: number;
    surahName: string;
    juz: number;
    pageNumber: number;
  } | null;
}

// Props for SantriLookup component
export interface SantriLookupProps {
  /** Whether to show teacher filter (Admin only) */
  showTeacherFilter?: boolean;
  /** Whether user can perform input actions (Teacher only) */
  canInput?: boolean;
  /** Whether user can perform recheck actions (Teacher only) */
  canRecheck?: boolean;
  /** Current teacher ID (for teacher role) */
  currentTeacherId?: string;
  /** Title override */
  title?: string;
  /** Subtitle override */
  subtitle?: string;
}

// Chart data types for analytics
export interface MonthlyChartData {
  month: string;
  completed: number;
  inProgress: number;
}

export interface SurahProgressData {
  surah: string;
  completed: number;
  total: number;
}

export interface StatusDistributionData {
  status: string;
  count: number;
  color: string;
}
