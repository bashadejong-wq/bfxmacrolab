import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, BiasChip, RiskChip, MarkdownBlock, queryWithRetry, getBiasColor } from "@/components/ui-helpers";
import { CalendarDays, CalendarRange, Calendar as CalIcon, DollarSign, Package, BarChart2, Percent } from "lucide-react";

const PERIODS = [
  { label: "Daily", value: "daily", icon: CalendarDays },
  { label: "Weekly", value: "weekly", icon: CalendarRange },
  { label: "Monthly", value: "monthly", icon: CalIcon },
];
const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

export default function DWM() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState("daily");
  const [snap, setSnap] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    queryWithRetry(() => supabase.from("period_snapshots").select("*").eq("period_type", activePeriod).order("period_start", { ascending: false }).limit(1), `DWM/period_snapshots/${activePeriod}`)
      .then(data => { setSnap((data as any[])?.[0] || null); setLoaded(true); });
  }, [activePeriod]);

  return (
    <DashboardLayout>
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-7">
        {PERIODS.map((p) => {
          const Icon = p.icon;
          return (
            <button key={p.value} onClick={() => setActivePeriod(p.value)}
              className={`flex items-center gap-1.5 px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
                p.value === activePeriod ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
              }`}>
              <Icon size={14} />
              {p.label}
            </button>
          );
        })}
      </div>

      {loaded && !snap ? (
        <div className="text-center text-label text-[13px] mt-10">Nog geen snapshot beschikbaar voor {activePeriod}</div>
      ) : snap && (
        <>
          <DataCard className="p-5 mb-4">
            <div className="flex items-center gap-4">
              <span className="text-[16px] font-bold text-foreground">{val(snap.period_label)}</span>
              <span className="bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">{val(snap.macro_regime)}</span>
              <RiskChip regime={snap.risk_regime} />
              <div className="ml-auto flex items-baseline">
                <span className="text-[22px] font-extrabold text-purple-accent font-mono">{val(snap.conviction_score)}</span>
                <span className="text-[14px] text-label ml-1">/10</span>
              </div>
            </div>
          </DataCard>

          <div className="text-[18px] font-bold text-foreground mb-3">{val(snap.headline)}</div>
          <div className="bg-secondary border border-card-border rounded-lg p-5 mb-8">
            <MarkdownBlock content={snap.summary_dashboard || snap.summary || snap.summary_micro} />
          </div>

          <SectionLabel>SCENARIO'S</SectionLabel>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "BASIS", value: snap.scenario_base, border: "border-l-neutral-text" },
              { label: "OPWAARTS", value: snap.scenario_upside, border: "border-l-bullish-text" },
              { label: "NEERWAARTS", value: snap.scenario_downside, border: "border-l-bearish-text" },
            ].map((s) => (
              <DataCard key={s.label} className={`p-5 border-l-[3px] ${s.border}`}>
                <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">{s.label}</div>
                <div className="text-[11px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
              </DataCard>
            ))}
          </div>

          <SectionLabel>FX BIAS</SectionLabel>
          <div className="grid grid-cols-8 gap-2 mb-8">
            {FX.map((code) => {
              const bias = snap?.[`${code.toLowerCase()}_bias`];
              const color = getBiasColor(bias);
              return (
                <DataCard key={code} className="p-3 text-center" onClick={() => navigate(`/currencies/${code}`)}>
                  <div className="text-[0.65rem] text-label uppercase">{code}</div>
                  <div className="text-[12px] font-bold mt-1" style={{ color }}>{val(bias)}</div>
                </DataCard>
              );
            })}
          </div>

          <SectionLabel>ASSET VIEWS</SectionLabel>
          <div className="grid grid-cols-5 gap-4 mb-4">
            {[
              { l: "GOLD", v: snap.gold_view, icon: Package },
              { l: "OIL", v: snap.oil_view, icon: Package },
              { l: "SPX", v: snap.spx_view, icon: BarChart2 },
              { l: "NASDAQ", v: snap.nasdaq_view, icon: BarChart2 },
              { l: "VIX", v: snap.vix_view, icon: BarChart2 },
            ].map(({ l, v, icon: Icon }) => (
              <DataCard key={l} className="p-5">
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={12} className="text-label" />
                  <span className="text-[0.65rem] text-label uppercase">{l}</span>
                </div>
                <div className="text-[13px] text-foreground font-mono font-semibold mt-1">{val(v)}</div>
              </DataCard>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { l: "US 2J", v: snap.us_2y_view, icon: Percent },
              { l: "US 10J", v: snap.us_10y_view, icon: Percent },
              { l: "CURVE", v: snap.curve_view, icon: Percent },
            ].map(({ l, v, icon: Icon }) => (
              <DataCard key={l} className="p-5">
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={12} className="text-label" />
                  <span className="text-[0.65rem] text-label uppercase">{l}</span>
                </div>
                <div className="text-[13px] text-foreground font-mono font-semibold mt-1">{val(v)}</div>
              </DataCard>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DataCard className="p-5">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">WAT VERANDERDE</div>
              <div className="text-[11px] text-sub-text leading-relaxed">{textVal(snap.what_changed)}</div>
            </DataCard>
            <DataCard className="p-5">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">TE MONITOREN</div>
              <div className="text-[11px] text-sub-text leading-relaxed">{textVal(snap.what_to_watch || snap.what_to_watch_next)}</div>
            </DataCard>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
