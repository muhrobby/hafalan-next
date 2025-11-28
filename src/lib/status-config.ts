/**
 * Unified Status Configuration
 *
 * File ini berisi konfigurasi status hafalan yang konsisten
 * untuk digunakan di seluruh aplikasi.
 */

import {
  Clock,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================
// HAFALAN STATUS TYPES
// ============================================

export type HafalanStatus =
  | "PROGRESS"
  | "COMPLETE_WAITING_RECHECK"
  | "RECHECK_PASSED"
  | "RECHECK_FAILED";

export type UserRole = "ADMIN" | "TEACHER" | "WALI" | "SANTRI";

// ============================================
// STATUS CONFIGURATION
// ============================================

export interface StatusConfig {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  chartColor: string;
  icon: LucideIcon;
  order: number;
}

export const hafalanStatusConfig: Record<HafalanStatus, StatusConfig> = {
  PROGRESS: {
    label: "Sedang Hafalan",
    shortLabel: "Progress",
    description: "Santri sedang dalam proses menghafal kaca ini",
    color: "blue",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    chartColor: "#3b82f6",
    icon: Clock,
    order: 1,
  },
  COMPLETE_WAITING_RECHECK: {
    label: "Menunggu Recheck",
    shortLabel: "Tunggu Recheck",
    description: "Hafalan sudah selesai, menunggu recheck dari guru",
    color: "amber",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    chartColor: "#f59e0b",
    icon: AlertCircle,
    order: 2,
  },
  RECHECK_PASSED: {
    label: "Lulus Recheck",
    shortLabel: "Selesai",
    description: "Hafalan telah lulus recheck dan selesai",
    color: "green",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    chartColor: "#10b981",
    icon: CheckCircle2,
    order: 3,
  },
  RECHECK_FAILED: {
    label: "Perlu Perbaikan",
    shortLabel: "Gagal",
    description: "Hafalan belum lulus recheck, perlu perbaikan",
    color: "red",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    chartColor: "#ef4444",
    icon: XCircle,
    order: 4,
  },
};

// ============================================
// STATUS HELPER FUNCTIONS
// ============================================

/**
 * Get status configuration by status key
 * Handles undefined/null status gracefully
 */
export const getStatusConfig = (
  status: string | undefined | null
): StatusConfig => {
  if (!status) {
    return {
      label: "Unknown",
      shortLabel: "?",
      description: "Status tidak tersedia",
      color: "gray",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
      textColor: "text-gray-800",
      chartColor: "#6b7280",
      icon: HelpCircle,
      order: 99,
    };
  }

  const normalizedStatus = status.toUpperCase() as HafalanStatus;
  return (
    hafalanStatusConfig[normalizedStatus] || {
      label: status,
      shortLabel: status,
      description: "Status tidak dikenal",
      color: "gray",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
      textColor: "text-gray-800",
      chartColor: "#6b7280",
      icon: HelpCircle,
      order: 99,
    }
  );
};

/**
 * Get badge class string for a status
 */
export const getStatusBadgeClass = (status: string): string => {
  const config = getStatusConfig(status);
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
};

/**
 * Get chart colors for all statuses
 */
export const getChartColors = (): string[] => {
  return Object.values(hafalanStatusConfig)
    .sort((a, b) => a.order - b.order)
    .map((config) => config.chartColor);
};

/**
 * Get status for pie chart data
 */
export const getStatusChartData = (counts: Record<string, number>) => {
  return Object.entries(counts)
    .map(([status, count]) => {
      const config = getStatusConfig(status);
      return {
        name: config.shortLabel,
        value: count,
        color: config.chartColor,
        status,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => {
      const configA = getStatusConfig(a.status);
      const configB = getStatusConfig(b.status);
      return configA.order - configB.order;
    });
};

// ============================================
// ROLE CONFIGURATION
// ============================================

export interface RoleConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  permissions: {
    canViewAllSantri: boolean;
    canEditHafalan: boolean;
    canDeleteHafalan: boolean;
    canInputHafalan: boolean;
    canRecheckHafalan: boolean;
    canExportPDF: boolean;
    canExportExcel: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
  };
}

export const roleConfig: Record<UserRole, RoleConfig> = {
  ADMIN: {
    label: "Administrator",
    description: "Akses penuh ke seluruh sistem",
    color: "purple",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    permissions: {
      canViewAllSantri: true,
      canEditHafalan: true,
      canDeleteHafalan: true,
      canInputHafalan: false,
      canRecheckHafalan: false,
      canExportPDF: true,
      canExportExcel: true,
      canViewAnalytics: true,
      canManageUsers: true,
    },
  },
  TEACHER: {
    label: "Guru",
    description: "Mengelola hafalan santri yang diampu",
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    permissions: {
      canViewAllSantri: false,
      canEditHafalan: true,
      canDeleteHafalan: false,
      canInputHafalan: true,
      canRecheckHafalan: true,
      canExportPDF: true,
      canExportExcel: true,
      canViewAnalytics: true,
      canManageUsers: false,
    },
  },
  WALI: {
    label: "Wali",
    description: "Memantau progress hafalan anak",
    color: "amber",
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
    permissions: {
      canViewAllSantri: false,
      canEditHafalan: false,
      canDeleteHafalan: false,
      canInputHafalan: false,
      canRecheckHafalan: false,
      canExportPDF: true,
      canExportExcel: false,
      canViewAnalytics: true,
      canManageUsers: false,
    },
  },
  SANTRI: {
    label: "Santri",
    description: "Melihat progress hafalan sendiri",
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    permissions: {
      canViewAllSantri: false,
      canEditHafalan: false,
      canDeleteHafalan: false,
      canInputHafalan: false,
      canRecheckHafalan: false,
      canExportPDF: false,
      canExportExcel: false,
      canViewAnalytics: true,
      canManageUsers: false,
    },
  },
};

/**
 * Get role configuration
 */
export const getRoleConfig = (role: string): RoleConfig => {
  const normalizedRole = role.toUpperCase() as UserRole;
  return roleConfig[normalizedRole] || roleConfig.SANTRI;
};

/**
 * Check if role has specific permission
 */
export const hasPermission = (
  role: string,
  permission: keyof RoleConfig["permissions"]
): boolean => {
  const config = getRoleConfig(role);
  return config.permissions[permission];
};

// ============================================
// CHART COLOR PALETTE (PROFESSIONAL)
// ============================================

export const chartColors = {
  primary: "#10B981", // Emerald-500 - Main success color
  secondary: "#3B82F6", // Blue-500 - Secondary/progress
  tertiary: "#8B5CF6", // Violet-500 - Tertiary
  quaternary: "#F59E0B", // Amber-500 - Warning/waiting
  success: "#22C55E", // Green-500 - Success
  warning: "#F59E0B", // Amber-500 - Warning
  danger: "#EF4444", // Red-500 - Error/danger
  info: "#06B6D4", // Cyan-500 - Info
  muted: "#94A3B8", // Slate-400 - Muted/disabled

  // Extended palette for multi-series charts
  palette: [
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#06B6D4", // Cyan
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#84CC16", // Lime
  ],
};

/**
 * Get color from palette by index
 */
export const getPaletteColor = (index: number): string => {
  return chartColors.palette[index % chartColors.palette.length];
};

// ============================================
// TREND INDICATORS
// ============================================

export type TrendDirection = "up" | "down" | "neutral";

export interface TrendInfo {
  direction: TrendDirection;
  value: number;
  label: string;
  color: string;
}

/**
 * Calculate trend between two values
 */
export const calculateTrend = (
  current: number,
  previous: number
): TrendInfo => {
  if (previous === 0) {
    return {
      direction: current > 0 ? "up" : "neutral",
      value: current > 0 ? 100 : 0,
      label: current > 0 ? "Baru" : "Tidak ada perubahan",
      color: current > 0 ? chartColors.success : chartColors.muted,
    };
  }

  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);

  if (change > 0) {
    return {
      direction: "up",
      value: absChange,
      label: `+${absChange.toFixed(1)}%`,
      color: chartColors.success,
    };
  } else if (change < 0) {
    return {
      direction: "down",
      value: absChange,
      label: `-${absChange.toFixed(1)}%`,
      color: chartColors.danger,
    };
  } else {
    return {
      direction: "neutral",
      value: 0,
      label: "Tidak ada perubahan",
      color: chartColors.muted,
    };
  }
};
