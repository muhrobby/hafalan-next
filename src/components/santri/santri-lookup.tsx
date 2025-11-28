/**
 * Santri Lookup Page Component
 * Unified component for Admin and Teacher santri lookup
 */
"use client";

import { useSantriData } from "./use-santri-data";
import { SantriList } from "./santri-list";
import { SantriDetailView } from "./santri-detail";
import type { SantriLookupProps } from "./types";

export function SantriLookup({
  showTeacherFilter = false,
  canInput = false,
  canRecheck = false,
  currentTeacherId,
  title,
  subtitle,
}: SantriLookupProps) {
  const {
    teachers,
    santriList,
    selectedTeacher,
    searchQuery,
    selectedSantri,
    isLoading,
    isLoadingDetail,
    error,
    setSelectedTeacher,
    setSearchQuery,
    selectSantri,
    refreshSantriDetail,
  } = useSantriData({
    fetchTeachers: showTeacherFilter,
    teacherId: currentTeacherId,
  });

  // Handlers for teacher actions
  const handleInputHafalan = (santriId: string, kacaId?: number) => {
    // Navigate to input page with santri pre-selected
    const params = new URLSearchParams({ santriId });
    if (kacaId) params.append("kacaId", kacaId.toString());
    window.location.href = `/teacher/hafalan/input?${params}`;
  };

  const handleRecheck = (hafalanId: string) => {
    // Navigate to recheck page with hafalan pre-selected
    window.location.href = `/teacher/hafalan/recheck?id=${hafalanId}`;
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Santri List - 2 columns on large screens */}
      <div className="lg:col-span-2 h-[calc(100vh-12rem)]">
        <SantriList
          teachers={teachers}
          santriList={santriList}
          selectedTeacher={selectedTeacher}
          searchQuery={searchQuery}
          selectedSantriId={selectedSantri?.id ?? null}
          isLoading={isLoading}
          error={error}
          showTeacherFilter={showTeacherFilter}
          onTeacherChange={setSelectedTeacher}
          onSearchChange={setSearchQuery}
          onSantriSelect={selectSantri}
          title={title}
          subtitle={subtitle}
        />
      </div>

      {/* Santri Detail - 3 columns on large screens */}
      <div className="lg:col-span-3 h-[calc(100vh-12rem)]">
        <SantriDetailView
          santri={selectedSantri}
          isLoading={isLoadingDetail}
          canInput={canInput}
          canRecheck={canRecheck}
          onRefresh={refreshSantriDetail}
          onInputHafalan={handleInputHafalan}
          onRecheck={handleRecheck}
        />
      </div>
    </div>
  );
}
