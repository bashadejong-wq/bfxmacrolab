import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, MarkdownBlock, queryWithRetry, getBiasColor } from "@/components/ui-helpers";
import { GitMerge, CheckCircle, XCircle, TrendingUp, Shield, AlertTriangle, ShieldCheck, DollarSign } from "lucide-react";

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

const ALIGNMENT_ICONS: Record<string, React.ElementType> = {
  aligned: ShieldCheck, mixed: GitMerge, conflict: AlertTriangle, conflicted: AlertTriangle,
};

export default function Alignment() {
  const navigate = useNavigate();
  const [al, setAl] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queryWithRetry(() => supabase.from("alignment_engine").select("*").order("alignment_date", { ascending: false }).limit(1), "Alignment/alignment_engine")
      .then(data => { setAl((data as any[])?.[0] || null); setLoaded(true); });
  }, []);

  const stateKey = (al?.alignment_state || "").toLowerCase();
  const stateColor = stateKey === "aligned" ? "text-bullish-text" : stateKey.includes("conflict") ? "text-bearish-text" : "text-purple-accent";
  const StateIcon = ALIGNMENT_ICONS[stateKey] || GitMerge;

  if (loaded && !al) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Nog geen data beschikbaar</div></DashboardLayout>;

  return (
    <DashboardLayout>
      {/* STATE HEADER */}
      <DataCard className="p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">ALIGNMENT STATE</div>
            <div className="flex items-center gap-2 mb-2">
              <StateIcon size={20} className={stateColor} />
              <span className={`text-[24px] font-black uppercase ${stateColor}`}>{val(al?.alignment_state)}</span>
            </div>
            <div className="text-[11px] text-sub-text leading-relaxed max-w-[480px]">{textVal(al?.core_driver)}</div>
          </div>
          <div className="text-right">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-1">CONVICTION</div>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-[32px] font-black text-purple-accent font-mono">{val(al?.conviction_score)}</span>
              <span className="text-[12px] text-label">/10</span>
            </div>
          </div>
        </div>
      </DataCard>

      {/* NARRATIVE */}
      <div className="bg-secondary border border-card-border rounded-lg p-5 mb-8">
        <MarkdownBlock content={al?.summary_dashboard || al?.summary_micro || al?.macro_story} />
      </div>

      {/* WAT TE DOEN / VERMIJD */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5 border-l-[3px] border-l-bullish-text">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-bullish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">WAT TE DOEN</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al?.what_to_do)}</div>
        </DataCard>
        <DataCard className="p-5 border-l-[3px] border-l-bearish-text">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={14} className="text-bearish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VERMIJD</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al?.what_to_avoid)}</div>
        </DataCard>
      </div>

      {/* TIMEFRAME */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">DAILY VS WEEKLY</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al?.daily_vs_weekly)}</div>
        </DataCard>
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">WEEKLY VS MONTHLY</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al?.weekly_vs_monthly)}</div>
        </DataCard>
      </div>

      {/* 4 PILLARS */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          ["GROEI", al?.growth_alignment || al?.growth_view],
          ["INFLATIE", al?.inflation_alignment || al?.inflation_view],
          ["CENTRALE BANK", al?.cb_alignment_narrative || al?.cb_view],
          ["LIQUIDITEIT", al?.liquidity_alignment || al?.liquidity_view],
        ].map(([label, value]) => (
          <DataCard key={label as string} className="p-5">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">{label}</div>
            <div className="text-[11px] text-sub-text leading-relaxed">{textVal(value as any)}</div>
          </DataCard>
        ))}
      </div>

      {/* CONVICTION */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5 border-l-[3px] border-l-bullish-text">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">HOOG CONVICTION</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al?.high_conviction_assets)}</div>
        </DataCard>
        <DataCard className="p-5 border-l-[3px] border-l-bearish-text">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">LAAG CONVICTION</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al?.low_conviction_assets)}</div>
        </DataCard>
      </div>

      {/* CURRENCY VIEWS */}
      <SectionLabel>CURRENCY VIEWS</SectionLabel>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {FX.map((c) => (
          <DataCard key={c} className="p-5" onClick={() => navigate(`/currencies/${c}`)}>
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign size={12} className="text-purple-accent" />
              <span className="text-[11px] text-purple-accent uppercase font-bold">{c}</span>
            </div>
            <div className="text-[11px] text-sub-text leading-snug">{textVal(al?.[`${c.toLowerCase()}_view`])}</div>
          </DataCard>
        ))}
      </div>

      {/* SCENARIOS */}
      <SectionLabel>SCENARIO'S</SectionLabel>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "BASIS", value: al?.scenario_base, border: "border-l-neutral-text" },
          { label: "OPWAARTS", value: al?.scenario_upside, border: "border-l-bullish-text" },
          { label: "NEERWAARTS", value: al?.scenario_downside, border: "border-l-bearish-text" },
        ].map((s) => (
          <DataCard key={s.label} className={`p-5 border-l-[3px] ${s.border}`}>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">{s.label}</div>
            <div className="text-[11px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
          </DataCard>
        ))}
      </div>

      {/* BOTTOM */}
      <div className="grid grid-cols-2 gap-4">
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">KEY WATCHPOINTS</div>
          <MarkdownBlock content={al?.key_watchpoints} />
        </DataCard>
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">HANDELIMPLICATIES</div>
          <MarkdownBlock content={al?.trading_implications} />
        </DataCard>
      </div>
    </DashboardLayout>
  );
}
