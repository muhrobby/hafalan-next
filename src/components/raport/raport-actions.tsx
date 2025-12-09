"use client";

/**
 * RaportActions Component
 *
 * Action buttons untuk raport berdasarkan role
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Share2,
} from "lucide-react";
import { hasPermission } from "@/lib/status-config";
import type { RaportActionsProps } from "./types";

export function RaportActions({
  role,
  onPrint,
  onExportPDF,
  onExportExcel,
}: RaportActionsProps) {
  const canExportPDF = hasPermission(role, "canExportPDF");
  const canExportExcel = hasPermission(role, "canExportExcel");
  const hasAnyExport = canExportPDF || canExportExcel;

  return (
    <div className="flex items-center gap-2">
      {/* Print Button - always visible */}
      {onPrint && (
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Cetak</span>
        </Button>
      )}

      {/* Export Dropdown */}
      {hasAnyExport && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canExportPDF && onExportPDF && (
              <DropdownMenuItem onClick={onExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            )}
            {canExportExcel && onExportExcel && (
              <DropdownMenuItem onClick={onExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Full width action bar
export function RaportActionBar({
  role,
  onPrint,
  onExportPDF,
  onExportExcel,
  onShare,
  santriName,
}: RaportActionsProps & { onShare?: () => void; santriName?: string }) {
  const canExportPDF = hasPermission(role, "canExportPDF");
  const canExportExcel = hasPermission(role, "canExportExcel");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
      <div>
        <p className="text-sm text-muted-foreground">
          {santriName ? `Raport untuk ${santriName}` : "Raport Hafalan"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onPrint && (
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        )}

        {canExportPDF && onExportPDF && (
          <Button variant="outline" size="sm" onClick={onExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        )}

        {canExportExcel && onExportExcel && (
          <Button variant="outline" size="sm" onClick={onExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
        )}

        {onShare && (
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Bagikan
          </Button>
        )}
      </div>
    </div>
  );
}

// Compact action buttons for cards
export function RaportActionsCompact({
  role,
  onPrint,
  onExportPDF,
}: Pick<RaportActionsProps, "role" | "onPrint" | "onExportPDF">) {
  const canExportPDF = hasPermission(role, "canExportPDF");

  return (
    <div className="flex items-center gap-1">
      {onPrint && (
        <Button variant="ghost" size="sm" onClick={onPrint} title="Cetak">
          <Printer className="h-4 w-4 mr-2" />
          Cetak
        </Button>
      )}
      {canExportPDF && onExportPDF && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportPDF}
          title="Export PDF"
        >
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>
      )}
    </div>
  );
}
