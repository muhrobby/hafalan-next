"use client";

/**
 * StatusBadge Component
 *
 * Badge yang konsisten untuk menampilkan status hafalan di seluruh aplikasi
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStatusConfig, type HafalanStatus } from "@/lib/status-config";

interface StatusBadgeProps {
  status: string | undefined | null;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeVariants = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
  lg: "text-sm px-3 py-1.5",
};

export function StatusBadge({
  status,
  showIcon = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeVariants[size],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn("mr-1", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")}
        />
      )}
      {size === "sm" ? config.shortLabel : config.label}
    </Badge>
  );
}

// Dot indicator only (for compact displays)
export function StatusDot({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = getStatusConfig(status);

  return (
    <div
      className={cn("w-2 h-2 rounded-full", className)}
      style={{ backgroundColor: config.chartColor }}
      title={config.label}
    />
  );
}

// Status with count for summary displays
export function StatusWithCount({
  status,
  count,
  className,
}: {
  status: string;
  count: number;
  className?: string;
}) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
        <Icon className={cn("h-4 w-4", config.textColor)} />
      </div>
      <div>
        <p className={cn("text-lg font-bold", config.textColor)}>{count}</p>
        <p className="text-xs text-muted-foreground">{config.shortLabel}</p>
      </div>
    </div>
  );
}
