/**
 * Santri List Component
 * Displays list of santri with search and filter
 */
"use client";

import { Search, Users, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Teacher, Santri } from "./types";

interface SantriListProps {
  teachers: Teacher[];
  santriList: Santri[];
  selectedTeacher: string;
  searchQuery: string;
  selectedSantriId: string | null;
  isLoading: boolean;
  error: string | null;
  showTeacherFilter: boolean;
  onTeacherChange: (id: string) => void;
  onSearchChange: (query: string) => void;
  onSantriSelect: (id: string) => void;
  title?: string;
  subtitle?: string;
}

export function SantriList({
  teachers,
  santriList,
  selectedTeacher,
  searchQuery,
  selectedSantriId,
  isLoading,
  error,
  showTeacherFilter,
  onTeacherChange,
  onSearchChange,
  onSantriSelect,
  title = "Daftar Santri",
  subtitle = "Pilih santri untuk melihat detail",
}: SantriListProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Filters */}
        <div className="p-4 space-y-3 border-b bg-muted/30">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Teacher Filter (Admin only) */}
          {showTeacherFilter && (
            <Select value={selectedTeacher} onValueChange={onTeacherChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Guru" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Guru</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name || teacher.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Santri List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : santriList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">Tidak ada santri ditemukan</p>
              <p className="text-sm">Coba ubah filter pencarian</p>
            </div>
          ) : (
            <div className="divide-y">
              {santriList.map((santri) => (
                <button
                  key={santri.id}
                  onClick={() => onSantriSelect(santri.id)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    selectedSantriId === santri.id
                      ? "bg-primary/10 border-l-4 border-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {santri.name || "Tanpa Nama"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {santri.email}
                      </p>
                      {santri.angkatan && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Angkatan {santri.angkatan}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={santri.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {santri.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                      {showTeacherFilter && santri.teacher && (
                        <span className="text-xs text-muted-foreground">
                          {santri.teacher.name || santri.teacher.email}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {isLoading ? "Memuat..." : `${santriList.length} santri`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
