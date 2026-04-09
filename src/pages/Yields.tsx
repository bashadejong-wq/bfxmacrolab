import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { TrendingUp, TrendingDown, Minus, Percent, DollarSign, Activity, AlertTriangle, Clock } from "lucide-react";

/* Curve shape inline SVG glyph — 40x20 */
function CurveGlyph({ regime }: { regime: string | null }) {
  const r = (regime || "").toLowerCase();
  let d = "M4 10 L36 10";
  if (r.includes("steep")) d = "M4 16 L20 10 L36 4";
  else if (r.includes("invert")) d = "M4 4 L20 10 L36 16";
  return (
    <svg width={40} height={20} viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={d} stroke="#7C3AED" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function curveIcon(regime: string | null) {
  const r = (regime || "").toLowerCase();
  if (r.includes("steep")) return TrendingUp;
  if (r.includes("invert")) return TrendingDown;
  return Minus;
}

function curveIconColor(regime: string | null) {
  const r = (regime || "").toLowerCase();
  if (r.includes("steep")) return "text-bullish-text";
  if (r.includes("invert")) return "text-bearish-text";
  return "text-label";
}

const spreadColor = (v: any) => {
  if (v === null || v === undefined) return "";
  return Number(v) > 0 ? "text-bullish-text" : Number(v) < 0 ? "text-bearish-text" : "";
};

const PATTERN_STYLES: Record<string, { bg: string; color: string }> = {
  bear_steepener: { bg: "#FFFBEB", color: "#D97706" },
  bull_steepener: { bg: "#F0FDF4", color: "#16A34A" },
  bear_flattener: { bg: "#FEF2F2", color: "#DC2626" },
  bull_flattener: { bg: "#ECFDF5", color: "#059669" },
  mild_steepener: { bg: "#F0FDF4", color: "#6B7280" },
  structural_steepener: { bg: "#FFFBEB", color: "#D97706" },
  flat_curve: { bg: "#F5F5F5", color: "#6B7280" },
  flat_to_inverted: { bg: "#FEF2F2", color: "#DC2626" },
  front_end_squeeze: { bg: "#FFFBEB", color: "#D97706" },
  neutral_curve: { bg: "#F5F5F5", color: "#6B7280" },
};

function PatternBadge({ pattern }: { pattern: string | null }) {
  if (!pattern) return <span className="text-[9px] text-label">—</span>;
  const key = pattern.toLowerCase().replace(/[\s-]/g, "_");
  const style = PATTERN_STYLES[key] || { bg: "#F5F5F5", color: "#6B7280" };
  return (
    <span className="px-2 py-[2px] text-[8px] rounded uppercase font-bold whitespace-nowrap" style={{ backgroundColor: style.bg, color: style.color }}>
      {pattern.replace(/_/g, " ")}
    </span>
  );
}

function DeltaBp({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-[10px] text-label">—</span>;
  const color = value > 0 ? "#16A34A" : value < 0 ? "#DC2626" : "#6B7280";
  const sign = value > 0 ? "+" : "";
  return <span className="text-[10px] font-mono font-bold" style={{ color }}>{sign}{value}bp</span>;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Yields() {
  const navigate = useNavigate();
  const [y, setY] = useState<any>(null);
  const [pattern, setPattern] = useState<any>(null);
  const [delta, setDelta] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      queryWithRetry(() => supabase.from("yields_live").select("*").order("fetch_date", { ascending: false }).limit(1), "Yields/yields_live"),
      queryWithRetry(() => supabase.from("v_yield_pattern_intelligence").select("*").limit(1), "Yields/pattern"),
      queryWithRetry(() => supabase.from("v_yield_delta").select("*").limit(1), "Yields/delta"),
    ]).then(([yl, pt, dl]) => {
      setY((yl as any[])?.[0] || null);
      setPattern((pt as any[])?.[0] || null);
      setDelta((dl as any[])?.[0] || null);
      setLoaded(true);
    });
  }, []);

  if (loaded && !y) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Nog geen yield data beschikbaar</div></DashboardLayout>;
  if (!y) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Laden...</div></DashboardLayout>;

  const p = pattern || {};
  const d = delta || {};
  const CurveIcon = curveIcon(y.curve_regime);
  const cColor = curveIconColor(y.curve_regime);
  const staleAge = daysSince(y.fetch_date);

  // Regime labels for key metrics
  const regimeLabel = (key: string): string | null => {
    if (key === "2s10s") {
      const v = y.us_2s10s;
      if (v == null) return null;
      return Number(v) > 0 ? "steepening" : Number(v) < 0 ? "inverted" : "flat";
    }
    if (key === "real") {
      const v = y.us_real_10y;
      if (v == null) return null;
      return Number(v) > 2 ? "restrictive" : Number(v) > 1 ? "tight" : "accommodative";
    }
    if (key === "be") {
      const v = y.breakeven_10y;
      if (v == null) return null;
      return Number(v) > 2.5 ? "elevated" : Number(v) > 2 ? "anchored" : "low";
    }
    if (key === "3m10y") {
      const v = y.us_3m10y || y.us_10y3m;
      if (v == null) return null;
      return Number(v) > 0 ? "normal" : "inverted";
    }
    return null;
  };

  const rows = [
    { code: "USD", y2: y.us_2y, y10: y.us_10y, diff: null, s2s10s: y.us_2s10s, pat: p.eur_yield_pattern ? "—" : null, fxImpl: null, d10: d.us_10y_delta_bp, d2: d.us_2y_delta_bp },
    { code: "EUR", y2: y.eur_2y, y10: y.eur_10y, diff: y.diff_eur_10y, s2s10s: y.eur_2s10s, pat: p.eur_yield_pattern, fxImpl: p.eur_fx_implication, d10: d.eur_10y_delta_bp, d2: d.eur_2y_delta_bp },
    { code: "JPY", y2: y.jpy_2y, y10: y.jpy_10y, diff: y.diff_jpy_10y, s2s10s: y.jpy_2s10s, pat: p.jpy_yield_pattern, fxImpl: p.jpy_fx_implication, d10: d.jpy_10y_delta_bp, d2: null },
    { code: "GBP", y2: y.gbp_2y, y10: y.gbp_10y, diff: y.diff_gbp_10y, s2s10s: y.gbp_2s10s, pat: p.gbp_yield_pattern, fxImpl: p.gbp_fx_implication, d10: d.gbp_10y_delta_bp, d2: d.gbp_2y_delta_bp },
    { code: "AUD", y2: y.aud_2y, y10: y.aud_10y, diff: y.diff_aud_10y, s2s10s: y.aud_2s10s, pat: p.aud_yield_pattern, fxImpl: p.aud_fx_implication, d10: null, d2: null },
    { code: "CAD", y2: y.cad_2y, y10: y.cad_10y, diff: y.diff_cad_10y, s2s10s: y.cad_2s10s, pat: p.cad_yield_pattern, fxImpl: p.cad_fx_implication, d10: null, d2: null },
    { code: "NZD", y2: y.nzd_2y, y10: y.nzd_10y, diff: y.diff_nzd_10y, s2s10s: y.nzd_2s10s, pat: null, fxImpl: null, d10: null, d2: null },
    { code: "CHF", y2: y.chf_2y, y10: y.chf_10y, diff: y.diff_chf_10y, s2s10s: y.chf_2s10s, pat: p.chf_yield_pattern, fxImpl: p.chf_fx_implication, d10: null, d2: null },
  ];

  // Top 3 extreme spreads
  const spreads = rows.filter(r => r.diff !== null).map(r => ({ code: r.code, diff: Number(r.diff), fxImpl: r.fxImpl })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 3);

  return (
    <DashboardLayout>
      {/* 4. DATE INDICATOR */}
      <div className="flex items-center gap-2 mb-4">
        <Clock size={12} className="text-label" />
        <span className="text-[10px] text-label">Bijgewerkt: {fmtDate(y.fetch_date)}</span>
        {staleAge > 1 && (
          <span className="flex items-center gap-1 bg-mixed-bg text-mixed-text px-2 py-[1px] text-[9px] rounded font-semibold">
            <AlertTriangle size={10} />
            Data van {staleAge} dagen geleden
          </span>
        )}
      </div>

      {/* 1. US TREASURY CURVE */}
      <SectionLabel>US TREASURY CURVE</SectionLabel>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "2 JAAR", value: y.us_2y, sub: null, deltaKey: "us_2y_delta_bp" },
          { label: "5 JAAR", value: y.us_5y, sub: null, deltaKey: null },
          { label: "10 JAAR", value: y.us_10y, sub: y.us_real_10y != null ? `Reëel: ${y.us_real_10y}%` : null, deltaKey: "us_10y_delta_bp" },
          { label: "30 JAAR", value: y.us_30y, sub: null, deltaKey: null },
        ].map(item => (
          <DataCard key={item.label} className="px-3 py-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Percent size={12} className="text-label" />
              <span className="text-[8px] text-label uppercase tracking-[0.08em] font-medium">{item.label}</span>
            </div>
            <div className="text-[20px] font-bold text-foreground font-mono">{val(item.value, "%")}</div>
            <div className="flex items-center gap-2 mt-0.5">
              {item.sub && <span className="text-[9px] text-label">{item.sub}</span>}
              {item.deltaKey && d[item.deltaKey] != null && <DeltaBp value={d[item.deltaKey]} />}
            </div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-4" />

      {/* CURVE REGIME BANNER */}
      <DataCard className="px-4 py-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <CurveIcon size={18} className={cColor} />
          <span className={`text-[18px] font-extrabold uppercase ${cColor}`}>{val(y.curve_regime)}</span>
          <CurveGlyph regime={y.curve_regime} />
          {(y.curve_signal || p.curve_signal) && (
            <PatternBadge pattern={y.curve_signal || p.curve_signal} />
          )}
        </div>
        {(y.curve_interpretation || p.curve_interpretation) && (
          <div className="text-[12px] text-sub-text leading-relaxed mt-2 max-w-[720px]">{y.curve_interpretation || p.curve_interpretation}</div>
        )}
      </DataCard>

      <hr className="border-card-border mb-4" />

      {/* 3. KEY METRICS with delta + regime label */}
      <SectionLabel>KEY METRICS</SectionLabel>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "2S10S", value: y.us_2s10s, colored: true, key: "2s10s", deltaVal: d.us_2s10s_delta_bp },
          { label: "REËEL 10J", value: y.us_real_10y || y.us_real_yield_10y, colored: false, key: "real", deltaVal: null },
          { label: "BREAKEVEN 10J", value: y.breakeven_10y, colored: false, key: "be", deltaVal: null },
          { label: "3M10Y", value: y.us_3m10y || y.us_10y3m, colored: true, key: "3m10y", deltaVal: null },
        ].map(item => {
          const rl = regimeLabel(item.key);
          return (
            <DataCard key={item.label} className="px-3 py-3">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] text-label uppercase tracking-[0.08em] font-medium">{item.label}</span>
                {rl && <span className="text-[7px] text-label uppercase bg-secondary px-1.5 py-[1px] rounded font-semibold">{rl}</span>}
              </div>
              <div className={`text-[18px] font-bold font-mono ${item.colored ? spreadColor(item.value) || "text-foreground" : "text-foreground"}`}>
                {val(item.value, "%")}
              </div>
              {item.deltaVal != null && <div className="mt-0.5"><DeltaBp value={item.deltaVal} /></div>}
            </DataCard>
          );
        })}
      </div>

      <hr className="border-card-border mb-4" />

      {/* G10 YIELDS TABLE — enhanced */}
      <SectionLabel>G10 YIELDS</SectionLabel>
      <DataCard className="overflow-hidden mb-4">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-[8px] text-label uppercase text-left px-4 py-2">Currency</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-2">2Y</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-2">10Y</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-2">Δ 10Y</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-2">Spread vs USD</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-2">2s10s</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-2">Pattern</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-2">FX Impact</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.code} className="border-b border-card-border last:border-b-0 hover:bg-secondary cursor-pointer" onClick={() => navigate(`/currencies/${r.code}`)}>
                <td className="px-4 py-2">
                  <span className="text-[11px] text-purple-accent font-bold">{r.code}</span>
                </td>
                <td className="text-[11px] text-sub-text font-mono px-4 py-2">{val(r.y2, "%")}</td>
                <td className="text-[11px] text-sub-text font-mono px-4 py-2">{val(r.y10, "%")}</td>
                <td className="px-4 py-2"><DeltaBp value={r.d10} /></td>
                <td className={`text-[11px] font-mono px-4 py-2 ${spreadColor(r.diff)}`}>{r.diff === null ? "—" : val(r.diff, "%")}</td>
                <td className={`text-[11px] font-mono px-4 py-2 ${spreadColor(r.s2s10s)}`}>{val(r.s2s10s, "%")}</td>
                <td className="px-4 py-2"><PatternBadge pattern={r.pat} /></td>
                <td className="px-4 py-2 max-w-[200px]">
                  {r.fxImpl ? <span className="text-[9px] text-sub-text italic leading-tight line-clamp-2">{r.fxImpl}</span> : <span className="text-[9px] text-label">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>

      <hr className="border-card-border mb-4" />

      {/* YIELD ANALYSE — structured */}
      <SectionLabel>YIELD ANALYSE</SectionLabel>

      {/* Section 1: Curve Regime */}
      <DataCard className="px-4 py-3 mb-3 border-l-[3px] border-l-purple-accent">
        <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1">CURVE REGIME</div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[14px] font-bold uppercase ${cColor}`}>{val(y.curve_regime)}</span>
          <PatternBadge pattern={y.curve_signal || p.curve_signal} />
        </div>
        <div className="text-[11px] text-sub-text leading-relaxed max-w-[720px]">
          {textVal(y.curve_interpretation || p.curve_interpretation, "Geen curve interpretatie beschikbaar")}
        </div>
      </DataCard>

      {/* Section 2: Real Yield */}
      <DataCard className="px-4 py-3 mb-3">
        <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1">REAL YIELD SIGNAAL</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[8px] text-label uppercase">US REËEL 10J</div>
            <div className="text-[16px] font-bold text-foreground font-mono mt-0.5">{val(y.us_real_10y || y.us_real_yield_10y, "%")}</div>
          </div>
          <div>
            <div className="text-[8px] text-label uppercase">BREAKEVEN 10J</div>
            <div className="text-[16px] font-bold text-foreground font-mono mt-0.5">{val(y.breakeven_10y, "%")}</div>
          </div>
          <div>
            <div className="text-[8px] text-label uppercase">IMPLICATIE</div>
            <div className="text-[11px] text-sub-text mt-1 leading-relaxed">
              {y.us_real_10y != null && Number(y.us_real_10y) > 2
                ? "Restrictief — ondersteunt USD, drukt goud en risk assets"
                : y.us_real_10y != null && Number(y.us_real_10y) > 1
                ? "Krap — matig positief USD, neutraal goud"
                : y.us_real_10y != null
                ? "Accommoderend — drukt USD, ondersteunt goud en risk"
                : "—"}
            </div>
          </div>
        </div>
      </DataCard>

      {/* Section 3: USD Differential Overview */}
      {spreads.length > 0 && (
        <DataCard className="px-4 py-3 mb-3">
          <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-2">USD DIFFERENTIAL — TOP 3 EXTREMEN</div>
          <div className="grid grid-cols-3 gap-3">
            {spreads.map(s => (
              <div key={s.code} className="border border-card-border rounded px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[12px] font-bold text-purple-accent">{s.code}</span>
                  <span className={`text-[12px] font-mono font-bold ${s.diff > 0 ? "text-bullish-text" : "text-bearish-text"}`}>
                    {s.diff > 0 ? "+" : ""}{s.diff.toFixed(2)}%
                  </span>
                </div>
                {s.fxImpl && <div className="text-[9px] text-sub-text italic leading-tight mt-1">{s.fxImpl}</div>}
              </div>
            ))}
          </div>
        </DataCard>
      )}

      <div className="text-[9px] text-label mt-2">Bijgewerkt {fmtDate(y.fetch_date)}</div>
    </DashboardLayout>
  );
}
