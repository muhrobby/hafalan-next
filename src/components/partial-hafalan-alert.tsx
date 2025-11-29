"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle,
  Trash2,
  Lock,
  Pause,
  RefreshCw,
  PartyPopper,
  AlertTriangle,
} from "lucide-react";
import { PartialHafalan } from "@/hooks/use-partial-hafalan";

interface PartialHafalanAlertProps {
  partials: PartialHafalan[];
  kacaInfo?: {
    pageNumber: number;
    surahName: string;
  };
  onViewDetails?: () => void;
  onComplete?: (partialId: string, ayatNumber: number) => void;
  onContinue?: (partial: PartialHafalan) => void;
  onDelete?: (partialId: string) => void;
  showActions?: boolean;
}

interface CompletedPartialAlertProps {
  completedPartials: PartialHafalan[];
  hasUnsavedChanges?: boolean;
  /** If true, show critical warning that data might be lost from previous session */
  isPreviousSessionUnsaved?: boolean;
  onSaveHafalan?: () => void;
  /** Callback to auto-check ayat from unsaved partials */
  onRestoreAyatChecks?: (ayatNumbers: number[]) => void;
}

// Alert for active partials
export function PartialHafalanAlert({
  partials,
  kacaInfo,
  onViewDetails,
  onComplete,
  onContinue,
  onDelete,
  showActions = true,
}: PartialHafalanAlertProps) {
  if (partials.length === 0) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Partial Hafalan Aktif
        {kacaInfo && (
          <span className="font-normal text-sm">
            - Kaca {kacaInfo.pageNumber}
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <p className="text-xs mb-3 flex items-center gap-1">
          <Pause className="h-3 w-3" />
          Ayat dengan partial aktif dan ayat setelahnya terkunci sampai partial
          diselesaikan
        </p>
        <div className="mt-2 space-y-3">
          {partials.slice(0, 5).map((partial) => (
            <div
              key={partial.id}
              className="flex flex-col gap-2 p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-amber-200/50"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-100 text-amber-800 border-amber-300"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Ayat {partial.ayatNumber}
                  </Badge>
                  {partial.percentage && (
                    <Badge variant="secondary" className="text-xs">
                      {partial.percentage}%
                    </Badge>
                  )}
                </div>
                {showActions && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Lanjutkan: Update progress tanpa menyelesaikan */}
                    {onContinue && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-amber-400 text-amber-700 hover:bg-amber-100"
                        onClick={() => onContinue(partial)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Lanjutkan
                      </Button>
                    )}
                    {/* Selesaikan: Mark as complete */}
                    {onComplete && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          onComplete(partial.id, partial.ayatNumber)
                        }
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selesaikan
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(partial.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground truncate">
                  {partial.progress}
                </p>
                {partial.percentage && (
                  <Progress value={partial.percentage} className="h-1.5" />
                )}
              </div>
            </div>
          ))}
          {partials.length > 5 && (
            <p className="text-xs text-muted-foreground">
              +{partials.length - 5} partial lainnya
            </p>
          )}
        </div>
        {onViewDetails && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 p-0 h-auto text-amber-600 dark:text-amber-400"
            onClick={onViewDetails}
          >
            Lihat & Kelola Semua Partial →
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Alert for recently completed partials - Reminder to save
export function CompletedPartialAlert({
  completedPartials,
  hasUnsavedChanges = false,
  isPreviousSessionUnsaved = false,
  onSaveHafalan,
  onRestoreAyatChecks,
}: CompletedPartialAlertProps) {
  if (completedPartials.length === 0) return null;

  // If from previous session and unsaved, show critical warning
  const isCritical = isPreviousSessionUnsaved;
  const showWarning = hasUnsavedChanges || isCritical;

  return (
    <Alert
      className={`${
        isCritical
          ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950"
          : showWarning
          ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950"
          : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      ) : showWarning ? (
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      ) : (
        <PartyPopper className="h-4 w-4 text-green-600 dark:text-green-400" />
      )}
      <AlertTitle
        className={`${
          isCritical
            ? "text-red-800 dark:text-red-200"
            : showWarning
            ? "text-orange-800 dark:text-orange-200"
            : "text-green-800 dark:text-green-200"
        } flex items-center gap-2`}
      >
        {isCritical ? (
          <>
            <AlertTriangle className="h-4 w-4" />
            ⚠️ Partial Belum Tersimpan!
          </>
        ) : showWarning ? (
          <>
            <AlertTriangle className="h-4 w-4" />
            Jangan Lupa Simpan!
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Partial Selesai
          </>
        )}
      </AlertTitle>
      <AlertDescription
        className={`${
          isCritical
            ? "text-red-700 dark:text-red-300"
            : showWarning
            ? "text-orange-700 dark:text-orange-300"
            : "text-green-700 dark:text-green-300"
        }`}
      >
        <div className="space-y-2">
          <p className="text-sm">
            {isCritical ? (
              <>
                Anda memiliki {completedPartials.length} partial yang sudah
                selesai tapi{" "}
                <span className="font-bold">belum tersimpan ke database!</span>{" "}
                Centang ayat dan simpan hafalan sekarang.
              </>
            ) : showWarning ? (
              <>
                Anda telah menyelesaikan {completedPartials.length} partial.
                <span className="font-semibold">
                  {" "}
                  Jangan lupa simpan hafalan
                </span>{" "}
                agar ayat tercatat di database!
              </>
            ) : (
              <>
                Santri telah menyelesaikan {completedPartials.length} partial
                hafalan pada sesi sebelumnya.
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            {completedPartials.slice(0, 5).map((partial) => (
              <Badge
                key={partial.id}
                variant="secondary"
                className={`${
                  isCritical
                    ? "bg-red-100 text-red-800"
                    : showWarning
                    ? "bg-orange-100 text-orange-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Ayat {partial.ayatNumber}
              </Badge>
            ))}
            {completedPartials.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{completedPartials.length - 5} lainnya
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {/* Button to restore ayat checks from unsaved partials */}
            {isCritical && onRestoreAyatChecks && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-400 text-red-700 hover:bg-red-100"
                onClick={() =>
                  onRestoreAyatChecks(completedPartials.map((p) => p.ayatNumber))
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Centang Ayat Otomatis
              </Button>
            )}

            {showWarning && onSaveHafalan && (
              <Button
                size="sm"
                className={`${
                  isCritical
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
                onClick={onSaveHafalan}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Simpan Hafalan Sekarang
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
