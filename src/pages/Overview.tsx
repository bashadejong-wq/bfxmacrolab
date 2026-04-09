import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, BiasChip, RiskChip, ImpactChip, MarkdownBlock, fmtDate, fmtDateTime, queryWithRetry } from "@/components/ui-helpers";

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
      queryWithRetry(() => supabase.from("fx_consensus").select("*").in("entity_code", ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"]).order("conviction_pct", { ascending: false }).order("total_count", { ascending: false }).limit(3), "Overview/fx_consensus"),
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
  }, []);

  const vixColor = (regime: string | null) => {
    const r = (regime || "").toLowerCase();
    return r === "elevated" ? "text-warning-text" : r === "extreme" ? "text-bearish-text" : r === "low" ? "text-bullish-text" : "text-label";
  };

  return (
    <DashboardLayout>
      {/* STATE STRIP */}
      <DataCard className="p-5 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-[9px] text-label uppercase tracking-[0.08em]">MACRO REGIME</div>
            <div className="text-[22px] font-extrabold text-foreground uppercase mt-1">{val(alignment?.alignment_state)}</div>
            <div className="flex gap-2 mt-2">
              <span className="bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase">{val(alignment?.macro_regime)}</span>
              <RiskChip regime={alignment?.risk_regime} />
            </div>
            <div className="text-[11px] text-sub-text leading-relaxed max-w-[480px] mt-2 line-clamp-2">{val(alignment?.core_driver)}</div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="flex items-baseline">
              <span className="text-[32px] font-extrabold text-purple-accent font-mono">{val(alignment?.conviction_score)}</span>
              <span className="text-[14px] text-label ml-1">/10</span>
            </div>
          </div>
        </div>
      </DataCard>

      {/* WAT TE DOEN / VERMIJD */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <DataCard className="p-4 border-l-[3px] border-l-bullish-text">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">WAT TE DOEN</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(alignment?.what_to_do)}</div>
        </DataCard>
        <DataCard className="p-4 border-l-[3px] border-l-bearish-text">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">VERMIJD</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(alignment?.what_to_avoid)}</div>
        </DataCard>
      </div>

      {/* MARKET STRIP */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: "VIX", value: market?.vix, sub: market?.vix_regime },
          { label: "DXY", value: market?.dxy_trade_weighted },
          { label: "GOLD", value: market?.gold },
          { label: "OIL BRENT", value: market?.oil_brent },
          { label: "SPX", value: market?.spx },
        ].map((item) => (
          <DataCard key={item.label} className="p-[14px_16px]">
            <div className="text-[9px] text-label uppercase">{item.label}</div>
            <div className="text-[18px] font-bold text-foreground font-mono mt-1">{val(item.value)}</div>
            {item.sub && <div className={`text-[9px] mt-1 ${vixColor(item.sub)}`}>{item.sub}</div>}
          </DataCard>
        ))}
      </div>

      {/* FX CONSENSUS */}
      <SectionLabel subtitle="Top 3 op conviction">FX CONSENSUS</SectionLabel>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {consensus.length === 0 && loaded ? (
          <div className="col-span-3 text-center text-[11px] text-label">Geen data beschikbaar</div>
        ) : consensus.map((c) => {
          const bias = (c.consensus_bias || "").toLowerCase();
          const borderColor = bias === "bullish" ? "border-l-bullish-text" : bias === "bearish" ? "border-l-bearish-text" : "border-l-neutral-bg";
          return (
            <DataCard key={c.entity_code} className={`p-[16px_18px] border-l-2 ${borderColor}`} onClick={() => navigate(`/currencies/${c.entity_code}`)}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[20px] font-extrabold text-foreground">{c.entity_code}</span>
                <BiasChip bias={c.consensus_bias} />
              </div>
              <div className="text-[15px] font-bold text-purple-accent">{val(c.conviction_pct, "%")}</div>
              <div className="text-[9px] text-neutral-text mt-1">{c.bullish_count ?? 0}/{c.total_count ?? 0} rapporten</div>
            </DataCard>
          );
        })}
      </div>

      {/* TABLES */}
      <div className="grid grid-cols-2 gap-4">
        {/* Events */}
        <DataCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border">
            <span className="text-[9px] text-label uppercase tracking-[0.08em] font-medium">AANKOMENDE EVENTS</span>
          </div>
          {events.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-label">Geen events gevonden</div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[9px] text-label uppercase text-left px-4 py-2">Datum/Tijd</th>
                  <th className="text-[9px] text-label uppercase text-left px-4 py-2">Event</th>
                  <th className="text-[9px] text-label uppercase text-left px-4 py-2">Valuta</th>
                  <th className="text-[9px] text-label uppercase text-left px-4 py-2">Impact</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary cursor-pointer border-b border-card-border last:border-0" onClick={() => navigate("/calendar")}>
                    <td className="text-[11px] text-sub-text px-4 py-2">{fmtDateTime(e.event_datetime)}</td>
                    <td className="text-[11px] text-sub-text px-4 py-2">{val(e.event_name)}</td>
                    <td className="text-[11px] text-sub-text px-4 py-2">{val(e.event_currency)}</td>
                    <td className="px-4 py-2"><ImpactChip impact={e.event_impact} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 py-2 border-t border-card-border">
            <span className="text-[10px] text-purple-accent cursor-pointer hover:underline" onClick={() => navigate("/calendar")}>→ Alle events</span>
          </div>
        </DataCard>

        {/* Reports */}
        <DataCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border">
            <span className="text-[9px] text-label uppercase tracking-[0.08em] font-medium">RECENTE RAPPORTEN</span>
          </div>
          {reports.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-label">Geen rapporten gevonden</div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[9px] text-label uppercase text-left px-4 py-2">Datum</th>
                  <th className="text-[9px] text-label uppercase text-left px-4 py-2">Titel</th>
                  <th className="text-[9px] text-label uppercase text-left px-4 py-2">Regime</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary cursor-pointer border-b border-card-border last:border-0" onClick={() => navigate(`/reports?id=${r.id}`)}>
                    <td className="text-[11px] text-sub-text px-4 py-2">{fmtDate(r.analysis_date)}</td>
                    <td className="text-[11px] text-sub-text px-4 py-2 max-w-[200px] truncate">{val(r.title)}</td>
                    <td className="px-4 py-2"><span className="bg-[#F5F0FF] text-purple-accent px-2 py-[2px] text-[9px] rounded uppercase">{val(r.macro_regime)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 py-2 border-t border-card-border">
            <span className="text-[10px] text-purple-accent cursor-pointer hover:underline" onClick={() => navigate("/reports")}>→ Alle rapporten</span>
          </div>
        </DataCard>
      </div>
    </DashboardLayout>
  );
}
