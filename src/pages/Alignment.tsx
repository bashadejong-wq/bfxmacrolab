import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, MarkdownBlock, queryWithRetry } from "@/components/ui-helpers";

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

export default function Alignment() {
  const navigate = useNavigate();
  const [al, setAl] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queryWithRetry(() => supabase.from("alignment_engine").select("*").order("alignment_date", { ascending: false }).limit(1), "Alignment/alignment_engine")
      .then(data => { setAl((data as any[])?.[0] || null); setLoaded(true); });
  }, []);

  const stateColor = (s: string | null) => {
    const v = (s || "").toLowerCase();
    return v === "aligned" ? "text-bullish-text" : v === "conflict" ? "text-bearish-text" : "text-purple-accent";
  };

  if (loaded && !al) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Geen data beschikbaar</div></DashboardLayout>;

  return (
    <DashboardLayout>
      {/* STATE HEADER */}
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

      {/* NARRATIVE */}
      <div className="bg-secondary border border-card-border rounded-lg p-5 mb-5">
        <MarkdownBlock content={al?.summary_dashboard || al?.summary_micro || al?.macro_story} fallback="—" />
      </div>

      {/* WAT TE DOEN / VERMIJD */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <DataCard className="p-4 border-l-[3px] border-l-bullish-text">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">WAT TE DOEN</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(al?.what_to_do)}</div>
        </DataCard>
        <DataCard className="p-4 border-l-[3px] border-l-bearish-text">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">VERMIJD</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(al?.what_to_avoid)}</div>
        </DataCard>
      </div>

      {/* TIMEFRAME */}
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

      {/* 4 PILLARS */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ["GROEI", al?.growth_alignment || al?.growth_view],
          ["INFLATIE", al?.inflation_alignment || al?.inflation_view],
          ["CENTRALE BANK", al?.cb_alignment_narrative || al?.cb_view],
          ["LIQUIDITEIT", al?.liquidity_alignment || al?.liquidity_view],
        ].map(([label, value]) => (
          <DataCard key={label as string} className="p-4">
            <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">{label}</div>
            <div className="text-[11px] text-sub-text leading-relaxed">{val(value)}</div>
          </DataCard>
        ))}
      </div>

      {/* CONVICTION */}
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

      {/* CURRENCY VIEWS */}
      <SectionLabel>CURRENCY VIEWS</SectionLabel>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {FX.map((c) => (
          <DataCard key={c} className="p-[14px]" onClick={() => navigate(`/currencies/${c}`)}>
            <div className="text-[9px] text-purple-accent uppercase font-bold mb-1">{c}</div>
            <div className="text-[11px] text-sub-text leading-snug">{val(al?.[`${c.toLowerCase()}_view`])}</div>
          </DataCard>
        ))}
      </div>

      {/* SCENARIOS */}
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

      {/* BOTTOM */}
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
