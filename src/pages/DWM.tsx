import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, BiasChip, RiskChip, MarkdownBlock, queryWithRetry, getBiasColor } from "@/components/ui-helpers";
import {
  CalendarDays, CalendarRange, Calendar as CalIcon,
  BookOpen, Package, BarChart2, Activity, Percent,
  RefreshCw, Eye, Target, TrendingUp, TrendingDown, Minus,
  Zap, Sun, GitMerge, ArrowRightLeft
} from "lucide-react";

const PERIODS = [
  { label: "Daily", value: "daily", icon: CalendarDays },
  { label: "Weekly", value: "weekly", icon: CalendarRange },
  { label: "Monthly", value: "monthly", icon: CalIcon },
];
const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

const REGIME_ICONS: Record<string, any> = {
  energy_shock: Zap, stagflation: TrendingUp, goldilocks: Sun,
  reflation: RefreshCw, deflation: TrendingDown, mixed: GitMerge,
  transitional: ArrowRightLeft,
};

function getRegimeIcon(regime: string | null) {
  const r = (regime || "").toLowerCase().replace(/[\s-]/g, "_");
  for (const [key, Icon] of Object.entries(REGIME_ICONS)) {
    if (r.includes(key)) return Icon;
  }
  return GitMerge;
}

function getCurveIcon(curve: string | null) {
  const c = (curve || "").toLowerCase();
  if (c.includes("steep") || c.includes("bull")) return TrendingUp;
  if (c.includes("invert") || c.includes("bear")) return TrendingDown;
  return Minus;
}

const MONTHS_NL = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
function fmtShortDate(v: any) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return String(v); }
}

export default function DWM() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState("daily");
  const [snap, setSnap] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    queryWithRetry(() =>
      supabase.from("period_snapshots").select("*")
        .eq("period_type", activePeriod)
        .order("period_start", { ascending: false })
        .limit(1),
      `DWM/${activePeriod}`
    ).then(data => { setSnap((data as any[])?.[0] || null); setLoaded(true); });
  }, [activePeriod]);

  const RegimeIcon = snap ? getRegimeIcon(snap.macro_regime) : GitMerge;
  const CurveIcon = snap ? getCurveIcon(snap.curve_view) : Minus;
  const convictionPct = snap?.conviction_score ? Math.min(Math.max((snap.conviction_score / 10) * 100, 0), 100) : 0;

  return (
    <DashboardLayout>
      {/* Tab bar */}
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
      ) : !loaded ? (
        <div className="text-center text-label text-[13px] mt-10">Laden...</div>
      ) : snap && (
        <>
          {/* 1. HEADER */}
          <DataCard className="p-5 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[18px] font-bold text-foreground">{val(snap.period_label)}</span>
              <span className="text-[12px] text-label">{fmtShortDate(snap.period_start)}</span>
              <span className="flex items-center gap-1 bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">
                <RegimeIcon size={12} />
                {val(snap.macro_regime)}
              </span>
              <RiskChip regime={snap.risk_regime} />
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[22px] font-extrabold text-purple-accent font-mono">{val(snap.conviction_score)}</span>
                <span className="text-[12px] text-label">/10</span>
                <div className="w-[120px] h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-accent transition-all" style={{ width: `${convictionPct}%` }} />
                </div>
              </div>
            </div>
          </DataCard>

          {/* 2. HEADLINE */}
          <div className="flex items-start gap-2 mb-3">
            <BookOpen size={18} className="text-label mt-[3px] shrink-0" />
            <h2 className="text-[18px] font-bold text-foreground leading-snug">{textVal(snap.headline, "Nog geen headline beschikbaar")}</h2>
          </div>

          {/* Divider */}
          <hr className="border-card-border mb-6" />

          {/* 3. MACRO STORY */}
          <SectionLabel>MACRO SAMENVATTING</SectionLabel>
          <div className="bg-secondary border border-card-border rounded-lg p-5 mb-8">
            <div className="max-w-[680px] text-[13px] text-sub-text leading-[1.7]">
              <MarkdownBlock content={snap.summary_micro || snap.summary_dashboard || snap.summary} />
            </div>
          </div>

          {/* Divider */}
          <hr className="border-card-border mb-6" />

          {/* 4. SCENARIOS */}
          <SectionLabel>SCENARIO'S</SectionLabel>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "BASIS", value: snap.scenario_base, borderColor: "#6B7280" },
              { label: "OPWAARTS", value: snap.scenario_upside, borderColor: "#16A34A" },
              { label: "NEERWAARTS", value: snap.scenario_downside, borderColor: "#DC2626" },
            ].map((s) => (
              <DataCard key={s.label} className="p-5" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
                <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2 font-medium">{s.label}</div>
                <div className="text-[11px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
              </DataCard>
            ))}
          </div>

          {/* Divider */}
          <hr className="border-card-border mb-6" />

          {/* 5. FX BIAS ROW */}
          <SectionLabel>FX BIAS</SectionLabel>
          <div className="flex flex-wrap gap-2 mb-8">
            {FX.map((code) => {
              const bias = snap?.[`${code.toLowerCase()}_bias`];
              const color = getBiasColor(bias);
              const bg = bias ? undefined : "#F9FAFB";
              return (
                <button key={code} onClick={() => navigate(`/currencies/${code}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-card-border bg-card hover:border-purple-accent/30 transition-colors">
                  <span className="text-[10px] text-label font-semibold uppercase">{code}</span>
                  <span className="text-[10px] font-bold uppercase" style={{ color }}>{val(bias)}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <hr className="border-card-border mb-6" />

          {/* 6. ASSET VIEWS */}
          <SectionLabel>ASSET VIEWS</SectionLabel>
          <div className="grid grid-cols-5 gap-4 mb-4">
            {[
              { l: "GOLD", v: snap.gold_view, icon: Package },
              { l: "OIL", v: snap.oil_view, icon: Package },
              { l: "SPX", v: snap.spx_view, icon: BarChart2 },
              { l: "NASDAQ", v: snap.nasdaq_view, icon: BarChart2 },
              { l: "VIX", v: snap.vix_view, icon: Activity },
            ].map(({ l, v, icon: Icon }) => (
              <DataCard key={l} className="p-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={14} className="text-label" />
                  <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">{l}</span>
                </div>
                <div className="text-[12px] text-foreground leading-relaxed">{textVal(v)}</div>
              </DataCard>
            ))}
          </div>

          {/* Divider */}
          <hr className="border-card-border mb-6" />

          {/* 7. RATES */}
          <SectionLabel>RENTES & CURVE</SectionLabel>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { l: "US 2Y", v: snap.us_2y_view, icon: Percent, curve: false },
              { l: "US 10Y", v: snap.us_10y_view, icon: Percent, curve: false },
              { l: "CURVE", v: snap.curve_view, icon: Percent, curve: true },
            ].map(({ l, v, icon: PIcon, curve }) => {
              const TrailIcon = curve ? CurveIcon : null;
              return (
                <DataCard key={l} className="p-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <PIcon size={14} className="text-label" />
                    <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">{l}</span>
                    {TrailIcon && <TrailIcon size={12} className="text-label ml-auto" />}
                  </div>
                  <div className="text-[12px] text-foreground leading-relaxed">{textVal(v)}</div>
                </DataCard>
              );
            })}
          </div>

          {/* Divider */}
          <hr className="border-card-border mb-6" />

          {/* 8. WHAT CHANGED / WATCH / TRADING */}
          <SectionLabel>ACTIE & MONITORING</SectionLabel>
          <div className="grid grid-cols-3 gap-4">
            {[
              { l: "WAT VERANDERDE", v: snap.what_changed, icon: RefreshCw },
              { l: "TE MONITOREN", v: snap.what_to_watch || snap.what_to_watch_next || snap.next_watchpoints, icon: Eye },
              { l: "TRADING IMPLICATIES", v: snap.trading_implications, icon: Target },
            ].map(({ l, v, icon: Icon }) => (
              <DataCard key={l} className="p-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={14} className="text-label" />
                  <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">{l}</span>
                </div>
                <div className="text-[11px] text-sub-text leading-relaxed">{textVal(v)}</div>
              </DataCard>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
