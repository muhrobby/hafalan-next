"use client";

import React from "react";

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
}

export function ResponsiveCard({
  children,
  className = "",
  hover = false,
  clickable = false,
}: ResponsiveCardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-4 sm:p-5 md:p-6
        shadow-sm transition-all duration-200
        ${hover ? "hover:shadow-md hover:border-gray-300" : ""}
        ${clickable ? "cursor-pointer active:scale-95" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface ResponsiveCardHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function ResponsiveCardHeader({
  title,
  subtitle,
  action,
  className = "",
}: ResponsiveCardHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 pb-4 border-b border-gray-100 mb-4 ${className}`}
    >
      <div className="min-w-0 flex-1">
        {title && (
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ResponsiveCardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>{children}</div>
  );
}
