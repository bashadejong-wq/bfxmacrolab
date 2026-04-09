import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, BiasChip, RiskChip, MarkdownBlock } from "@/components/ui-helpers";

const PERIODS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

export default function DWM() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState("daily");
  const [snap, setSnap] = useState<any>(null);

  useEffect(() => {
    supabase.from("period_snapshots").select("*").eq("period_type", activePeriod).order("period_start", { ascending: false }).limit(1)
      .then(({ data }) => setSnap(data?.[0] || null));
  }, [activePeriod]);

  const biasColor = (b: string | null) => {
    const v = (b || "").toLowerCase();
    return v === "bullish" ? "text-bullish-text" : v === "bearish" ? "text-bearish-text" : "text-neutral-text";
  };

  const fxBiases: [string, any][] = FX.map(c => [c, snap?.[`${c.toLowerCase()}_bias`]]);

  return (
    <DashboardLayout>
      {/* Tab Bar */}
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-7">
        {PERIODS.map((p) => (
          <button key={p.value} onClick={() => setActivePeriod(p.value)}
            className={`px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
              p.value === activePeriod ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
            }`}>{p.label}</button>
        ))}
      </div>

      {!snap ? (
        <div className="text-center text-label text-[13px] mt-10">Geen snapshot beschikbaar voor {activePeriod}</div>
      ) : (
        <>
          {/* BLOCK 1 - Header Strip */}
          <DataCard className="p-[16px_24px] mb-5">
            <div className="flex items-center gap-4">
              <span className="text-[16px] font-bold text-foreground">{val(snap.period_label)}</span>
              <span className="bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase">{val(snap.macro_regime)}</span>
              <RiskChip regime={snap.risk_regime} />
              <div className="ml-auto flex items-baseline">
                <span className="text-[22px] font-extrabold text-purple-accent font-mono">{val(snap.conviction_score)}</span>
                <span className="text-[14px] text-label ml-1">/10</span>
              </div>
            </div>
          </DataCard>

          {/* BLOCK 2 - Headline + Narrative */}
          <div className="text-[18px] font-bold text-foreground mb-3">{val(snap.headline)}</div>
          <div className="bg-secondary border border-card-border rounded-lg p-5 mb-5">
            <MarkdownBlock content={snap.summary_dashboard || snap.summary || snap.summary_micro} />
          </div>

          {/* BLOCK 3 - Scenarios */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "BASIS", value: snap.scenario_base, border: "border-l-neutral-bg" },
              { label: "OPWAARTS", value: snap.scenario_upside, border: "border-l-bullish-text" },
              { label: "NEERWAARTS", value: snap.scenario_downside, border: "border-l-bearish-text" },
            ].map((s) => (
              <DataCard key={s.label} className={`p-4 border-l-[3px] ${s.border}`}>
                <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">{s.label}</div>
                <div className="text-[11px] text-sub-text leading-relaxed">{val(s.value)}</div>
              </DataCard>
            ))}
          </div>

          {/* BLOCK 4 - FX Bias Chips */}
          <SectionLabel>FX BIAS</SectionLabel>
          <div className="grid grid-cols-8 gap-2 mb-5">
            {fxBiases.map(([code, bias]) => (
              <DataCard key={code} className="p-[10px_14px] text-center" onClick={() => navigate(`/currencies/${code}`)}>
                <div className="text-[9px] text-label uppercase">{code}</div>
                <div className={`text-[12px] font-bold mt-1 ${biasColor(bias)}`}>{val(bias)}</div>
              </DataCard>
            ))}
          </div>

          {/* BLOCK 5 - Asset Views */}
          <SectionLabel>ASSET VIEWS</SectionLabel>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[["GOLD", snap.gold_view],["OIL", snap.oil_view],["SPX", snap.spx_view],["NASDAQ", snap.nasdaq_view],["VIX", snap.vix_view]].map(([l,v]) => (
              <DataCard key={l as string} className="p-3">
                <div className="text-[9px] text-label uppercase">{l}</div>
                <div className="text-[13px] text-foreground font-mono font-semibold mt-1">{val(v)}</div>
              </DataCard>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[["US 2J", snap.us_2y_view],["US 10J", snap.us_10y_view],["CURVE", snap.curve_view]].map(([l,v]) => (
              <DataCard key={l as string} className="p-3">
                <div className="text-[9px] text-label uppercase">{l}</div>
                <div className="text-[13px] text-foreground font-mono font-semibold mt-1">{val(v)}</div>
              </DataCard>
            ))}
          </div>

          {/* BLOCK 6 - Bottom */}
          <div className="grid grid-cols-2 gap-3">
            <DataCard className="p-4">
              <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">WAT VERANDERDE</div>
              <div className="text-[11px] text-sub-text leading-relaxed">{val(snap.what_changed)}</div>
            </DataCard>
            <DataCard className="p-4">
              <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">TE MONITOREN</div>
              <div className="text-[11px] text-sub-text leading-relaxed">{val(snap.what_to_watch)}</div>
            </DataCard>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
