# 🎯 SHARED COMPONENTS DOCUMENTATION

> **Dokumentasi komponen-komponen shared yang telah dibuat untuk refactoring** > **Tanggal dibuat:** 2024

---

## 📁 STRUKTUR DIREKTORI

```
src/
├── lib/
│   ├── formatters.ts        # Unified date/number formatting
│   └── status-config.ts     # Centralized status definitions
├── components/
│   ├── ui/
│   │   ├── status-badge.tsx      # Consistent status display
│   │   └── teacher-badges.tsx    # Multiple teachers display
│   ├── analytics/
│   │   ├── types.ts              # Analytics type definitions
│   │   ├── stats-card.tsx        # Stats card with trend
│   │   ├── trend-line-chart.tsx  # Smooth line chart
│   │   ├── comparison-bar-chart.tsx # Grouped bar chart
│   │   ├── status-pie-chart.tsx  # Donut chart
│   │   ├── activity-chart.tsx    # Activity visualization
│   │   ├── progress-gauge.tsx    # Circular progress
│   │   └── index.ts              # Re-exports
│   ├── raport/
│   │   ├── types.ts              # Raport type definitions
│   │   ├── raport-stats.tsx      # Summary stats cards
│   │   ├── raport-charts.tsx     # Chart variants
│   │   ├── raport-table.tsx      # Table with actions
│   │   ├── raport-actions.tsx    # Action buttons by role
│   │   └── index.ts              # Re-exports
│   └── santri/
│       ├── types.ts              # Santri type definitions
│       ├── use-santri-data.ts    # Data fetching hook
│       ├── santri-list.tsx       # Santri list component
│       ├── santri-detail.tsx     # Santri detail view
│       ├── santri-lookup.tsx     # Combined lookup page
│       └── index.ts              # Re-exports
```

---

## 📚 LIB - UTILITIES

### `lib/formatters.ts`

**Fungsi Format Tanggal:**

```tsx
import { formatDate, formatDateTime, formatRelative } from "@/lib/formatters";

formatDate("2024-01-15"); // "15 Januari 2024"
formatDateTime("2024-01-15T10:30"); // "15 Jan 2024, 10:30"
formatRelative("2024-01-15"); // "2 hari yang lalu"
```

**Fungsi Format Angka:**

```tsx
import { formatNumber, formatPercent, formatCurrency } from "@/lib/formatters";

formatNumber(1234567); // "1.234.567"
formatNumber(1234567, true); // "1,2 jt"
formatPercent(0.8567); // "85,67%"
formatPercent(0.8567, 0); // "86%"
formatCurrency(50000); // "Rp 50.000"
```

---

### `lib/status-config.ts`

**Status Constants:**

```tsx
import { HAFALAN_STATUS, STATUS_COLORS } from "@/lib/status-config";

// Status keys
HAFALAN_STATUS.PROGRESS; // "PROGRESS"
HAFALAN_STATUS.COMPLETE_WAITING_RECHECK; // "COMPLETE_WAITING_RECHECK"
HAFALAN_STATUS.RECHECK_PASSED; // "RECHECK_PASSED"

// Color palette for charts
STATUS_COLORS.primary; // "#3b82f6" (blue)
STATUS_COLORS.success; // "#10b981" (green)
STATUS_COLORS.warning; // "#f59e0b" (amber)
STATUS_COLORS.danger; // "#ef4444" (red)
```

**Status Configuration:**

```tsx
import { getStatusConfig, getStatusColor } from "@/lib/status-config";

const config = getStatusConfig("PROGRESS");
// Returns:
// {
//   label: "Sedang Hafalan",
//   shortLabel: "Progress",
//   bgColor: "bg-blue-100 dark:bg-blue-950",
//   textColor: "text-blue-700 dark:text-blue-300",
//   borderColor: "border-blue-200 dark:border-blue-800",
//   chartColor: "#3b82f6",
//   icon: Clock (Lucide icon component)
// }

const color = getStatusColor("RECHECK_PASSED"); // "#10b981"
```

---

## 🎨 UI COMPONENTS

### `StatusBadge`

Badge yang konsisten untuk menampilkan status hafalan:

```tsx
import { StatusBadge, StatusDot, StatusWithCount } from "@/components/ui/status-badge";

// Basic usage
<StatusBadge status="PROGRESS" />
<StatusBadge status="RECHECK_PASSED" size="sm" />
<StatusBadge status="COMPLETE_WAITING_RECHECK" showIcon={false} />

// Dot indicator only
<StatusDot status="RECHECK_PASSED" />

// With count
<StatusWithCount status="PROGRESS" count={15} />
```

### `TeacherBadges`

Menampilkan daftar guru dengan tooltip:

```tsx
import { TeacherBadges, TeacherBadgesCompact, SingleTeacherBadge } from "@/components/ui/teacher-badges";

const teachers = [
  { id: "1", name: "Ustadz Ahmad", nip: "12345" },
  { id: "2", name: "Ustadz Budi" },
];

// Multiple teachers with tooltip
<TeacherBadges teachers={teachers} maxDisplay={2} />

// Compact version (single line)
<TeacherBadgesCompact teachers={teachers} />

// Single teacher
<SingleTeacherBadge teacher={teachers[0]} />

// For input/recheck teacher
import { InputRecheckTeachers } from "@/components/ui/teacher-badges";
<InputRecheckTeachers
  inputTeacher={{ id: "1", name: "Ustadz Ahmad" }}
  recheckTeacher={{ id: "2", name: "Ustadz Budi" }}
/>
```

---

## 📊 ANALYTICS COMPONENTS

### `StatsCard`

Card statistik dengan trend indicator:

```tsx
import { StatsCard, StatsCardCompact, StatsCardCenter } from "@/components/analytics";

<StatsCard
  title="Total Santri"
  value={150}
  icon={Users}
  trend={{ value: 12, isPositive: true }}
  description="Aktif bulan ini"
/>

<StatsCardCompact
  title="Selesai"
  value={85}
  icon={CheckCircle}
  iconColor="text-green-500"
/>

<StatsCardCenter
  title="Progress"
  value="75%"
  icon={TrendingUp}
  bgGradient="from-blue-500 to-blue-600"
/>
```

### `TrendLineChart`

Line chart dengan smooth curves dan gradient:

```tsx
import { TrendLineChart } from "@/components/analytics";

const data = [
  { date: "2024-01-01", value: 10, label: "Jan" },
  { date: "2024-02-01", value: 25, label: "Feb" },
];

<TrendLineChart
  data={data}
  title="Progress Bulanan"
  color="#3b82f6"
  height={300}
  showGrid={true}
/>;
```

### `ComparisonBarChart`

Grouped bar chart untuk perbandingan:

```tsx
import { ComparisonBarChart } from "@/components/analytics";

const data = [
  { name: "Ahmad", completed: 30, inProgress: 5, target: 40 },
  { name: "Budi", completed: 25, inProgress: 10, target: 40 },
];

<ComparisonBarChart
  data={data}
  title="Perbandingan Santri"
  keys={["completed", "inProgress"]}
  colors={["#10b981", "#3b82f6"]}
/>;
```

### `StatusPieChart`

Donut chart dengan legend:

```tsx
import { StatusPieChart } from "@/components/analytics";

const data = [
  { name: "Selesai", value: 50, color: "#10b981" },
  { name: "Proses", value: 30, color: "#3b82f6" },
  { name: "Menunggu", value: 20, color: "#f59e0b" },
];

<StatusPieChart data={data} title="Distribusi Status" showLegend={true} />;
```

### `ActivityChart`

Chart untuk visualisasi aktivitas harian/mingguan:

```tsx
import { ActivityChart } from "@/components/analytics";

const data = [
  { day: "Sen", setoran: 5, recheck: 3 },
  { day: "Sel", setoran: 8, recheck: 5 },
];

<ActivityChart
  data={data}
  title="Aktivitas Mingguan"
  type="bar" // or "line"
/>;
```

### `ProgressGauge`

Circular progress indicator:

```tsx
import { ProgressGauge } from "@/components/analytics";

<ProgressGauge
  value={75}
  max={100}
  label="Progress Hafalan"
  color="#10b981"
  size={120}
/>;
```

---

## 📄 RAPORT COMPONENTS

### `RaportStats`

Summary statistics untuk raport:

```tsx
import { RaportStats } from "@/components/raport";

<RaportStats
  totalKaca={604}
  completedKaca={150}
  waitingRecheck={10}
  inProgress={5}
/>;
```

### `RaportCharts`

Chart variants untuk raport:

```tsx
import { RaportCharts } from "@/components/raport";

<RaportCharts
  monthlyData={monthlyProgress}
  surahData={surahProgress}
  statusData={statusDistribution}
  activityData={weeklyActivity}
  variant="full" // or "compact"
/>;
```

### `RaportTable`

Tabel hafalan dengan action role-based:

```tsx
import { RaportTable } from "@/components/raport";

<RaportTable
  records={hafalanRecords}
  role="TEACHER"
  onEdit={(id) => handleEdit(id)}
  onRecheck={(id) => handleRecheck(id)}
  showPagination={true}
/>;
```

### `RaportActions`

Action buttons berdasarkan role:

```tsx
import { RaportActions } from "@/components/raport";

<RaportActions
  role="TEACHER"
  onPrint={() => window.print()}
  onExportPDF={() => exportToPDF()}
  onExportExcel={() => exportToExcel()}
  santriId="..."
/>;
```

---

## 👤 SANTRI COMPONENTS

### `SantriLookup`

Komponen utama untuk lookup santri (Admin & Teacher):

```tsx
import { SantriLookup } from "@/components/santri";

// Admin view dengan teacher filter
<SantriLookup
  showTeacherFilter={true}
  canInput={false}
  canRecheck={false}
  title="Semua Santri"
  subtitle="Filter berdasarkan guru"
/>

// Teacher view dengan action buttons
<SantriLookup
  showTeacherFilter={false}
  canInput={true}
  canRecheck={true}
  currentTeacherId={teacherId}
/>
```

### `useSantriData` Hook

Hook untuk data fetching:

```tsx
import { useSantriData } from "@/components/santri";

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
  resetError,
} = useSantriData({
  fetchTeachers: true,
  teacherId: undefined,
});
```

### `SantriList` & `SantriDetailView`

Komponen terpisah untuk list dan detail:

```tsx
import { SantriList, SantriDetailView } from "@/components/santri";

// List view
<SantriList
  teachers={teachers}
  santriList={santriList}
  selectedTeacher={selectedTeacher}
  searchQuery={searchQuery}
  selectedSantriId={selectedId}
  isLoading={isLoading}
  error={error}
  showTeacherFilter={true}
  onTeacherChange={setSelectedTeacher}
  onSearchChange={setSearchQuery}
  onSantriSelect={selectSantri}
/>

// Detail view
<SantriDetailView
  santri={selectedSantri}
  isLoading={isLoadingDetail}
  canInput={true}
  canRecheck={true}
  onRefresh={refreshSantriDetail}
  onInputHafalan={handleInput}
  onRecheck={handleRecheck}
/>
```

---

## ✅ CHECKLIST IMPLEMENTASI

### Phase 1: Libraries ✅

- [x] `lib/formatters.ts` - Date/number formatting
- [x] `lib/status-config.ts` - Status configuration

### Phase 2: UI Components ✅

- [x] `ui/status-badge.tsx` - StatusBadge, StatusDot, StatusWithCount
- [x] `ui/teacher-badges.tsx` - TeacherBadges, InputRecheckTeachers

### Phase 3: Analytics Components ✅

- [x] `analytics/types.ts` - Type definitions
- [x] `analytics/stats-card.tsx` - StatsCard variants
- [x] `analytics/trend-line-chart.tsx` - TrendLineChart
- [x] `analytics/comparison-bar-chart.tsx` - ComparisonBarChart
- [x] `analytics/status-pie-chart.tsx` - StatusPieChart
- [x] `analytics/activity-chart.tsx` - ActivityChart
- [x] `analytics/progress-gauge.tsx` - ProgressGauge
- [x] `analytics/index.ts` - Exports

### Phase 4: Raport Components ✅

- [x] `raport/types.ts` - Type definitions
- [x] `raport/raport-stats.tsx` - RaportStats
- [x] `raport/raport-charts.tsx` - RaportCharts
- [x] `raport/raport-table.tsx` - RaportTable
- [x] `raport/raport-actions.tsx` - RaportActions
- [x] `raport/index.ts` - Exports

### Phase 5: Santri Components ✅

- [x] `santri/types.ts` - Type definitions
- [x] `santri/use-santri-data.ts` - Data hook
- [x] `santri/santri-list.tsx` - SantriList
- [x] `santri/santri-detail.tsx` - SantriDetailView
- [x] `santri/santri-lookup.tsx` - SantriLookup
- [x] `santri/index.ts` - Exports

### Phase 6: Page Updates ⏳

- [ ] Update `admin/santri-lookup` to use SantriLookup
- [ ] Update `teacher/santri-lookup` to use SantriLookup
- [ ] Update `teacher/raport` to use Raport components
- [ ] Update `wali/reports` to use Raport components
- [ ] Update `admin/analytics` to use Analytics components

---

## 🎨 DESIGN CONSISTENCY

### Colors

```tsx
// Primary palette (from status-config)
Primary:  #3b82f6 (blue-500)
Success:  #10b981 (emerald-500)
Warning:  #f59e0b (amber-500)
Danger:   #ef4444 (red-500)
Neutral:  #6b7280 (gray-500)
```

### Chart Styling

```tsx
// Consistent chart props
const chartDefaults = {
  height: 300,
  margin: { top: 20, right: 20, bottom: 20, left: 0 },
  strokeWidth: 2,
  curveType: "monotone",
};
```

### Typography

```tsx
// Consistent text styles
Title: "text-lg font-semibold";
Subtitle: "text-sm text-muted-foreground";
Label: "text-xs font-medium";
Value: "text-2xl font-bold";
```

---

## 📝 USAGE NOTES

1. **Import dari index.ts** untuk clean imports:

   ```tsx
   import { StatusPieChart, TrendLineChart } from "@/components/analytics";
   import { RaportTable, RaportStats } from "@/components/raport";
   import { SantriLookup } from "@/components/santri";
   ```

2. **Gunakan formatters** untuk konsistensi display:

   ```tsx
   import { formatDate, formatPercent } from "@/lib/formatters";
   ```

3. **Gunakan status-config** untuk warna dan label konsisten:

   ```tsx
   import { getStatusConfig, STATUS_COLORS } from "@/lib/status-config";
   ```

4. **Pass role prop** untuk role-based features:
   ```tsx
   <RaportActions role={session.user.role} />
   ```
