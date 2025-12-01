"use client";

/**
 * Professional Raport Template
 * Template raport profesional yang dapat dicetak dengan format resmi
 */

import React, { forwardRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  User,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useBranding } from "@/hooks/use-branding";

// Types
interface HafalanSummary {
  totalRecords: number;
  completedKaca: number;
  waitingRecheck: number;
  inProgress: number;
  completionRate: number;
}

interface HafalanRecord {
  id: string;
  kacaInfo: string;
  juzNumber: number;
  status: string;
  tanggalSetor: string;
  completedVerses: number;
  totalVerses: number;
  teacherName?: string;
  catatan?: string;
}

interface StudentInfo {
  name: string;
  nis: string;
  birthDate?: string;
  birthPlace?: string;
  address?: string;
  parentName?: string;
  teacherName?: string;
}

interface RaportTemplateProps {
  studentInfo: StudentInfo;
  summary: HafalanSummary;
  records: HafalanRecord[];
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  teacherNotes?: string;
  className?: string;
}

// Print-only styles component
const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      body * {
        visibility: hidden;
      }
      .print-area,
      .print-area * {
        visibility: visible;
      }
      .print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20mm;
        background: white !important;
      }
      .no-print {
        display: none !important;
      }
      .print-break {
        page-break-before: always;
      }
      @page {
        margin: 15mm;
        size: A4;
      }
    }
  `}</style>
);

// Raport Header Component
function RaportHeader({
  institutionName,
  institutionTagline,
  logoUrl,
  studentInfo,
  periodLabel,
}: {
  institutionName: string;
  institutionTagline: string;
  logoUrl?: string;
  studentInfo: StudentInfo;
  periodLabel: string;
}) {
  return (
    <div className="text-center mb-8">
      {/* Institution Header */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
            {institutionName}
          </h1>
          <p className="text-sm text-gray-600">{institutionTagline}</p>
        </div>
      </div>

      <div className="border-t-4 border-b-2 border-emerald-600 py-2 mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          RAPORT HAFALAN AL-QUR&apos;AN
        </h2>
        <p className="text-sm text-gray-600">Periode: {periodLabel}</p>
      </div>

      {/* Student Info */}
      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex">
              <span className="w-32 text-gray-600">Nama Santri</span>
              <span className="font-semibold">: {studentInfo.name}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-gray-600">NIS</span>
              <span className="font-semibold">: {studentInfo.nis}</span>
            </div>
            {studentInfo.birthPlace && studentInfo.birthDate && (
              <div className="flex">
                <span className="w-32 text-gray-600">TTL</span>
                <span>
                  : {studentInfo.birthPlace},{" "}
                  {format(new Date(studentInfo.birthDate), "d MMMM yyyy", {
                    locale: idLocale,
                  })}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {studentInfo.teacherName && (
              <div className="flex">
                <span className="w-32 text-gray-600">Guru Pembimbing</span>
                <span>: {studentInfo.teacherName}</span>
              </div>
            )}
            {studentInfo.parentName && (
              <div className="flex">
                <span className="w-32 text-gray-600">Nama Wali</span>
                <span>: {studentInfo.parentName}</span>
              </div>
            )}
            {studentInfo.address && (
              <div className="flex">
                <span className="w-32 text-gray-600">Alamat</span>
                <span className="line-clamp-2">: {studentInfo.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Section Component
function SummarySection({ summary }: { summary: HafalanSummary }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Award className="h-5 w-5 text-emerald-600" />
        Ringkasan Hafalan
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200">
          <div className="text-3xl font-bold text-emerald-700">
            {summary.totalRecords}
          </div>
          <div className="text-sm text-emerald-600">Total Setoran</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
          <div className="text-3xl font-bold text-green-700">
            {summary.completedKaca}
          </div>
          <div className="text-sm text-green-600">Kaca Lulus</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
          <div className="text-3xl font-bold text-amber-700">
            {summary.waitingRecheck}
          </div>
          <div className="text-sm text-amber-600">Menunggu Muroja&apos;ah</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
          <div className="text-3xl font-bold text-blue-700">
            {summary.inProgress}
          </div>
          <div className="text-sm text-blue-600">Sedang Proses</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Tingkat Kelulusan
          </span>
          <span className="text-sm font-bold text-emerald-600">
            {summary.completionRate}%
          </span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${summary.completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Hafalan Details Table
function HafalanDetailsTable({ records }: { records: HafalanRecord[] }) {
  // Group by juz
  const groupedByJuz = useMemo(() => {
    const groups: Record<number, HafalanRecord[]> = {};
    records.forEach((record) => {
      if (!groups[record.juzNumber]) {
        groups[record.juzNumber] = [];
      }
      groups[record.juzNumber].push(record);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([juz, items]) => ({
        juz: Number(juz),
        records: items.sort(
          (a, b) =>
            new Date(b.tanggalSetor).getTime() -
            new Date(a.tanggalSetor).getTime()
        ),
      }));
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Belum ada data hafalan pada periode ini</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-emerald-600" />
        Rincian Hafalan
      </h3>

      {groupedByJuz.map(({ juz, records: juzRecords }) => (
        <div key={juz} className="mb-6">
          <div className="bg-emerald-100 px-4 py-2 rounded-t-lg border border-emerald-200 border-b-0">
            <h4 className="font-semibold text-emerald-800">Juz {juz}</h4>
          </div>
          <div className="border border-gray-200 rounded-b-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Kaca / Surah</TableHead>
                  <TableHead className="text-center">Ayat</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Tanggal Setor</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {juzRecords.map((record, idx) => (
                  <TableRow key={record.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {record.kacaInfo}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {record.completedVerses}/{record.totalVerses}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.tanggalSetor), "d MMM yyyy", {
                        locale: idLocale,
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                      {record.catatan || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}

// Signature Section
function SignatureSection({
  teacherName,
  periodEnd,
}: {
  teacherName?: string;
  periodEnd: Date;
}) {
  return (
    <div className="mt-12 print-break">
      <div className="grid grid-cols-2 gap-8">
        {/* Teacher Signature */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-16">Guru Pembimbing</p>
          <div className="border-b border-gray-400 mx-auto w-48 mb-2" />
          <p className="font-medium">{teacherName || "________________"}</p>
          <p className="text-xs text-gray-500">NIP. ________________</p>
        </div>

        {/* Parent/Guardian Signature */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-16">Orang Tua / Wali</p>
          <div className="border-b border-gray-400 mx-auto w-48 mb-2" />
          <p className="font-medium">________________</p>
        </div>
      </div>

      {/* Date and Stamp area */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          {format(periodEnd, "'Dikeluarkan pada tanggal' d MMMM yyyy", {
            locale: idLocale,
          })}
        </p>
      </div>
    </div>
  );
}

// Main Raport Template Component
export const RaportTemplate = forwardRef<HTMLDivElement, RaportTemplateProps>(
  function RaportTemplate(
    {
      studentInfo,
      summary,
      records,
      periodLabel,
      periodStart,
      periodEnd,
      teacherNotes,
      className,
    },
    ref
  ) {
    const { branding, isLoading } = useBranding();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      );
    }

    return (
      <>
        <PrintStyles />
        <div
          ref={ref}
          className={cn("print-area bg-white p-8 max-w-4xl mx-auto", className)}
        >
          <RaportHeader
            institutionName={branding.institutionName}
            institutionTagline={branding.institutionTagline}
            logoUrl={branding.logoUrl}
            studentInfo={studentInfo}
            periodLabel={periodLabel}
          />

          <SummarySection summary={summary} />

          <Separator className="my-6" />

          <HafalanDetailsTable records={records} />

          {/* Teacher Notes */}
          {teacherNotes && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Catatan Guru
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-line">
                  {teacherNotes}
                </p>
              </div>
            </div>
          )}

          <SignatureSection
            teacherName={studentInfo.teacherName}
            periodEnd={periodEnd}
          />
        </div>
      </>
    );
  }
);

// Raport Action Buttons
export function RaportPrintActions({
  onPrint,
  onDownload,
  className,
}: {
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
}) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={cn("flex items-center gap-2 no-print", className)}>
      <Button onClick={handlePrint} variant="outline" className="gap-2">
        <Printer className="h-4 w-4" />
        Cetak Raport
      </Button>
      {onDownload && (
        <Button onClick={onDownload} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      )}
    </div>
  );
}

// Raport Preview Card (for selecting student)
export function RaportPreviewCard({
  studentName,
  studentNis,
  totalRecords,
  completedKaca,
  lastActivity,
  onViewRaport,
  className,
}: {
  studentName: string;
  studentNis: string;
  totalRecords: number;
  completedKaca: number;
  lastActivity?: string;
  onViewRaport: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{studentName}</p>
              <p className="text-sm text-gray-500">NIS: {studentNis}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total: </span>
                <span className="font-semibold">{totalRecords}</span>
              </div>
              <div>
                <span className="text-gray-500">Lulus: </span>
                <span className="font-semibold text-emerald-600">
                  {completedKaca}
                </span>
              </div>
            </div>
            {lastActivity && (
              <p className="text-xs text-gray-400 mt-1">
                Terakhir: {lastActivity}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={onViewRaport}
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Lihat Raport
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RaportTemplate;
