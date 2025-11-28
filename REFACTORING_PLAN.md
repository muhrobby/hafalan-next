# 🚀 REFACTORING PLAN - Hafalan Al-Qur'an App

> **Tanggal:** 2024
> **Status:** ✅ PHASE 1-6 COMPLETED
> **Tujuan:** Unifikasi tampilan, profesionalisasi analytics, konsistensi data, dan optimasi menu

---

## 📋 RINGKASAN EKSEKUTIF

### Scope Refactoring:

| No  | Area                 | Prioritas | Status  |
| --- | -------------------- | --------- | ------- |
| 1   | Shared Libraries     | 🔴 HIGH   | ✅ DONE |
| 2   | Analytics Components | 🔴 HIGH   | ✅ DONE |
| 3   | Raport Components    | 🔴 HIGH   | ✅ DONE |
| 4   | Santri Components    | 🔴 HIGH   | ✅ DONE |
| 5   | UI Components        | 🔴 HIGH   | ✅ DONE |
| 6   | Page Updates         | 🟡 MEDIUM | ✅ DONE |

### Komponen yang Telah Dibuat:

| Directory                   | Files  | Lines      |
| --------------------------- | ------ | ---------- |
| `src/lib/`                  | 2      | ~180       |
| `src/components/ui/`        | 2      | ~270       |
| `src/components/analytics/` | 8      | ~600       |
| `src/components/raport/`    | 6      | ~550       |
| `src/components/santri/`    | 6      | ~550       |
| **Total**                   | **24** | **~2,150** |

---

## ✅ COMPLETED PHASES

### Phase 1: Shared Libraries ✅

- `src/lib/formatters.ts` - Unified date/number formatting
- `src/lib/status-config.ts` - Centralized status configuration

### Phase 2: Analytics Components ✅

- `src/components/analytics/types.ts`
- `src/components/analytics/stats-card.tsx`
- `src/components/analytics/trend-line-chart.tsx`
- `src/components/analytics/comparison-bar-chart.tsx`
- `src/components/analytics/status-pie-chart.tsx`
- `src/components/analytics/activity-chart.tsx`
- `src/components/analytics/progress-gauge.tsx`
- `src/components/analytics/index.ts`

### Phase 3: Raport Components ✅

- `src/components/raport/types.ts`
- `src/components/raport/raport-stats.tsx`
- `src/components/raport/raport-charts.tsx`
- `src/components/raport/raport-table.tsx`
- `src/components/raport/raport-actions.tsx`
- `src/components/raport/index.ts`

### Phase 4: Santri Components ✅

- `src/components/santri/types.ts`
- `src/components/santri/use-santri-data.ts`
- `src/components/santri/santri-list.tsx`
- `src/components/santri/santri-detail.tsx`
- `src/components/santri/santri-lookup.tsx`
- `src/components/santri/index.ts`

### Phase 5: UI Components ✅

- `src/components/ui/status-badge.tsx`
- `src/components/ui/teacher-badges.tsx`

### Phase 6: Page Updates ✅

Migrated 11 pages to use shared StatusBadge component:

- `admin/hafalan/page.tsx` - Removed local getStatusBadge
- `admin/santri-lookup/page.tsx` - Removed local getStatusBadge
- `raport/download/page.tsx` - Removed local getStatusBadge
- `santri/hafalan/page.tsx` - Removed local getStatusBadge
- `teacher/raport/page.tsx` - Removed local getStatusBadge
- `teacher/santri-lookup/page.tsx` - Removed local getStatusBadge
- `teacher/santri/page.tsx` - Removed local getStatusBadge
- `wali/children/page.tsx` - Removed local getStatusBadge
- `wali/reports/page.tsx` - Removed local getStatusBadge
- `components/raport/raport-table.tsx` - Removed local getStatusBadge
- `components/recent-activity-table.tsx` - Removed local getStatusBadge

**Result:** ~389 lines removed, code duplication eliminated

---

## 📚 DOCUMENTATION

Lihat `SHARED_COMPONENTS.md` untuk dokumentasi lengkap penggunaan komponen.

---

## 1️⃣ UNIFIED RAPORT VIEW

### 1.1 Kondisi Saat Ini

| Page                       | Lines | Features                                                                                                            |
| -------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------- |
| `teacher/raport/page.tsx`  | 1,347 | ✅ Charts (Pie, Bar, Line), ✅ Date range picker, ✅ Santri selector, ✅ JuzSelector, ✅ Export PDF/Excel, ✅ Print |
| `wali/reports/page.tsx`    | 632   | ✅ Child selector, ✅ Period filter, ✅ Print/Download, ❌ No advanced charts                                       |
| `raport/download/page.tsx` | 618   | ✅ Shared download, ✅ Suspense wrapper                                                                             |

### 1.2 Target Unifikasi

**Buat Shared Component:**

```
src/components/raport/
├── RaportView.tsx          # Main unified component
├── RaportHeader.tsx        # Title, santri info, date range
├── RaportCharts.tsx        # Status pie, monthly bar, trend line
├── RaportTable.tsx         # Hafalan records table
├── RaportStats.tsx         # Summary statistics
├── RaportActions.tsx       # Print, export, role-specific buttons
└── types.ts                # Shared types
```

### 1.3 Role-Based Button Matrix

| Button         | Admin | Teacher | Wali | Santri |
| -------------- | ----- | ------- | ---- | ------ |
| View           | ✅    | ✅      | ✅   | ✅     |
| Print          | ✅    | ✅      | ✅   | ✅     |
| Export PDF     | ✅    | ✅      | ✅   | ❌     |
| Export Excel   | ✅    | ✅      | ❌   | ❌     |
| Edit Hafalan   | ✅    | ✅      | ❌   | ❌     |
| Delete Hafalan | ✅    | ❌      | ❌   | ❌     |
| Input Hafalan  | ❌    | ✅      | ❌   | ❌     |

### 1.4 Implementation Steps

```markdown
Step 1: Create types.ts

- Define RaportData, HafalanRecord, RaportStats interfaces

Step 2: Create RaportCharts.tsx

- Extract chart components from teacher/raport
- Use Recharts with consistent styling
- Status distribution (Pie)
- Monthly progress (Bar)
- Trend line (Line with smooth curves)

Step 3: Create RaportTable.tsx

- Paginated table with hafalan records
- Role-based action columns

Step 4: Create RaportActions.tsx

- Print, export buttons
- Accept `role` prop for visibility control

Step 5: Create RaportView.tsx

- Compose all sub-components
- Accept props: { role, santriId, data, onEdit?, onDelete? }

Step 6: Update page files

- teacher/raport → <RaportView role="TEACHER" ... />
- wali/reports → <RaportView role="WALI" ... />
- admin/raport → <RaportView role="ADMIN" ... /> (if created)
```

### 1.5 Code Sample - RaportActions.tsx

```tsx
interface RaportActionsProps {
  role: "ADMIN" | "TEACHER" | "WALI" | "SANTRI";
  onPrint: () => void;
  onExportPDF: () => void;
  onExportExcel?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onInputHafalan?: () => void;
}

export function RaportActions({ role, ...handlers }: RaportActionsProps) {
  return (
    <div className="flex gap-2">
      {/* Always visible */}
      <Button onClick={handlers.onPrint}>Print</Button>

      {/* Admin, Teacher, Wali only */}
      {["ADMIN", "TEACHER", "WALI"].includes(role) && (
        <Button onClick={handlers.onExportPDF}>Export PDF</Button>
      )}

      {/* Admin, Teacher only */}
      {["ADMIN", "TEACHER"].includes(role) && handlers.onExportExcel && (
        <Button onClick={handlers.onExportExcel}>Export Excel</Button>
      )}

      {/* Teacher only */}
      {role === "TEACHER" && handlers.onInputHafalan && (
        <Button onClick={handlers.onInputHafalan}>Input Hafalan</Button>
      )}

      {/* Admin only */}
      {role === "ADMIN" && handlers.onDelete && (
        <Button variant="destructive" onClick={() => handlers.onDelete?.("id")}>
          Delete
        </Button>
      )}
    </div>
  );
}
```

---

## 2️⃣ PROFESSIONAL ANALYTICS

### 2.1 Kondisi Saat Ini

| Page                       | Lines | Charts                                                                                          |
| -------------------------- | ----- | ----------------------------------------------------------------------------------------------- |
| `admin/analytics/page.tsx` | 531   | ✅ UserStats, ✅ HafalanStats, ✅ MonthlyProgress (Bar), ✅ TeacherPerformance                  |
| `wali/progress/page.tsx`   | 685   | ✅ MonthlyProgress (Bar), ✅ ChildrenComparison, ✅ StatusDistribution (Pie), ✅ WeeklyActivity |
| `santri/progress/page.tsx` | 399   | ✅ MonthlyProgress (basic), ✅ JuzProgress                                                      |

### 2.2 Target Professional Analytics

**Fitur Baru:**

| Feature                | Description                               | Roles                |
| ---------------------- | ----------------------------------------- | -------------------- |
| Smooth Line Charts     | Trend analysis dengan curve interpolation | All                  |
| Comparison Charts      | Compare multiple santri/periods           | Admin, Teacher, Wali |
| Heatmap Calendar       | Daily activity visualization              | All                  |
| Performance Indicators | KPI cards dengan trend arrows             | Admin, Teacher       |
| Prediction/Target      | Target vs actual comparison               | All                  |

### 2.3 New Shared Components

```
src/components/analytics/
├── AnalyticsDashboard.tsx    # Main container
├── StatsCard.tsx             # KPI card with trend indicator
├── TrendLineChart.tsx        # Smooth line with area fill
├── ComparisonBarChart.tsx    # Multi-series bar chart
├── PerformancePieChart.tsx   # Donut chart dengan center text
├── ActivityHeatmap.tsx       # Calendar heatmap
├── ProgressGauge.tsx         # Circular progress indicator
├── TimeRangeFilter.tsx       # Unified filter (sudah ada)
└── types.ts
```

### 2.4 Design Specifications

**Color Palette (Professional):**

```tsx
const chartColors = {
  primary: "#10B981", // Emerald-500
  secondary: "#3B82F6", // Blue-500
  tertiary: "#8B5CF6", // Violet-500
  success: "#22C55E", // Green-500
  warning: "#F59E0B", // Amber-500
  danger: "#EF4444", // Red-500
  muted: "#94A3B8", // Slate-400
};
```

**Chart Styling:**

```tsx
// Smooth line chart
<LineChart data={data}>
  <Line
    type="monotone" // Smooth curve
    strokeWidth={3}
    dot={{ r: 4 }}
    activeDot={{ r: 6 }}
  />
  <Area fill="url(#gradient)" />
</LineChart>
```

### 2.5 StatsCard Component

```tsx
interface StatsCardProps {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  description?: string;
}

export function StatsCard({
  title,
  value,
  trend,
  icon,
  description,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div
            className={cn(
              "flex items-center text-xs",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.isPositive ? <TrendingUp /> : <TrendingDown />}
            <span>{Math.abs(trend.value)}% dari bulan lalu</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 2.6 Comparison Chart (Santri vs Santri)

```tsx
interface ComparisonData {
  period: string;
  [santriName: string]: number | string;
}

export function SantriComparisonChart({ data, santriNames }: Props) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Legend />
        {santriNames.map((name, i) => (
          <Bar
            key={name}
            dataKey={name}
            fill={chartColors[i % chartColors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## 3️⃣ DATA CONSISTENCY CHECK

### 3.1 Identified Issues

| Issue             | Location                          | Fix Required                    |
| ----------------- | --------------------------------- | ------------------------------- |
| Teacher Display   | Santri can have multiple teachers | Show all teachers, not just one |
| Wali Display      | Wali can have multiple children   | Consistent children count       |
| Stats Calculation | Different calculation methods     | Unified calculation logic       |
| Date Formatting   | Inconsistent date formats         | Use single formatter            |
| Status Labels     | Different status naming           | Unified status mapping          |

### 3.2 Files to Audit

**Teacher Display Issues:**

```
- src/app/admin/santri/page.tsx (line ~200-250)
- src/app/admin/santri-lookup/page.tsx (line ~300-400)
- src/app/teacher/santri/page.tsx
- src/app/wali/children/page.tsx
```

**Stats Calculation Issues:**

```
- src/app/admin/analytics/page.tsx
- src/app/teacher/raport/page.tsx
- src/app/wali/progress/page.tsx
- src/app/santri/progress/page.tsx
```

### 3.3 Fix: Multiple Teachers Display

**Current (Wrong):**

```tsx
// Hanya tampilkan 1 teacher
<span>{santri.teachers[0]?.teacher?.name || "-"}</span>
```

**Fixed (Correct):**

```tsx
// Tampilkan semua teachers
<div className="flex flex-wrap gap-1">
  {santri.teachers?.length > 0 ? (
    santri.teachers.map((t, idx) => (
      <Badge key={idx} variant="secondary">
        {t.teacher?.name}
      </Badge>
    ))
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</div>
```

### 3.4 Unified Date Formatter

**Create: `src/lib/formatters.ts`**

```tsx
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export const formatDate = (date: Date | string) =>
  format(new Date(date), "d MMMM yyyy", { locale: id });

export const formatDateTime = (date: Date | string) =>
  format(new Date(date), "d MMM yyyy, HH:mm", { locale: id });

export const formatRelative = (date: Date | string) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
```

### 3.5 Unified Status Mapping

**Create: `src/lib/status-config.ts`**

```tsx
export const hafalanStatusConfig = {
  PENDING: {
    label: "Menunggu",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "Proses",
    color: "bg-blue-100 text-blue-800",
    icon: RefreshCw,
  },
  COMPLETE_WAITING_RECHECK: {
    label: "Tunggu Recheck",
    color: "bg-orange-100 text-orange-800",
    icon: AlertCircle,
  },
  COMPLETE: {
    label: "Selesai",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
};

export const getStatusBadge = (status: keyof typeof hafalanStatusConfig) => {
  const config = hafalanStatusConfig[status];
  return (
    <Badge className={config.color}>
      <config.icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};
```

---

## 4️⃣ MENU REFACTORING

### 4.1 Current Menu Structure Analysis

**ADMIN (8 items):**

```
✅ Dashboard
✅ Manajemen User
✅ Data Santri
✅ Data Guru
✅ Rekap Hafalan
✅ Cek Progress Santri (santri-lookup)
✅ Analytics
✅ Pengaturan
```

**TEACHER (6 items):**

```
✅ Dashboard
✅ Santri Saya
✅ Input Hafalan
✅ Recheck Hafalan
✅ Cek Progress Santri (santri-lookup)
✅ Raport Santri
```

**WALI (4 items):**

```
✅ Dashboard
✅ Anak Saya
✅ Progress Hafalan
✅ Laporan
```

**SANTRI (4 items):**

```
✅ Dashboard
✅ Hafalan Saya
✅ Progress
✅ Profil
```

### 4.2 Identified Redundancies

| Issue          | Current State                                           | Recommendation                          |
| -------------- | ------------------------------------------------------- | --------------------------------------- |
| Santri Lookup  | Admin + Teacher have separate pages (1,924 lines total) | Create shared component, filter by role |
| Progress Pages | wali/progress + santri/progress overlap                 | Unify with role-based filters           |
| Raport/Reports | teacher/raport + wali/reports                           | Already addressed in Section 1          |

### 4.3 Recommended Menu Restructure

**ADMIN (reorganized):**

```
📊 Dashboard
👥 Manajemen
   ├── Users
   ├── Santri
   └── Guru
📚 Hafalan
   ├── Rekap
   └── Progress Santri
📈 Analytics
⚙️ Pengaturan
```

**TEACHER (reorganized):**

```
📊 Dashboard
👨‍🎓 Santri Saya
📚 Hafalan
   ├── Input
   └── Recheck (with badge)
📋 Progress & Raport
```

### 4.4 Shared Santri-Lookup Component

**Create: `src/components/santri/SantriLookup.tsx`**

```tsx
interface SantriLookupProps {
  role: "ADMIN" | "TEACHER";
  teacherId?: string; // Only for TEACHER role
}

export function SantriLookup({ role, teacherId }: SantriLookupProps) {
  // Admin sees all santri with teacher filter
  // Teacher sees only their assigned santri

  const apiUrl =
    role === "ADMIN"
      ? "/api/users?role=SANTRI"
      : `/api/users?role=SANTRI&teacherId=${teacherId}`;

  // ... rest of implementation
}
```

**Update pages:**

```tsx
// admin/santri-lookup/page.tsx
export default function AdminSantriLookup() {
  return <SantriLookup role="ADMIN" />;
}

// teacher/santri-lookup/page.tsx
export default function TeacherSantriLookup() {
  const session = useSession();
  return (
    <SantriLookup
      role="TEACHER"
      teacherId={session.data?.user?.teacherProfile?.id}
    />
  );
}
```

---

## 5️⃣ IMPLEMENTATION PRIORITY

### Phase 1: Critical Fixes (Day 1)

```markdown
1. [ ] Create src/lib/formatters.ts (unified date formatting)
2. [ ] Create src/lib/status-config.ts (unified status)
3. [ ] Fix multiple teachers display in all santri tables
4. [ ] Create src/components/raport/types.ts
```

### Phase 2: Raport Unification (Day 2)

```markdown
1. [ ] Create RaportCharts.tsx
2. [ ] Create RaportTable.tsx
3. [ ] Create RaportActions.tsx
4. [ ] Create RaportView.tsx (main component)
5. [ ] Update teacher/raport to use RaportView
6. [ ] Update wali/reports to use RaportView
```

### Phase 3: Analytics Enhancement (Day 3)

```markdown
1. [ ] Create StatsCard.tsx with trend indicators
2. [ ] Create TrendLineChart.tsx (smooth curves)
3. [ ] Create ComparisonBarChart.tsx
4. [ ] Create AnalyticsDashboard.tsx
5. [ ] Update admin/analytics
6. [ ] Update wali/progress
7. [ ] Update santri/progress
```

### Phase 4: Menu & Component Consolidation (Day 4)

```markdown
1. [ ] Create SantriLookup shared component
2. [ ] Refactor admin/santri-lookup
3. [ ] Refactor teacher/santri-lookup
4. [ ] Update menu config if needed
```

---

## 6️⃣ FILE CHANGES SUMMARY

### New Files to Create:

```
src/lib/
├── formatters.ts
└── status-config.ts

src/components/raport/
├── index.ts
├── types.ts
├── RaportView.tsx
├── RaportHeader.tsx
├── RaportCharts.tsx
├── RaportTable.tsx
├── RaportStats.tsx
└── RaportActions.tsx

src/components/analytics/
├── index.ts
├── types.ts
├── AnalyticsDashboard.tsx
├── StatsCard.tsx
├── TrendLineChart.tsx
├── ComparisonBarChart.tsx
├── PerformancePieChart.tsx
├── ProgressGauge.tsx
└── ActivityHeatmap.tsx

src/components/santri/
├── index.ts
└── SantriLookup.tsx
```

### Files to Update:

```
src/app/teacher/raport/page.tsx      # Use RaportView
src/app/wali/reports/page.tsx        # Use RaportView
src/app/admin/analytics/page.tsx     # Use AnalyticsDashboard
src/app/wali/progress/page.tsx       # Use AnalyticsDashboard
src/app/santri/progress/page.tsx     # Use AnalyticsDashboard
src/app/admin/santri-lookup/page.tsx # Use SantriLookup
src/app/teacher/santri-lookup/page.tsx # Use SantriLookup
src/app/admin/santri/page.tsx        # Fix teacher display
```

---

## 7️⃣ TESTING CHECKLIST

### After Each Phase:

```markdown
- [ ] `npm run build` passes without errors
- [ ] All pages load correctly
- [ ] Role-based access works
- [ ] Charts render properly
- [ ] Export/print functions work
- [ ] Mobile responsive
- [ ] No console errors
```

---

## 8️⃣ QUICK START

**Untuk memulai implementasi, jalankan perintah berikut:**

```bash
# 1. Buat struktur folder
mkdir -p src/components/raport
mkdir -p src/components/analytics
mkdir -p src/components/santri

# 2. Jalankan development server
npm run dev

# 3. Setelah setiap perubahan
npm run build
```

---

**📝 CATATAN:**

- Plan ini dapat disesuaikan sesuai kebutuhan
- Prioritaskan fixes yang critical terlebih dahulu
- Test setiap perubahan sebelum lanjut ke fase berikutnya
- Backup code sebelum major refactoring

---

_Plan dibuat berdasarkan analisis kode existing pada 2024_
