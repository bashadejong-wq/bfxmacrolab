import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, ImpactChip, fmtDate, fmtDateTime, queryWithRetry } from "@/components/ui-helpers";
import {
  Zap, TrendingUp, TrendingDown, Sun, RefreshCw, GitMerge, HelpCircle,
  Shield, AlertTriangle, AlertOctagon, ShieldAlert, ShieldCheck,
  CheckCircle, XCircle, Star, FileText, CalendarDays, Activity, Minus,
  ArrowRight, ChevronRight,
} from "lucide-react";

const REGIME_ICONS: Record<string, React.ElementType> = {
  energy_shock: Zap, stagflation: TrendingUp, goldilocks: Sun, reflation: RefreshCw,
  deflation: TrendingDown, mixed: GitMerge, transitional: GitMerge,
};
const RISK_ICONS: Record<string, React.ElementType> = {
  low: ShieldCheck, normal: Shield, elevated: ShieldAlert, stress: AlertTriangle, crisis: AlertOctagon,
};
const RISK_COLORS: Record<string, string> = {
  low: "text-bullish-text bg-bullish-bg", normal: "text-neutral-text bg-neutral-bg",
  elevated: "text-mixed-text bg-mixed-bg", stress: "text-bearish-text bg-bearish-bg", crisis: "text-bearish-text bg-bearish-bg",
};

const ALIGNMENT_COLORS: Record<string, string> = {
  aligned: "bg-bullish-bg text-bullish-text",
  mixed: "bg-amber-100 text-amber-700",
  conflicted: "bg-bearish-bg text-bearish-text",
  transitioning: "bg-mixed-bg text-mixed-text",
};

function parseCurrencyRanking(raw: string | null): { rank: number; code: string; bias: string; conviction: string }[] {
  if (!raw) return [];
  return raw.split("|").map(part => {
    const m = part.trim().match(/^(\d+)\.\s*(\w+)\s*\((\w+),\s*(\w+)\)$/);
    if (!m) return null;
    return { rank: Number(m[1]), code: m[2], bias: m[3].toLowerCase(), conviction: m[4].toLowerCase() };
  }).filter(Boolean) as any[];
}

function parseHighConviction(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split("|").map(s => s.trim()).filter(s => s.length > 0);
}

function parseSummaryDashboard(raw: string | null): { header: string; body: string }[] {
  if (!raw) return [];
  const sections: { header: string; body: string }[] = [];
  const lines = raw.split("\n");
  let current: { header: string; body: string } | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && !trimmed.includes(".")) {
      if (current) sections.push(current);
      current = { header: trimmed, body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + trimmed;
    } else {
      current = { header: "", body: trimmed };
    }
  }
  if (current) sections.push(current);
  return sections;
}

function getStepColor(value: string | null): string {
  const v = (value || "").toLowerCase();
  if (v.includes("bullish") || v.includes("loose") || v.includes("rising") || v.includes("easing")) return "#16A34A";
  if (v.includes("bearish") || v.includes("tightening") || v.includes("tight") || v.includes("hawkish") || v.includes("falling")) return "#DC2626";
  return "#6B7280";
}

function getStepBg(value: string | null): string {
  const v = (value || "").toLowerCase();
  if (v.includes("bullish") || v.includes("loose") || v.includes("rising") || v.includes("easing")) return "#F0FDF4";
  if (v.includes("bearish") || v.includes("tightening") || v.includes("tight") || v.includes("hawkish") || v.includes("falling")) return "#FEF2F2";
  return "#F5F5F5";
}

function ConvictionBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const pct = Math.min(Math.max((s / 10) * 100, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[24px] font-black text-purple-accent font-mono">{s}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[8px] text-label uppercase">/10</span>
        <div className="w-[100px] h-[3px] rounded-full bg-[#E5E7EB] overflow-hidden">
          <div className="h-full rounded-full bg-purple-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function DeltaValue({ value, invert = false }: { value: number | null | undefined; invert?: boolean }) {
  if (value == null) return null;
  const positive = value > 0;
  const isGood = invert ? !positive : positive;
  const color = isGood ? "#16A34A" : "#DC2626";
  const prefix = positive ? "+" : "";
  return (
    <span className="text-[10px] font-mono font-semibold" style={{ color }}>
      {prefix}{typeof value === "number" ? value.toFixed(2) : value}%
    </span>
  );
}

const FALLBACK = "Nog geen data beschikbaar";

export default function Overview() {
  const navigate = useNavigate();
  const [cockpit, setCockpit] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  
  const [events, setEvents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [ck, md, e, r] = await Promise.all([
      queryWithRetry(() => supabase.from("v_overview_cockpit").select("*").limit(1), "Overview/cockpit"),
      queryWithRetry(() => supabase.from("v_market_delta").select("*").limit(1), "Overview/market_delta"),
      queryWithRetry(() => supabase.from("macro_events_calendar").select("*").gte("event_date", new Date().toISOString().split("T")[0]).in("event_impact", ["high", "medium"]).order("event_datetime", { ascending: true }).limit(6), "Overview/events"),
      queryWithRetry(() => supabase.from("report_analysis").select("id,analysis_date,title,macro_regime,confidence_score").order("analysis_date", { ascending: false }).limit(5), "Overview/reports"),
    ]);
    setCockpit((ck as any[])?.[0] || null);
    setMarket((md as any[])?.[0] || null);
    setEvents((e as any[]) || []);
    setReports((r as any[]) || []);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); const interval = setInterval(load, 60000); return () => clearInterval(interval); }, [load]);

  const a = cockpit; // alias
  const regimeKey = (a?.macro_regime || "").toLowerCase().replace(/[\s-]/g, "_");
  const RegimeIcon = REGIME_ICONS[regimeKey] || HelpCircle;
  const riskKey = (a?.risk_regime || "").toLowerCase().replace(/[\s-]/g, "_");
  const RiskIcon = RISK_ICONS[riskKey] || Shield;
  const riskColor = RISK_COLORS[riskKey] || "text-neutral-text bg-neutral-bg";
  const alignKey = (a?.alignment_state || "").toLowerCase();
  const alignColor = ALIGNMENT_COLORS[alignKey] || "bg-neutral-bg text-neutral-text";

  const vixColor = (regime: string | null) => {
    const r = (regime || "").toLowerCase();
    return r === "elevated" ? "text-mixed-text" : r === "extreme" ? "text-bearish-text" : r === "low" ? "text-bullish-text" : "text-label";
  };

  // Transmission chain steps
  const chainSteps = [
    { label: "GROEI", value: a?.growth_view },
    { label: "INFLATIE", value: a?.inflation_view },
    { label: "CB", value: a?.cb_view },
    { label: "YIELDS", value: a?.yield_view },
    { label: "LIQUIDITEIT", value: a?.liquidity_view },
  ];

  // Parse what_changed into bullet points
  const whatChanged = a?.daily_what_changed || "";
  const changeBullets = whatChanged
    ? whatChanged.split(/[.\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 5)
    : [];

  // Market snapshot items with deltas
  const marketItems = [
    { label: "VIX", value: market?.vix, delta: market?.vix_delta, pct: market?.vix_pct, sub: market?.vix_regime, invert: true },
    { label: "DXY", value: market?.dxy, delta: market?.dxy_delta, pct: market?.dxy_pct },
    { label: "GOLD", value: market?.gold, delta: market?.gold_delta, pct: market?.gold_pct },
    { label: "OIL BRENT", value: market?.oil_brent, delta: market?.oil_delta, pct: market?.oil_pct },
    { label: "SPX", value: market?.spx, delta: market?.spx_delta, pct: market?.spx_pct },
  ];

  return (
    <DashboardLayout>
      {/* 1. TRANSMISSION CHAIN STRIP */}
      <div className="flex items-stretch gap-0 mb-3 bg-card border border-card-border rounded-lg overflow-x-auto">
        {chainSteps.map((step, i) => {
          const color = getStepColor(step.value);
          const bg = getStepBg(step.value);
          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex-1 px-3 py-2.5 text-center" style={{ backgroundColor: bg }}>
                <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-0.5">{step.label}</div>
                <div className="text-[11px] font-bold truncate" style={{ color }}>{val(step.value)}</div>
              </div>
              {i < chainSteps.length - 1 && (
                <ChevronRight size={14} className="text-label shrink-0 -mx-1 z-10" />
              )}
            </div>
          );
        })}
      </div>

      {/* REGIME HERO — compact */}
      <DataCard className="px-4 py-3 mb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-md">
              <RegimeIcon size={16} className="text-purple-accent" />
              <span className="text-[14px] md:text-[16px] font-black text-foreground uppercase tracking-tight">{a?.macro_regime || FALLBACK}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${riskColor}`}>
              <RiskIcon size={13} />
              <span className="text-[10px] font-semibold uppercase">{a?.risk_regime || "—"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ConvictionBar score={a?.conviction_score} />
              <div className="flex flex-col items-start gap-0.5">
                <span className={`${alignColor} px-2 py-[1px] text-[8px] rounded font-bold uppercase`}>
                  {a?.alignment_state || "—"}
                </span>
                <span className="text-[8px] text-label">D/W/M convergentie</span>
              </div>
            </div>
          </div>
        </div>
      </DataCard>

      {/* 2. MACRO STORY / FLOW CHAIN */}
      <DataCard className="px-4 py-3 mb-3 border-l-[3px] border-l-purple-accent">
        <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1.5">TRANSMISSIE FLOW</div>
        <div className="text-[14px] font-bold text-foreground leading-snug mb-1.5 font-mono">
          {textVal(a?.flow_chain, "—")}
        </div>
        <div className="text-[12px] text-sub-text leading-relaxed max-w-[720px]">
          {textVal(a?.macro_story, "—")}
        </div>
      </DataCard>

      {/* WHAT TO DO / AVOID — compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <DataCard className="px-4 py-3 border-l-[3px] border-l-bullish-text">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle size={12} className="text-bullish-text" />
            <span className="text-[8px] text-label uppercase tracking-wider font-medium">WAT TE DOEN</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(a?.what_to_do)}</div>
        </DataCard>
        <DataCard className="px-4 py-3 border-l-[3px] border-l-bearish-text">
          <div className="flex items-center gap-1.5 mb-1.5">
            <XCircle size={12} className="text-bearish-text" />
            <span className="text-[8px] text-label uppercase tracking-wider font-medium">VERMIJD</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(a?.what_to_avoid)}</div>
        </DataCard>
      </div>

      {/* MARKET SNAPSHOT */}
      <SectionLabel>MARKET SNAPSHOT</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
        {marketItems.map((item) => (
          <DataCard key={item.label} className="px-4 py-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[8px] text-label uppercase font-medium">{item.label}</span>
              {item.label === "VIX" && (
                item.sub?.toLowerCase() === "elevated" || item.sub?.toLowerCase() === "extreme"
                  ? <TrendingUp size={12} className="text-bearish-text" />
                  : <TrendingDown size={12} className="text-bullish-text" />
              )}
            </div>
            <div className="text-[18px] font-bold text-foreground font-mono">{item.value != null ? item.value : "—"}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {item.pct != null ? (
                <DeltaValue value={item.pct} invert={item.invert} />
              ) : item.delta != null ? (
                <DeltaValue value={item.delta} invert={item.invert} />
              ) : null}
              {item.sub && <span className={`text-[8px] font-semibold uppercase ${vixColor(item.sub)}`}>{item.sub}</span>}
            </div>
          </DataCard>
        ))}
      </div>

      {/* 4. WHAT CHANGED TODAY */}
      {changeBullets.length > 0 && (
        <>
          <SectionLabel>WAT VERANDERDE VANDAAG</SectionLabel>
          <DataCard className="px-4 py-3 mb-3">
            <div className="space-y-1">
              {changeBullets.slice(0, 5).map((bullet: string, i: number) => {
                const lower = bullet.toLowerCase();
                const isPositive = lower.includes("stijg") || lower.includes("positie") || lower.includes("risk-on") || lower.includes("bullish") || lower.includes("+");
                const isNegative = lower.includes("daal") || lower.includes("negatief") || lower.includes("risk-off") || lower.includes("bearish") || lower.includes("druk") || lower.includes("escalat");
                const dotColor = isPositive ? "#16A34A" : isNegative ? "#DC2626" : "#6B7280";
                return (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: dotColor }} />
                    <span className="text-[11px] text-sub-text leading-relaxed">{bullet}</span>
                  </div>
                );
              })}
            </div>
          </DataCard>
        </>
      )}

      {/* 5. CURRENCY RANKING (parsed from cockpit) */}
      <SectionLabel>CURRENCY RANKING</SectionLabel>
      <DataCard className="overflow-hidden mb-3 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">#</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Currency</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Bias</th>
              <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Conviction</th>
            </tr>
          </thead>
          <tbody>
            {parseCurrencyRanking(a?.currency_ranking).map((fx) => {
              const biasColor = fx.bias === "bullish" ? "bg-bullish-bg text-bullish-text" : fx.bias === "bearish" ? "bg-bearish-bg text-bearish-text" : "bg-neutral-bg text-neutral-text";
              return (
                <tr key={fx.rank} className="border-b border-card-border last:border-0">
                  <td className="text-[11px] font-mono font-bold text-label px-4 py-2">{fx.rank}</td>
                  <td className="text-[12px] font-bold text-foreground px-4 py-2">{fx.code}</td>
                  <td className="px-4 py-2"><span className={`px-2 py-[2px] rounded text-[9px] font-bold uppercase ${biasColor}`}>{fx.bias}</span></td>
                  <td className="text-[10px] text-sub-text px-4 py-2 uppercase">{fx.conviction}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataCard>

      {/* HIGH CONVICTION TRADES */}
      {parseHighConviction(a?.high_conviction_assets).length > 0 && (
        <>
          <SectionLabel>HIGH CONVICTION TRADES</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {parseHighConviction(a?.high_conviction_assets).map((idea, i) => {
              const isLong = idea.toLowerCase().startsWith("long");
              const isShort = idea.toLowerCase().startsWith("short");
              const borderColor = isLong ? "border-l-bullish-text" : isShort ? "border-l-bearish-text" : "border-l-label";
              const icon = isLong ? <TrendingUp size={13} className="text-bullish-text" /> : isShort ? <TrendingDown size={13} className="text-bearish-text" /> : <Minus size={13} className="text-label" />;
              const parts = idea.split("—").map(s => s.trim());
              return (
                <DataCard key={i} className={`px-4 py-3 border-l-[3px] ${borderColor}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {icon}
                    <span className="text-[12px] font-bold text-foreground">{parts[0]}</span>
                  </div>
                  {parts[1] && <div className="text-[10px] text-sub-text leading-relaxed">{parts[1]}</div>}
                </DataCard>
              );
            })}
          </div>
        </>
      )}

      {/* SUMMARY DASHBOARD */}
      {parseSummaryDashboard(a?.summary_dashboard).length > 0 && (
        <>
          <SectionLabel>DAILY SUMMARY</SectionLabel>
          <DataCard className="px-4 py-3 mb-3">
            <div className="space-y-3">
              {parseSummaryDashboard(a?.summary_dashboard).map((section, i) => (
                <div key={i}>
                  {section.header && <div className="text-[9px] text-label uppercase tracking-wider font-bold mb-0.5">{section.header}</div>}
                  <div className="text-[11px] text-sub-text leading-relaxed">{section.body}</div>
                </div>
              ))}
            </div>
          </DataCard>
        </>
      )}

      {/* TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Events */}
        <DataCard className="overflow-hidden overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-card-border flex items-center gap-2">
            <CalendarDays size={13} className="text-label" />
            <span className="text-[8px] text-label uppercase tracking-wider font-medium">AANKOMENDE EVENTS</span>
          </div>
          {events.length === 0 && loaded ? (
            <div className="p-4 text-center text-[11px] text-label">{FALLBACK}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Datum/Tijd</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Event</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Valuta</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Impact</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary cursor-pointer border-b border-card-border last:border-0" onClick={() => navigate("/calendar")}>
                    <td className="text-[10px] text-sub-text px-4 py-2">{fmtDateTime(e.event_datetime)}</td>
                    <td className="text-[10px] text-sub-text px-4 py-2">{val(e.event_name)}</td>
                    <td className="text-[10px] text-sub-text px-4 py-2">{val(e.event_currency)}</td>
                    <td className="px-4 py-2"><div className="flex items-center gap-1"><ImpactChip impact={e.event_impact} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 py-2 border-t border-card-border">
            <span className="text-[9px] text-purple-accent cursor-pointer hover:underline font-medium" onClick={() => navigate("/calendar")}>Alle events →</span>
          </div>
        </DataCard>

        {/* Reports */}
        <DataCard className="overflow-hidden overflow-x-auto">
          <div className="px-4 py-2.5 border-b border-card-border flex items-center gap-2">
            <FileText size={13} className="text-label" />
            <span className="text-[8px] text-label uppercase tracking-wider font-medium">RECENTE RAPPORTEN</span>
          </div>
          {reports.length === 0 && loaded ? (
            <div className="p-4 text-center text-[11px] text-label">{FALLBACK}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Datum</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Titel</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Regime</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Score</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary cursor-pointer border-b border-card-border last:border-0" onClick={() => navigate(`/reports?id=${r.id}`)}>
                    <td className="text-[10px] text-sub-text px-4 py-2">{fmtDate(r.analysis_date)}</td>
                    <td className="text-[10px] text-sub-text px-4 py-2 max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5"><FileText size={11} className="text-label shrink-0" />{val(r.title)}</div>
                    </td>
                    <td className="px-4 py-2"><span className="bg-secondary text-purple-accent px-1.5 py-[1px] text-[8px] rounded uppercase font-semibold">{val(r.macro_regime)}</span></td>
                    <td className="text-[10px] text-foreground font-mono font-semibold px-4 py-2">{r.confidence_score != null ? `${r.confidence_score}/10` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 py-2 border-t border-card-border">
            <span className="text-[9px] text-purple-accent cursor-pointer hover:underline font-medium" onClick={() => navigate("/reports")}>Alle rapporten →</span>
          </div>
        </DataCard>
      </div>
    </DashboardLayout>
  );
}
