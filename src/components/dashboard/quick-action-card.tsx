"use client";

/**
 * Quick Action Card Component
 *
 * Card untuk quick actions dengan icon dan deskripsi
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: "emerald" | "blue" | "amber" | "purple" | "rose";
  badge?: string;
  className?: string;
}

const colorVariants = {
  emerald: {
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    iconBg: "bg-emerald-100 text-emerald-600",
    hover: "hover:from-emerald-100 hover:to-teal-100",
    border: "border-emerald-200",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    iconBg: "bg-blue-100 text-blue-600",
    hover: "hover:from-blue-100 hover:to-indigo-100",
    border: "border-blue-200",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    iconBg: "bg-amber-100 text-amber-600",
    hover: "hover:from-amber-100 hover:to-orange-100",
    border: "border-amber-200",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-50 to-violet-50",
    iconBg: "bg-purple-100 text-purple-600",
    hover: "hover:from-purple-100 hover:to-violet-100",
    border: "border-purple-200",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-50 to-pink-50",
    iconBg: "bg-rose-100 text-rose-600",
    hover: "hover:from-rose-100 hover:to-pink-100",
    border: "border-rose-200",
  },
};

export function QuickActionCard({
  title,
  description,
  icon,
  href,
  color = "emerald",
  badge,
  className,
}: QuickActionCardProps) {
  const colors = colorVariants[color];

  return (
    <Link href={href}>
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-300",
          "border shadow-sm hover:shadow-lg",
          colors.bg,
          colors.hover,
          colors.border,
          className
        )}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "p-3 rounded-xl transition-transform group-hover:scale-110",
                colors.iconBg
              )}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {title}
                </h3>
                {badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 text-gray-600">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-1">
                {description}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Grid container for quick actions
interface QuickActionGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function QuickActionGrid({
  children,
  columns = 2,
  className,
}: QuickActionGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={cn("grid gap-3 md:gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
