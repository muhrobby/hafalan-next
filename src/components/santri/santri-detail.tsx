/**
 * Santri Detail Component
 * Displays detailed information about selected santri with hafalan records
 */
"use client";

import { useState } from "react";
import {
  User,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StatusBadge } from "@/components/ui/status-badge";
import { TeacherBadges } from "@/components/ui/teacher-badges";
import { formatDate, formatRelative } from "@/lib/formatters";
import { HAFALAN_STATUS } from "@/lib/status-config";
import type { SantriDetail, HafalanRecord } from "./types";

interface SantriDetailProps {
  santri: SantriDetail | null;
  isLoading: boolean;
  canInput?: boolean;
  canRecheck?: boolean;
  onRefresh?: () => void;
  onInputHafalan?: (santriId: string, kacaId?: number) => void;
  onRecheck?: (hafalanId: string) => void;
}

export function SantriDetailView({
  santri,
  isLoading,
  canInput = false,
  canRecheck = false,
  onRefresh,
  onInputHafalan,
  onRecheck,
}: SantriDetailProps) {
  const [showAllRecords, setShowAllRecords] = useState(false);

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Memuat data santri...</p>
        </div>
      </Card>
    );
  }

  if (!santri) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Pilih santri dari daftar</p>
          <p className="text-sm">untuk melihat detail hafalan</p>
        </div>
      </Card>
    );
  }

  // Group records by status
  const pendingRecheck = santri.hafalan.filter(
    (h) => h.status === HAFALAN_STATUS.COMPLETE_WAITING_RECHECK
  );
  const inProgress = santri.hafalan.filter(
    (h) => h.status === HAFALAN_STATUS.PROGRESS
  );
  const completed = santri.hafalan.filter(
    (h) => h.status === HAFALAN_STATUS.RECHECK_PASSED
  );

  // Records to display
  const displayRecords = showAllRecords
    ? santri.hafalan
    : santri.hafalan.slice(0, 10);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {santri.name || "Tanpa Nama"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{santri.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Badge variant={santri.isActive ? "default" : "secondary"}>
              {santri.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-4 space-y-4">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          {santri.angkatan && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Angkatan</p>
              <p className="font-semibold">{santri.angkatan}</p>
            </div>
          )}
          {santri.teacher && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Guru Pembimbing</p>
              <p className="font-semibold truncate">
                {santri.teacher.name || santri.teacher.email}
              </p>
            </div>
          )}
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress Hafalan</span>
            <span className="text-sm font-bold text-primary">
              {santri.progress.percentage}%
            </span>
          </div>
          <Progress value={santri.progress.percentage} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{santri.progress.completed} halaman selesai</span>
            <span>{santri.progress.total} total halaman</span>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-700 dark:text-green-400">
              {completed.length}
            </p>
            <p className="text-xs text-green-600/80">Selesai</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
            <Clock className="h-5 w-5 mx-auto text-orange-600 mb-1" />
            <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
              {pendingRecheck.length}
            </p>
            <p className="text-xs text-orange-600/80">Menunggu</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {inProgress.length}
            </p>
            <p className="text-xs text-blue-600/80">Proses</p>
          </div>
        </div>

        {/* Next Kaca / Action Button */}
        {canInput && santri.nextKaca && (
          <div className="border border-dashed rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Halaman Selanjutnya</p>
                <p className="text-lg font-bold text-primary">
                  {santri.nextKaca.surahName} - Hal {santri.nextKaca.pageNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Juz {santri.nextKaca.juz}
                </p>
              </div>
              <Button
                onClick={() => onInputHafalan?.(santri.id, santri.nextKaca?.id)}
                size="sm"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Input
              </Button>
            </div>
          </div>
        )}

        {/* Pending Recheck List */}
        {canRecheck && pendingRecheck.length > 0 && (
          <div className="border border-orange-200 dark:border-orange-900 rounded-lg p-4">
            <p className="text-sm font-medium mb-3 text-orange-700 dark:text-orange-400">
              Menunggu Recheck ({pendingRecheck.length})
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {pendingRecheck.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/30 rounded p-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {record.kaca.surahName} - Hal {record.kaca.pageNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(record.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRecheck?.(record.id)}
                  >
                    Recheck
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hafalan Records */}
        <Collapsible open={showAllRecords} onOpenChange={setShowAllRecords}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Riwayat Hafalan ({santri.hafalan.length})
            </p>
            {santri.hafalan.length > 10 && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {showAllRecords ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Sembunyikan
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Lihat Semua
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            )}
          </div>

          <CollapsibleContent>
            <ScrollArea className="h-[300px]">
              <RecordList
                records={displayRecords}
                canRecheck={canRecheck}
                onRecheck={onRecheck}
              />
            </ScrollArea>
          </CollapsibleContent>

          {!showAllRecords && (
            <RecordList
              records={displayRecords}
              canRecheck={canRecheck}
              onRecheck={onRecheck}
            />
          )}
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// Record List Sub-component
function RecordList({
  records,
  canRecheck,
  onRecheck,
}: {
  records: HafalanRecord[];
  canRecheck?: boolean;
  onRecheck?: (id: string) => void;
}) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Belum ada hafalan tercatat</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <div
          key={record.id}
          className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium truncate">{record.kaca.surahName}</p>
                <StatusBadge status={record.status} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">
                Halaman {record.kaca.pageNumber} • Juz {record.kaca.juz}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {formatDate(record.createdAt)}
              </div>
              {(record.teacher || record.recheckTeacher) && (
                <div className="mt-2">
                  <TeacherBadges
                    inputTeacher={record.teacher}
                    recheckTeacher={record.recheckTeacher}
                  />
                </div>
              )}
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              {record.nilai !== null && (
                <Badge variant="outline" className="font-mono">
                  {record.nilai}
                </Badge>
              )}
              {canRecheck &&
                record.status === HAFALAN_STATUS.COMPLETE_WAITING_RECHECK && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onRecheck?.(record.id)}
                  >
                    Recheck
                  </Button>
                )}
            </div>
          </div>
          {record.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic border-t pt-2">
              &quot;{record.notes}&quot;
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
