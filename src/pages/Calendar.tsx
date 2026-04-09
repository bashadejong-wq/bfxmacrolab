import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val, ImpactChip, MarkdownBlock, fmtDate, fmtDateTime, queryWithRetry } from "@/components/ui-helpers";

export default function Calendar() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [events, setEvents] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const today = new Date().toISOString().split("T")[0];
    const fn = activeTab === "upcoming"
      ? () => supabase.from("macro_events_calendar").select("*").gte("event_date", today).order("event_datetime", { ascending: true }).limit(30)
      : () => {
          const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
          return supabase.from("macro_events_calendar").select("*").lt("event_date", today).gte("event_date", weekAgo).order("event_datetime", { ascending: false }).limit(20);
        };
    queryWithRetry(fn, `Calendar/macro_events_calendar/${activeTab}`)
      .then(data => { setEvents((data as any[]) || []); setExpandedId(null); setLoaded(true); });
  }, [activeTab]);

  return (
    <DashboardLayout>
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-7">
        {[["Upcoming","upcoming"],["Recent","recent"]].map(([label, key]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
              key === activeTab ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
            }`}>{label}</button>
        ))}
      </div>

      {loaded && events.length === 0 ? (
        <div className="text-center text-label text-[13px] mt-10">
          {activeTab === "upcoming" ? "Geen aankomende events gevonden" : "Geen recente events gevonden"}
        </div>
      ) : events.length > 0 && (
        <DataCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">{activeTab === "upcoming" ? "Datum/Tijd" : "Datum"}</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Event</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Valuta</th>
                {activeTab === "recent" && <th className="text-[9px] text-label uppercase text-left px-4 py-2">Actueel</th>}
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Verwacht</th>
                {activeTab === "upcoming" && <th className="text-[9px] text-label uppercase text-left px-4 py-2">Vorig</th>}
                {activeTab === "recent" && <th className="text-[9px] text-label uppercase text-left px-4 py-2">Verrassing</th>}
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Impact</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const isExpanded = expandedId === e.id;
                return (
                  <tbody key={e.id}>
                    <tr className="border-b border-card-border hover:bg-secondary cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                      <td className="text-[11px] text-sub-text px-4 py-2">{activeTab === "upcoming" ? fmtDateTime(e.event_datetime) : fmtDate(e.event_date)}</td>
                      <td className="text-[11px] text-sub-text px-4 py-2">{val(e.event_name)}</td>
                      <td className="text-[11px] text-sub-text px-4 py-2">{val(e.event_currency)}</td>
                      {activeTab === "recent" && <td className="text-[11px] text-sub-text px-4 py-2">{val(e.actual_value)}</td>}
                      <td className="text-[11px] text-sub-text px-4 py-2">{val(e.expected_value)}</td>
                      {activeTab === "upcoming" && <td className="text-[11px] text-sub-text px-4 py-2">{val(e.previous_value)}</td>}
                      {activeTab === "recent" && (
                        <td className="text-[11px] px-4 py-2">
                          {e.surprise_direction ? (
                            <span className={e.surprise_direction === "positive" ? "text-bullish-text" : "text-bearish-text"}>
                              {e.surprise_direction === "positive" ? "↑" : "↓"} {val(e.surprise_score)}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      <td className="px-4 py-2"><ImpactChip impact={e.event_impact} /></td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={activeTab === "upcoming" ? 7 : 8} className="bg-secondary px-[18px] py-[14px]">
                          {activeTab === "recent" && (
                            <div className="flex gap-6 mb-3">
                              {[["Yields", e.yields_reaction],["DXY", e.dxy_reaction],["Aandelen", e.equity_reaction],["Goud", e.gold_reaction]].map(([l,v]) => (
                                <div key={l as string}>
                                  <div className="text-[9px] text-label uppercase">{l}</div>
                                  <div className="text-[11px] text-sub-text">{val(v)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          <MarkdownBlock content={e.interpretation} />
                          {activeTab === "upcoming" && e.market_impact_narrative && (
                            <div className="mt-2"><MarkdownBlock content={e.market_impact_narrative} /></div>
                          )}
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
    </DashboardLayout>
  );
}
