import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  gap?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const colsMap = {
  1: "grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 md:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const gapMap = {
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4",
  lg: "gap-4 md:gap-6",
  xl: "gap-6 md:gap-8",
};

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, md: 3 },
  gap = "md",
  className = "",
}: ResponsiveGridProps) {
  const colsClass = `grid grid-cols-1 ${cols.sm && "sm:grid-cols-2"} ${
    cols.md && "md:grid-cols-3"
  } ${cols.lg && "lg:grid-cols-4"} ${cols.xl && "xl:grid-cols-5"}`;

  return (
    <div className={`${colsClass} ${gapMap[gap]} ${className}`}>{children}</div>
  );
}
