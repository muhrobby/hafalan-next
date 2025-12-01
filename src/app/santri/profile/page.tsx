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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { showAlert } from "@/lib/alert";

interface SantriProfile {
  id: string;
  name: string;
  email: string;
  nis: string;
  phone?: string;
  birthDate?: string;
  birthPlace?: string;
  gender: string;
  address?: string;
  teacher?: {
    name: string;
    email: string;
    nip: string;
  };
  wali?: {
    name: string;
    email: string;
    phone?: string;
  };
  hafalanStats: {
    total: number;
    completed: number;
    inProgress: number;
    waitingRecheck: number;
  };
}

export default function SantriProfilePage() {
  const { session, isLoading, isAuthorized } = useRoleGuard({
    allowedRoles: ["SANTRI"],
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SantriProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // Fetch user and hafalan data in parallel
        const [userResponse, hafalanResponse] = await Promise.all([
          fetch("/api/users?role=SANTRI&limit=1"),
          fetch("/api/hafalan?limit=200"),
        ]);

        if (!userResponse.ok || !hafalanResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [userData, hafalanData] = await Promise.all([
          userResponse.json(),
          hafalanResponse.json(),
        ]);

        const currentUser = userData.data?.find(
          (u: any) => u.id === session?.user?.id
        );

        const records = hafalanData.data || [];
        const hafalanStats = {
          total: records.length,
          completed: records.filter(
            (r: any) => r.statusKaca === "RECHECK_PASSED"
          ).length,
          inProgress: records.filter((r: any) => r.statusKaca === "PROGRESS")
            .length,
          waitingRecheck: records.filter(
            (r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK"
          ).length,
        };

        if (currentUser) {
          setProfile({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            nis: currentUser.santriProfile?.nis || "-",
            phone: currentUser.santriProfile?.phone,
            birthDate: currentUser.santriProfile?.birthDate,
            birthPlace: currentUser.santriProfile?.birthPlace,
            gender: currentUser.santriProfile?.gender || "MALE",
            address: currentUser.santriProfile?.address,
            teacher: currentUser.santriProfile?.teacher?.user
              ? {
                  name: currentUser.santriProfile.teacher.user.name,
                  email: currentUser.santriProfile.teacher.user.email,
                  nip: currentUser.santriProfile.teacher.nip,
                }
              : undefined,
            wali: currentUser.santriProfile?.wali?.user
              ? {
                  name: currentUser.santriProfile.wali.user.name,
                  email: currentUser.santriProfile.wali.user.email,
                  phone: currentUser.santriProfile.wali.phone,
                }
              : undefined,
            hafalanStats,
          });
        } else {
          // Fallback to session data
          setProfile({
            id: session?.user?.id || "",
            name: session?.user?.name || "",
            email: session?.user?.email || "",
            nis: session?.user?.santriProfile?.nis || "-",
            phone: undefined,
            gender: "MALE",
            hafalanStats,
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        showAlert.error("Error", "Gagal memuat data profil");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  // Authorization check
  if (isLoading) {
    return (
      <DashboardLayout role="SANTRI">
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
      <DashboardLayout role="SANTRI">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="SANTRI">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/santri">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Profil Saya
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Lihat informasi lengkap tentang diri Anda
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700">
                    {profile?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <Badge className="mt-2" variant="secondary">
                  Santri
                </Badge>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile?.name}
                  </h2>
                  <p className="text-gray-600">NIS: {profile?.nis}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                  )}
                  {profile?.birthDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {new Date(profile.birthDate).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  )}
                  {profile?.birthPlace && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{profile.birthPlace}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Badge
                    variant={
                      profile?.gender === "MALE" ? "default" : "secondary"
                    }
                  >
                    {profile?.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hafalan Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Statistik Hafalan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.hafalanStats.total || 0}
                </p>
                <p className="text-sm text-gray-600">Total Kaca</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {profile?.hafalanStats.completed || 0}
                </p>
                <p className="text-sm text-gray-600">Lulus</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {profile?.hafalanStats.waitingRecheck || 0}
                </p>
                <p className="text-sm text-gray-600">Menunggu Recheck</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {profile?.hafalanStats.inProgress || 0}
                </p>
                <p className="text-sm text-gray-600">Sedang Proses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher & Wali Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Teacher */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Guru Pembimbing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.teacher ? (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">
                    {profile.teacher.name}
                  </p>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Mail className="h-4 w-4" />
                    {profile.teacher.email}
                  </div>
                  <Badge variant="outline">NIP: {profile.teacher.nip}</Badge>
                </div>
              ) : (
                <p className="text-gray-500">
                  Belum ada guru pembimbing yang ditugaskan
                </p>
              )}
            </CardContent>
          </Card>

          {/* Wali */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Wali
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.wali ? (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">
                    {profile.wali.name}
                  </p>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Mail className="h-4 w-4" />
                    {profile.wali.email}
                  </div>
                  {profile.wali.phone && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Phone className="h-4 w-4" />
                      {profile.wali.phone}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Belum ada wali yang ditugaskan</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
