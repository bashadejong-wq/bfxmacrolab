import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, ImpactChip, fmtDate, fmtDateTime, queryWithRetry, safeText, renderDashboardText, formatLabel, RegimeBadge } from "@/components/ui-helpers";
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
    const m = part.trim().match(/^(\d+)\.\s*(\w+)\s*\(([^,]+),\s*(\w+)\)$/);
    if (!m) return null;
    return { rank: Number(m[1]), code: m[2], bias: m[3].toLowerCase().trim(), conviction: m[4].toLowerCase() };
  }).filter(Boolean) as any[];
}

function parseHighConviction(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split("|").map(s => s.replace(/^[\s—–\-]+/, '').trim()).filter(s => s.length > 0);
}

function parseSummaryDashboard(raw: string | null): { header: string; body: string }[] {
  if (!raw) return [];
  const text = renderDashboardText(raw);
  if (!text) return [];
  const sections: { header: string; body: string }[] = [];
  const lines = text.split("\n");
  let current: { header: string; body: string } | null = null;
  for (const line of lines) {
    const trimmed = safeText(line);
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

function ConvictionBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const pct = Math.min(Math.max((s / 10) * 100, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[28px] font-black text-purple-accent font-mono">{s}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[8px] text-label uppercase">/10</span>
        <div className="w-[100px] h-[4px] rounded-full bg-secondary overflow-hidden">
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
  const prefix = positive ? "▲ " : value < 0 ? "▼ " : "";
  return (
    <span className="text-[11px] font-mono font-semibold" style={{ color }}>
      {prefix}{typeof value === "number" ? Math.abs(value).toFixed(2) : value}%
    </span>
  );
}

function getBiasClassForRanking(bias: string): string {
  const b = bias.toLowerCase().trim();
  if (b === "bullish") return "bg-bullish-bg text-bullish-text";
  if (b === "licht bullish") return "bg-bullish-bg text-[#4ADE80]";
  if (b === "bearish") return "bg-bearish-bg text-bearish-text";
  if (b === "licht bearish") return "bg-[#FFF7ED] text-[#F97316]";
  if (b === "neutraal") return "bg-neutral-bg text-neutral-text";
  if (b === "niet relevant") return "bg-neutral-bg text-[#D1D5DB] italic text-[8px]";
  if (b === "mixed") return "bg-mixed-bg text-mixed-text";
  return "bg-neutral-bg text-neutral-text";
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
      queryWithRetry(() => supabase.from("macro_events_calendar").select("*").gte("event_date", new Date().toISOString().split("T")[0]).or('event_impact.ilike.high,event_impact.ilike.medium,event_impact.ilike.High,event_impact.ilike.Medium,event_impact.ilike.HIGH,event_impact.ilike.MEDIUM').order("event_datetime", { ascending: true }).limit(6), "Overview/events"),
      queryWithRetry(() => supabase.from("report_analysis").select("id,analysis_date,title,macro_regime,confidence_score").order("analysis_date", { ascending: false }).limit(5), "Overview/reports"),
    ]);
    setCockpit((ck as any[])?.[0] || null);
    setMarket((md as any[])?.[0] || null);
    setEvents((e as any[]) || []);
    setReports((r as any[]) || []);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); const interval = setInterval(load, 60000); return () => clearInterval(interval); }, [load]);

  const a = cockpit;
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

  const chainSteps = [
    { label: "GROEI", value: a?.growth_view },
    { label: "INFLATIE", value: a?.inflation_view },
    { label: "CB", value: a?.cb_view },
    { label: "YIELDS", value: a?.yield_view },
    { label: "LIQUIDITEIT", value: a?.liquidity_view },
  ];

  const whatChanged = a?.daily_what_changed || "";
  const changeBullets = whatChanged
    ? whatChanged.split(/[.\n]/).map((s: string) => safeText(s)).filter((s: string) => s.length > 5)
    : [];

  const marketItems = [
    { label: "VIX", value: market?.vix, delta: market?.vix_delta, pct: market?.vix_pct, sub: market?.vix_regime, invert: true },
    { label: "DXY", value: market?.dxy, delta: market?.dxy_delta, pct: market?.dxy_pct },
    { label: "GOLD", value: market?.gold, delta: market?.gold_delta, pct: market?.gold_pct },
    { label: "OIL", value: market?.oil_brent, delta: market?.oil_delta, pct: market?.oil_pct },
    { label: "SPX", value: market?.spx, delta: market?.spx_delta, pct: market?.spx_pct },
  ];

  return (
    <DashboardLayout>
      {/* ━━━ SECTION 1: REGIME HERO ━━━ */}
      <div className="inst-card mb-8" style={{ borderLeft: `4px solid hsl(var(--purple-accent))`, borderRadius: 12, padding: '24px 32px' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <RegimeIcon size={20} className="text-purple-accent" />
              <RegimeBadge regime={a?.macro_regime} />
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md ${riskColor}`}>
              <RiskIcon size={14} />
              <span className="text-[10px] font-semibold uppercase">{formatLabel(a?.risk_regime) || "—"}</span>
            </div>
            <div className={`${alignColor} px-3 py-1 text-[9px] rounded font-bold uppercase`}>
              {formatLabel(a?.alignment_state) || "—"}
            </div>
          </div>
          <ConvictionBar score={a?.conviction_score} />
        </div>
        {/* Transmission flow */}
        <div className="flex items-center gap-1 mt-4 flex-wrap">
          {chainSteps.map((step, i) => {
            const color = getStepColor(step.value);
            return (
              <div key={step.label} className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-secondary">
                  <span className="text-[8px] text-label uppercase tracking-wider font-medium">{step.label}</span>
                  <span className="text-[11px] font-bold" style={{ color }}>{val(step.value)}</span>
                </div>
                {i < chainSteps.length - 1 && <ChevronRight size={12} className="text-label shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ━━━ SECTION 2: WHAT TO DO / AVOID ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 section-gap">
        <DataCard className="p-6 border-accent-bullish">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-bullish-text" />
            <span className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold">WAT TE DOEN</span>
          </div>
          <div className="text-[13px] text-sub-text leading-relaxed">{safeText(textVal(a?.what_to_do))}</div>
        </DataCard>
        <DataCard className="p-6 border-accent-bearish">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={14} className="text-bearish-text" />
            <span className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold">VERMIJD</span>
          </div>
          <div className="text-[13px] text-sub-text leading-relaxed">{safeText(textVal(a?.what_to_avoid))}</div>
        </DataCard>
      </div>

      {/* ━━━ SECTION 3: MARKET SNAPSHOT ━━━ */}
      <div className="inst-section-label">MARKET SNAPSHOT</div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 section-gap">
        {marketItems.map((item) => (
          <DataCard key={item.label} className="p-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold">{item.label}</span>
              {item.label === "VIX" && (
                item.sub?.toLowerCase() === "elevated" || item.sub?.toLowerCase() === "extreme"
                  ? <TrendingUp size={12} className="text-bearish-text" />
                  : <TrendingDown size={12} className="text-bullish-text" />
              )}
            </div>
            <div className="inst-metric-sm mt-1">{item.value != null ? item.value : "—"}</div>
            <div className="flex items-center gap-2 mt-2">
              {item.pct != null ? (
                <DeltaValue value={item.pct} invert={item.invert} />
              ) : item.delta != null ? (
                <DeltaValue value={item.delta} invert={item.invert} />
              ) : null}
              {item.sub && <span className={`text-[8px] font-semibold uppercase ${vixColor(item.sub)}`}>{formatLabel(item.sub)}</span>}
            </div>
          </DataCard>
        ))}
      </div>

      {/* ━━━ SECTION 4: WHAT CHANGED TODAY ━━━ */}
      {changeBullets.length > 0 && (
        <div className="section-gap">
          <DataCard className="p-6 border-accent-action">
            <div className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold mb-3">WAT VERANDERDE VANDAAG</div>
            <div className="space-y-2">
              {changeBullets.slice(0, 5).map((bullet: string, i: number) => {
                const lower = bullet.toLowerCase();
                const isPositive = lower.includes("stijg") || lower.includes("positie") || lower.includes("risk-on") || lower.includes("bullish") || lower.includes("+");
                const isNegative = lower.includes("daal") || lower.includes("negatief") || lower.includes("risk-off") || lower.includes("bearish") || lower.includes("druk") || lower.includes("escalat");
                const dotColor = isPositive ? "#16A34A" : isNegative ? "#DC2626" : "#6B7280";
                return (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: dotColor }} />
                    <span className="text-[13px] text-sub-text leading-relaxed">{bullet}</span>
                  </div>
                );
              })}
            </div>
          </DataCard>
        </div>
      )}

      {/* ━━━ HIGH CONVICTION + DAILY SUMMARY (two-column) ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 section-gap">
        {/* Left: High Conviction */}
        <div>
          <div className="inst-section-label">HIGH CONVICTION TRADES</div>
          {parseHighConviction(a?.high_conviction_assets).length > 0 ? (
            <div className="space-y-3">
              {parseHighConviction(a?.high_conviction_assets).map((idea, i) => {
                const isLong = idea.toLowerCase().startsWith("long");
                const isShort = idea.toLowerCase().startsWith("short");
                const accentClass = isLong ? "border-accent-bullish" : isShort ? "border-accent-bearish" : "border-accent-neutral";
                const icon = isLong ? <TrendingUp size={14} className="text-bullish-text" /> : isShort ? <TrendingDown size={14} className="text-bearish-text" /> : <Minus size={14} className="text-label" />;
                const parts = idea.split("—").map(s => safeText(s));
                return (
                  <DataCard key={i} className={`p-4 ${accentClass}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {icon}
                      <span className="text-[13px] font-bold text-foreground">{parts[0]}</span>
                    </div>
                    {parts[1] && <div className="text-[12px] text-sub-text leading-relaxed">{parts[1]}</div>}
                  </DataCard>
                );
              })}
            </div>
          ) : (
            <DataCard className="p-6">
              <span className="text-[13px] text-label italic">Geen hoog-conviction trades vandaag</span>
            </DataCard>
          )}
        </div>

        {/* Right: Daily Summary + Monitoring */}
        <div>
          <div className="inst-section-label">DAILY SUMMARY</div>
          <DataCard className="p-6 border-accent-action">
            {parseSummaryDashboard(a?.summary_dashboard).length > 0 ? (
              <div className="space-y-4">
                {parseSummaryDashboard(a?.summary_dashboard).map((section, i) => (
                  <div key={i}>
                    {section.header && <div className="text-[10px] text-label uppercase tracking-[0.12em] font-bold mb-1">{section.header}</div>}
                    <div className="text-[14px] text-sub-text leading-[1.7]">{safeText(section.body)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[13px] text-label italic">{FALLBACK}</span>
            )}

            {/* Monitoring items merged into summary */}
            {(a?.daily_what_to_watch || a?.next_week_focus) && (
              <div className="mt-4 pt-4 border-t border-card-border space-y-3">
                {a?.daily_what_to_watch && (
                  <div>
                    <div className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold mb-1">TE MONITOREN VANDAAG</div>
                    <div className="text-[12px] text-sub-text leading-relaxed">{safeText(a.daily_what_to_watch)}</div>
                  </div>
                )}
                {a?.next_week_focus && (
                  <div>
                    <div className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold mb-1">FOCUS VOLGENDE WEEK</div>
                    <div className="text-[12px] text-foreground font-semibold leading-relaxed">{safeText(a.next_week_focus)}</div>
                  </div>
                )}
              </div>
            )}
          </DataCard>
        </div>
      </div>

      {/* ━━━ EVENTS + REPORTS (two-column 60/40) ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 section-gap">
        {/* Events — 60% */}
        <DataCard className="overflow-hidden overflow-x-auto md:col-span-3">
          <div className="px-6 py-4 border-b border-card-border flex items-center gap-2">
            <CalendarDays size={14} className="text-label" />
            <span className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold">AANKOMENDE EVENTS</span>
          </div>
          {events.length === 0 && loaded ? (
            <div className="p-6 text-center text-[12px] text-label">{FALLBACK}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[9px] text-label uppercase text-left px-6 py-2">Datum/Tijd</th>
                  <th className="text-[9px] text-label uppercase text-left px-6 py-2">Event</th>
                  <th className="text-[9px] text-label uppercase text-left px-6 py-2">Valuta</th>
                  <th className="text-[9px] text-label uppercase text-left px-6 py-2">Impact</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary cursor-pointer border-b border-card-border last:border-0 zebra-row" onClick={() => navigate("/calendar")}>
                    <td className="text-[11px] text-sub-text px-6 py-3">{fmtDateTime(e.event_datetime)}</td>
                    <td className="text-[11px] text-sub-text px-6 py-3">{safeText(val(e.event_name))}</td>
                    <td className="text-[11px] text-sub-text px-6 py-3">{val(e.event_currency)}</td>
                    <td className="px-6 py-3"><ImpactChip impact={e.event_impact} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-6 py-3 border-t border-card-border">
            <span className="text-[10px] text-purple-accent cursor-pointer hover:underline font-medium" onClick={() => navigate("/calendar")}>Alle events →</span>
          </div>
        </DataCard>

        {/* Reports — 40% */}
        <DataCard className="overflow-hidden overflow-x-auto md:col-span-2">
          <div className="px-6 py-4 border-b border-card-border flex items-center gap-2">
            <FileText size={14} className="text-label" />
            <span className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold">RECENTE RAPPORTEN</span>
          </div>
          {reports.length === 0 && loaded ? (
            <div className="p-6 text-center text-[12px] text-label">{FALLBACK}</div>
          ) : (
            <div className="divide-y divide-card-border">
              {reports.map((r) => (
                <div key={r.id} className="px-6 py-3 hover:bg-secondary cursor-pointer transition-colors" onClick={() => navigate(`/reports?id=${r.id}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={11} className="text-label shrink-0" />
                    <span className="text-[11px] text-foreground font-medium truncate flex-1">{safeText(val(r.title))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-secondary text-purple-accent px-1.5 py-[1px] text-[8px] rounded uppercase font-semibold">{formatLabel(r.macro_regime) || "—"}</span>
                    <span className="text-[10px] text-foreground font-mono font-semibold">{r.confidence_score != null ? `${r.confidence_score}/10` : "—"}</span>
                    <span className="ml-auto text-[10px] text-label">{fmtDate(r.analysis_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-6 py-3 border-t border-card-border">
            <span className="text-[10px] text-purple-accent cursor-pointer hover:underline font-medium" onClick={() => navigate("/reports")}>Alle rapporten →</span>
          </div>
        </DataCard>
      </div>

      {/* ━━━ CURRENCY RANKING ━━━ */}
      <div className="inst-section-label">CURRENCY RANKING</div>
      <DataCard className="overflow-hidden overflow-x-auto">
        {parseCurrencyRanking(a?.currency_ranking).length === 0 ? (
          <div className="text-center text-label text-[13px] italic py-8">
            Ranking wordt berekend op basis van recente rapporten — nog geen data
          </div>
        ) : (
          <>
            <div className="block sm:hidden">
              {parseCurrencyRanking(a?.currency_ranking).map((fx) => {
                const biasClass = getBiasClassForRanking(fx.bias);
                return (
                  <div key={fx.rank} className="flex items-center gap-3 px-6 py-3 border-b border-card-border last:border-0">
                    <span className="text-[12px] font-mono font-bold text-label w-5">{fx.rank}</span>
                    <span className="text-[13px] font-bold text-foreground w-10">{fx.code}</span>
                    <span className={`px-2 py-[2px] rounded text-[9px] font-bold uppercase ${biasClass}`}>{fx.bias}</span>
                    <span className="text-[10px] text-sub-text ml-auto uppercase">{fx.conviction}</span>
                  </div>
                );
              })}
            </div>
            <table className="w-full hidden sm:table">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[9px] text-label uppercase text-left px-6 py-2">#</th>
                  <th className="text-[9px] text-label uppercase text-left px-6 py-2">Currency</th>
                  <th className="text-[9px] text-label uppercase text-left px-6 py-2">Bias</th>
                  <th className="text-[9px] text-label uppercase text-left px-6 py-2">Conviction</th>
                </tr>
              </thead>
              <tbody>
                {parseCurrencyRanking(a?.currency_ranking).map((fx) => {
                  const biasClass = getBiasClassForRanking(fx.bias);
                  return (
                    <tr key={fx.rank} className="border-b border-card-border last:border-0 zebra-row">
                      <td className="text-[12px] font-mono font-bold text-label px-6 py-3">{fx.rank}</td>
                      <td className="text-[13px] font-bold text-foreground px-6 py-3">{fx.code}</td>
                      <td className="px-6 py-3"><span className={`px-2 py-[2px] rounded text-[9px] font-bold uppercase ${biasClass}`}>{fx.bias}</span></td>
                      <td className="text-[11px] text-sub-text px-6 py-3 uppercase">{fx.conviction}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </DataCard>
    </DashboardLayout>
  );
}
