"use client";

/**
 * Empty State Component
 *
 * Tampilan untuk state kosong atau tidak ada data
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileQuestion,
  Inbox,
  Search,
  BookOpen,
  Users,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: "default" | "search" | "book" | "users" | "folder";
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const iconMap = {
  default: Inbox,
  search: Search,
  book: BookOpen,
  users: Users,
  folder: FolderOpen,
};

export function EmptyState({
  icon = "default",
  title = "Tidak ada data",
  description = "Belum ada data untuk ditampilkan saat ini.",
  action,
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>

      {action &&
        (action.href ? (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        ))}
    </div>
  );
}

// Compact variant for inline use
export function EmptyStateCompact({
  icon = "default",
  title = "Tidak ada data",
  className,
}: Pick<EmptyStateProps, "icon" | "title" | "className">) {
  const Icon = iconMap[icon];

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-6 px-4 text-gray-500",
        className
      )}
    >
      <Icon className="h-5 w-5 text-gray-400" />
      <span className="text-sm">{title}</span>
    </div>
  );
}
