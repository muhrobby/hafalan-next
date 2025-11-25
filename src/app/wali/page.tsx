"use client";

import { useRoleGuard } from "@/hooks/use-role-guard";
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
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Child {
  id: string;
  name: string;
  nis: string;
  totalHafalan: number;
  completedKaca: number;
  lastActivity: string;
}

interface ProgressSummary {
  totalChildren: number;
  activeHafalan: number;
  completedThisMonth: number;
  averageProgress: number;
}

export default function WaliDashboard() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["WALI"],
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary>({
    totalChildren: 0,
    activeHafalan: 0,
    completedThisMonth: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildrenData = async () => {
      try {
        // Fetch children for this wali - API already filters and calculates stats
        const usersResponse = await fetch(
          `/api/users?role=SANTRI&waliId=${session?.user.waliProfile?.id}`
        );
        const usersData = await usersResponse.json();

        // Process each child's data (stats already calculated by API)
        const childrenWithProgress = (usersData.data || []).map(
          (child: any) => ({
            id: child.id,
            name: child.name,
            nis: child.santriProfile?.nis || "",
            totalHafalan: child.totalKaca || 0,
            completedKaca: child.completedKaca || 0,
            lastActivity: child.lastActivityAt
              ? new Date(child.lastActivityAt).toLocaleDateString("id-ID")
              : "Belum ada",
          })
        );

        setChildren(childrenWithProgress);

        // Calculate summary
        const totalChildren = childrenWithProgress.length;
        const activeHafalan = childrenWithProgress.reduce(
          (sum, child) => sum + child.totalHafalan,
          0
        );
        const completedThisMonth = childrenWithProgress.reduce(
          (sum, child) => sum + child.completedKaca,
          0
        );
        const averageProgress =
          totalChildren > 0
            ? Math.round((completedThisMonth / (activeHafalan || 1)) * 100)
            : 0;

        setProgressSummary({
          totalChildren,
          activeHafalan,
          completedThisMonth,
          averageProgress,
        });
      } catch (error) {
        console.error("Error fetching children data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchChildrenData();
    }
  }, [session]);

  // Authorization check
  if (isLoading) {
    return (
      <DashboardLayout role="WALI">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return null; // useRoleGuard handles redirect
  }

  if (loading) {
    return (
      <DashboardLayout role="WALI">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="WALI">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Wali: Dashboard Wali
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Selamat datang, {session?.user.name}! Berikut progress hafalan
            anak-anak Anda.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anak</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressSummary.totalChildren}
              </div>
              <p className="text-xs text-muted-foreground">Anak didik</p>
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
              <div className="text-2xl font-bold">
                {progressSummary.activeHafalan}
              </div>
              <p className="text-xs text-muted-foreground">Sedang berjalan</p>
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
              <div className="text-2xl font-bold">
                {progressSummary.completedThisMonth}
              </div>
              <p className="text-xs text-muted-foreground">Total selesai</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Progress Rata-rata
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progressSummary.averageProgress}%
              </div>
              <Progress
                value={progressSummary.averageProgress}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Children Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Anak-anak</CardTitle>
            <CardDescription>Monitor hafalan setiap anak</CardDescription>
          </CardHeader>
          <CardContent>
            {children.length > 0 ? (
              <div className="space-y-4">
                {children.map((child) => (
                  <div key={child.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-lg">{child.name}</h3>
                        <p className="text-sm text-gray-600">
                          NIS: {child.nis}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {child.completedKaca} / {child.totalHafalan} Kaca
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Last: {child.lastActivity}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress Hafalan</span>
                        <span>
                          {child.totalHafalan > 0
                            ? Math.round(
                                (child.completedKaca / child.totalHafalan) * 100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          child.totalHafalan > 0
                            ? (child.completedKaca / child.totalHafalan) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/wali/children/${child.id}/progress`}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Detail Progress
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/wali/children/${child.id}/reports`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Laporan
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Belum ada data anak yang terdaftar</p>
                <p className="text-sm">
                  Silakan hubungi administrator untuk menambahkan data anak.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Progress Hafalan
              </CardTitle>
              <CardDescription>
                Lihat detail progress hafalan anak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/wali/progress">Lihat Progress</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Laporan Bulanan
              </CardTitle>
              <CardDescription>
                Download laporan progress bulanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/wali/reports">Lihat Laporan</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Kelola Anak
              </CardTitle>
              <CardDescription>Atur data profil anak-anak</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/wali/children">Kelola Anak</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
