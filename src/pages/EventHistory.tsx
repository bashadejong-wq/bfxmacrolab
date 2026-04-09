import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, ImpactChip, MarkdownBlock, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { Zap, Activity, Minus, ArrowUp, ArrowDown, CheckCircle, XCircle } from "lucide-react";

const PERIODS = [
  { label: "1W", days: 7 }, { label: "1M", days: 30 }, { label: "3M", days: 90 }, { label: "6M", days: 180 },
];
const CURRENCIES_ALL = ["ALL","USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF","CNY"];
const IMPACTS = ["ALL","HIGH","MEDIUM","LOW"];
const SURPRISES = ["ALL","BEAT","MISS","IN LINE"];

const impactIcon = (impact: string | null) => {
  const i = (impact || "").toLowerCase();
  if (i === "high") return <Zap size={13} className="text-bearish-text" />;
  if (i === "medium") return <Activity size={13} className="text-mixed-text" />;
  return <Minus size={13} className="text-neutral-text" />;
};

const surpriseDir = (d: string | null) => (d || "").toLowerCase();
const isBeat = (d: string | null) => { const v = surpriseDir(d); return v === "positive" || v === "beat"; };
const isMiss = (d: string | null) => { const v = surpriseDir(d); return v === "negative" || v === "miss"; };

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1 text-[10px] uppercase font-semibold rounded-full transition-colors ${
        active ? "bg-purple-accent text-white" : "bg-secondary text-label hover:text-foreground"
      }`}>{children}</button>
  );
}

function SurpriseBadge({ direction, score }: { direction: string | null; score: any }) {
  if (isBeat(direction)) return (
    <span className="inline-flex items-center gap-1 bg-bullish-bg text-bullish-text px-2 py-[2px] text-[9px] rounded font-semibold uppercase">
      <ArrowUp size={11} /> BEAT {score != null && <span className="text-[8px] opacity-80">{score}</span>}
    </span>
  );
  if (isMiss(direction)) return (
    <span className="inline-flex items-center gap-1 bg-bearish-bg text-bearish-text px-2 py-[2px] text-[9px] rounded font-semibold uppercase">
      <ArrowDown size={11} /> MISS {score != null && <span className="text-[8px] opacity-80">{score}</span>}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded font-semibold uppercase">
      <Minus size={11} /> IN LINE
    </span>
  );
}

export default function EventHistory() {
  const [events, setEvents] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [period, setPeriod] = useState("3M");
  const [currency, setCurrency] = useState("ALL");
  const [impact, setImpact] = useState("ALL");
  const [surprise, setSurprise] = useState("ALL");

  const periodDays = PERIODS.find(p => p.label === period)?.days || 90;
  const fromDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - periodDays); return d.toISOString().split("T")[0]; }, [periodDays]);

  useEffect(() => {
    setLoaded(false);
    const fn = async () => {
      let q = supabase.from("macro_events_calendar").select("*")
        .eq("event_status", "released")
        .gte("event_date", fromDate)
        .order("event_datetime", { ascending: false })
        .limit(500);
      if (currency !== "ALL") q = q.eq("event_currency", currency);
      if (impact !== "ALL") q = q.ilike("event_impact", impact);
      return q;
    };
    queryWithRetry(fn, "EventHistory/macro_events_calendar").then(data => { setEvents((data as any[]) || []); setExpandedId(null); setLoaded(true); });
  }, [fromDate, currency, impact]);

  const filtered = useMemo(() => {
    if (surprise === "ALL") return events;
    return events.filter(e => {
      if (surprise === "BEAT") return isBeat(e.surprise_direction);
      if (surprise === "MISS") return isMiss(e.surprise_direction);
      return !isBeat(e.surprise_direction) && !isMiss(e.surprise_direction);
    });
  }, [events, surprise]);

  const stats = useMemo(() => {
    const beat = filtered.filter(e => isBeat(e.surprise_direction)).length;
    const miss = filtered.filter(e => isMiss(e.surprise_direction)).length;
    return { total: filtered.length, beat, miss, inline: filtered.length - beat - miss };
  }, [filtered]);

  const perCurrency = useMemo(() => {
    const map: Record<string, { beat: number; miss: number; inline: number }> = {};
    filtered.forEach(e => {
      const cur = e.event_currency || "?";
      if (!map[cur]) map[cur] = { beat: 0, miss: 0, inline: 0 };
      if (isBeat(e.surprise_direction)) map[cur].beat++;
      else if (isMiss(e.surprise_direction)) map[cur].miss++;
      else map[cur].inline++;
    });
    return Object.entries(map).sort((a, b) => (b[1].beat + b[1].miss + b[1].inline) - (a[1].beat + a[1].miss + a[1].inline));
  }, [filtered]);

  return (
    <DashboardLayout>
      {/* FILTER BAR */}
      <div className="bg-card border border-card-border rounded-lg p-4 mb-6 flex flex-wrap gap-5 items-end">
        <div>
          <div className="text-[9px] text-label uppercase tracking-wide mb-1.5 font-medium">Periode</div>
          <div className="flex gap-1">{PERIODS.map(p => <Pill key={p.label} active={period === p.label} onClick={() => setPeriod(p.label)}>{p.label}</Pill>)}</div>
        </div>
        <div>
          <div className="text-[9px] text-label uppercase tracking-wide mb-1.5 font-medium">Valuta</div>
          <div className="flex gap-1 flex-wrap">{CURRENCIES_ALL.map(c => <Pill key={c} active={currency === c} onClick={() => setCurrency(c)}>{c}</Pill>)}</div>
        </div>
        <div>
          <div className="text-[9px] text-label uppercase tracking-wide mb-1.5 font-medium">Impact</div>
          <div className="flex gap-1">{IMPACTS.map(i => <Pill key={i} active={impact === i} onClick={() => setImpact(i)}>{i}</Pill>)}</div>
        </div>
        <div>
          <div className="text-[9px] text-label uppercase tracking-wide mb-1.5 font-medium">Verrassing</div>
          <div className="flex gap-1">{SURPRISES.map(s => <Pill key={s} active={surprise === s} onClick={() => setSurprise(s)}>{s}</Pill>)}</div>
        </div>
      </div>

      {/* SUMMARY COUNTERS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <DataCard className="p-4 text-center">
          <div className="text-[9px] text-label uppercase font-medium">Totaal</div>
          <div className="text-[24px] font-extrabold text-foreground font-mono mt-1">{stats.total}</div>
        </DataCard>
        <DataCard className="p-4 text-center">
          <div className="flex items-center justify-center gap-1"><CheckCircle size={12} className="text-bullish-text" /><span className="text-[9px] text-label uppercase font-medium">Beat</span></div>
          <div className="text-[24px] font-extrabold text-bullish-text font-mono mt-1">{stats.beat}</div>
        </DataCard>
        <DataCard className="p-4 text-center">
          <div className="flex items-center justify-center gap-1"><XCircle size={12} className="text-bearish-text" /><span className="text-[9px] text-label uppercase font-medium">Miss</span></div>
          <div className="text-[24px] font-extrabold text-bearish-text font-mono mt-1">{stats.miss}</div>
        </DataCard>
        <DataCard className="p-4 text-center">
          <div className="flex items-center justify-center gap-1"><Minus size={12} className="text-neutral-text" /><span className="text-[9px] text-label uppercase font-medium">In Line</span></div>
          <div className="text-[24px] font-extrabold text-neutral-text font-mono mt-1">{stats.inline}</div>
        </DataCard>
      </div>

      {/* BEAT/MISS RATIO BAR (when filtering by currency) */}
      {currency !== "ALL" && stats.total > 0 && (
        <div className="mb-6">
          <div className="text-[9px] text-label uppercase font-medium mb-1.5">Beat / Miss ratio — {currency}</div>
          <div className="flex h-3 rounded-full overflow-hidden bg-neutral-bg">
            {stats.beat > 0 && <div className="bg-bullish-text" style={{ width: `${(stats.beat / stats.total) * 100}%` }} />}
            {stats.inline > 0 && <div className="bg-neutral-text/30" style={{ width: `${(stats.inline / stats.total) * 100}%` }} />}
            {stats.miss > 0 && <div className="bg-bearish-text" style={{ width: `${(stats.miss / stats.total) * 100}%` }} />}
          </div>
          <div className="flex justify-between text-[9px] mt-1">
            <span className="text-bullish-text font-semibold">{Math.round((stats.beat / stats.total) * 100)}% beat</span>
            <span className="text-bearish-text font-semibold">{Math.round((stats.miss / stats.total) * 100)}% miss</span>
          </div>
        </div>
      )}

      {/* TABLE */}
      {loaded && filtered.length === 0 ? (
        <div className="text-center text-label text-[13px] mt-10">Geen historische events gevonden voor deze selectie</div>
      ) : filtered.length > 0 && (
        <DataCard className="overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Datum</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Event</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Valuta</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Verwacht</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Actueel</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Verrassing</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Impact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, idx) => {
                const isExp = expandedId === e.id;
                return (
                  <>
                    <tr key={e.id}
                      className={`border-b border-card-border cursor-pointer transition-colors hover:bg-secondary/50 ${idx % 2 === 1 ? "bg-secondary/30" : ""}`}
                      onClick={() => setExpandedId(isExp ? null : e.id)}>
                      <td className="text-[11px] text-sub-text px-4 py-2.5">{fmtDate(e.event_date)}</td>
                      <td className="text-[11px] text-foreground px-4 py-2.5 font-medium truncate max-w-[220px]">{val(e.event_name)}</td>
                      <td className="px-4 py-2.5"><span className="text-[10px] font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded">{val(e.event_currency)}</span></td>
                      <td className="text-[11px] text-sub-text px-4 py-2.5">{val(e.expected_value)}</td>
                      <td className="text-[11px] text-foreground font-bold px-4 py-2.5">{val(e.actual_value)}</td>
                      <td className="px-4 py-2.5"><SurpriseBadge direction={e.surprise_direction} score={e.surprise_score} /></td>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-1.5">{impactIcon(e.event_impact)}<ImpactChip impact={e.event_impact} /></div></td>
                    </tr>
                    {isExp && (
                      <tr key={`exp-${e.id}`}>
                        <td colSpan={7} className="bg-secondary/60 px-6 py-4 border-b border-card-border animate-fade-in">
                          <div className="flex gap-6 mb-3">
                            {[["Yields", e.yields_reaction],["DXY", e.dxy_reaction],["Aandelen", e.equity_reaction],["Goud", e.gold_reaction]].map(([l,v]) => (
                              <div key={l as string}>
                                <div className="text-[9px] text-label uppercase">{l}</div>
                                <div className="text-[11px] text-sub-text">{val(v)}</div>
                              </div>
                            ))}
                          </div>
                          {e.interpretation && <MarkdownBlock content={e.interpretation} />}
                          {e.market_impact_narrative && <div className="mt-2"><MarkdownBlock content={e.market_impact_narrative} /></div>}
                          {!e.interpretation && !e.market_impact_narrative && <span className="text-[11px] text-label italic">Geen details beschikbaar</span>}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </DataCard>
      )}

      {/* PER CURRENCY SUMMARY */}
      {perCurrency.length > 0 && (
        <>
          <SectionLabel>BEAT / MISS PER VALUTA</SectionLabel>
          <div className="grid grid-cols-5 gap-4">
            {perCurrency.map(([cur, counts]) => {
              const total = counts.beat + counts.miss + counts.inline;
              const dominant = counts.beat >= counts.miss && counts.beat >= counts.inline ? "text-bullish-text"
                : counts.miss >= counts.beat && counts.miss >= counts.inline ? "text-bearish-text"
                : "text-neutral-text";
              return (
                <DataCard key={cur} className="p-4">
                  <div className={`text-[14px] font-bold mb-2 ${dominant}`}>{cur}</div>
                  <div className="flex gap-2 text-[10px] flex-wrap">
                    <span className="text-bullish-text font-semibold">{counts.beat} beat</span>
                    <span className="text-bearish-text font-semibold">{counts.miss} miss</span>
                    <span className="text-neutral-text">{counts.inline} inline</span>
                  </div>
                  {total > 0 && (
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-neutral-bg mt-2">
                      {counts.beat > 0 && <div className="bg-bullish-text" style={{ width: `${(counts.beat / total) * 100}%` }} />}
                      {counts.inline > 0 && <div className="bg-neutral-text/30" style={{ width: `${(counts.inline / total) * 100}%` }} />}
                      {counts.miss > 0 && <div className="bg-bearish-text" style={{ width: `${(counts.miss / total) * 100}%` }} />}
                    </div>
                  )}
                </DataCard>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
