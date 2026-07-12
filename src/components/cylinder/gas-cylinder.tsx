"use client";

import { cn, gasLevelColor, gasLevelLabel } from "@/lib/utils";

interface GasCylinderProps {
  level: number;
  size?: "sm" | "md" | "lg";
  serial?: string;
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizes = {
  sm: { w: 56, h: 100, font: 11 },
  md: { w: 80, h: 140, font: 13 },
  lg: { w: 110, h: 190, font: 16 },
};

export function GasCylinder({
  level,
  size = "md",
  serial,
  showLabel = true,
  className,
  onClick,
}: GasCylinderProps) {
  const clamped = Math.max(0, Math.min(100, level));
  const dims = sizes[size];
  const color = gasLevelColor(clamped);
  const label = gasLevelLabel(clamped);
  const isCritical = label === "critical";

  const bodyTop = 28;
  const bodyBottom = dims.h - 18;
  const bodyHeight = bodyBottom - bodyTop;
  const fillHeight = (bodyHeight * clamped) / 100;
  const fillY = bodyBottom - fillHeight;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-2 text-left transition-opacity hover:opacity-90",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <svg
        width={dims.w}
        height={dims.h}
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        className={cn(isCritical && "animate-critical")}
        aria-label={`Gas cylinder at ${clamped}%`}
      >
        {/* Valve */}
        <rect x={dims.w / 2 - 6} y={4} width={12} height={10} fill="#6b6b6b" stroke="#4a4a4a" />
        <rect x={dims.w / 2 - 14} y={12} width={28} height={8} fill="#5a5a5a" stroke="#4a4a4a" />
        {/* Neck */}
        <rect
          x={dims.w / 2 - 10}
          y={20}
          width={20}
          height={10}
          fill="#4a4a4a"
          stroke="#3a3a3a"
        />
        {/* Body outline */}
        <rect
          x={10}
          y={bodyTop}
          width={dims.w - 20}
          height={bodyHeight}
          rx={0}
          fill="#2a2a2a"
          stroke="#4a4a4a"
          strokeWidth={2}
        />
        {/* Fill clip */}
        <defs>
          <clipPath id={`cyl-clip-${serial ?? size}-${Math.round(clamped)}`}>
            <rect x={12} y={bodyTop + 2} width={dims.w - 24} height={bodyHeight - 4} />
          </clipPath>
        </defs>
        <g clipPath={`url(#cyl-clip-${serial ?? size}-${Math.round(clamped)})`}>
          <rect
            className="cylinder-fill"
            x={12}
            y={fillY}
            width={dims.w - 24}
            height={fillHeight}
            fill={color}
            opacity={0.85}
          />
          {/* Hatch pattern lines */}
          {Array.from({ length: Math.ceil(fillHeight / 8) }).map((_, i) => (
            <line
              key={i}
              x1={14}
              y1={fillY + i * 8}
              x2={dims.w - 14}
              y2={fillY + i * 8}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth={1}
            />
          ))}
        </g>
        {/* GAS label */}
        <text
          x={dims.w / 2}
          y={bodyTop + bodyHeight / 2}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize={dims.font}
          fontFamily="Oxanium, sans-serif"
          fontWeight={700}
          letterSpacing={2}
        >
          GAS
        </text>
        {/* Base */}
        <rect
          x={8}
          y={bodyBottom}
          width={dims.w - 16}
          height={10}
          fill="#3a3a3a"
          stroke="#4a4a4a"
        />
      </svg>
      {showLabel && (
        <div className="text-center">
          <div
            className="font-mono text-lg font-semibold tabular-nums"
            style={{ color }}
          >
            {Math.round(clamped)}%
          </div>
          {serial && (
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {serial}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
