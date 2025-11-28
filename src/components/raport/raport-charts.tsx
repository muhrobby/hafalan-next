"use client";

/**
 * RaportCharts Component
 *
 * Chart visualizations untuk raport
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { chartColors } from "@/lib/status-config";
import type { RaportChartsProps } from "./types";

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-sm text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString("id-ID")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Pie chart custom label
const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function RaportCharts({ data, loading = false }: RaportChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="progress" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="surah">Surah</TabsTrigger>
        <TabsTrigger value="juz">Juz</TabsTrigger>
      </TabsList>

      {/* Monthly Progress Chart */}
      <TabsContent value="progress">
        <Card>
          <CardHeader>
            <CardTitle>Progress Hafalan</CardTitle>
            <CardDescription>Perkembangan hafalan per periode</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {data.monthlyProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyProgress}>
                  <defs>
                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={chartColors.primary}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={chartColors.primary}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorProgress"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={chartColors.secondary}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={chartColors.secondary}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 16 }} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                    name="Selesai"
                    dot={{ r: 4, fill: chartColors.primary }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inProgress"
                    stroke={chartColors.secondary}
                    strokeWidth={2}
                    fill="url(#colorProgress)"
                    name="Progress"
                    dot={{ r: 4, fill: chartColors.secondary }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Belum ada data progress
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Status Distribution */}
      <TabsContent value="status">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status</CardTitle>
            <CardDescription>Pembagian status hafalan</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {data.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius={140}
                    innerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString("id-ID")}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Belum ada data status
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Surah Progress */}
      <TabsContent value="surah">
        <Card>
          <CardHeader>
            <CardTitle>Progress per Surah</CardTitle>
            <CardDescription>Top 10 surah yang dihafal</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {data.surahProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.surahProgress}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="surahName"
                    type="category"
                    width={90}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} ayat`,
                      name === "completedAyats" ? "Dihafal" : "Total",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="completedAyats"
                    fill={chartColors.primary}
                    name="Dihafal"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={25}
                  />
                  <Bar
                    dataKey="totalAyats"
                    fill={chartColors.muted}
                    name="Total"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Belum ada data surah
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Juz Progress */}
      <TabsContent value="juz">
        <Card>
          <CardHeader>
            <CardTitle>Progress per Juz</CardTitle>
            <CardDescription>Hafalan berdasarkan juz Al-Quran</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {data.juzProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.juzProgress}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="juz"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `Juz ${value}`}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString("id-ID")}
                    labelFormatter={(label) => `Juz ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="completed"
                    fill={chartColors.primary}
                    name="Selesai"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="total"
                    fill={chartColors.muted}
                    name="Total Kaca"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Belum ada data juz
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Simple chart version for dashboard
export function RaportChartsSimple({
  data,
  loading = false,
}: RaportChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[250px]" />
        <Skeleton className="h-[250px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Progress Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Progress Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthlyProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="completed"
                  fill={chartColors.primary}
                  name="Selesai"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="inProgress"
                  fill={chartColors.secondary}
                  name="Progress"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Belum ada data
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribusi Status</CardTitle>
        </CardHeader>
        <CardContent>
          {data.statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Belum ada data
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
