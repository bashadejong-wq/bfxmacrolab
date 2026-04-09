import ReactMarkdown from "react-markdown";

/** Null-safe value display */
export const val = (v: any, suffix = "") => {
  if (v === null || v === undefined || v === "" || v === 0) return "—";
  return `${v}${suffix}`;
};

/** Bias chip */
export function BiasChip({ bias, size = "sm" }: { bias: string | null; size?: "sm" | "lg" }) {
  const b = (bias || "").toLowerCase();
  const styles =
    b === "bullish" ? "bg-bullish-bg text-bullish-text" :
    b === "bearish" ? "bg-bearish-bg text-bearish-text" :
    "bg-neutral-bg text-neutral-text";
  const padding = size === "lg" ? "px-5 py-3 text-[14px]" : "px-2 py-[2px] text-[9px]";
  return (
    <span className={`${styles} ${padding} rounded uppercase font-semibold inline-block`}>
      {bias || "NEUTRAL"}
    </span>
  );
}

/** Risk regime chip */
export function RiskChip({ regime }: { regime: string | null }) {
  const r = (regime || "").toLowerCase();
  const styles =
    r === "risk-off" ? "bg-bearish-bg text-bearish-text" :
    r === "risk-on" ? "bg-bullish-bg text-bullish-text" :
    "bg-neutral-bg text-neutral-text";
  return (
    <span className={`${styles} px-2 py-[2px] text-[9px] rounded uppercase font-semibold inline-block`}>
      {regime || "—"}
    </span>
  );
}

/** Impact chip */
export function ImpactChip({ impact }: { impact: string | null }) {
  const i = (impact || "").toLowerCase();
  const styles =
    i === "high" ? "bg-bearish-bg text-bearish-text" :
    i === "medium" ? "bg-warning-bg text-warning-text" :
    "bg-neutral-bg text-neutral-text";
  return (
    <span className={`${styles} px-2 py-[2px] text-[9px] rounded uppercase font-semibold inline-block`}>
      {impact || "—"}
    </span>
  );
}

/** Confidence chip */
export function ConfidenceChip({ confidence }: { confidence: string | null }) {
  const c = (confidence || "").toLowerCase();
  const styles =
    c === "high" ? "bg-bullish-bg text-bullish-text" :
    c === "medium" ? "bg-warning-bg text-warning-text" :
    c === "low" ? "bg-bearish-bg text-bearish-text" :
    "bg-neutral-bg text-neutral-text";
  return (
    <span className={`${styles} px-2 py-[2px] text-[9px] rounded uppercase font-semibold inline-block`}>
      {confidence || "—"}
    </span>
  );
}

/** Data card wrapper */
export function DataCard({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-card border border-card-border rounded-lg ${onClick ? "cursor-pointer hover:border-purple-accent/30 hover:bg-[#F5F0FF] transition-colors" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/** Section label */
export function SectionLabel({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-3">
      <span className="text-[9px] text-label uppercase tracking-[0.08em] font-medium">{children}</span>
      {subtitle && <span className="text-[9px] text-neutral-text ml-2">{subtitle}</span>}
    </div>
  );
}

/** Markdown block */
export function MarkdownBlock({ content, fallback }: { content: string | null; fallback?: string }) {
  if (!content) return <span className="text-[11px] text-label italic">{fallback || "—"}</span>;
  return (
    <div className="markdown-content">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

/** Label + Value pair */
export function LabelValue({ label, value, suffix, mono, large, className = "" }: {
  label: string; value: any; suffix?: string; mono?: boolean; large?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[9px] text-label uppercase tracking-[0.08em]">{label}</div>
      <div className={`${large ? "text-[22px]" : "text-[12px]"} text-foreground font-semibold ${mono ? "font-mono" : ""} mt-1`}>
        {val(value, suffix)}
      </div>
    </div>
  );
}

import { ReactNode as RN } from "react";
