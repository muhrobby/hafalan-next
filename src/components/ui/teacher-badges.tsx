"use client";

/**
 * TeacherBadges Component
 *
 * Menampilkan daftar guru secara konsisten di seluruh aplikasi
 * Untuk santri yang memiliki lebih dari satu guru
 */

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Teacher {
  id: string;
  name: string;
  nip?: string;
}

interface TeacherBadgesProps {
  teachers: Teacher[] | undefined | null;
  maxDisplay?: number;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export function TeacherBadges({
  teachers,
  maxDisplay = 2,
  size = "md",
  className,
  showIcon = true,
}: TeacherBadgesProps) {
  if (!teachers || teachers.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const displayedTeachers = teachers.slice(0, maxDisplay);
  const remainingCount = teachers.length - maxDisplay;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
  };

  return (
    <TooltipProvider>
      <div className={cn("flex flex-wrap gap-1", className)}>
        {displayedTeachers.map((teacher) => (
          <Tooltip key={teacher.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={cn("cursor-default", sizeClasses[size])}
              >
                {showIcon && <User className="h-3 w-3 mr-1" />}
                {teacher.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{teacher.name}</p>
              {teacher.nip && (
                <p className="text-xs text-muted-foreground">
                  NIP: {teacher.nip}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn("cursor-default", sizeClasses[size])}
              >
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium mb-1">Guru lainnya:</p>
              {teachers.slice(maxDisplay).map((teacher) => (
                <p key={teacher.id} className="text-sm">
                  {teacher.name}
                </p>
              ))}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Compact version - single line with tooltip
export function TeacherBadgesCompact({
  teachers,
  className,
}: Pick<TeacherBadgesProps, "teachers" | "className">) {
  if (!teachers || teachers.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  if (teachers.length === 1) {
    return <span className={cn("text-sm", className)}>{teachers[0].name}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "text-sm cursor-default flex items-center gap-1",
              className
            )}
          >
            <Users className="h-3 w-3 text-muted-foreground" />
            {teachers.length} guru
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium mb-1">Daftar Guru:</p>
          {teachers.map((teacher) => (
            <p key={teacher.id} className="text-sm">
              {teacher.name}
            </p>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// List version - for detail views
export function TeacherList({
  teachers,
  showNip = false,
  className,
}: {
  teachers: Teacher[] | undefined | null;
  showNip?: boolean;
  className?: string;
}) {
  if (!teachers || teachers.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">Belum ada guru</span>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {teachers.map((teacher) => (
        <div key={teacher.id} className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium">{teacher.name}</p>
            {showNip && teacher.nip && (
              <p className="text-xs text-muted-foreground">
                NIP: {teacher.nip}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
