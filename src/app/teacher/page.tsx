"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { RecentActivityTable } from "@/components/recent-activity-table";

interface DashboardStats {
  totalSantri: number;
  activeHafalan: number;
  completedToday: number;
  pendingRecheck: number;
  collaborativeSantri: number; // Santri yang diajar bersama guru lain
}

interface RecentActivity {
  id: string;
  santriName: string;
  kacaInfo: string;
  status: string;
  timestamp: string;
  teacherName?: string; // Nama guru yang input hafalan
}

export default function TeacherDashboard() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["TEACHER"],
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalSantri: 0,
    activeHafalan: 0,
    completedToday: 0,
    pendingRecheck: 0,
    collaborativeSantri: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthorized) return;

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // Fetch teacher's santri using API filter
        const santriResponse = await fetch(
          `/api/users?role=SANTRI&teacherId=${session?.user?.id}`
        );
        const santriData = await santriResponse.json();

        // Fetch recent hafalan records (API already filters by teacher role)
        const hafalanResponse = await fetch("/api/hafalan?limit=10");
        const hafalanData = await hafalanResponse.json();

        const mySantris = santriData.data || [];
        const totalSantri = mySantris.length;

        // Count santri yang diajar bersama guru lain (collaborative teaching)
        const collaborativeSantri = mySantris.filter((user: any) => {
          const assignments = user.santriProfile?.teacherAssignments || [];
          return assignments.length > 1; // Lebih dari 1 guru assigned
        }).length;

        const today = new Date().toISOString().split("T")[0];
        const completedToday =
          hafalanData.data?.filter(
            (record: any) =>
              record.tanggalSetor.startsWith(today) &&
              record.statusKaca === "COMPLETE_WAITING_RECHECK"
          ).length || 0;

        const pendingRecheck =
          hafalanData.data?.filter(
            (record: any) => record.statusKaca === "COMPLETE_WAITING_RECHECK"
          ).length || 0;

        setStats({
          totalSantri,
          activeHafalan: hafalanData.data?.length || 0,
          completedToday,
          pendingRecheck,
          collaborativeSantri,
        });

        // Prepare recent activity
        const activity =
          hafalanData.data?.slice(0, 5).map((record: any) => ({
            id: record.id,
            santriName: record.santri.user.name,
            kacaInfo: `${record.kaca.surahName} (${record.kaca.pageNumber})`,
            status: record.statusKaca,
            timestamp: new Date(record.createdAt).toLocaleDateString("id-ID"),
            teacherName: record.teacher?.user?.name, // Nama guru yang input
          })) || [];

        setRecentActivity(activity);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthorized, session]);

  // Show loading while checking authorization
  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Teacher: Dashboard Guru
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Selamat datang kembali, {session?.user.name}! Berikut ringkasan
            aktivitas terbaru.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Santri
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSantri}</div>
              <p className="text-xs text-muted-foreground">Santri aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Hafalan Aktif
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeHafalan}</div>
              <p className="text-xs text-muted-foreground">
                Sedang berlangsung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Selesai Hari Ini
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">Menunggu recheck</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Recheck
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRecheck}</div>
              <p className="text-xs text-muted-foreground">Perlu dicek ulang</p>
            </CardContent>
          </Card>
        </div>

        {/* Collaborative Teaching Info */}
        {stats.collaborativeSantri > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Pengajaran Kolaboratif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                Anda mengajar{" "}
                <span className="font-semibold text-blue-700">
                  {stats.collaborativeSantri} santri
                </span>{" "}
                bersama guru lain. Koordinasi dan komunikasi antar guru akan
                membantu proses pembelajaran yang lebih efektif.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Input Hafalan Baru
              </CardTitle>
              <CardDescription>
                Catat progress hafalan santri terbaru
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/teacher/hafalan/input">Input Hafalan</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Recheck Hafalan
              </CardTitle>
              <CardDescription>
                Periksa ulang hafalan yang sudah selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/teacher/hafalan/recheck">Lakukan Recheck</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Lihat Raport
              </CardTitle>
              <CardDescription>Analisis progress per santri</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/teacher/raport">Lihat Raport</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Hafalan yang baru saja dicatat</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityTable
              activities={recentActivity}
              showSantriName={true}
              showTeacherName={true}
              emptyMessage="Belum ada aktivitas hafalan terbaru"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
