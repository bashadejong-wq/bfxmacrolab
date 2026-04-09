import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, BiasChip, RiskChip, ImpactChip, MarkdownBlock, fmtDate, fmtDateTime, queryWithRetry } from "@/components/ui-helpers";
import {
  Zap, TrendingUp, TrendingDown, Sun, RefreshCw, GitMerge, HelpCircle,
  Shield, AlertTriangle, AlertOctagon, ShieldAlert, ShieldCheck,
  CheckCircle, XCircle, Star, FileText, CalendarDays, Activity, Minus,
} from "lucide-react";

const REGIME_ICONS: Record<string, React.ElementType> = {
  energy_shock: Zap,
  stagflation: TrendingUp,
  goldilocks: Sun,
  reflation: RefreshCw,
  deflation: TrendingDown,
  mixed: GitMerge,
  transitional: GitMerge,
};

const RISK_ICONS: Record<string, React.ElementType> = {
  low: ShieldCheck,
  normal: Shield,
  elevated: ShieldAlert,
  stress: AlertTriangle,
  crisis: AlertOctagon,
};

const RISK_COLORS: Record<string, string> = {
  low: "text-bullish-text bg-bullish-bg",
  normal: "text-neutral-text bg-neutral-bg",
  elevated: "text-warning-text bg-warning-bg",
  stress: "text-bearish-text bg-bearish-bg",
  crisis: "text-bearish-text bg-bearish-bg",
};

function getBiasColor(bias: string | null): string {
  const b = (bias || "").toLowerCase();
  if (b === "bullish") return "#16A34A";
  if (b === "bearish") return "#DC2626";
  if (b === "mixed") return "#D97706";
  return "#6B7280";
}

function getBiasBackground(bias: string | null): string {
  const b = (bias || "").toLowerCase();
  if (b === "bullish") return "#F0FDF4";
  if (b === "bearish") return "#FEF2F2";
  if (b === "mixed") return "#FFFBEB";
  return "#F9FAFB";
}

function ConvictionBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const pct = Math.min(Math.max((s / 10) * 100, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[28px] font-black text-purple-accent font-mono">{s}</span>
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-label uppercase tracking-wide">/10</span>
        <div className="w-[120px] h-[4px] rounded-full bg-[#E5E7EB] overflow-hidden">
          <div className="h-full rounded-full bg-purple-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function BiasPill({ code, bias, isTop3 }: { code: string; bias: string | null; isTop3: boolean }) {
  const color = getBiasColor(bias);
  const bg = getBiasBackground(bias);
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md" style={{ backgroundColor: bg }}>
      {isTop3 && <Star size={12} className="text-warning-text fill-warning-text" />}
      <span className="text-[11px] font-bold" style={{ color }}>{code}</span>
      <span className="text-[9px] uppercase font-semibold" style={{ color }}>{(bias || "neutral").toLowerCase()}</span>
    </div>
  );
}

const FALLBACK = "Nog geen data beschikbaar";

export default function Overview() {
  const navigate = useNavigate();
  const [alignment, setAlignment] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [consensus, setConsensus] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [a, m, c, e, r] = await Promise.all([
      queryWithRetry(() => supabase.from("alignment_engine").select("*").order("alignment_date", { ascending: false }).limit(1), "Overview/alignment_engine"),
      queryWithRetry(() => supabase.from("market_data_live").select("*").order("fetch_date", { ascending: false }).limit(1), "Overview/market_data_live"),
      queryWithRetry(() => supabase.from("fx_consensus").select("*").in("entity_code", ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"]).order("conviction_pct", { ascending: false }).order("total_count", { ascending: false }), "Overview/fx_consensus"),
      queryWithRetry(() => supabase.from("macro_events_calendar").select("*").gte("event_date", new Date().toISOString().split("T")[0]).in("event_impact", ["high","medium"]).order("event_datetime", { ascending: true }).limit(6), "Overview/macro_events_calendar"),
      queryWithRetry(() => supabase.from("report_analysis").select("id,analysis_date,title,macro_regime,confidence_score").order("analysis_date", { ascending: false }).limit(5), "Overview/report_analysis"),
    ]);
    setAlignment((a as any[])?.[0] || null);
    setMarket((m as any[])?.[0] || null);
    setConsensus((c as any[]) || []);
    setEvents((e as any[]) || []);
    setReports((r as any[]) || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const regimeKey = (alignment?.macro_regime || "").toLowerCase().replace(/[\s-]/g, "_");
  const RegimeIcon = REGIME_ICONS[regimeKey] || HelpCircle;
  const riskKey = (alignment?.risk_regime || "").toLowerCase().replace(/[\s-]/g, "_");
  const RiskIcon = RISK_ICONS[riskKey] || Shield;
  const riskColor = RISK_COLORS[riskKey] || "text-neutral-text bg-neutral-bg";

  const vixColor = (regime: string | null) => {
    const r = (regime || "").toLowerCase();
    return r === "elevated" ? "text-warning-text" : r === "extreme" ? "text-bearish-text" : r === "low" ? "text-bullish-text" : "text-label";
  };

  const top3Codes = consensus.slice(0, 3).map(c => c.entity_code);
  const allCurrencies = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];
  const consensusMap = Object.fromEntries(consensus.map(c => [c.entity_code, c]));

  const impactIcon = (impact: string | null) => {
    const i = (impact || "").toLowerCase();
    if (i === "high") return <Zap size={12} className="text-bearish-text" />;
    if (i === "medium") return <Activity size={12} className="text-warning-text" />;
    return <Minus size={12} className="text-neutral-text" />;
  };

  return (
    <DashboardLayout>
      {/* === REGIME HERO === */}
      <DataCard className="p-5 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-[10px] text-label uppercase tracking-[0.08em] mb-2">MACRO REGIME</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md">
                <RegimeIcon size={18} className="text-purple-accent" />
                <span className="text-[20px] font-black text-foreground uppercase tracking-tight">
                  {alignment?.macro_regime || FALLBACK}
                </span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-md ${riskColor}`}>
                <RiskIcon size={14} />
                <span className="text-[11px] font-semibold uppercase">{alignment?.risk_regime || "—"}</span>
              </div>
            </div>
            <div className="text-[11px] text-sub-text leading-relaxed max-w-[520px] line-clamp-2">
              {alignment?.core_driver || FALLBACK}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] text-label uppercase tracking-[0.08em] mb-2">CONVICTION</div>
            <ConvictionBar score={alignment?.conviction_score} />
          </div>
        </div>
      </DataCard>

      {/* === WHAT TO DO / AVOID === */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5 border-l-[3px] border-l-[#16A34A]">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-bullish-text" />
            <span className="text-[10px] text-label uppercase tracking-[0.08em] font-medium">WAT TE DOEN</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">
            {alignment?.what_to_do || FALLBACK}
          </div>
        </DataCard>
        <DataCard className="p-5 border-l-[3px] border-l-[#DC2626]">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={14} className="text-bearish-text" />
            <span className="text-[10px] text-label uppercase tracking-[0.08em] font-medium">VERMIJD</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">
            {alignment?.what_to_avoid || FALLBACK}
          </div>
        </DataCard>
      </div>

      {/* === MARKET CARDS === */}
      <SectionLabel>MARKET SNAPSHOT</SectionLabel>
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: "VIX", value: market?.vix, sub: market?.vix_regime },
          { label: "DXY", value: market?.dxy_trade_weighted || market?.dxy },
          { label: "GOLD", value: market?.gold },
          { label: "OIL BRENT", value: market?.oil_brent },
          { label: "SPX", value: market?.spx },
        ].map((item) => (
          <DataCard key={item.label} className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-label uppercase font-medium">{item.label}</span>
              {item.label === "VIX" && (
                item.sub?.toLowerCase() === "elevated" || item.sub?.toLowerCase() === "extreme"
                  ? <TrendingUp size={14} className="text-bearish-text" />
                  : <TrendingDown size={14} className="text-bullish-text" />
              )}
            </div>
            <div className="text-[20px] font-bold text-foreground font-mono mt-1">
              {item.value != null ? item.value : "—"}
            </div>
            {item.sub && (
              <div className={`text-[9px] mt-1 font-semibold uppercase ${vixColor(item.sub)}`}>{item.sub}</div>
            )}
          </DataCard>
        ))}
      </div>

      {/* === FX CONSENSUS === */}
      <SectionLabel subtitle="★ = Top 3 conviction">FX CONSENSUS</SectionLabel>
      <div className="flex flex-wrap gap-2 mb-8">
        {allCurrencies.map((code) => {
          const c = consensusMap[code];
          const bias = c?.consensus_bias || null;
          const isTop3 = top3Codes.includes(code);
          return <BiasPill key={code} code={code} bias={bias} isTop3={isTop3} />;
        })}
      </div>

      {/* === TABLES === */}
      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming Events */}
        <DataCard className="overflow-hidden">
          <div className="px-5 py-3 border-b border-card-border flex items-center gap-2">
            <CalendarDays size={14} className="text-label" />
            <span className="text-[10px] text-label uppercase tracking-[0.08em] font-medium">AANKOMENDE EVENTS</span>
          </div>
          {events.length === 0 && loaded ? (
            <div className="p-5 text-center text-[11px] text-label">{FALLBACK}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Datum/Tijd</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Event</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Valuta</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Impact</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary cursor-pointer border-b border-card-border last:border-0" onClick={() => navigate("/calendar")}>
                    <td className="text-[11px] text-sub-text px-5 py-2.5">{fmtDateTime(e.event_datetime)}</td>
                    <td className="text-[11px] text-sub-text px-5 py-2.5">{val(e.event_name)}</td>
                    <td className="text-[11px] text-sub-text px-5 py-2.5">{val(e.event_currency)}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-1">
                        {impactIcon(e.event_impact)}
                        <ImpactChip impact={e.event_impact} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-5 py-2.5 border-t border-card-border">
            <span className="text-[10px] text-purple-accent cursor-pointer hover:underline font-medium" onClick={() => navigate("/calendar")}>→ Alle events</span>
          </div>
        </DataCard>

        {/* Recent Reports */}
        <DataCard className="overflow-hidden">
          <div className="px-5 py-3 border-b border-card-border flex items-center gap-2">
            <FileText size={14} className="text-label" />
            <span className="text-[10px] text-label uppercase tracking-[0.08em] font-medium">RECENTE RAPPORTEN</span>
          </div>
          {reports.length === 0 && loaded ? (
            <div className="p-5 text-center text-[11px] text-label">{FALLBACK}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Datum</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Titel</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Regime</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary cursor-pointer border-b border-card-border last:border-0" onClick={() => navigate(`/reports?id=${r.id}`)}>
                    <td className="text-[11px] text-sub-text px-5 py-2.5">{fmtDate(r.analysis_date)}</td>
                    <td className="text-[11px] text-sub-text px-5 py-2.5 max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5">
                        <FileText size={12} className="text-label shrink-0" />
                        {val(r.title)}
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="bg-secondary text-purple-accent px-2 py-[2px] text-[9px] rounded uppercase font-semibold">{val(r.macro_regime)}</span>
                    </td>
                    <td className="text-[11px] text-foreground font-mono font-semibold px-5 py-2.5">{r.confidence_score != null ? `${r.confidence_score}/10` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-5 py-2.5 border-t border-card-border">
            <span className="text-[10px] text-purple-accent cursor-pointer hover:underline font-medium" onClick={() => navigate("/reports")}>→ Alle rapporten</span>
          </div>
        </DataCard>
      </div>
    </DashboardLayout>
  );
}
