"use client";

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface TimeRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
  dateRangeType?: "preset" | "custom";
  onDateRangeTypeChange?: (type: "preset" | "custom") => void;
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  showGranularity?: boolean;
  granularity?: "day" | "week" | "month";
  onGranularityChange?: (granularity: "day" | "week" | "month") => void;
  className?: string;
  compact?: boolean;
}

export const timeRangePresets = [
  { value: "today", label: "Hari Ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "last_week", label: "Minggu Lalu" },
  { value: "this_month", label: "Bulan Ini" },
  { value: "last_month", label: "Bulan Lalu" },
  { value: "1month", label: "1 Bulan Terakhir" },
  { value: "3months", label: "3 Bulan Terakhir" },
  { value: "6months", label: "6 Bulan Terakhir" },
  { value: "this_year", label: "Tahun Ini" },
  { value: "all", label: "Semua Waktu" },
];

export function getDateRange(
  timeRange: string,
  dateRangeType: "preset" | "custom" = "preset",
  startDate?: Date,
  endDate?: Date
): DateRange {
  const now = new Date();

  if (dateRangeType === "custom" && startDate && endDate) {
    return {
      start: startOfDay(startDate),
      end: endOfDay(endDate),
      label: `${format(startDate, "d MMM yyyy", { locale: idLocale })} - ${format(endDate, "d MMM yyyy", { locale: idLocale })}`,
    };
  }

  switch (timeRange) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: "Hari Ini",
      };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
        label: "Kemarin",
      };
    case "this_week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
        label: "Minggu Ini",
      };
    case "last_week":
      const lastWeek = subDays(now, 7);
      return {
        start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        label: "Minggu Lalu",
      };
    case "this_month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: "Bulan Ini",
      };
    case "last_month":
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
        label: "Bulan Lalu",
      };
    case "1month":
      return {
        start: subMonths(now, 1),
        end: now,
        label: "1 Bulan Terakhir",
      };
    case "3months":
      return {
        start: subMonths(now, 3),
        end: now,
        label: "3 Bulan Terakhir",
      };
    case "6months":
      return {
        start: subMonths(now, 6),
        end: now,
        label: "6 Bulan Terakhir",
      };
    case "this_year":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
        label: "Tahun Ini",
      };
    case "all":
      return {
        start: new Date(2020, 0, 1),
        end: now,
        label: "Semua Waktu",
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: "Bulan Ini",
      };
  }
}

export function TimeRangeFilter({
  value,
  onChange,
  dateRangeType = "preset",
  onDateRangeTypeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showGranularity = false,
  granularity = "month",
  onGranularityChange,
  className,
  compact = false,
}: TimeRangeFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {/* Date Range Type Selector (if custom dates are supported) */}
      {onDateRangeTypeChange && (
        <div className={cn("space-y-1", compact ? "w-auto" : "flex-1 min-w-[140px]")}>
          {!compact && <Label className="text-xs text-gray-500">Tipe</Label>}
          <Select
            value={dateRangeType}
            onValueChange={(val: "preset" | "custom") => {
              onDateRangeTypeChange(val);
            }}
          >
            <SelectTrigger className={cn(compact && "h-8 text-xs")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preset">Preset</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Preset Time Range */}
      {dateRangeType === "preset" && (
        <div className={cn("space-y-1", compact ? "w-auto" : "flex-1 min-w-[160px]")}>
          {!compact && <Label className="text-xs text-gray-500">Rentang Waktu</Label>}
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={cn(compact && "h-8 text-xs")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangePresets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Custom Date Pickers */}
      {dateRangeType === "custom" && onStartDateChange && onEndDateChange && (
        <>
          <div className={cn("space-y-1", compact ? "w-auto" : "flex-1 min-w-[140px]")}>
            {!compact && <Label className="text-xs text-gray-500">Dari</Label>}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full",
                    !startDate && "text-muted-foreground",
                    compact && "h-8 text-xs"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "d MMM yyyy", { locale: idLocale }) : "Pilih"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className={cn("space-y-1", compact ? "w-auto" : "flex-1 min-w-[140px]")}>
            {!compact && <Label className="text-xs text-gray-500">Sampai</Label>}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full",
                    !endDate && "text-muted-foreground",
                    compact && "h-8 text-xs"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "d MMM yyyy", { locale: idLocale }) : "Pilih"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  disabled={(date) => (startDate ? date < startDate : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      {/* Granularity Selector */}
      {showGranularity && onGranularityChange && (
        <div className={cn("space-y-1", compact ? "w-auto" : "flex-1 min-w-[120px]")}>
          {!compact && <Label className="text-xs text-gray-500">Tampilan</Label>}
          <Select value={granularity} onValueChange={onGranularityChange}>
            <SelectTrigger className={cn(compact && "h-8 text-xs")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Harian</SelectItem>
              <SelectItem value="week">Mingguan</SelectItem>
              <SelectItem value="month">Bulanan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export function useTimeRange(defaultValue: string = "this_month") {
  const [timeRange, setTimeRange] = useState(defaultValue);
  const [dateRangeType, setDateRangeType] = useState<"preset" | "custom">("preset");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  const dateRange = useMemo(() => {
    return getDateRange(timeRange, dateRangeType, startDate, endDate);
  }, [timeRange, dateRangeType, startDate, endDate]);

  return {
    timeRange,
    setTimeRange,
    dateRangeType,
    setDateRangeType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    granularity,
    setGranularity,
    dateRange,
  };
}
