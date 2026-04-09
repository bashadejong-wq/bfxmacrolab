import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, ImpactChip, SurpriseChip, MarkdownBlock, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { Zap, Activity, Minus, TrendingUp, TrendingDown } from "lucide-react";

const PERIODS = [
  { label: "1W", days: 7 }, { label: "1M", days: 30 }, { label: "3M", days: 90 }, { label: "6M", days: 180 },
];
const CURRENCIES_ALL = ["ALL","USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF","CNY"];
const IMPACTS = ["ALL","HIGH","MEDIUM","LOW"];
const SURPRISES = ["ALL","BEAT","MISS","IN LINE"];

export default function EventHistory() {
  const [events, setEvents] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [period, setPeriod] = useState("3M");
  const [currency, setCurrency] = useState("ALL");
  const [impact, setImpact] = useState<string[]>(["HIGH","MEDIUM"]);
  const [surprise, setSurprise] = useState("ALL");

  const periodDays = PERIODS.find(p => p.label === period)?.days || 90;
  const fromDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - periodDays); return d.toISOString().split("T")[0]; }, [periodDays]);

  useEffect(() => {
    setLoaded(false);
    const fn = async () => {
      let q = supabase.from("macro_events_calendar").select("*").not("actual_value", "is", null).gte("event_date", fromDate).order("event_datetime", { ascending: false });
      if (currency !== "ALL") q = q.eq("event_currency", currency);
      if (!impact.includes("ALL")) q = q.in("event_impact", impact.map(i => i.toLowerCase()));
      return q;
    };
    queryWithRetry(fn, "EventHistory/macro_events_calendar").then(data => { setEvents((data as any[]) || []); setLoaded(true); });
  }, [fromDate, currency, impact]);

  const filtered = useMemo(() => {
    if (surprise === "ALL") return events;
    return events.filter(e => {
      const d = (e.surprise_direction || "").toLowerCase();
      if (surprise === "BEAT") return d === "positive";
      if (surprise === "MISS") return d === "negative";
      return d === "neutral" || d === "inline" || d === "" || !e.surprise_direction;
    });
  }, [events, surprise]);

  const stats = useMemo(() => ({
    total: filtered.length,
    beat: filtered.filter(e => (e.surprise_direction || "").toLowerCase() === "positive").length,
    miss: filtered.filter(e => (e.surprise_direction || "").toLowerCase() === "negative").length,
    inline: filtered.length - filtered.filter(e => ["positive","negative"].includes((e.surprise_direction || "").toLowerCase())).length,
  }), [filtered]);

  const perCurrency = useMemo(() => {
    const map: Record<string, { beat: number; miss: number; inline: number }> = {};
    filtered.forEach(e => {
      const cur = e.event_currency || "?";
      if (!map[cur]) map[cur] = { beat: 0, miss: 0, inline: 0 };
      const d = (e.surprise_direction || "").toLowerCase();
      if (d === "positive") map[cur].beat++; else if (d === "negative") map[cur].miss++; else map[cur].inline++;
    });
    return Object.entries(map).sort((a, b) => (b[1].beat + b[1].miss + b[1].inline) - (a[1].beat + a[1].miss + a[1].inline));
  }, [filtered]);

  const toggleImpact = (v: string) => {
    if (v === "ALL") { setImpact(["ALL"]); return; }
    let next = impact.filter(i => i !== "ALL");
    if (next.includes(v)) next = next.filter(i => i !== v); else next = [...next, v];
    if (next.length === 0) next = ["ALL"];
    setImpact(next);
  };

  return (
    <DashboardLayout>
      {/* FILTER BAR */}
      <div className="bg-card border border-card-border rounded-lg p-5 mb-8 flex flex-wrap gap-4 items-center sticky top-0 z-10">
        <div>
          <div className="text-[0.65rem] text-label uppercase mb-1">Periode</div>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button key={p.label} onClick={() => setPeriod(p.label)}
                className={`px-3 py-1 text-[10px] rounded font-semibold ${period === p.label ? "bg-purple-accent text-white" : "bg-neutral-bg text-neutral-text hover:bg-secondary"}`}>{p.label}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[0.65rem] text-label uppercase mb-1">Valuta</div>
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-card border border-card-border rounded px-2 py-1 text-[11px] text-foreground">
            {CURRENCIES_ALL.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[0.65rem] text-label uppercase mb-1">Impact</div>
          <div className="flex gap-1">
            {IMPACTS.map(i => (
              <button key={i} onClick={() => toggleImpact(i)}
                className={`px-3 py-1 text-[10px] rounded font-semibold ${impact.includes(i) ? "bg-purple-accent text-white" : "bg-neutral-bg text-neutral-text hover:bg-secondary"}`}>{i}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[0.65rem] text-label uppercase mb-1">Surprise</div>
          <div className="flex gap-1">
            {SURPRISES.map(s => (
              <button key={s} onClick={() => setSurprise(s)}
                className={`px-3 py-1 text-[10px] rounded font-semibold ${surprise === s ? "bg-purple-accent text-white" : "bg-neutral-bg text-neutral-text hover:bg-secondary"}`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <DataCard className="p-5 text-center">
          <div className="text-[0.65rem] text-label uppercase">Totaal</div>
          <div className="text-[22px] font-extrabold text-foreground font-mono mt-1">{stats.total}</div>
        </DataCard>
        <DataCard className="p-5 text-center">
          <div className="flex items-center justify-center gap-1"><TrendingUp size={12} className="text-bullish-text" /><span className="text-[0.65rem] text-label uppercase">Beat</span></div>
          <div className="text-[22px] font-extrabold text-bullish-text font-mono mt-1">{stats.beat}</div>
        </DataCard>
        <DataCard className="p-5 text-center">
          <div className="flex items-center justify-center gap-1"><TrendingDown size={12} className="text-bearish-text" /><span className="text-[0.65rem] text-label uppercase">Miss</span></div>
          <div className="text-[22px] font-extrabold text-bearish-text font-mono mt-1">{stats.miss}</div>
        </DataCard>
        <DataCard className="p-5 text-center">
          <div className="flex items-center justify-center gap-1"><Minus size={12} className="text-neutral-text" /><span className="text-[0.65rem] text-label uppercase">In Line</span></div>
          <div className="text-[22px] font-extrabold text-neutral-text font-mono mt-1">{stats.inline}</div>
        </DataCard>
      </div>

      {/* TABLE */}
      {loaded && filtered.length === 0 ? (
        <div className="text-center text-label text-[13px] mt-10">Geen events gevonden</div>
      ) : filtered.length > 0 && (
        <DataCard className="overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2">Datum</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2">Event</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2">Valuta</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2">Verwacht</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2">Actueel</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2">Verrassing</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2">Impact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const isExpanded = expandedId === e.id;
                return (
                  <tbody key={e.id}>
                    <tr className="border-b border-card-border hover:bg-secondary cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{fmtDate(e.event_date)}</td>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{val(e.event_name)}</td>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{val(e.event_currency)}</td>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{val(e.expected_value)}</td>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{val(e.actual_value)}</td>
                      <td className="px-5 py-2.5"><SurpriseChip direction={e.surprise_direction} score={e.surprise_score} /></td>
                      <td className="px-5 py-2.5"><ImpactChip impact={e.event_impact} /></td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-secondary px-5 py-4">
                          <div className="flex gap-6 mb-3">
                            {[["Yields", e.yields_reaction],["DXY", e.dxy_reaction],["Aandelen", e.equity_reaction],["Goud", e.gold_reaction]].map(([l,v]) => (
                              <div key={l as string}>
                                <div className="text-[0.65rem] text-label uppercase">{l}</div>
                                <div className="text-[11px] text-sub-text">{val(v)}</div>
                              </div>
                            ))}
                          </div>
                          <MarkdownBlock content={e.interpretation} />
                          {e.market_impact_narrative && <div className="mt-2"><MarkdownBlock content={e.market_impact_narrative} /></div>}
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </tbody>
          </table>
        </DataCard>
      )}

      {/* BEAT/MISS PER VALUTA */}
      {perCurrency.length > 0 && (
        <>
          <SectionLabel>BEAT/MISS PER VALUTA</SectionLabel>
          <div className="grid grid-cols-5 gap-4">
            {perCurrency.map(([cur, counts]) => (
              <DataCard key={cur} className="p-5">
                <div className="text-[13px] font-bold text-foreground mb-2">{cur}</div>
                <div className="flex gap-3 text-[11px]">
                  <span className="text-bullish-text font-semibold">{counts.beat} beat</span>
                  <span className="text-bearish-text font-semibold">{counts.miss} miss</span>
                  <span className="text-neutral-text">{counts.inline} inline</span>
                </div>
              </DataCard>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
