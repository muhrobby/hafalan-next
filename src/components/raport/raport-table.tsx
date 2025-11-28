"use client";

/**
 * RaportTable Component
 *
 * Table untuk menampilkan daftar hafalan dengan action buttons berdasarkan role
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  MoreVertical,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { formatDateShort, formatRelative } from "@/lib/formatters";
import { getStatusConfig, hasPermission } from "@/lib/status-config";
import { cn } from "@/lib/utils";
import type { RaportTableProps, HafalanRecord } from "./types";

export function RaportTable({
  role,
  records,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onRecheck,
}: RaportTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<HafalanRecord | null>(
    null
  );

  // Filter records based on search
  const filteredRecords = records.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.santriName.toLowerCase().includes(searchLower) ||
      record.kacaInfo.toLowerCase().includes(searchLower) ||
      record.teacherName?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetail = (record: HafalanRecord) => {
    setSelectedRecord(record);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-64 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Daftar Hafalan</CardTitle>
              <CardDescription>
                {filteredRecords.length} dari {records.length} record
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari hafalan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchTerm
                  ? "Tidak ada hasil pencarian"
                  : "Belum ada data hafalan"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm
                  ? "Coba kata kunci lain"
                  : "Data hafalan akan muncul di sini"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px]">Santri</TableHead>
                    <TableHead className="w-[180px]">Kaca</TableHead>
                    <TableHead className="w-[80px]">Juz</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[120px]">Tanggal</TableHead>
                    <TableHead className="w-[150px]">Guru</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {record.santriName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.kacaInfo}
                          <div className="text-xs text-muted-foreground">
                            {record.completedVerses}/{record.totalVerses} ayat
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Juz {record.juzNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateShort(record.tanggalSetor)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.teacherName || "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetail(record)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>

                            {/* Teacher: Recheck button for waiting status */}
                            {role === "TEACHER" &&
                              record.status === "COMPLETE_WAITING_RECHECK" &&
                              onRecheck && (
                                <DropdownMenuItem
                                  onClick={() => onRecheck(record)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Recheck
                                </DropdownMenuItem>
                              )}

                            {/* Admin & Teacher: Edit */}
                            {hasPermission(role, "canEditHafalan") &&
                              onEdit && (
                                <DropdownMenuItem
                                  onClick={() => onEdit(record)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}

                            {/* Admin only: Delete */}
                            {hasPermission(role, "canDeleteHafalan") &&
                              onDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => onDelete(record)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedRecord}
        onOpenChange={() => setSelectedRecord(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Detail Hafalan</DialogTitle>
            <DialogDescription>
              Informasi lengkap hafalan santri
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Santri Info */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedRecord.santriName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedRecord.kacaInfo}
                    </p>
                  </div>
                  <StatusBadge status={selectedRecord.status} />
                </div>

                <Separator />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Juz</p>
                    <p className="font-medium">
                      Juz {selectedRecord.juzNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Progress Ayat
                    </p>
                    <p className="font-medium">
                      {selectedRecord.completedVerses} /{" "}
                      {selectedRecord.totalVerses} ayat
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tanggal Setor
                    </p>
                    <p className="font-medium">
                      {formatDateShort(selectedRecord.tanggalSetor)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Guru Pembimbing
                    </p>
                    <p className="font-medium">
                      {selectedRecord.teacherName || "-"}
                    </p>
                  </div>
                </div>

                {/* Catatan */}
                {selectedRecord.catatan && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Catatan
                      </p>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {selectedRecord.catatan}
                      </p>
                    </div>
                  </>
                )}

                {/* History */}
                {selectedRecord.history &&
                  selectedRecord.history.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-3">
                          Riwayat Perubahan
                        </p>
                        <div className="space-y-3">
                          {selectedRecord.history.map((h, idx) => (
                            <div key={idx} className="flex gap-3 text-sm">
                              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                              <div>
                                <p className="font-medium">{h.teacherName}</p>
                                <p className="text-muted-foreground">
                                  {formatDateShort(h.date)}
                                  {h.catatan && ` - ${h.catatan}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Recheck Records */}
                {selectedRecord.recheckRecords &&
                  selectedRecord.recheckRecords.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-3">
                          Riwayat Recheck
                        </p>
                        <div className="space-y-3">
                          {selectedRecord.recheckRecords.map((rr, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "p-3 rounded-lg border",
                                rr.allPassed
                                  ? "bg-green-50 border-green-200"
                                  : "bg-red-50 border-red-200"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {rr.allPassed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-medium text-sm">
                                  {rr.allPassed ? "Lulus" : "Tidak Lulus"}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Oleh {rr.recheckedByName} •{" "}
                                {formatDateShort(rr.recheckDate)}
                              </p>
                              {rr.failedAyats && rr.failedAyats.length > 0 && (
                                <p className="text-sm text-red-600 mt-1">
                                  Ayat gagal: {rr.failedAyats.join(", ")}
                                </p>
                              )}
                              {rr.catatan && (
                                <p className="text-sm mt-1">{rr.catatan}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact table for dashboard/cards
export function RaportTableCompact({
  records,
  maxItems = 5,
  loading = false,
}: {
  records: HafalanRecord[];
  maxItems?: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: maxItems }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const displayRecords = records.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayRecords.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Belum ada data
        </p>
      ) : (
        displayRecords.map((record) => {
          const statusConfig = getStatusConfig(record.status);

          return (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">
                  {record.santriName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {record.kacaInfo}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 shrink-0",
                  statusConfig.bgColor,
                  statusConfig.textColor
                )}
              >
                {statusConfig.shortLabel}
              </Badge>
            </div>
          );
        })
      )}
    </div>
  );
}
