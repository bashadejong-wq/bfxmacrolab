import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

const MONTHS_NL = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
const DAYS_NL = ["Zo","Ma","Di","Wo","Do","Vr","Za"];

/** Shared bias color utility */
export function getBiasColor(bias: string | null): string {
  const b = (bias || "").toLowerCase();
  if (b === "bullish") return "#16A34A";
  if (b === "bearish") return "#DC2626";
  if (b === "mixed") return "#D97706";
  return "#6B7280";
}

/** Shared bias background utility */
export function getBiasBackground(bias: string | null): string {
  const b = (bias || "").toLowerCase();
  if (b === "bullish") return "#F0FDF4";
  if (b === "bearish") return "#FEF2F2";
  if (b === "mixed") return "#FFFBEB";
  return "#F9FAFB";
}

/** Bias tailwind class utility */
export function getBiasClasses(bias: string | null): string {
  const b = (bias || "").toLowerCase();
  if (b === "bullish") return "bg-bullish-bg text-bullish-text";
  if (b === "bearish") return "bg-bearish-bg text-bearish-text";
  if (b === "mixed") return "bg-mixed-bg text-mixed-text";
  return "bg-neutral-bg text-neutral-text";
}

const FALLBACK_TEXT = "Nog geen analyse beschikbaar";

/** Format date string to Dutch readable format */
export const fmtDate = (v: any): string => {
  if (!v || v === "null") return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return String(v); }
};

/** Format datetime string to Dutch readable format */
export const fmtDateTime = (v: any): string => {
  if (!v || v === "null") return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const day = DAYS_NL[d.getDay()];
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${hours}:${mins}`;
  } catch { return String(v); }
};

/** Null-safe value display — for numeric/data fields returns "—" */
export const val = (v: any, suffix = "") => {
  if (v === null || v === undefined || v === "" || v === "null" || v === "undefined" || (typeof v === "string" && v.trim() === "")) return "—";
  if (v === 0 && suffix === "") return "—";
  return `${v}${suffix}`;
};

/** Null-safe text display — for narrative/text fields returns fallback */
export const textVal = (v: any, fallback = FALLBACK_TEXT) => {
  if (v === null || v === undefined || v === "" || v === "null" || v === "undefined" || (typeof v === "string" && v.trim() === "")) return fallback;
  return String(v);
};

/** Null-safe numeric value — treats 0 as "—" */
export const numVal = (v: any, suffix = "") => {
  if (v === null || v === undefined || v === "" || v === 0) return "—";
  return `${v}${suffix}`;
};

/** Supabase query with 1 retry */
export async function queryWithRetry<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  label: string
): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, error } = await queryFn();
      if (error) {
        console.error(`[${label}] attempt ${attempt + 1}:`, error);
        if (attempt === 0) continue;
        return null;
      }
      return data;
    } catch (e) {
      console.error(`[${label}] attempt ${attempt + 1}:`, e);
      if (attempt === 0) continue;
      return null;
    }
  }
  return null;
}

/** Bias chip */
export function BiasChip({ bias, size = "sm" }: { bias: string | null; size?: "sm" | "lg" }) {
  const styles = getBiasClasses(bias);
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
    r === "risk-off" || r === "stress" || r === "crisis" ? "bg-bearish-bg text-bearish-text" :
    r === "risk-on" || r === "low" ? "bg-bullish-bg text-bullish-text" :
    r === "elevated" ? "bg-mixed-bg text-mixed-text" :
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
    i === "medium" ? "bg-mixed-bg text-mixed-text" :
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
    c === "medium" ? "bg-mixed-bg text-mixed-text" :
    c === "low" ? "bg-bearish-bg text-bearish-text" :
    "bg-neutral-bg text-neutral-text";
  return (
    <span className={`${styles} px-2 py-[2px] text-[9px] rounded uppercase font-semibold inline-block`}>
      {confidence || "—"}
    </span>
  );
}

/** Surprise chip */
export function SurpriseChip({ direction, score }: { direction: string | null; score: any }) {
  const d = (direction || "").toLowerCase();
  if (d === "positive") return <span className="bg-bullish-bg text-bullish-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">BEAT {score != null ? score : ""}</span>;
  if (d === "negative") return <span className="bg-bearish-bg text-bearish-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">MISS {score != null ? score : ""}</span>;
  return <span className="bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">IN LINE</span>;
}

/** Data card wrapper */
export function DataCard({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-card border border-card-border rounded-lg ${onClick ? "cursor-pointer hover:border-purple-accent/30 transition-colors" : ""} ${className}`}
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
      <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">{children}</span>
      {subtitle && <span className="text-[0.65rem] text-neutral-text ml-2">{subtitle}</span>}
    </div>
  );
}

/** Markdown block */
export function MarkdownBlock({ content, fallback }: { content: string | null; fallback?: string }) {
  if (!content || content.trim() === "" || content === "null" || content === "undefined") {
    return <span className="text-[11px] text-label italic">{fallback || FALLBACK_TEXT}</span>;
  }
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
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em]">{label}</div>
      <div className={`${large ? "text-[22px]" : "text-[12px]"} text-foreground font-semibold ${mono ? "font-mono" : ""} mt-1`}>
        {val(value, suffix)}
      </div>
    </div>
  );
}
