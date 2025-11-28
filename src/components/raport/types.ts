/**
 * Raport Types
 *
 * Type definitions untuk komponen raport yang unified
 */

import type { UserRole } from "@/lib/status-config";

export interface HafalanRecord {
  id: string;
  santriId: string;
  santriName: string;
  kacaInfo: string;
  juzNumber: number;
  pageNumber: number;
  surahName: string;
  status: string;
  tanggalSetor: string;
  completedVerses: number;
  totalVerses: number;
  teacherName?: string;
  catatan?: string;
  history?: HafalanHistory[];
  recheckRecords?: RecheckRecord[];
}

export interface HafalanHistory {
  teacherName: string;
  date: string;
  catatan?: string;
  completedVerses?: string;
}

export interface RecheckRecord {
  recheckedBy: string;
  recheckedByName: string;
  recheckDate: string;
  allPassed: boolean;
  failedAyats?: number[];
  catatan?: string;
}

export interface SantriInfo {
  id: string;
  name: string;
  nis: string;
  kelas?: string;
  teachers?: TeacherInfo[];
  wali?: WaliInfo;
}

export interface TeacherInfo {
  id: string;
  name: string;
  nip?: string;
}

export interface WaliInfo {
  id: string;
  name: string;
  phone?: string;
}

export interface RaportSummary {
  totalKaca: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheck: number;
  successRate: number;
  averagePerWeek: number;
  lastActivity?: string;
}

export interface RaportChartData {
  monthlyProgress: {
    label: string;
    completed: number;
    inProgress: number;
  }[];
  statusDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  surahProgress: {
    surahName: string;
    completedAyats: number;
    totalAyats: number;
    percentage: number;
  }[];
  juzProgress: {
    juz: number;
    completed: number;
    total: number;
    percentage: number;
  }[];
}

export interface RaportFilterState {
  santriId: string;
  timeRange: string;
  dateRangeType: "preset" | "custom";
  startDate?: Date;
  endDate?: Date;
  chartGranularity: "day" | "week" | "month";
}

export interface RaportViewProps {
  role: UserRole;
  santriId?: string;
  santriList?: SantriInfo[];
  records: HafalanRecord[];
  summary: RaportSummary;
  chartData: RaportChartData;
  loading?: boolean;

  // Filter state
  filters: RaportFilterState;
  onFiltersChange: (filters: Partial<RaportFilterState>) => void;

  // Actions (role-based)
  onPrint?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onEdit?: (record: HafalanRecord) => void;
  onDelete?: (record: HafalanRecord) => void;
  onInputHafalan?: () => void;
  onRecheck?: (record: HafalanRecord) => void;
}

export interface RaportActionsProps {
  role: UserRole;
  onPrint?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

export interface RaportTableProps {
  role: UserRole;
  records: HafalanRecord[];
  loading?: boolean;
  onView?: (record: HafalanRecord) => void;
  onEdit?: (record: HafalanRecord) => void;
  onDelete?: (record: HafalanRecord) => void;
  onRecheck?: (record: HafalanRecord) => void;
}

export interface RaportStatsProps {
  summary: RaportSummary;
  loading?: boolean;
}

export interface RaportChartsProps {
  data: RaportChartData;
  loading?: boolean;
}
