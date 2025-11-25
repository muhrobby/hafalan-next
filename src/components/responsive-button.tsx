"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface ResponsiveButtonGroupProps {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  className?: string;
}

export function ResponsiveButtonGroup({
  children,
  direction = "horizontal",
  className = "",
}: ResponsiveButtonGroupProps) {
  return (
    <div
      className={`
        flex flex-col sm:flex-row gap-2 sm:gap-3
        ${direction === "vertical" ? "flex-col" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface ResponsiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function ResponsiveButton({
  children,
  fullWidth = false,
  className = "",
  ...props
}: ResponsiveButtonProps) {
  return (
    <Button
      {...props}
      className={`
        text-xs sm:text-sm font-medium
        px-3 sm:px-4 py-2 sm:py-2.5
        ${fullWidth ? "w-full sm:w-auto" : ""}
        ${className}
      `}
    >
      {children}
    </Button>
  );
}
