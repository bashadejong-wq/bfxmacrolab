import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, BiasChip, ConfidenceChip, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { Lightbulb, Target, ShieldAlert, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function TradeIdeas() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queryWithRetry(
      () => supabase.from("report_trade_ideas").select("*").order("snap_date", { ascending: false }).limit(50),
      "TradeIdeas"
    ).then(data => { setIdeas((data as any[]) || []); setLoaded(true); });
  }, []);

  if (!loaded) {
    return (
      <DashboardLayout>
        <div className="text-label text-[13px] mt-10 text-center">Laden...</div>
      </DashboardLayout>
    );
  }

  if (ideas.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
            <Lightbulb size={28} className="text-purple-accent" />
          </div>
          <h2 className="text-[18px] font-bold text-foreground">Trade Ideas</h2>
          <p className="text-[13px] text-label text-center max-w-md leading-relaxed">
            Trade ideas worden automatisch gegenereerd uit dagelijkse rapportanalyses.
            Zodra de volgende workflow run klaar is, verschijnen hier concrete trade suggesties
            met bias, conviction, entry rationale en invalidation levels.
          </p>
          <div className="bg-secondary rounded-lg px-5 py-3 mt-2">
            <p className="text-[11px] text-label">
              💡 Data bron: <span className="font-mono text-foreground">report_trade_ideas</span> — gevuld via de dagelijkse analyse pipeline
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const active = ideas.filter(i => i.status === "active");
  const closed = ideas.filter(i => i.status !== "active");

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-foreground">Trade Ideas</h1>
        <p className="text-[12px] text-label mt-1">{ideas.length} ideeën gevonden — gegenereerd uit rapport analyses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-wide">Totaal</div>
          <div className="text-[22px] font-extrabold font-mono mt-1 text-foreground">{ideas.length}</div>
        </DataCard>
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-wide">Actief</div>
          <div className="text-[22px] font-extrabold font-mono mt-1 text-bullish-text">{active.length}</div>
        </DataCard>
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-wide">Gem. Conviction</div>
          <div className="text-[22px] font-extrabold font-mono mt-1 text-purple-accent">
            {ideas.filter(i => i.conviction != null).length > 0
              ? (ideas.reduce((s, i) => s + (i.conviction || 0), 0) / ideas.filter(i => i.conviction != null).length).toFixed(1)
              : "—"}
          </div>
        </DataCard>
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-wide">Bullish / Bearish</div>
          <div className="text-[16px] font-bold font-mono mt-1 text-foreground">
            <span className="text-bullish-text">{ideas.filter(i => (i.bias || "").toLowerCase() === "bullish").length}</span>
            {" / "}
            <span className="text-bearish-text">{ideas.filter(i => (i.bias || "").toLowerCase() === "bearish").length}</span>
          </div>
        </DataCard>
      </div>

      {/* Ideas grid */}
      <SectionLabel>Actieve Trade Ideas</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(active.length > 0 ? active : ideas).map((idea) => (
          <DataCard key={idea.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {(idea.direction || "").toLowerCase() === "long" ? (
                  <ArrowUpRight size={16} className="text-bullish-text" />
                ) : (
                  <ArrowDownRight size={16} className="text-bearish-text" />
                )}
                <span className="text-[15px] font-bold text-foreground">{idea.asset}</span>
                <span className="text-[10px] text-label uppercase">{idea.asset_class}</span>
              </div>
              <BiasChip bias={idea.bias} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[0.6rem] text-label uppercase">Direction</div>
                <div className="text-[12px] font-semibold text-foreground mt-0.5">{val(idea.direction)}</div>
              </div>
              <div>
                <div className="text-[0.6rem] text-label uppercase">Conviction</div>
                <div className="text-[12px] font-semibold text-foreground mt-0.5">{val(idea.conviction)}/10</div>
              </div>
              <div>
                <div className="text-[0.6rem] text-label uppercase">Timing</div>
                <div className="text-[12px] text-sub-text mt-0.5">{val(idea.timing)}</div>
              </div>
              <div>
                <div className="text-[0.6rem] text-label uppercase">Datum</div>
                <div className="text-[12px] text-sub-text mt-0.5">{fmtDate(idea.snap_date)}</div>
              </div>
            </div>

            {idea.entry_rationale && (
              <div className="mb-2">
                <div className="text-[0.6rem] text-label uppercase flex items-center gap-1"><Target size={10} /> Entry</div>
                <div className="text-[11px] text-sub-text mt-0.5 leading-relaxed">{idea.entry_rationale}</div>
              </div>
            )}

            {idea.main_driver && (
              <div className="mb-2">
                <div className="text-[0.6rem] text-label uppercase flex items-center gap-1"><TrendingUp size={10} /> Driver</div>
                <div className="text-[11px] text-sub-text mt-0.5">{idea.main_driver}</div>
              </div>
            )}

            {idea.invalidation && (
              <div className="mb-2">
                <div className="text-[0.6rem] text-label uppercase flex items-center gap-1"><ShieldAlert size={10} /> Invalidation</div>
                <div className="text-[11px] text-bearish-text mt-0.5">{idea.invalidation}</div>
              </div>
            )}
          </DataCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
