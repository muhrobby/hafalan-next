"use client";

/**
 * ProgressGauge Component
 *
 * Circular progress indicator dengan persentase
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { chartColors } from "@/lib/status-config";

interface ProgressGaugeProps {
  value: number;
  max?: number;
  title?: string;
  description?: string;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: keyof typeof colorVariants;
  className?: string;
}

const colorVariants = {
  primary: {
    stroke: chartColors.primary,
    bg: "bg-emerald-100",
    text: "text-emerald-600",
  },
  secondary: {
    stroke: chartColors.secondary,
    bg: "bg-blue-100",
    text: "text-blue-600",
  },
  warning: {
    stroke: chartColors.warning,
    bg: "bg-amber-100",
    text: "text-amber-600",
  },
  danger: {
    stroke: chartColors.danger,
    bg: "bg-red-100",
    text: "text-red-600",
  },
  success: {
    stroke: chartColors.success,
    bg: "bg-green-100",
    text: "text-green-600",
  },
};

const sizeVariants = {
  sm: { size: 80, strokeWidth: 8, fontSize: "text-lg" },
  md: { size: 120, strokeWidth: 10, fontSize: "text-2xl" },
  lg: { size: 160, strokeWidth: 12, fontSize: "text-3xl" },
};

export function ProgressGauge({
  value,
  max = 100,
  title,
  description,
  label,
  showValue = true,
  size = "md",
  color = "primary",
  className,
}: ProgressGaugeProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizeConfig = sizeVariants[size];
  const colorConfig = colorVariants[color];

  const radius = (sizeConfig.size - sizeConfig.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex flex-col items-center justify-center">
        <div
          className="relative"
          style={{ width: sizeConfig.size, height: sizeConfig.size }}
        >
          {/* Background circle */}
          <svg
            className="transform -rotate-90"
            width={sizeConfig.size}
            height={sizeConfig.size}
          >
            <circle
              cx={sizeConfig.size / 2}
              cy={sizeConfig.size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={sizeConfig.strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={sizeConfig.size / 2}
              cy={sizeConfig.size / 2}
              r={radius}
              fill="none"
              stroke={colorConfig.stroke}
              strokeWidth={sizeConfig.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Center text */}
          {showValue && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "font-bold",
                  sizeConfig.fontSize,
                  colorConfig.text
                )}
              >
                {percentage.toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {label && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Simple gauge without card wrapper
export function SimpleProgressGauge({
  value,
  max = 100,
  size = "md",
  color = "primary",
  label,
}: Pick<ProgressGaugeProps, "value" | "max" | "size" | "color" | "label">) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizeConfig = sizeVariants[size];
  const colorConfig = colorVariants[color];

  const radius = (sizeConfig.size - sizeConfig.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: sizeConfig.size, height: sizeConfig.size }}
      >
        <svg
          className="transform -rotate-90"
          width={sizeConfig.size}
          height={sizeConfig.size}
        >
          <circle
            cx={sizeConfig.size / 2}
            cy={sizeConfig.size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={sizeConfig.strokeWidth}
          />
          <circle
            cx={sizeConfig.size / 2}
            cy={sizeConfig.size / 2}
            r={radius}
            fill="none"
            stroke={colorConfig.stroke}
            strokeWidth={sizeConfig.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn("font-bold", sizeConfig.fontSize, colorConfig.text)}
          >
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {label && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {label}
        </p>
      )}
    </div>
  );
}

// Linear progress with card
interface LinearProgressCardProps {
  value: number;
  max?: number;
  title: string;
  description?: string;
  showPercentage?: boolean;
  color?: keyof typeof colorVariants;
  className?: string;
}

export function LinearProgressCard({
  value,
  max = 100,
  title,
  description,
  showPercentage = true,
  color = "primary",
  className,
}: LinearProgressCardProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const colorConfig = colorVariants[color];

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-medium">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {showPercentage && (
            <span className={cn("text-lg font-bold", colorConfig.text)}>
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{value} selesai</span>
          <span>dari {max} total</span>
        </div>
      </CardContent>
    </Card>
  );
}
