import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val, ImpactChip, MarkdownBlock, SurpriseChip, queryWithRetry } from "@/components/ui-helpers";
import { CalendarDays, Zap, Activity, Minus, ArrowUp, ArrowDown } from "lucide-react";

const DAYS_NL = ["Zo","Ma","Di","Wo","Do","Vr","Za"];
const MONTHS_NL = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

const fmtDT = (v: any): string => {
  if (!v || v === "null") return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  } catch { return String(v); }
};

const dateKey = (v: any): string => {
  if (!v) return "";
  try {
    const d = new Date(v);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  } catch { return ""; }
};

const dateLabelNL = (v: any): string => {
  if (!v) return "";
  try {
    const d = new Date(v);
    return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return ""; }
};

const impactIcon = (impact: string | null) => {
  const i = (impact || "").toLowerCase();
  if (i === "high") return <Zap size={13} className="text-bearish-text" />;
  if (i === "medium") return <Activity size={13} className="text-mixed-text" />;
  return <Minus size={13} className="text-neutral-text" />;
};

const surpriseIcon = (dir: string | null) => {
  const d = (dir || "").toLowerCase();
  if (d === "positive" || d === "beat") return <ArrowUp size={13} className="text-bullish-text" />;
  if (d === "negative" || d === "miss") return <ArrowDown size={13} className="text-bearish-text" />;
  return <Minus size={13} className="text-neutral-text" />;
};

type ImpactFilter = "all" | "high" | "medium" | "low";

export default function Calendar() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [events, setEvents] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>("all");

  useEffect(() => {
    setLoaded(false);
    const fn = activeTab === "upcoming"
      ? () => supabase.from("macro_events_calendar").select("*").eq("event_status", "upcoming").order("event_datetime", { ascending: true }).limit(100)
      : () => supabase.from("macro_events_calendar").select("*").eq("event_status", "released").order("event_datetime", { ascending: false }).limit(100);
    queryWithRetry(fn, `Calendar/${activeTab}`)
      .then(data => { setEvents((data as any[]) || []); setExpandedId(null); setLoaded(true); });
  }, [activeTab]);

  const filtered = useMemo(() => {
    if (impactFilter === "all") return events;
    return events.filter(e => (e.event_impact || "").toLowerCase() === impactFilter);
  }, [events, impactFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const result: { date: string; label: string; items: any[] }[] = [];
    let lastDate = "";
    for (const e of filtered) {
      const dk = dateKey(e.event_datetime || e.event_date);
      if (dk !== lastDate) {
        result.push({ date: dk, label: dateLabelNL(e.event_datetime || e.event_date), items: [] });
        lastDate = dk;
      }
      result[result.length - 1].items.push(e);
    }
    return result;
  }, [filtered]);

  const isUpcoming = activeTab === "upcoming";
  const colCount = isUpcoming ? 6 : 8;

  return (
    <DashboardLayout>
      {/* Tabs */}
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-5">
        {[["Upcoming","upcoming"],["Recent","recent"]].map(([label, key]) => (
          <button key={key} onClick={() => { setActiveTab(key); setImpactFilter("all"); }}
            className={`flex items-center gap-1.5 px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
              key === activeTab ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
            }`}>
            <CalendarDays size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Impact filter */}
      <div className="flex items-center gap-2 mb-5">
        {(["all","high","medium","low"] as ImpactFilter[]).map(f => (
          <button key={f} onClick={() => setImpactFilter(f)}
            className={`px-3 py-1 text-[10px] uppercase font-semibold rounded transition-colors ${
              f === impactFilter
                ? "bg-purple-accent text-white"
                : "bg-secondary text-label hover:text-foreground"
            }`}>
            {f === "all" ? "Alle" : f}
          </button>
        ))}
      </div>

      {loaded && filtered.length === 0 ? (
        <div className="text-center text-label text-[13px] mt-10">
          {isUpcoming ? "Geen aankomende events gevonden" : "Geen recente events gevonden"}
        </div>
      ) : filtered.length > 0 && (
        <DataCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Datum/Tijd</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Event</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Valuta</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Verwacht</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Vorig</th>
                {!isUpcoming && <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Actueel</th>}
                {!isUpcoming && <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Verrassing</th>}
                <th className="text-[9px] text-label uppercase text-left px-4 py-2.5">Impact</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((group) => (
                <>
                  {/* Date separator */}
                  <tr key={`sep-${group.date}`}>
                    <td colSpan={colCount} className="bg-secondary px-4 py-1.5">
                      <span className="text-[10px] text-label font-semibold uppercase tracking-wide">{group.label}</span>
                    </td>
                  </tr>
                  {group.items.map((e) => {
                    const isExp = expandedId === e.id;
                    const surpriseDir = (e.surprise_direction || "").toLowerCase();
                    const surpriseLabel = surpriseDir === "positive" || surpriseDir === "beat" ? "BEAT"
                      : surpriseDir === "negative" || surpriseDir === "miss" ? "MISS" : "IN LINE";
                    const surpriseColor = surpriseDir === "positive" || surpriseDir === "beat" ? "text-bullish-text"
                      : surpriseDir === "negative" || surpriseDir === "miss" ? "text-bearish-text" : "text-neutral-text";

                    return (
                      <tr key={e.id} className="contents">
                        <td colSpan={colCount} className="p-0">
                          {/* Main row */}
                          <div
                            className="grid items-center border-b border-card-border hover:bg-secondary/50 cursor-pointer transition-colors"
                            style={{ gridTemplateColumns: isUpcoming ? "repeat(6, 1fr)" : "repeat(8, 1fr)" }}
                            onClick={() => setExpandedId(isExp ? null : e.id)}
                          >
                            <div className="text-[11px] text-sub-text px-4 py-2.5 truncate">{fmtDT(e.event_datetime)}</div>
                            <div className="text-[11px] text-foreground px-4 py-2.5 truncate font-medium">{val(e.event_name)}</div>
                            <div className="px-4 py-2.5">
                              <span className="text-[10px] font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded">{val(e.event_currency)}</span>
                            </div>
                            <div className="text-[11px] text-sub-text px-4 py-2.5">{val(e.expected_value)}</div>
                            <div className="text-[11px] text-sub-text px-4 py-2.5">{val(e.previous_value)}</div>
                            {!isUpcoming && (
                              <div className="text-[11px] text-foreground font-bold px-4 py-2.5">{val(e.actual_value)}</div>
                            )}
                            {!isUpcoming && (
                              <div className="px-4 py-2.5">
                                {e.surprise_direction ? (
                                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${surpriseColor}`}>
                                    {surpriseIcon(e.surprise_direction)}
                                    {surpriseLabel}
                                    {e.surprise_score != null && <span className="text-[9px] opacity-70 ml-0.5">{e.surprise_score}</span>}
                                  </span>
                                ) : <span className="text-[11px] text-neutral-text">—</span>}
                              </div>
                            )}
                            <div className="px-4 py-2.5 flex items-center gap-1.5">
                              {impactIcon(e.event_impact)}
                              <ImpactChip impact={e.event_impact} />
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExp && (
                            <div className="bg-secondary/60 px-6 py-4 border-b border-card-border animate-fade-in">
                              {!isUpcoming && e.actual_value != null && (
                                <div className="flex items-center gap-4 mb-3">
                                  <div>
                                    <span className="text-[9px] text-label uppercase">Actueel</span>
                                    <span className="text-[13px] font-bold text-foreground ml-2">{e.actual_value}</span>
                                  </div>
                                  {e.surprise_direction && (
                                    <div className={`flex items-center gap-1 ${surpriseColor}`}>
                                      {surpriseIcon(e.surprise_direction)}
                                      <span className="text-[11px] font-semibold">{surpriseLabel}</span>
                                      {e.surprise_score != null && <span className="text-[10px]">({e.surprise_score})</span>}
                                    </div>
                                  )}
                                </div>
                              )}
                              {e.interpretation && (
                                <div className="mb-2">
                                  <div className="text-[9px] text-label uppercase mb-1">Interpretatie</div>
                                  <MarkdownBlock content={e.interpretation} />
                                </div>
                              )}
                              {e.market_impact_narrative && (
                                <div>
                                  <div className="text-[9px] text-label uppercase mb-1">Marktimpact</div>
                                  <MarkdownBlock content={e.market_impact_narrative} />
                                </div>
                              )}
                              {!e.interpretation && !e.market_impact_narrative && (
                                <span className="text-[11px] text-label italic">Geen details beschikbaar</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </DataCard>
      )}
    </DashboardLayout>
  );
}
