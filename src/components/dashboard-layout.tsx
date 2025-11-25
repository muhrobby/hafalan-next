"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useMobile } from "@/hooks/use-mobile";
import {
  BookOpen,
  Users,
  UserCheck,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  Home,
  FileText,
  User,
  Menu,
  X,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "ADMIN" | "TEACHER" | "WALI" | "SANTRI";
}

const navigationItems = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Manajemen User", icon: Users },
    { href: "/admin/santri", label: "Data Santri", icon: GraduationCap },
    { href: "/admin/guru", label: "Data Guru", icon: Users },
    { href: "/admin/hafalan", label: "Rekap Hafalan", icon: BookOpen },
    {
      href: "/admin/santri-lookup",
      label: "Cek Progress Santri",
      icon: UserCheck,
    },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  ],
  TEACHER: [
    { href: "/teacher", label: "Dashboard", icon: Home },
    { href: "/teacher/santri", label: "Santri Saya", icon: GraduationCap },
    { href: "/teacher/hafalan/input", label: "Input Hafalan", icon: BookOpen },
    {
      href: "/teacher/hafalan/recheck",
      label: "Recheck Hafalan",
      icon: FileText,
    },
    {
      href: "/teacher/santri-lookup",
      label: "Cek Progress Santri",
      icon: UserCheck,
    },
    { href: "/teacher/raport", label: "Raport Santri", icon: BarChart3 },
  ],
  WALI: [
    { href: "/wali", label: "Dashboard", icon: Home },
    { href: "/wali/children", label: "Anak Saya", icon: Users },
    { href: "/wali/progress", label: "Progress Hafalan", icon: BookOpen },
    { href: "/wali/reports", label: "Laporan", icon: FileText },
  ],
  SANTRI: [
    { href: "/santri", label: "Dashboard", icon: Home },
    { href: "/santri/hafalan", label: "Hafalan Saya", icon: BookOpen },
    { href: "/santri/progress", label: "Progress", icon: BarChart3 },
    { href: "/santri/profile", label: "Profil", icon: User },
  ],
};

export function DashboardLayout({
  children,
  role: propRole,
}: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();

  // Use prop role if provided, otherwise use session role
  const role =
    propRole ||
    (session?.user?.role as "ADMIN" | "TEACHER" | "WALI" | "SANTRI");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-600"></div>
          <p className="text-sm text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  const items = role ? navigationItems[role] : [];

  // Mobile drawer view
  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-semibold text-gray-900 text-sm">Hafalan</h1>
            </div>
            <DropdownMenu open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {sidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {session.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            {items.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 py-2 px-1 text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-50 active:bg-emerald-50 active:text-emerald-600"
              >
                <item.icon className="w-5 h-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Sidebar view
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <Sidebar className="hidden md:flex border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  Hafalan Qur'an
                </h1>
                <p className="text-xs text-gray-600 capitalize truncate">
                  {role?.toLowerCase() || "Loading..."}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors w-full"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 h-auto py-2.5 hover:bg-gray-100"
                >
                  <Avatar className="w-8 h-8 mr-3 shrink-0">
                    <AvatarFallback className="text-sm bg-emerald-600 text-white">
                      {session.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-gray-900">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {role.toLowerCase()}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="flex items-center justify-between px-4 py-3 md:px-6 lg:px-8">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <SidebarTrigger className="md:hidden shrink-0" />
                <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 truncate">
                  Aplikasi Hafalan Al-Qur'an
                </h2>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs md:text-sm text-gray-600 hidden sm:inline">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="w-full max-w-[1600px] mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
