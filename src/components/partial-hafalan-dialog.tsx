"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { PartialHafalan } from "@/hooks/use-partial-hafalan";

interface PartialHafalanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  santriId: string;
  kacaId: string;
  kacaInfo: {
    pageNumber: number;
    surahName: string;
    ayatStart: number;
    ayatEnd: number;
  };
  availableAyats: number[];
  activePartials: PartialHafalan[];
  onSave: (data: {
    ayatNumber: number;
    progress: string;
    percentage?: number;
    catatan?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
}

const PERCENTAGE_OPTIONS = [
  { value: "25", label: "25% - Seperempat ayat" },
  { value: "50", label: "50% - Setengah ayat" },
  { value: "75", label: "75% - Tiga perempat ayat" },
];

export function PartialHafalanDialog({
  open,
  onOpenChange,
  kacaInfo,
  availableAyats,
  activePartials,
  onSave,
  onDelete,
  onComplete,
}: PartialHafalanDialogProps) {
  const [selectedAyat, setSelectedAyat] = useState<string>("");
  const [progress, setProgress] = useState("");
  const [percentage, setPercentage] = useState<string>("");
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out ayats that already have active partials
  const filteredAyats = availableAyats.filter(
    (ayat) =>
      !activePartials.some(
        (p) => p.ayatNumber === ayat && p.status === "IN_PROGRESS"
      )
  );

  const handleSave = async () => {
    if (!selectedAyat || !progress.trim()) {
      setError("Pilih ayat dan isi keterangan progress");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        ayatNumber: parseInt(selectedAyat),
        progress: progress.trim(),
        percentage: percentage ? parseInt(percentage) : undefined,
        catatan: catatan.trim() || undefined,
      });

      // Reset form
      setSelectedAyat("");
      setProgress("");
      setPercentage("");
      setCatatan("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus partial hafalan ini?")) return;

    setIsSubmitting(true);
    try {
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Tandai ayat ini sebagai selesai full?")) return;

    setIsSubmitting(true);
    try {
      await onComplete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyelesaikan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Partial Hafalan
          </DialogTitle>
          <DialogDescription>
            Kaca {kacaInfo.pageNumber} - {kacaInfo.surahName} (Ayat{" "}
            {kacaInfo.ayatStart}-{kacaInfo.ayatEnd})
          </DialogDescription>
        </DialogHeader>

        {/* Active Partials List */}
        {activePartials.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Partial Aktif</Label>
            <div className="space-y-2">
              {activePartials.map((partial) => (
                <div
                  key={partial.id}
                  className="flex items-start justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Ayat {partial.ayatNumber}</Badge>
                      {partial.percentage && (
                        <Badge variant="secondary">{partial.percentage}%</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {partial.progress}
                    </p>
                    {partial.catatan && (
                      <p className="text-xs text-muted-foreground italic">
                        Catatan: {partial.catatan}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(partial.tanggalSetor).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComplete(partial.id)}
                      disabled={isSubmitting}
                      title="Tandai selesai"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(partial.id)}
                      disabled={isSubmitting}
                      className="text-destructive hover:text-destructive"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Partial Form */}
        <div className="space-y-4 pt-2">
          {activePartials.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Tambah Partial Baru</Label>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="ayat">Pilih Ayat</Label>
            <Select value={selectedAyat} onValueChange={setSelectedAyat}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih ayat yang sedang dihafal" />
              </SelectTrigger>
              <SelectContent>
                {filteredAyats.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Semua ayat sudah punya partial aktif
                  </SelectItem>
                ) : (
                  filteredAyats.map((ayat) => (
                    <SelectItem key={ayat} value={String(ayat)}>
                      Ayat {ayat}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">Keterangan Progress *</Label>
            <Textarea
              id="progress"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="Contoh: Baru sampai tanda waqaf kedua"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentage">Persentase (opsional)</Label>
            <Select value={percentage} onValueChange={setPercentage}>
              <SelectTrigger>
                <SelectValue placeholder="Perkiraan progress" />
              </SelectTrigger>
              <SelectContent>
                {PERCENTAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan Guru (opsional)</Label>
            <Textarea
              id="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !selectedAyat || !progress.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Partial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
