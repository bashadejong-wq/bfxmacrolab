import { useMemo } from "react";

interface SparklineProps {
  values: (number | null | undefined)[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ values, width = 80, height = 24, color = "#7C3AED" }: SparklineProps) {
  const points = useMemo(() => {
    const nums = values.filter((v): v is number => v != null && !isNaN(Number(v))).map(Number);
    if (nums.length < 2) return null;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const range = max - min || 1;
    const padding = 2;
    const w = width - padding * 2;
    const h = height - padding * 2;
    return nums.map((v, i) => ({
      x: padding + (i / (nums.length - 1)) * w,
      y: padding + h - ((v - min) / range) * h,
    }));
  }, [values, width, height]);

  if (!points) return <span className="text-label text-[9px]">—</span>;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const trending = last.y < first.y ? "#16A34A" : last.y > first.y ? "#DC2626" : "#6B7280";

  return (
    <svg width={width} height={height} className="inline-block">
      <path d={pathD} fill="none" stroke={trending} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2} fill={trending} />
    </svg>
  );
}
