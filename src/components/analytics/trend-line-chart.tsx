"use client";

/**
 * TrendLineChart Component
 *
 * Line chart dengan smooth curves dan area fill untuk trend analysis
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { chartColors } from "@/lib/status-config";
import { cn } from "@/lib/utils";
import type { TrendLineChartProps, ChartDataPoint } from "./types";

interface ExtendedTrendLineChartProps extends TrendLineChartProps {
  title?: string;
  description?: string;
}

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

export function TrendLineChart({
  data,
  dataKey,
  secondaryDataKey,
  xAxisKey = "label",
  height = 300,
  showArea = true,
  showGrid = true,
  smooth = true,
  title,
  description,
  className,
}: ExtendedTrendLineChartProps) {
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

  const ChartComponent = showArea ? AreaChart : LineChart;

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
          <ChartComponent data={data}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
            )}
            <XAxis
              dataKey={xAxisKey}
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

            {/* Gradient definitions */}
            <defs>
              <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
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
              <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
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

            {showArea ? (
              <>
                <Area
                  type={smooth ? "monotone" : "linear"}
                  dataKey={dataKey}
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  fill="url(#colorPrimary)"
                  name="Selesai"
                  dot={{ r: 4, fill: chartColors.primary }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                {secondaryDataKey && (
                  <Area
                    type={smooth ? "monotone" : "linear"}
                    dataKey={secondaryDataKey}
                    stroke={chartColors.secondary}
                    strokeWidth={2}
                    fill="url(#colorSecondary)"
                    name="Progress"
                    dot={{ r: 4, fill: chartColors.secondary }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                )}
              </>
            ) : (
              <>
                <Line
                  type={smooth ? "monotone" : "linear"}
                  dataKey={dataKey}
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  name="Selesai"
                  dot={{ r: 4, fill: chartColors.primary, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                {secondaryDataKey && (
                  <Line
                    type={smooth ? "monotone" : "linear"}
                    dataKey={secondaryDataKey}
                    stroke={chartColors.secondary}
                    strokeWidth={3}
                    name="Progress"
                    dot={{ r: 4, fill: chartColors.secondary, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                )}
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Simple line chart without card wrapper
export function SimpleTrendLine({
  data,
  dataKey,
  secondaryDataKey,
  xAxisKey = "label",
  height = 300,
  showArea = true,
  smooth = true,
}: Omit<TrendLineChartProps, "className">) {
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
      <AreaChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e5e7eb"
          vertical={false}
        />
        <XAxis
          dataKey={xAxisKey}
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

        <defs>
          <linearGradient id="simpleColorPrimary" x1="0" y1="0" x2="0" y2="1">
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
          <linearGradient id="simpleColorSecondary" x1="0" y1="0" x2="0" y2="1">
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

        <Area
          type={smooth ? "monotone" : "linear"}
          dataKey={dataKey}
          stroke={chartColors.primary}
          strokeWidth={2}
          fill="url(#simpleColorPrimary)"
          name="Selesai"
          dot={{ r: 4, fill: chartColors.primary }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
        {secondaryDataKey && (
          <Area
            type={smooth ? "monotone" : "linear"}
            dataKey={secondaryDataKey}
            stroke={chartColors.secondary}
            strokeWidth={2}
            fill="url(#simpleColorSecondary)"
            name="Progress"
            dot={{ r: 4, fill: chartColors.secondary }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
