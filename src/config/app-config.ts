/**
 * Application Configuration
 * 
 * Menu items dan konfigurasi frontend lainnya.
 * Untuk mengaktifkan/menonaktifkan menu, ubah properti `enabled` di masing-masing item.
 */

import {
  BookOpen,
  Users,
  UserCheck,
  GraduationCap,
  BarChart3,
  Settings,
  Home,
  FileText,
  User,
  BookMarked,
} from "lucide-react";

export interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  hasBadge?: boolean;
}

export interface MenuConfig {
  ADMIN: MenuItem[];
  TEACHER: MenuItem[];
  WALI: MenuItem[];
  SANTRI: MenuItem[];
}

/**
 * Konfigurasi Menu per Role
 * 
 * Ubah `enabled: false` untuk menyembunyikan menu tertentu.
 * Menu yang disabled tidak akan muncul di sidebar/navigation.
 */
export const menuConfig: MenuConfig = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: Home, enabled: true },
    { href: "/admin/users", label: "Manajemen User", icon: Users, enabled: true },
    { href: "/admin/santri", label: "Data Santri", icon: GraduationCap, enabled: true },
    { href: "/admin/guru", label: "Data Guru", icon: Users, enabled: true },
    { href: "/admin/kaca", label: "Data Kaca", icon: BookMarked, enabled: true },
    { href: "/admin/hafalan", label: "Rekap Hafalan", icon: BookOpen, enabled: true },
    { href: "/admin/santri-lookup", label: "Cek Progress Santri", icon: UserCheck, enabled: true },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, enabled: true },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings, enabled: true },
  ],
  TEACHER: [
    { href: "/teacher", label: "Dashboard", icon: Home, enabled: true },
    { href: "/teacher/santri", label: "Santri Saya", icon: GraduationCap, enabled: true },
    { href: "/teacher/hafalan/input", label: "Input Hafalan", icon: BookOpen, enabled: true },
    { href: "/teacher/hafalan/recheck", label: "Recheck Hafalan", icon: FileText, enabled: true, hasBadge: true },
    { href: "/teacher/santri-lookup", label: "Cek Progress Santri", icon: UserCheck, enabled: true },
    { href: "/teacher/raport", label: "Raport Santri", icon: BarChart3, enabled: true },
  ],
  WALI: [
    { href: "/wali", label: "Dashboard", icon: Home, enabled: true },
    { href: "/wali/children", label: "Anak Saya", icon: Users, enabled: true },
    { href: "/wali/progress", label: "Progress Hafalan", icon: BookOpen, enabled: true },
    { href: "/wali/reports", label: "Laporan", icon: FileText, enabled: true },
  ],
  SANTRI: [
    { href: "/santri", label: "Dashboard", icon: Home, enabled: true },
    { href: "/santri/hafalan", label: "Hafalan Saya", icon: BookOpen, enabled: true },
    { href: "/santri/progress", label: "Progress", icon: BarChart3, enabled: true },
    { href: "/santri/profile", label: "Profil", icon: User, enabled: true },
  ],
};

/**
 * Get enabled menu items for a specific role
 */
export function getEnabledMenuItems(role: keyof MenuConfig): MenuItem[] {
  return menuConfig[role].filter(item => item.enabled);
}

/**
 * Default App Branding (fallback if API fails)
 */
export const defaultBranding = {
  brandName: "Hafalan Al-Qur'an",
  brandTagline: "Metode 1 Kaca",
  primaryColor: "#059669",
};
