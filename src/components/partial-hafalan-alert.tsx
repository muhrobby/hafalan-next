"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Info, Clock, CheckCircle, Trash2, Lock, Pause } from "lucide-react";
import { PartialHafalan } from "@/hooks/use-partial-hafalan";

interface PartialHafalanAlertProps {
  partials: PartialHafalan[];
  kacaInfo?: {
    pageNumber: number;
    surahName: string;
  };
  onViewDetails?: () => void;
  onComplete?: (partialId: string, ayatNumber: number) => void;
  onDelete?: (partialId: string) => void;
  showActions?: boolean;
}

export function PartialHafalanAlert({
  partials,
  kacaInfo,
  onViewDetails,
  onComplete,
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
          Ayat dengan partial aktif dan ayat setelahnya terkunci sampai partial diselesaikan
        </p>
        <div className="mt-2 space-y-3">
          {partials.slice(0, 5).map((partial) => (
            <div
              key={partial.id}
              className="flex flex-col gap-2 p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-amber-200/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
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
                  <div className="flex items-center gap-1">
                    {onComplete && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => onComplete(partial.id, partial.ayatNumber)}
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
