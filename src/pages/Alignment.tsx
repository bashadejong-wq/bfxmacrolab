import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, MarkdownBlock } from "@/components/ui-helpers";

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

export default function Alignment() {
  const navigate = useNavigate();
  const [al, setAl] = useState<any>(null);

  useEffect(() => {
    supabase.from("alignment_engine").select("*").order("alignment_date", { ascending: false }).limit(1)
      .then(({ data }) => setAl(data?.[0] || null));
  }, []);

  const stateColor = (s: string | null) => {
    const v = (s || "").toLowerCase();
    return v === "aligned" ? "text-bullish-text" : v === "conflict" ? "text-bearish-text" : "text-purple-accent";
  };

  return (
    <DashboardLayout>
      {/* BLOCK 1 - State Header */}
      <DataCard className="p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[9px] text-label uppercase tracking-[0.08em]">ALIGNMENT STATE</div>
            <div className={`text-[26px] font-black uppercase mt-1 ${stateColor(al?.alignment_state)}`}>{val(al?.alignment_state)}</div>
            <div className="text-[11px] text-sub-text leading-relaxed max-w-[480px] mt-1">{val(al?.core_driver)}</div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end">
              <span className="text-[36px] font-black text-purple-accent font-mono">{val(al?.conviction_score)}</span>
            </div>
            <div className="text-[11px] text-label">/10 Conviction</div>
          </div>
        </div>
      </DataCard>

      {/* BLOCK 2 - Timeframe Comparison */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <DataCard className="p-4">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">DAILY VS WEEKLY</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(al?.daily_vs_weekly)}</div>
        </DataCard>
        <DataCard className="p-4">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">WEEKLY VS MONTHLY</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(al?.weekly_vs_monthly)}</div>
        </DataCard>
      </div>

      {/* BLOCK 3 - 4 Macro Pillars */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ["GROEI", al?.growth_alignment], ["INFLATIE", al?.inflation_alignment],
          ["CENTRALE BANK", al?.cb_alignment_narrative], ["LIQUIDITEIT", al?.liquidity_alignment],
        ].map(([label, value]) => (
          <DataCard key={label as string} className="p-4">
            <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">{label}</div>
            <div className="text-[11px] text-sub-text leading-relaxed">{val(value)}</div>
          </DataCard>
        ))}
      </div>

      {/* BLOCK 4 - Conviction / Vermijd */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <DataCard className="p-4 border-l-[3px] border-l-bullish-text">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">HOOG CONVICTION</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(al?.high_conviction_assets)}</div>
        </DataCard>
        <DataCard className="p-4 border-l-[3px] border-l-bearish-text">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">VERMIJD</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(al?.low_conviction_assets)}</div>
        </DataCard>
      </div>

      {/* BLOCK 5 - 8 Currency Views */}
      <SectionLabel>CURRENCY VIEWS</SectionLabel>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {FX.map((c) => (
          <DataCard key={c} className="p-[14px]" onClick={() => navigate(`/currencies/${c}`)}>
            <div className="text-[9px] text-purple-accent uppercase font-bold mb-1">{c}</div>
            <div className="text-[11px] text-sub-text leading-snug">{val(al?.[`${c.toLowerCase()}_view`])}</div>
          </DataCard>
        ))}
      </div>

      {/* BLOCK 6 - Scenarios */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "BASIS", value: al?.scenario_base, border: "border-l-neutral-bg" },
          { label: "OPWAARTS", value: al?.scenario_upside, border: "border-l-bullish-text" },
          { label: "NEERWAARTS", value: al?.scenario_downside, border: "border-l-bearish-text" },
        ].map((s) => (
          <DataCard key={s.label} className={`p-4 border-l-[3px] ${s.border}`}>
            <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">{s.label}</div>
            <div className="text-[11px] text-sub-text leading-relaxed">{val(s.value)}</div>
          </DataCard>
        ))}
      </div>

      {/* BLOCK 7 - Watchpoints + Implications */}
      <div className="grid grid-cols-2 gap-3">
        <DataCard className="p-5">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">KEY WATCHPOINTS</div>
          <MarkdownBlock content={al?.key_watchpoints} />
        </DataCard>
        <DataCard className="p-5">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">HANDELIMPLICATIES</div>
          <MarkdownBlock content={al?.trading_implications} />
        </DataCard>
      </div>
    </DashboardLayout>
  );
}
