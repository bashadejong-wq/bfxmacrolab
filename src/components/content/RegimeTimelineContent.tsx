// Extracted from RegimeTimeline.tsx — renders without DashboardLayout
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DataCard, SectionLabel, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { Clock, TrendingUp, Shield, Droplets } from "lucide-react";

type RegimePoint = {
  date: string;
  label: string;
  source: "snapshot" | "alignment";
  macro_regime: string | null;
  risk_regime: string | null;
  liquidity_regime: string | null;
  core_driver: string | null;
  conviction_score: number | null;
};

const REGIME_COLORS: Record<string, string> = {
  "risk-on": "#16A34A", "low": "#16A34A", "bullish": "#16A34A", "loose": "#16A34A", "expansion": "#16A34A",
  "risk-off": "#DC2626", "crisis": "#DC2626", "stress": "#DC2626", "bearish": "#DC2626", "tight": "#DC2626",
  "liquidity-stress": "#DC2626",
  "elevated": "#D97706", "mixed": "#D97706", "energy_shock": "#D97706",
  "neutral": "#6B7280", "": "#6B7280",
};

function regimeColor(val: string | null): string {
  if (!val) return "#6B7280";
  return REGIME_COLORS[val.toLowerCase()] || "#6B7280";
}

function RegimeDot({ value, size = 10 }: { value: string | null; size?: number }) {
  return <div className="rounded-full flex-shrink-0" style={{ width: size, height: size, background: regimeColor(value) }} title={value || "—"} />;
}

const FIELD_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  macro_regime: { label: "Macro", icon: TrendingUp },
  risk_regime: { label: "Risk", icon: Shield },
  liquidity_regime: { label: "Liquidity", icon: Droplets },
};

export default function RegimeTimelineContent() {
  const [points, setPoints] = useState<RegimePoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      queryWithRetry(() => supabase.from("period_snapshots").select("period_start, period_end, period_label, period_type, macro_regime, risk_regime, liquidity_regime, core_driver, conviction_score").order("period_end", { ascending: false }).limit(100), "RegimeTimeline/snapshots"),
      queryWithRetry(() => supabase.from("alignment_engine").select("alignment_date, macro_regime, risk_regime, liquidity_regime, core_driver, conviction_score, alignment_state").order("alignment_date", { ascending: false }).limit(100), "RegimeTimeline/alignment"),
    ]).then(([snaps, aligns]) => {
      const pts: RegimePoint[] = [];
      ((snaps as any[]) || []).forEach(s => pts.push({ date: s.period_end || s.period_start, label: s.period_label || `${s.period_type} ${s.period_start}`, source: "snapshot", macro_regime: s.macro_regime, risk_regime: s.risk_regime, liquidity_regime: s.liquidity_regime, core_driver: s.core_driver, conviction_score: s.conviction_score }));
      ((aligns as any[]) || []).forEach(a => pts.push({ date: a.alignment_date, label: `Alignment ${a.alignment_date}`, source: "alignment", macro_regime: a.macro_regime, risk_regime: a.risk_regime, liquidity_regime: a.liquidity_regime, core_driver: a.core_driver, conviction_score: a.conviction_score }));
      pts.sort((a, b) => b.date.localeCompare(a.date));
      const seen = new Set<string>();
      setPoints(pts.filter(p => { const k = `${p.date}-${p.source}`; if (seen.has(k)) return false; seen.add(k); return true; }));
      setLoaded(true);
    });
  }, []);

  const shifts = useMemo(() => {
    const result: { date: string; field: string; from: string; to: string }[] = [];
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < sorted.length; i++) {
      for (const field of ["macro_regime", "risk_regime", "liquidity_regime"] as const) {
        const pv = (sorted[i - 1][field] || "").toLowerCase();
        const cv = (sorted[i][field] || "").toLowerCase();
        if (pv && cv && pv !== cv) result.push({ date: sorted[i].date, field, from: pv, to: cv });
      }
    }
    return result.reverse();
  }, [points]);

  if (!loaded) return <div className="text-label text-[13px] mt-10 text-center">Laden...</div>;

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 gap-4">
        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center"><Clock size={28} className="text-purple-accent" /></div>
        <p className="text-[13px] text-label text-center max-w-md">Regime data wordt automatisch gevuld via de dagelijkse pipeline.</p>
      </div>
    );
  }

  return (
    <>
      {points[0] && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(["macro_regime", "risk_regime", "liquidity_regime"] as const).map(field => {
            const info = FIELD_LABELS[field];
            const Icon = info.icon;
            const v = points[0][field];
            return (
              <DataCard key={field} className="p-5">
                <div className="flex items-center gap-1.5 mb-2"><Icon size={14} className="text-label" /><span className="text-[0.65rem] text-label uppercase tracking-wide font-medium">{info.label} Regime</span></div>
                <div className="flex items-center gap-2"><RegimeDot value={v} size={12} /><span className="text-[16px] font-bold text-foreground uppercase">{v || "—"}</span></div>
                <div className="text-[10px] text-label mt-1">{fmtDate(points[0].date)}</div>
              </DataCard>
            );
          })}
        </div>
      )}

      {shifts.length > 0 && (
        <div className="mb-8">
          <SectionLabel>Regime Shifts</SectionLabel>
          <div className="space-y-2">
            {shifts.slice(0, 10).map((s, i) => {
              const info = FIELD_LABELS[s.field];
              const Icon = info.icon;
              return (
                <DataCard key={i} className="px-5 py-3 flex items-center gap-4">
                  <span className="text-[11px] text-label font-mono w-24 flex-shrink-0">{fmtDate(s.date)}</span>
                  <Icon size={14} className="text-label flex-shrink-0" />
                  <span className="text-[10px] text-label uppercase font-semibold w-16">{info.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1"><RegimeDot value={s.from} /><span className="text-[11px] text-sub-text uppercase">{s.from}</span></div>
                    <span className="text-[11px] text-label">→</span>
                    <div className="flex items-center gap-1"><RegimeDot value={s.to} /><span className="text-[11px] font-semibold text-foreground uppercase">{s.to}</span></div>
                  </div>
                </DataCard>
              );
            })}
          </div>
        </div>
      )}

      <SectionLabel>Volledige Timeline</SectionLabel>
      <DataCard className="p-5">
        <div className="grid grid-cols-[100px_80px_1fr_1fr_1fr_1fr] gap-2 mb-3 pb-2 border-b border-card-border">
          <span className="text-[9px] text-label uppercase font-semibold">Datum</span>
          <span className="text-[9px] text-label uppercase font-semibold">Bron</span>
          <span className="text-[9px] text-label uppercase font-semibold">Macro</span>
          <span className="text-[9px] text-label uppercase font-semibold">Risk</span>
          <span className="text-[9px] text-label uppercase font-semibold">Liquidity</span>
          <span className="text-[9px] text-label uppercase font-semibold">Core Driver</span>
        </div>
        <div className="space-y-0">
          {points.map((pt, i) => (
            <div key={`${pt.date}-${pt.source}-${i}`} className={`grid grid-cols-[100px_80px_1fr_1fr_1fr_1fr] gap-2 py-2.5 items-center ${i < points.length - 1 ? "border-b border-card-border/50" : ""}`}>
              <span className="text-[11px] text-label font-mono">{fmtDate(pt.date)}</span>
              <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded inline-block w-fit ${pt.source === "alignment" ? "bg-purple-accent/10 text-purple-accent" : "bg-secondary text-sub-text"}`}>
                {pt.source === "alignment" ? "Align" : "Snap"}
              </span>
              <div className="flex items-center gap-1.5"><RegimeDot value={pt.macro_regime} /><span className="text-[11px] text-foreground uppercase">{pt.macro_regime || "—"}</span></div>
              <div className="flex items-center gap-1.5"><RegimeDot value={pt.risk_regime} /><span className="text-[11px] text-foreground uppercase">{pt.risk_regime || "—"}</span></div>
              <div className="flex items-center gap-1.5"><RegimeDot value={pt.liquidity_regime} /><span className="text-[11px] text-foreground uppercase">{pt.liquidity_regime || "—"}</span></div>
              <span className="text-[10px] text-sub-text truncate" title={pt.core_driver || ""}>{pt.core_driver || "—"}</span>
            </div>
          ))}
        </div>
      </DataCard>
    </>
  );
}
