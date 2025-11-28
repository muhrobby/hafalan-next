"use client";

/**
 * RaportStats Component
 *
 * Summary statistics untuk raport
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/formatters";
import type { RaportStatsProps } from "./types";

export function RaportStats({ summary, loading = false }: RaportStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Kaca",
      value: summary.totalKaca,
      icon: BookOpen,
      color: "text-gray-900",
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      title: "Selesai",
      value: summary.completedKaca,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Progress",
      value: summary.inProgressKaca,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Menunggu Recheck",
      value: summary.waitingRecheck,
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Tingkat Kelulusan",
      value: `${summary.successRate}%`,
      icon: Award,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
      isPercentage: true,
    },
    {
      title: "Rata-rata/Minggu",
      value: summary.averagePerWeek.toFixed(1),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stat.color)}>
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString("id-ID")
                  : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar keseluruhan */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Progress Keseluruhan</p>
              <p className="text-sm text-muted-foreground">
                {summary.completedKaca} dari {summary.totalKaca} kaca selesai
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-600">
                {summary.successRate}%
              </span>
              {summary.lastActivity && (
                <p className="text-xs text-muted-foreground">
                  Terakhir aktif: {formatRelative(summary.lastActivity)}
                </p>
              )}
            </div>
          </div>
          <Progress value={summary.successRate} className="h-3" />

          {/* Detail breakdown */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                {summary.completedKaca}
              </p>
              <p className="text-xs text-muted-foreground">Lulus Recheck</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-amber-600">
                {summary.waitingRecheck}
              </p>
              <p className="text-xs text-muted-foreground">Menunggu Recheck</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600">
                {summary.inProgressKaca}
              </p>
              <p className="text-xs text-muted-foreground">Sedang Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact version untuk card kecil
export function RaportStatsCompact({
  summary,
  loading = false,
}: RaportStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-12 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gray-100 rounded-lg">
          <BookOpen className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <p className="text-lg font-bold">{summary.totalKaca}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-green-600">
            {summary.completedKaca}
          </p>
          <p className="text-xs text-muted-foreground">Selesai</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-amber-600">
            {summary.waitingRecheck}
          </p>
          <p className="text-xs text-muted-foreground">Menunggu</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Clock className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-blue-600">
            {summary.inProgressKaca}
          </p>
          <p className="text-xs text-muted-foreground">Progress</p>
        </div>
      </div>
    </div>
  );
}
