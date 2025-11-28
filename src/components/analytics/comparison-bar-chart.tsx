"use client";

/**
 * ComparisonBarChart Component
 *
 * Bar chart untuk membandingkan data antar santri/kategori
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { chartColors, getPaletteColor } from "@/lib/status-config";
import { cn } from "@/lib/utils";
import type { ComparisonBarChartProps, ComparisonData } from "./types";

interface ExtendedComparisonBarChartProps extends ComparisonBarChartProps {
  title?: string;
  description?: string;
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-sm text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium">
              {entry.value.toLocaleString("id-ID")}
            </span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="border-t mt-2 pt-2">
            <span className="text-gray-600">Total: </span>
            <span className="font-medium">
              {payload
                .reduce((sum: number, p: any) => sum + p.value, 0)
                .toLocaleString("id-ID")}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function ComparisonBarChart({
  data,
  height = 350,
  showGrid = true,
  horizontal = false,
  title,
  description,
  className,
}: ExtendedComparisonBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            Belum ada data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={horizontal ? { left: 80 } : undefined}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={!horizontal}
                horizontal={horizontal}
              />
            )}
            {horizontal ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={75}
                  tick={{ fontSize: 12 }}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
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
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 16 }} iconType="circle" />
            <Bar
              dataKey="completed"
              name="Selesai"
              fill={chartColors.primary}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="inProgress"
              name="Progress"
              fill={chartColors.secondary}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            {data[0]?.waiting !== undefined && (
              <Bar
                dataKey="waiting"
                name="Menunggu"
                fill={chartColors.quaternary}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Simple comparison without card wrapper
export function SimpleComparisonBar({
  data,
  height = 350,
  showGrid = true,
  horizontal = false,
}: Omit<ComparisonBarChartProps, "className">) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        Belum ada data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={horizontal ? { left: 80 } : undefined}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="name"
              type="category"
              width={75}
              tick={{ fontSize: 12 }}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 16 }} iconType="circle" />
        <Bar
          dataKey="completed"
          name="Selesai"
          fill={chartColors.primary}
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
        <Bar
          dataKey="inProgress"
          name="Progress"
          fill={chartColors.secondary}
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Single metric bar chart (for teacher performance, etc.)
interface SingleBarChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  horizontal?: boolean;
  title?: string;
  description?: string;
  className?: string;
  dataLabel?: string;
}

export function SingleBarChart({
  data,
  height = 300,
  horizontal = true,
  title,
  description,
  className,
  dataLabel = "Jumlah",
}: SingleBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            Belum ada data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={horizontal ? { left: 80 } : undefined}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            {horizontal ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={75}
                  tick={{ fontSize: 12 }}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              name={dataLabel}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || getPaletteColor(index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
