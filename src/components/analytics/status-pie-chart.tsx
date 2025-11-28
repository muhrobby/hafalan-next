"use client";

/**
 * StatusPieChart Component
 *
 * Pie/Donut chart untuk distribusi status
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StatusPieChartProps, StatusDistribution } from "./types";

interface ExtendedStatusPieChartProps extends StatusPieChartProps {
  title?: string;
  description?: string;
  centerLabel?: string;
  centerValue?: string | number;
}

// Custom label untuk pie slices
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any) => {
  if (percent < 0.05) return null; // Hide labels for very small slices

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

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium text-sm">{data.name}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Jumlah:{" "}
          <span className="font-medium">
            {data.value.toLocaleString("id-ID")}
          </span>
        </p>
        {data.percentage !== undefined && (
          <p className="text-sm text-gray-600">
            Persentase:{" "}
            <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Custom legend
const renderCustomLegend = (props: any) => {
  const { payload } = props;

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function StatusPieChart({
  data,
  height = 350,
  showLabel = true,
  donut = true,
  title,
  description,
  centerLabel,
  centerValue,
  className,
}: ExtendedStatusPieChartProps) {
  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));

  if (!data || data.length === 0 || total === 0) {
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
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showLabel ? renderCustomizedLabel : undefined}
              outerRadius={height * 0.35}
              innerRadius={donut ? height * 0.2 : 0}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderCustomLegend} />

            {/* Center text for donut chart */}
            {donut && centerValue && (
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-900 text-2xl font-bold"
              >
                {centerValue}
              </text>
            )}
            {donut && centerLabel && (
              <text
                x="50%"
                y="55%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-500 text-sm"
              >
                {centerLabel}
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Simple pie without card wrapper
export function SimpleStatusPie({
  data,
  height = 300,
  showLabel = true,
  donut = true,
}: Omit<StatusPieChartProps, "className">) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));

  if (!data || data.length === 0 || total === 0) {
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
      <PieChart>
        <Pie
          data={dataWithPercentage}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showLabel ? renderCustomizedLabel : undefined}
          outerRadius={height * 0.35}
          innerRadius={donut ? height * 0.2 : 0}
          fill="#8884d8"
          dataKey="value"
        >
          {dataWithPercentage.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderCustomLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
