import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, BiasChip, RiskChip, MarkdownBlock, queryWithRetry, getBiasColor } from "@/components/ui-helpers";
import {
  CalendarDays, CalendarRange, Calendar as CalIcon,
  BookOpen, Package, BarChart2, Activity, Percent,
  RefreshCw, Eye, Target, TrendingUp, TrendingDown, Minus,
  Zap, Sun, GitMerge, ArrowRightLeft, Shield, AlertTriangle,
  Layers, ArrowRight, ChevronRight
} from "lucide-react";

import { BriefContent as BriefInline } from "./Brief";

const PERIODS = [
  { label: "Daily", value: "daily", icon: CalendarDays },
  { label: "Weekly", value: "weekly", icon: CalendarRange },
  { label: "Monthly", value: "monthly", icon: CalIcon },
  { label: "Brief", value: "brief", icon: BookOpen },
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

function convictionColor(score: number | null) {
  if (!score) return "#6B7280";
  if (score >= 8) return "#16A34A";
  if (score >= 5) return "#D97706";
  return "#DC2626";
}

function riskOnOffBadge(bias: string | null) {
  const b = (bias || "").toLowerCase();
  if (b.includes("risk-on") || b === "risk on") return { label: "RISK-ON", bg: "#F0FDF4", color: "#16A34A" };
  if (b.includes("risk-off") || b === "risk off") return { label: "RISK-OFF", bg: "#FEF2F2", color: "#DC2626" };
  return { label: "NEUTRAL", bg: "#F5F5F5", color: "#6B7280" };
}

/** Parse bullets from text */
function parseBullets(text: string | null): string[] {
  if (!text) return [];
  return text.split(/\n|•|–|-|\*/).map(s => s.trim()).filter(s => s.length > 3);
}

/** Flow chain strip */
function FlowChainStrip({ chain }: { chain: string | null }) {
  if (!chain) return null;
  const steps = chain.split(/→|->|➜/).map(s => s.trim()).filter(Boolean);
  if (steps.length < 2) return null;
  return (
    <DataCard className="px-4 py-3 mb-3">
      <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-2">TRANSMISSIEKETEN</div>
      <div className="flex items-center gap-1 flex-wrap">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="bg-secondary text-foreground text-[10px] font-semibold px-2.5 py-1 rounded">{step}</span>
            {i < steps.length - 1 && <ChevronRight size={12} className="text-label shrink-0" />}
          </div>
        ))}
      </div>
    </DataCard>
  );
}

/** Enhanced asset view text */
function assetViewText(v: any, yieldSignal?: string | null): string {
  if (!v || v === "" || v === "null" || v === "undefined" || (typeof v === "string" && v.trim() === "")) {
    return "— (geen duidelijke edge — volg regime)";
  }
  const lower = String(v).toLowerCase().trim();
  if (lower === "neutral") {
    if (yieldSignal) return `neutral — ${yieldSignal}`;
    return "neutral (geen duidelijke edge — volg regime)";
  }
  return String(v);
}

/** Scenario fallback */
function scenarioText(v: any): string {
  if (!v || v === "" || v === "null" || v === "undefined" || (typeof v === "string" && v.trim() === "")) {
    return "Geen expliciete scenario data — zie daily brief voor context";
  }
  return String(v);
}

export default function DWM() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState("daily");
  const [allSnaps, setAllSnaps] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    queryWithRetry(
      () => supabase.from("v_dwm_latest").select("*"),
      "DWM/v_dwm_latest"
    ).then(data => {
      setAllSnaps((data as any[]) || []);
      setLoaded(true);
    });
  }, []);

  const snap = allSnaps.find(s => s.period_type === activePeriod) || null;
  const isDaily = activePeriod === "daily";
  const isWeekly = activePeriod === "weekly";
  const isMonthly = activePeriod === "monthly";

  const RegimeIcon = snap ? getRegimeIcon(snap.macro_regime) : GitMerge;
  const CurveIcon = snap ? getCurveIcon(snap.curve_view) : Minus;
  const convictionPct = snap?.conviction_score ? Math.min(Math.max((snap.conviction_score / 10) * 100, 0), 100) : 0;
  const roBadge = riskOnOffBadge(snap?.risk_on_off_bias);

  return (
    <DashboardLayout>
      {/* Tab bar */}
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-5">
        {PERIODS.map((p) => {
          const Icon = p.icon;
          return (
            <button key={p.value} onClick={() => setActivePeriod(p.value)}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${
                p.value === activePeriod ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
              }`}>
              <Icon size={14} />
              {p.label}
            </button>
          );
        })}
      </div>

      {activePeriod === "brief" ? (
        <BriefInline />
      ) : loaded && !snap ? (
        <div className="text-center text-label text-[13px] mt-10">Nog geen snapshot beschikbaar voor {activePeriod}</div>
      ) : !loaded ? (
        <div className="text-center text-label text-[13px] mt-10">Laden...</div>
      ) : snap && (
        <>
          {/* 1. HEADER — improved */}
          <DataCard className="px-4 py-3 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[16px] font-bold text-foreground">{val(snap.period_label)}</span>
              <span className="text-[11px] text-label">{fmtShortDate(snap.period_start)}</span>
              <span className="flex items-center gap-1 bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">
                <RegimeIcon size={11} />
                {val(snap.macro_regime)}
              </span>
              <RiskChip regime={snap.risk_regime} />
              <span className="px-2 py-[2px] text-[9px] rounded uppercase font-bold" style={{ backgroundColor: roBadge.bg, color: roBadge.color }}>
                {roBadge.label}
              </span>
              {snap.risk_sentiment && (
                <span className="text-[10px] text-sub-text italic truncate max-w-[250px]">{snap.risk_sentiment}</span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[20px] font-extrabold font-mono" style={{ color: convictionColor(snap.conviction_score) }}>
                  {val(snap.conviction_score)}
                </span>
                <span className="text-[11px] text-label">/10</span>
                <div className="w-[100px] h-[3px] bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${convictionPct}%`, backgroundColor: convictionColor(snap.conviction_score) }} />
                </div>
              </div>
            </div>
          </DataCard>

          {/* 2. HEADLINE + subtitle for weekly */}
          <div className="flex items-start gap-2 mb-1">
            <BookOpen size={16} className="text-label mt-[3px] shrink-0" />
            <div>
              <h2 className="text-[16px] font-bold text-foreground leading-snug">{textVal(snap.headline, "Nog geen headline beschikbaar")}</h2>
              {isWeekly && snap.strongest_theme && (
                <div className="text-[11px] text-sub-text italic mt-0.5">{snap.strongest_theme}</div>
              )}
            </div>
          </div>

          {/* DAILY: what_changed prominent */}
          {isDaily && snap.what_changed && (
            <DataCard className="px-4 py-3 mb-3 border-l-[3px] border-l-purple-accent">
              <div className="flex items-center gap-1.5 mb-1">
                <RefreshCw size={11} className="text-purple-accent" />
                <span className="text-[8px] text-label uppercase tracking-wider font-medium">WAT VERANDERDE VANDAAG</span>
              </div>
              <div className="text-[12px] text-foreground font-semibold leading-relaxed">{snap.what_changed}</div>
            </DataCard>
          )}

          {/* DAILY: flow chain strip */}
          {isDaily && <FlowChainStrip chain={snap.flow_chain} />}

          {/* DAILY: key developments */}
          {isDaily && snap.key_developments && (() => {
            const bullets = parseBullets(snap.key_developments);
            return bullets.length > 0 ? (
              <DataCard className="px-4 py-3 mb-3">
                <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1.5">KEY DEVELOPMENTS</div>
                <ul className="space-y-1">
                  {bullets.slice(0, 5).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-accent mt-[3px] shrink-0">•</span>
                      <span className="text-[11px] text-sub-text leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </DataCard>
            ) : null;
          })()}

          <hr className="border-card-border mb-4 mt-3" />

          {/* MACRO SAMENVATTING */}
          <SectionLabel>MACRO SAMENVATTING</SectionLabel>
          <div className="bg-secondary border border-card-border rounded-lg p-4 mb-4">
            <div className="max-w-[720px] text-[13px] text-sub-text leading-[1.7]">
              <MarkdownBlock content={snap.summary_micro || snap.summary_dashboard || snap.summary} />
            </div>
          </div>

          {/* WEEKLY: strongest/weakest theme */}
          {isWeekly && (snap.strongest_theme || snap.weakest_theme) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <DataCard className="px-4 py-3 border-l-[3px] border-l-bullish-text">
                <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1">STERKSTE THEMA</div>
                <div className="text-[12px] text-foreground font-semibold">{textVal(snap.strongest_theme, "Geen dominant thema geïdentificeerd")}</div>
              </DataCard>
              <DataCard className="px-4 py-3 border-l-[3px] border-l-bearish-text">
                <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1">ZWAKSTE THEMA</div>
                <div className="text-[12px] text-foreground font-semibold">{textVal(snap.weakest_theme, "Geen zwak thema geïdentificeerd")}</div>
              </DataCard>
            </div>
          )}

          {/* WEEKLY: capital rotation */}
          {isWeekly && snap.capital_rotation && (
            <DataCard className="px-4 py-3 mb-4 border-l-[3px] border-l-mixed-text">
              <div className="flex items-center gap-1.5 mb-1">
                <Layers size={11} className="text-mixed-text" />
                <span className="text-[8px] text-label uppercase tracking-wider font-medium">KAPITAALROTATIE</span>
              </div>
              <div className="text-[12px] text-sub-text leading-relaxed">{snap.capital_rotation}</div>
            </DataCard>
          )}

          {/* MONTHLY: structural changes */}
          {isMonthly && snap.structural_changes && (
            <>
              <SectionLabel>STRUCTURELE VERANDERINGEN</SectionLabel>
              <DataCard className="px-4 py-3 mb-4 border-l-[3px]" style={{ borderLeftColor: "#C4673A" }}>
                <div className="text-[12px] text-sub-text leading-relaxed">{snap.structural_changes}</div>
              </DataCard>
            </>
          )}

          {/* MONTHLY: high conviction next month */}
          {isMonthly && snap.high_conviction_next_month && (
            <DataCard className="px-4 py-3 mb-4 border-l-[3px] border-l-purple-accent">
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={11} className="text-purple-accent" />
                <span className="text-[8px] text-label uppercase tracking-wider font-medium">HIGH CONVICTION VOLGENDE MAAND</span>
              </div>
              <div className="text-[12px] text-foreground font-semibold leading-relaxed">{snap.high_conviction_next_month}</div>
            </DataCard>
          )}

          {/* MONTHLY: biggest shifts */}
          {isMonthly && snap.biggest_shifts && (() => {
            const bullets = parseBullets(snap.biggest_shifts);
            return bullets.length > 0 ? (
              <DataCard className="px-4 py-3 mb-4">
                <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1.5">GROOTSTE VERSCHUIVINGEN</div>
                <ul className="space-y-1">
                  {bullets.slice(0, 5).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#C4673A] mt-[3px] shrink-0">•</span>
                      <span className="text-[11px] text-sub-text leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </DataCard>
            ) : null;
          })()}

          {/* MONTHLY: priced in assessment */}
          {isMonthly && snap.priced_in_assessment && (
            <DataCard className="px-4 py-3 mb-4 border-l-[3px] border-l-mixed-text">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield size={11} className="text-mixed-text" />
                <span className="text-[8px] text-label uppercase tracking-wider font-medium">PRICED-IN ASSESSMENT</span>
              </div>
              <div className="text-[12px] text-sub-text leading-relaxed">{snap.priced_in_assessment}</div>
            </DataCard>
          )}

          <hr className="border-card-border mb-4" />

          {/* SCENARIOS */}
          <SectionLabel>SCENARIO'S</SectionLabel>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "BASIS", value: snap.scenario_base, borderColor: "#6B7280" },
              { label: "OPWAARTS", value: snap.scenario_upside, borderColor: "#16A34A" },
              { label: "NEERWAARTS", value: snap.scenario_downside, borderColor: "#DC2626" },
            ].map((s) => (
              <DataCard key={s.label} className="px-4 py-3" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
                <div className="text-[8px] text-label uppercase tracking-[0.08em] mb-1.5 font-medium">{s.label}</div>
                <div className="text-[11px] text-sub-text leading-relaxed">{scenarioText(s.value)}</div>
              </DataCard>
            ))}
          </div>

          <hr className="border-card-border mb-4" />

          {/* FX BIAS */}
          <SectionLabel>FX BIAS</SectionLabel>
          <div className="flex flex-wrap gap-2 mb-4">
            {FX.map((code) => {
              const bias = snap?.[`${code.toLowerCase()}_bias`];
              const hasBias = bias && bias !== "" && bias !== "null" && bias.toLowerCase() !== "neutral";
              const color = hasBias ? getBiasColor(bias) : "#6B7280";
              return (
                <button key={code} onClick={() => navigate(`/currencies/${code}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-card-border bg-card hover:border-purple-accent/30 transition-colors">
                  <span className="text-[10px] text-label font-semibold uppercase">{code}</span>
                  <span className="text-[10px] font-bold uppercase" style={{ color }}>
                    {hasBias ? bias : "—"}
                  </span>
                </button>
              );
            })}
          </div>

          <hr className="border-card-border mb-4" />

          {/* ASSET VIEWS */}
          <SectionLabel>ASSET VIEWS</SectionLabel>
          <div className="grid grid-cols-5 gap-3 mb-3">
            {[
              { l: "GOLD", v: snap.gold_view, icon: Package },
              { l: "OIL", v: snap.oil_view, icon: Package },
              { l: "SPX", v: snap.spx_view, icon: BarChart2 },
              { l: "NASDAQ", v: snap.nasdaq_view, icon: BarChart2 },
              { l: "VIX", v: snap.vix_view, icon: Activity },
            ].map(({ l, v, icon: Icon }) => (
              <DataCard key={l} className="px-3 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={13} className="text-label" />
                  <span className="text-[8px] text-label uppercase tracking-[0.08em] font-medium">{l}</span>
                </div>
                <div className="text-[11px] text-foreground leading-relaxed">{assetViewText(v)}</div>
              </DataCard>
            ))}
          </div>

          <hr className="border-card-border mb-4" />

          {/* RATES */}
          <SectionLabel>RENTES & CURVE</SectionLabel>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { l: "US 2Y", v: snap.us_2y_view, icon: Percent, curve: false },
              { l: "US 10Y", v: snap.us_10y_view, icon: Percent, curve: false },
              { l: "CURVE", v: snap.curve_view, icon: Percent, curve: true },
            ].map(({ l, v, icon: PIcon, curve }) => {
              const TrailIcon = curve ? CurveIcon : null;
              return (
                <DataCard key={l} className="px-3 py-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <PIcon size={13} className="text-label" />
                    <span className="text-[8px] text-label uppercase tracking-[0.08em] font-medium">{l}</span>
                    {TrailIcon && <TrailIcon size={11} className="text-label ml-auto" />}
                  </div>
                  <div className="text-[11px] text-foreground leading-relaxed">{assetViewText(v, snap.yield_signal)}</div>
                </DataCard>
              );
            })}
          </div>

          <hr className="border-card-border mb-4" />

          {/* ACTIE & MONITORING */}
          <SectionLabel>ACTIE & MONITORING</SectionLabel>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { l: "WAT VERANDERDE", v: snap.what_changed, icon: RefreshCw, fallback: "Geen veranderingen geregistreerd — markt in continuïteit" },
              { l: "TE MONITOREN", v: snap.what_to_watch || snap.what_to_watch_next || snap.next_watchpoints, icon: Eye, fallback: "Volg regime-indicatoren en CB communicatie" },
              { l: "TRADING IMPLICATIES", v: snap.trading_implications, icon: Target, fallback: "Geen expliciete trading implicaties — wacht op regime-shift" },
            ].map(({ l, v, icon: Icon, fallback }) => (
              <DataCard key={l} className="px-3 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={13} className="text-label" />
                  <span className="text-[8px] text-label uppercase tracking-[0.08em] font-medium">{l}</span>
                </div>
                <div className="text-[11px] text-sub-text leading-relaxed">{textVal(v, fallback)}</div>
              </DataCard>
            ))}
          </div>

          {/* WEEKLY: next week focus */}
          {isWeekly && snap.next_week_focus && (
            <DataCard className="px-4 py-3 mt-3 border-l-[3px] border-l-purple-accent">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye size={11} className="text-purple-accent" />
                <span className="text-[8px] text-label uppercase tracking-wider font-medium">FOCUS VOLGENDE WEEK</span>
              </div>
              <div className="text-[12px] text-foreground font-semibold leading-relaxed">{snap.next_week_focus}</div>
            </DataCard>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
