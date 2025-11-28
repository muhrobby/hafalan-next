/**
 * Analytics Types
 *
 * Type definitions untuk komponen analytics
 */

export interface StatsCardData {
  title: string;
  value: number | string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  color?: "default" | "success" | "warning" | "danger" | "info" | "primary";
}

export interface ChartDataPoint {
  label: string;
  [key: string]: number | string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface ComparisonData {
  name: string;
  completed: number;
  inProgress: number;
  waiting?: number;
  total?: number;
}

export interface PerformanceData {
  name: string;
  value: number;
  target?: number;
  percentage?: number;
}

export interface ActivityData {
  day: string;
  count: number;
  date?: string;
}

export interface MonthlyProgressData {
  month: string;
  completed: number;
  inProgress: number;
  new?: number;
  total?: number;
}

export interface SantriProgressData {
  id: string;
  name: string;
  nis: string;
  totalKaca: number;
  completedKaca: number;
  inProgressKaca: number;
  waitingRecheck: number;
  percentage: number;
  teachers?: string[];
  lastActivity?: string;
}

export interface TeacherPerformanceData {
  id: string;
  name: string;
  santriCount: number;
  totalHafalan: number;
  completedHafalan: number;
  avgProgress: number;
  lastActivity?: string;
}

export interface AnalyticsSummary {
  totalHafalan: number;
  completedHafalan: number;
  inProgress: number;
  waitingRecheck: number;
  successRate: number;
  activeUsers: number;
  trend?: {
    hafalan: number;
    completed: number;
  };
}

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export type TimeRangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "1month"
  | "3months"
  | "6months"
  | "this_year"
  | "all";

export type ChartGranularity = "day" | "week" | "month";

export interface FilterState {
  timeRange: TimeRangePreset;
  dateRangeType: "preset" | "custom";
  startDate?: Date;
  endDate?: Date;
  granularity: ChartGranularity;
  santriId?: string;
  teacherId?: string;
}

// Props interfaces for components
export interface StatsCardProps extends StatsCardData {
  className?: string;
  loading?: boolean;
}

export interface TrendLineChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  secondaryDataKey?: string;
  xAxisKey?: string;
  height?: number;
  showArea?: boolean;
  showGrid?: boolean;
  smooth?: boolean;
  className?: string;
}

export interface ComparisonBarChartProps {
  data: ComparisonData[];
  height?: number;
  showGrid?: boolean;
  horizontal?: boolean;
  className?: string;
}

export interface StatusPieChartProps {
  data: StatusDistribution[];
  height?: number;
  showLabel?: boolean;
  donut?: boolean;
  className?: string;
}

export interface ActivityChartProps {
  data: ActivityData[];
  height?: number;
  type?: "bar" | "line";
  className?: string;
}
