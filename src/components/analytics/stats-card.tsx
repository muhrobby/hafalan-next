"use client";

/**
 * StatsCard Component
 *
 * Card untuk menampilkan statistik dengan trend indicator
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatsCardProps } from "./types";

const colorVariants = {
  default: {
    icon: "bg-gray-100 text-gray-600",
    value: "text-gray-900",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  success: {
    icon: "bg-green-100 text-green-600",
    value: "text-green-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  warning: {
    icon: "bg-amber-100 text-amber-600",
    value: "text-amber-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  danger: {
    icon: "bg-red-100 text-red-600",
    value: "text-red-600",
    trend: {
      up: "text-red-600",
      down: "text-green-600",
      neutral: "text-gray-500",
    },
  },
  info: {
    icon: "bg-blue-100 text-blue-600",
    value: "text-blue-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
  primary: {
    icon: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-500",
    },
  },
};

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
  color = "default",
  className,
  loading = false,
}: StatsCardProps) {
  const colors = colorVariants[color];

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn("p-2 rounded-lg", colors.icon)}>{icon}</div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colors.value)}>
          {typeof value === "number" ? value.toLocaleString("id-ID") : value}
        </div>

        {(trend || description) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <div
                className={cn(
                  "flex items-center text-xs font-medium",
                  trend.isPositive ? colors.trend.up : colors.trend.down
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : trend.value === 0 ? (
                  <Minus className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                <span>
                  {trend.value > 0 ? "+" : ""}
                  {trend.value.toFixed(1)}%
                </span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Variant untuk stats grid
export function StatsCardCompact({
  title,
  value,
  icon,
  color = "default",
  className,
}: Pick<StatsCardProps, "title" | "value" | "icon" | "color" | "className">) {
  const colors = colorVariants[color];

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn("p-2 rounded-lg shrink-0", colors.icon)}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <p className={cn("text-2xl font-bold truncate", colors.value)}>
              {typeof value === "number"
                ? value.toLocaleString("id-ID")
                : value}
            </p>
            <p className="text-xs text-muted-foreground truncate">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Center aligned variant
export function StatsCardCenter({
  title,
  value,
  color = "default",
  className,
}: Pick<StatsCardProps, "title" | "value" | "color" | "className">) {
  const colors = colorVariants[color];

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="pt-6">
        <div className="text-center">
          <p className={cn("text-3xl font-bold", colors.value)}>
            {typeof value === "number" ? value.toLocaleString("id-ID") : value}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
