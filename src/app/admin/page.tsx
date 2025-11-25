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
import {
  Users,
  BookOpen,
  TrendingUp,
  Settings,
  UserCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";

interface SystemStats {
  totalUsers: number;
  totalSantri: number;
  totalTeachers: number;
  totalWalis: number;
  totalHafalanRecords: number;
  completedKaca: number;
}

interface UserSummary {
  role: string;
  count: number;
  color: string;
}

export default function AdminDashboard() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["ADMIN"],
  });
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalSantri: 0,
    totalTeachers: 0,
    totalWalis: 0,
    totalHafalanRecords: 0,
    completedKaca: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        // Fetch users data
        const usersResponse = await fetch("/api/users");
        const usersData = await usersResponse.json();

        // Fetch hafalan data
        const hafalanResponse = await fetch("/api/hafalan");
        const hafalanData = await hafalanResponse.json();

        const users = usersData.data || [];
        const hafalanRecords = hafalanData.data || [];

        const totalUsers = users.length;
        const totalSantri = users.filter(
          (u: any) => u.role === "SANTRI"
        ).length;
        const totalTeachers = users.filter(
          (u: any) => u.role === "TEACHER"
        ).length;
        const totalWalis = users.filter((u: any) => u.role === "WALI").length;
        const totalHafalanRecords = hafalanRecords.length;
        const completedKaca = hafalanRecords.filter(
          (r: any) => r.statusKaca === "RECHECK_PASSED"
        ).length;

        setStats({
          totalUsers,
          totalSantri,
          totalTeachers,
          totalWalis,
          totalHafalanRecords,
          completedKaca,
        });
      } catch (error) {
        console.error("Error fetching system data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session && isAuthorized) {
      fetchSystemData();
    }
  }, [session, isAuthorized]);

  // Show loading while checking authorization
  if (isLoading || !isAuthorized) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const userSummary: UserSummary[] = [
    { role: "Admin", count: 1, color: "bg-purple-100 text-purple-800" },
    {
      role: "Guru",
      count: stats.totalTeachers,
      color: "bg-blue-100 text-blue-800",
    },
    {
      role: "Santri",
      count: stats.totalSantri,
      color: "bg-green-100 text-green-800",
    },
    {
      role: "Wali",
      count: stats.totalWalis,
      color: "bg-orange-100 text-orange-800",
    },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard Administrator
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Selamat datang, {session?.user.name}! Berikut ringkasan sistem
            aplikasi hafalan.
          </p>
        </div>

        {/* System Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Semua pengguna sistem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Santri
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSantri}</div>
              <p className="text-xs text-muted-foreground">Santri aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Hafalan
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalHafalanRecords}
              </div>
              <p className="text-xs text-muted-foreground">Record hafalan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Kaca Selesai
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedKaca}</div>
              <p className="text-xs text-muted-foreground">Selesai recheck</p>
            </CardContent>
          </Card>
        </div>

        {/* User Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi User</CardTitle>
              <CardDescription>Jumlah user berdasarkan peran</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userSummary.map((item) => (
                  <div
                    key={item.role}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={item.color}>{item.role}</Badge>
                      <span className="text-sm text-gray-600">
                        {item.count} user
                      </span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.totalUsers > 0
                                ? (item.count / stats.totalUsers) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.totalUsers > 0
                        ? Math.round((item.count / stats.totalUsers) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Aksi cepat untuk mengelola sistem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Manajemen User
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/admin/santri">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Data Santri
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/admin/hafalan">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Rekap Hafalan
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/admin/analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Pengaturan
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>Status Sistem</CardTitle>
            <CardDescription>Kondisi kesehatan sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-gray-600">Terhubung</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Authentication</p>
                  <p className="text-sm text-gray-600">Normal</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">API Services</p>
                  <p className="text-sm text-gray-600">Berjalan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
