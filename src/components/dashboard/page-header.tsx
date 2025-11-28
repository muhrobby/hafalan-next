"use client";

/**
 * PageHeader Component
 *
 * Header profesional dengan gradient, avatar, dan greeting
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  showGreeting?: boolean;
  showDateTime?: boolean;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "success" | "warning" | "destructive";
  };
  actions?: React.ReactNode;
  className?: string;
}

const greetings = {
  morning: "Selamat Pagi",
  afternoon: "Selamat Siang",
  evening: "Selamat Sore",
  night: "Selamat Malam",
};

const roleLabels: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrator", color: "bg-purple-100 text-purple-700" },
  TEACHER: { label: "Guru Tahfidz", color: "bg-blue-100 text-blue-700" },
  SANTRI: { label: "Santri", color: "bg-emerald-100 text-emerald-700" },
  WALI: { label: "Wali Santri", color: "bg-amber-100 text-amber-700" },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return greetings.morning;
  if (hour < 15) return greetings.afternoon;
  if (hour < 18) return greetings.evening;
  return greetings.night;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PageHeader({
  title,
  subtitle,
  userName,
  userRole,
  userAvatar,
  showGreeting = true,
  showDateTime = true,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const roleInfo = userRole ? roleLabels[userRole] : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 md:p-8 text-white shadow-xl",
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-emerald-400/5 to-teal-400/5 blur-3xl" />

      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          {userName && (
            <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-white/30 shadow-lg">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-white/20 text-white text-lg font-semibold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {showGreeting && userName && mounted ? (
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  {getGreeting()}, {userName.split(" ")[0]}!
                </h1>
              ) : (
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  {title}
                </h1>
              )}
              {badge && (
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-none hover:bg-white/30"
                >
                  {badge.text}
                </Badge>
              )}
            </div>

            {subtitle && (
              <p className="text-emerald-100/90 text-sm md:text-base max-w-xl">
                {subtitle}
              </p>
            )}

            {roleInfo && (
              <Badge className={cn("mt-1", roleInfo.color)}>
                {roleInfo.label}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          {showDateTime && mounted && (
            <div className="flex items-center gap-4 text-emerald-100/80 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {currentTime.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>
                  {currentTime.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}

          {actions && (
            <div className="flex items-center gap-2 mt-2">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simpler variant without avatar
export function PageHeaderSimple({
  title,
  subtitle,
  badge,
  actions,
  className,
}: Omit<
  PageHeaderProps,
  "userName" | "userRole" | "userAvatar" | "showGreeting" | "showDateTime"
>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white shadow-lg",
        className
      )}
    >
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold">{title}</h1>
            {badge && (
              <Badge className="bg-white/20 text-white border-none">
                {badge.text}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-emerald-100/80 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
