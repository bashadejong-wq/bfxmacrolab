import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val, ImpactChip, MarkdownBlock, SurpriseChip, queryWithRetry } from "@/components/ui-helpers";
import { CalendarDays, Zap, Activity, Minus, ArrowUp, ArrowDown, Clock, X } from "lucide-react";

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

const fmtTime = (v: any): string => {
  if (!v || v === "null") return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  } catch { return ""; }
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
    return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
  } catch { return ""; }
};

const impactIcon = (impact: string | null) => {
  const i = (impact || "").toLowerCase();
  if (i === "high") return <Zap size={12} className="text-bearish-text" />;
  if (i === "medium") return <Activity size={12} className="text-mixed-text" />;
  return <Minus size={12} className="text-neutral-text" />;
};

const surpriseIcon = (dir: string | null) => {
  const d = (dir || "").toLowerCase();
  if (d === "positive" || d === "beat") return <ArrowUp size={12} className="text-bullish-text" />;
  if (d === "negative" || d === "miss") return <ArrowDown size={12} className="text-bearish-text" />;
  return <Minus size={12} className="text-neutral-text" />;
};

function countdownLabel(daysUntil: number | null, datetime: string | null): { text: string; color: string; bg: string } {
  if (daysUntil === null || daysUntil === undefined) return { text: "—", color: "#6B7280", bg: "#F5F5F5" };
  if (datetime) {
    const now = new Date();
    const target = new Date(datetime);
    const diffMs = target.getTime() - now.getTime();
    const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    if (diffHours < 24) return { text: diffHours <= 0 ? "Vandaag" : `Over ${diffHours}u`, color: "#DC2626", bg: "#FEF2F2" };
    if (daysUntil <= 3) return { text: `Over ${daysUntil}d`, color: "#D97706", bg: "#FFFBEB" };
  }
  return { text: `Over ${daysUntil}d`, color: "#6B7280", bg: "#F5F5F5" };
}

type ImpactFilter = "all" | "high" | "medium" | "low";

export default function Calendar() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>("all");

  useEffect(() => {
    setLoaded(false);
    const fn = activeTab === "upcoming"
      ? () => supabase.from("v_upcoming_events").select("*").order("event_date", { ascending: true }).limit(100)
      : () => supabase.from("macro_events_calendar").select("*").eq("event_status", "released").order("event_datetime", { ascending: false }).limit(100);
    queryWithRetry(fn, `Calendar/${activeTab}`)
      .then(data => { setEvents((data as any[]) || []); setSelectedEvent(null); setLoaded(true); });
  }, [activeTab]);

  const filtered = useMemo(() => {
    if (impactFilter === "all") return events;
    return events.filter(e => (e.event_impact || "").toLowerCase() === impactFilter);
  }, [events, impactFilter]);

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

  // Next high-impact event for catalyst countdown
  const nextHighImpact = useMemo(() => {
    if (!isUpcoming) return null;
    return events.find(e => (e.event_impact || "").toLowerCase() === "high") || null;
  }, [events, isUpcoming]);

  const countdown = nextHighImpact ? countdownLabel(nextHighImpact.days_until, nextHighImpact.event_datetime) : null;

  return (
    <DashboardLayout>
      {/* Tabs */}
      <div className="bg-card border-b border-card-border px-4 md:px-7 flex overflow-x-auto -mx-4 md:-mx-7 -mt-4 md:-mt-7 mb-5">
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

      {/* 4. CATALYST COUNTDOWN */}
      {isUpcoming && nextHighImpact && countdown && (
        <div className="rounded-lg px-5 py-4 mb-5 border" style={{ backgroundColor: countdown.bg, borderColor: countdown.color + "33" }}>
          <div className="text-[9px] text-label uppercase tracking-wider font-medium mb-1">VOLGENDE HIGH IMPACT EVENT</div>
          <div className="flex items-center gap-3 flex-wrap">
            <Zap size={16} style={{ color: countdown.color }} />
            <span className="text-[16px] font-bold text-foreground">{val(nextHighImpact.event_name)}</span>
            <span className="text-[11px] font-bold bg-secondary px-2 py-0.5 rounded">{val(nextHighImpact.event_currency)}</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: countdown.color }}>{countdown.text}</span>
            <span className="text-[10px] text-label ml-auto">{fmtDT(nextHighImpact.event_datetime)}</span>
          </div>
        </div>
      )}

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

      {/* Main content: table + side panel */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* TABLE */}
        <div className={`${selectedEvent ? "flex-1 min-w-0" : "w-full"} transition-all`}>
          {loaded && filtered.length === 0 ? (
            <div className="text-center mt-10">
              {isUpcoming ? (
                <div className="text-label text-[13px]">Geen aankomende events gevonden</div>
              ) : (
                <div className="text-label text-[13px] max-w-[400px] mx-auto">
                  <p className="mb-2">Geen recente events in de standaard filterperiode.</p>
                  <p className="text-[11px] italic">Recente releases zijn terug te vinden in Event History.</p>
                </div>
              )}
            </div>
          ) : filtered.length > 0 && (
            <DataCard className="overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-[8px] text-label uppercase text-left px-3 py-2 w-[60px]">Tijd</th>
                    <th className="text-[8px] text-label uppercase text-left px-3 py-2">Event</th>
                    <th className="text-[8px] text-label uppercase text-left px-3 py-2 w-[50px]">CCY</th>
                    <th className="text-[8px] text-label uppercase text-right px-3 py-2 w-[60px]">Verw.</th>
                    <th className="text-[8px] text-label uppercase text-right px-3 py-2 w-[60px]">Vorig</th>
                    {!isUpcoming && <th className="text-[8px] text-label uppercase text-right px-3 py-2 w-[60px]">Act.</th>}
                    {!isUpcoming && <th className="text-[8px] text-label uppercase text-left px-3 py-2 w-[70px]">Verr.</th>}
                    <th className="text-[8px] text-label uppercase text-left px-3 py-2 w-[70px]">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((group) => (
                    <React.Fragment key={`group-${group.date}`}>
                      <tr>
                        <td colSpan={isUpcoming ? 6 : 8} className="bg-secondary/70 px-3 py-1">
                          <span className="text-[9px] text-label font-semibold uppercase tracking-wide">{group.label}</span>
                        </td>
                      </tr>
                      {group.items.map((e) => {
                        const isSelected = selectedEvent?.id === e.id;
                        const surpriseDir = (e.surprise_direction || "").toLowerCase();
                        const surpriseLabel = surpriseDir === "positive" || surpriseDir === "beat" ? "BEAT"
                          : surpriseDir === "negative" || surpriseDir === "miss" ? "MISS" : "IN LINE";
                        const surpriseColor = surpriseDir === "positive" || surpriseDir === "beat" ? "text-bullish-text"
                          : surpriseDir === "negative" || surpriseDir === "miss" ? "text-bearish-text" : "text-neutral-text";

                        return (
                          <tr key={e.id}
                            className={`border-b border-card-border cursor-pointer transition-colors ${isSelected ? "bg-purple-accent/5" : "hover:bg-secondary/50"}`}
                            onClick={() => setSelectedEvent(isSelected ? null : e)}
                          >
                            <td className="text-[10px] text-sub-text px-3 py-2 font-mono">{fmtTime(e.event_datetime)}</td>
                            <td className="text-[10px] text-foreground px-3 py-2 font-medium truncate max-w-[200px]">{val(e.event_name)}</td>
                            <td className="px-3 py-2">
                              <span className="text-[9px] font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded">{val(e.event_currency)}</span>
                            </td>
                            <td className="text-[10px] text-sub-text px-3 py-2 text-right font-mono">{val(e.expected_value)}</td>
                            <td className="text-[10px] text-sub-text px-3 py-2 text-right font-mono">{val(e.previous_value)}</td>
                            {!isUpcoming && (
                              <td className="text-[10px] text-foreground font-bold px-3 py-2 text-right font-mono">{val(e.actual_value)}</td>
                            )}
                            {!isUpcoming && (
                              <td className="px-3 py-2">
                                {e.surprise_direction ? (
                                  <span className={`flex items-center gap-0.5 text-[9px] font-semibold ${surpriseColor}`}>
                                    {surpriseIcon(e.surprise_direction)}
                                    {surpriseLabel}
                                  </span>
                                ) : <span className="text-[10px] text-neutral-text">—</span>}
                              </td>
                            )}
                            <td className="px-3 py-2">
                              <ImpactChip impact={e.event_impact} />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </DataCard>
          )}
        </div>

        {/* 2. SIDE PANEL — Event Detail */}
        {selectedEvent && (
          <div className="w-full md:w-[340px] md:min-w-[340px] md:sticky md:top-0 md:self-start">
            <DataCard className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[14px] font-bold text-foreground leading-snug">{val(selectedEvent.event_name)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-label">{fmtDT(selectedEvent.event_datetime)}</span>
                    <span className="text-[9px] font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded">{val(selectedEvent.event_currency)}</span>
                    <ImpactChip impact={selectedEvent.event_impact} />
                  </div>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-label hover:text-foreground p-1">
                  <X size={14} />
                </button>
              </div>

              <hr className="border-card-border mb-3" />

              {/* Values */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-[8px] text-label uppercase">Verwacht</div>
                  <div className="text-[14px] font-bold text-foreground font-mono mt-0.5">{val(selectedEvent.expected_value || selectedEvent.consensus)}</div>
                </div>
                <div>
                  <div className="text-[8px] text-label uppercase">Vorig</div>
                  <div className="text-[14px] font-bold text-sub-text font-mono mt-0.5">{val(selectedEvent.previous_value)}</div>
                </div>
                {selectedEvent.actual_value != null && (
                  <>
                    <div>
                      <div className="text-[8px] text-label uppercase">Actueel</div>
                      <div className="text-[14px] font-bold text-foreground font-mono mt-0.5">{val(selectedEvent.actual_value)}</div>
                    </div>
                    {selectedEvent.surprise_direction && (
                      <div>
                        <div className="text-[8px] text-label uppercase">Verrassing</div>
                        <div className="mt-0.5"><SurpriseChip direction={selectedEvent.surprise_direction} score={selectedEvent.surprise_score} /></div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Interpretation */}
              {selectedEvent.interpretation && (
                <div className="mb-4">
                  <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1">INTERPRETATIE</div>
                  <div className="text-[11px] text-sub-text leading-relaxed">
                    <MarkdownBlock content={selectedEvent.interpretation} />
                  </div>
                </div>
              )}

              {/* Market impact narrative */}
              {selectedEvent.market_impact_narrative && (
                <div className="mb-4">
                  <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1">VERWACHTE MARKTIMPACT</div>
                  <div className="text-[11px] text-sub-text leading-relaxed">
                    <MarkdownBlock content={selectedEvent.market_impact_narrative} />
                  </div>
                </div>
              )}

              {!selectedEvent.interpretation && !selectedEvent.market_impact_narrative && (
                <span className="text-[11px] text-label italic">Geen details beschikbaar voor dit event</span>
              )}
            </DataCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
