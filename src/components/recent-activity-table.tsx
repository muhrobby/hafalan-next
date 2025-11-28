"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, BookOpen, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { usePagination, DataTablePagination } from "@/components/data-table-pagination";

interface ActivityRecord {
  id: string;
  santriName?: string;
  kacaInfo: string;
  status: string;
  timestamp: string;
  teacherName?: string;
  catatan?: string;
  completedVerses?: number;
  totalVerses?: number;
  juzNumber?: number;
  surahName?: string;
  pageNumber?: number;
  ayatStart?: number;
  ayatEnd?: number;
}

interface RecentActivityTableProps {
  activities: ActivityRecord[];
  showSantriName?: boolean;
  showTeacherName?: boolean;
  emptyMessage?: string;
  title?: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PROGRESS":
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-max">
          <Clock className="h-3 w-3" />
          Progress
        </Badge>
      );
    case "COMPLETE_WAITING_RECHECK":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-amber-300 text-amber-700 bg-amber-50 w-max"
        >
          <AlertCircle className="h-3 w-3" />
          Menunggu Recheck
        </Badge>
      );
    case "RECHECK_PASSED":
      return (
        <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200 w-max">
          <CheckCircle className="h-3 w-3" />
          Selesai
        </Badge>
      );
    case "RECHECK_FAILED":
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-max">
          <XCircle className="h-3 w-3" />
          Perlu Perbaikan
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="w-max">{status}</Badge>;
  }
}

export function RecentActivityTable({
  activities,
  showSantriName = true,
  showTeacherName = false,
  emptyMessage = "Belum ada aktivitas",
  title,
}: RecentActivityTableProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(activities.length, 10);

  const paginatedData = paginateData(activities);

  const handleViewDetail = (activity: ActivityRecord) => {
    setSelectedActivity(activity);
    setDetailOpen(true);
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="font-medium text-lg">{title}</h3>}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showSantriName && <TableHead>Santri</TableHead>}
              <TableHead>Kaca/Hafalan</TableHead>
              {showTeacherName && <TableHead>Guru</TableHead>}
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((activity) => (
              <TableRow key={activity.id}>
                {showSantriName && (
                  <TableCell className="font-medium">
                    {activity.santriName || "-"}
                  </TableCell>
                )}
                <TableCell>
                  <div className="truncate max-w-[200px]" title={activity.kacaInfo}>
                    {activity.kacaInfo}
                  </div>
                </TableCell>
                {showTeacherName && (
                  <TableCell>
                    {activity.teacherName ? (
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border-blue-200"
                      >
                        👨‍🏫 {activity.teacherName}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
                <TableCell className="text-sm text-gray-600">
                  {activity.timestamp}
                </TableCell>
                <TableCell>{getStatusBadge(activity.status)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetail(activity)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={activities.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Aktivitas</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang hafalan ini
            </DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {showSantriName && selectedActivity.santriName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Santri</p>
                    <p className="text-base">{selectedActivity.santriName}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Hafalan</p>
                  <p className="text-base">{selectedActivity.kacaInfo}</p>
                </div>

                {selectedActivity.juzNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Juz</p>
                    <p className="text-base">Juz {selectedActivity.juzNumber}</p>
                  </div>
                )}

                {selectedActivity.pageNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Halaman</p>
                    <p className="text-base">{selectedActivity.pageNumber}</p>
                  </div>
                )}

                {selectedActivity.ayatStart && selectedActivity.ayatEnd && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ayat</p>
                    <p className="text-base">
                      {selectedActivity.ayatStart} - {selectedActivity.ayatEnd}
                    </p>
                  </div>
                )}

                {selectedActivity.completedVerses !== undefined && selectedActivity.totalVerses && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Progress Ayat</p>
                    <p className="text-base">
                      {selectedActivity.completedVerses} / {selectedActivity.totalVerses} ayat
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal</p>
                  <p className="text-base">{selectedActivity.timestamp}</p>
                </div>

                {showTeacherName && selectedActivity.teacherName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Guru</p>
                    <p className="text-base">{selectedActivity.teacherName}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedActivity.status)}
                  </div>
                </div>

                {selectedActivity.catatan && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Catatan</p>
                    <p className="text-base text-gray-700 italic">
                      {selectedActivity.catatan}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
