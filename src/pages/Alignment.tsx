import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, BiasChip, MarkdownBlock, queryWithRetry, getBiasColor, safeText, formatLabel, parseWatchpoints, fmtDate } from "@/components/ui-helpers";
import {
  GitMerge, CheckCircle, XCircle, TrendingUp, AlertTriangle,
  DollarSign, BookOpen, Star, Eye, Target, GitCommit,
  Flame, Building2, Droplets, ChevronRight, ChevronDown, ChevronUp,
  Shield, ArrowRightLeft, Clock
} from "lucide-react";
import RegimeTimelineContent from "@/components/content/RegimeTimelineContent";

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

// fmtDate imported from ui-helpers

function getViewBias(text: string | null): string {
  const t = (text || "").toLowerCase();
  if (t.includes("bullish") || t === "bullish") return "bullish";
  if (t.includes("licht bullish")) return "licht bullish";
  if (t.includes("bearish") || t === "bearish") return "bearish";
  if (t.includes("licht bearish")) return "licht bearish";
  if (t.includes("niet relevant")) return "niet relevant";
  if (t.includes("mixed")) return "mixed";
  if (t.includes("neutraal")) return "neutraal";
  return "neutral";
}

function convictionColor(score: number | null) {
  if (!score) return "#6B7280";
  if (score >= 8) return "#16A34A";
  if (score >= 5) return "#D97706";
  return "#DC2626";
}

function alignmentBorder(state: string | null) {
  const s = (state || "").toLowerCase();
  if (s === "aligned") return "#16A34A";
  if (s.includes("conflict")) return "#DC2626";
  if (s.includes("transition")) return "#7C3AED";
  return "#D97706"; // mixed default
}

function alignmentBg(state: string | null) {
  const s = (state || "").toLowerCase();
  if (s === "aligned") return "#F0FDF4";
  if (s.includes("conflict")) return "#FEF2F2";
  if (s.includes("transition")) return "#FAF5FF";
  return "#FFFBEB";
}

function alignmentIcon(state: string | null) {
  const s = (state || "").toLowerCase();
  if (s === "aligned") return CheckCircle;
  if (s.includes("conflict")) return AlertTriangle;
  if (s.includes("transition")) return ArrowRightLeft;
  return GitMerge;
}

/** Timeframe card background based on content */
function timeframeBg(text: string | null) {
  const t = (text || "").toLowerCase();
  if (t.includes("conflict") || t.includes("divergen")) return { bg: "#FFFBEB", border: "#D97706" };
  if (t.includes("aligned") || t.includes("consistent") || t.includes("convergent")) return { bg: "#F0FDF4", border: "#16A34A" };
  return { bg: "#F9FAFB", border: "#E5E7EB" };
}

/** Parse chips from comma/newline separated text */
function parseChips(text: string | null): string[] {
  if (!text) return [];
  return text.split(/[,\n•\-]/).map(s => safeText(s)).filter(s => s.length > 2);
}

/** Parse currency ranking to get order */
function parseCurrencyRanking(ranking: string | null): string[] {
  if (!ranking) return FX;
  const matches = ranking.match(/([A-Z]{3})/g);
  if (!matches || matches.length < 2) return FX;
  const unique = [...new Set(matches)].filter(c => FX.includes(c));
  FX.forEach(c => { if (!unique.includes(c)) unique.push(c); });
  return unique;
}

export default function Alignment() {
  const navigate = useNavigate();
  const [al, setAl] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"alignment" | "timeline">("alignment");

  useEffect(() => {
    queryWithRetry(() => supabase.from("alignment_engine").select("*").order("alignment_date", { ascending: false }).limit(1), "Alignment/alignment_engine")
      .then(data => { setAl((data as any[])?.[0] || null); setLoaded(true); });
  }, []);

  return (
    <DashboardLayout>
      {/* Tab bar */}
      <div className="bg-card border-b border-card-border px-4 md:px-7 flex overflow-x-auto -mx-4 md:-mx-7 -mt-4 md:-mt-7 mb-5">
        {[
          { key: "alignment" as const, label: "Alignment", icon: GitMerge },
          { key: "timeline" as const, label: "Regime Timeline", icon: Clock },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${
                t.key === activeTab ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
              }`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "timeline" ? (
        <RegimeTimelineContent />
      ) : (
        <>
          {loaded && !al ? <div className="text-center text-label text-[13px] mt-10">Nog geen data beschikbaar</div> : !al ? <div className="text-center text-label text-[13px] mt-10">Laden...</div> : (
            <AlignmentContent al={al} navigate={navigate} storyOpen={storyOpen} setStoryOpen={setStoryOpen} />
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function AlignmentContent({ al, navigate, storyOpen, setStoryOpen }: { al: any; navigate: any; storyOpen: boolean; setStoryOpen: (v: boolean) => void }) {

  const stateColor = alignmentBorder(al.alignment_state);
  const stateBg = alignmentBg(al.alignment_state);
  const StateIcon = alignmentIcon(al.alignment_state);
  const convictionPct = al.conviction_score ? Math.min(Math.max((al.conviction_score / 10) * 100, 0), 100) : 0;

  // Flow chain steps
  const flowSteps = al.flow_chain ? al.flow_chain.split(/→|->|➜/).map((s: string) => safeText(s)).filter(Boolean) : [];

  // Currency order
  const orderedFx = parseCurrencyRanking(al.currency_ranking);

  // High conviction & avoid chips
  const highChips = parseChips(al.high_conviction_assets);
  const avoidChips = parseChips(al.low_conviction_assets || al.what_to_avoid);

  return (
    <>
      {/* 1. ALIGNMENT STATE HEADER */}
      <DataCard className="px-4 py-3 mb-3" style={{ borderLeft: `4px solid ${stateColor}` }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: stateBg }}>
            <StateIcon size={20} style={{ color: stateColor }} />
            <span className="text-[20px] font-black uppercase tracking-wide" style={{ color: stateColor }}>{formatLabel(al.alignment_state) || "—"}</span>
          </div>
          <span className="text-[11px] text-label">{fmtDate(al.alignment_date)}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[24px] font-extrabold font-mono" style={{ color: convictionColor(al.conviction_score) }}>
              {val(al.conviction_score)}
            </span>
            <span className="text-[11px] text-label">/10</span>
            <div className="w-[120px] h-[3px] bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${convictionPct}%`, backgroundColor: convictionColor(al.conviction_score) }} />
            </div>
          </div>
        </div>
        {al.risk_sentiment && (
          <div className="text-[11px] text-sub-text italic mt-1.5">{safeText(al.risk_sentiment)}</div>
        )}
        {al.summary_micro && (
          <div className="text-[12px] text-foreground mt-1 leading-relaxed max-w-[720px]">{safeText(al.summary_micro)}</div>
        )}
      </DataCard>

      {/* 2. MACRO VERHAAL — layered */}
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5"><BookOpen size={12} className="text-label" /> MACRO VERHAAL</span>
      </SectionLabel>

      {/* Layer 1: core driver */}
      {al.core_driver && (
        <DataCard className="px-4 py-3 mb-2 border-l-[3px]" style={{ borderLeftColor: "#C4673A" }}>
          <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-0.5">CORE DRIVER</div>
          <div className="text-[13px] text-foreground font-bold leading-snug">{safeText(al.core_driver)}</div>
        </DataCard>
      )}

      {/* Layer 2: flow chain strip */}
      {flowSteps.length >= 2 && (
        <DataCard className="px-4 py-3 mb-2">
          <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1.5">TRANSMISSIEKETEN</div>
          <div className="flex items-center gap-1 flex-wrap">
            {flowSteps.map((step: string, i: number) => (
              <div key={i} className="flex items-center gap-1">
                <span className="bg-secondary text-foreground text-[10px] font-semibold px-2.5 py-1 rounded">{step}</span>
                {i < flowSteps.length - 1 && <ChevronRight size={12} className="text-label shrink-0" />}
              </div>
            ))}
          </div>
        </DataCard>
      )}

      {/* Layer 3: collapsible macro story */}
      {al.macro_story && (
        <div className="mb-4">
          <button onClick={() => setStoryOpen(!storyOpen)}
            className="flex items-center gap-1.5 text-[10px] text-purple-accent font-semibold uppercase tracking-wider mb-1 hover:text-foreground transition-colors">
            {storyOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {storyOpen ? "VERBERG VOLLEDIG VERHAAL" : "TOON VOLLEDIG VERHAAL"}
          </button>
          {storyOpen && (
            <div className="bg-secondary border border-card-border rounded-lg p-4">
              <div className="max-w-[720px] text-[13px] text-sub-text leading-[1.7]">
                <MarkdownBlock content={safeText(al.macro_story)} />
              </div>
            </div>
          )}
        </div>
      )}

      <hr className="border-card-border mb-4" />

      {/* 3. TIMEFRAME VERGELIJKING */}
      <SectionLabel>TIMEFRAME VERGELIJKING</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {[
          { label: "DAILY VS WEEKLY", value: al.daily_vs_weekly },
          { label: "WEEKLY VS MONTHLY", value: al.weekly_vs_monthly },
        ].map(({ label, value }) => {
          const tf = timeframeBg(value);
          return (
            <DataCard key={label} className="px-4 py-3" style={{ backgroundColor: tf.bg, borderColor: tf.border }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <GitCommit size={13} className="text-label" />
                <span className="text-[8px] text-label uppercase tracking-wider font-medium">{label}</span>
              </div>
              <div className="text-[11px] text-sub-text leading-relaxed">{safeText(textVal(value, "Geen vergelijkingsdata beschikbaar"))}</div>
            </DataCard>
          );
        })}
      </div>

      <hr className="border-card-border mb-4" />

      {/* 4. MACRO PILAREN */}
      <SectionLabel>MACRO PILAREN</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: "GROEI", alignment: al.growth_alignment, view: al.growth_view, icon: TrendingUp },
          { label: "INFLATIE", alignment: al.inflation_alignment, view: al.inflation_view, icon: Flame },
          { label: "CENTRALE BANK", alignment: al.cb_alignment_narrative, view: al.cb_view, icon: Building2 },
          { label: "LIQUIDITEIT", alignment: al.liquidity_alignment, view: al.liquidity_view, icon: Droplets },
        ].map(({ label, alignment, view, icon: Icon }) => {
          const displayValue = alignment || view;
          const bias = getViewBias(displayValue);
          return (
            <DataCard key={label} className="px-3 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={13} className="text-label" />
                <span className="text-[8px] text-label uppercase tracking-wider font-medium">{label}</span>
                <div className="ml-auto"><BiasChip bias={bias} /></div>
              </div>
              <div className="text-[11px] text-sub-text leading-relaxed">{safeText(textVal(displayValue))}</div>
            </DataCard>
          );
        })}
      </div>

      <hr className="border-card-border mb-4" />

      {/* 5 & 6. HIGH CONVICTION / VERMIJD — chip-based */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <DataCard className="px-4 py-3" style={{ borderLeft: "3px solid #16A34A" }}>
          <div className="flex items-center gap-2 mb-2">
            <Star size={13} className="text-bullish-text" />
            <span className="text-[8px] text-label uppercase tracking-wider font-medium">HOOG CONVICTION</span>
          </div>
          {highChips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {highChips.map((chip, i) => (
                <span key={i} className="bg-bullish-bg text-bullish-text px-2.5 py-1 text-[10px] font-semibold rounded">{chip}</span>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-sub-text">{safeText(textVal(al.high_conviction_assets))}</div>
          )}
        </DataCard>
        <DataCard className="px-4 py-3" style={{ borderLeft: "3px solid #DC2626" }}>
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={13} className="text-bearish-text" />
            <span className="text-[8px] text-label uppercase tracking-wider font-medium">VERMIJD</span>
          </div>
          {avoidChips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {avoidChips.map((chip, i) => (
                <span key={i} className="bg-bearish-bg text-bearish-text px-2.5 py-1 text-[10px] font-semibold rounded">{chip}</span>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-sub-text">{safeText(textVal(al.low_conviction_assets || al.what_to_avoid))}</div>
          )}
        </DataCard>
      </div>

      {/* WAT TE DOEN / VERMIJD narratief */}
      {(al.what_to_do || al.what_to_avoid) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <DataCard className="px-4 py-3" style={{ borderLeft: "3px solid #16A34A" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle size={13} className="text-bullish-text" />
              <span className="text-[8px] text-label uppercase tracking-wider font-medium">WAT TE DOEN</span>
            </div>
            <div className="text-[11px] text-sub-text leading-relaxed">{safeText(textVal(al.what_to_do, "Zie macro verhaal voor positioneringsrichting"))}</div>
          </DataCard>
          <DataCard className="px-4 py-3" style={{ borderLeft: "3px solid #DC2626" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <XCircle size={13} className="text-bearish-text" />
              <span className="text-[8px] text-label uppercase tracking-wider font-medium">TE VERMIJDEN</span>
            </div>
            <div className="text-[11px] text-sub-text leading-relaxed">{safeText(textVal(al.what_to_avoid, "Geen specifieke risico's geïdentificeerd"))}</div>
          </DataCard>
        </div>
      )}

      <hr className="border-card-border mb-4" />

      {/* 7. CURRENCY VIEWS — 2x4 grid ranked */}
      <SectionLabel>CURRENCY VIEWS</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {orderedFx.map((c, idx) => {
          const view = al?.[`${c.toLowerCase()}_view`];
          const bias = getViewBias(view);
          return (
            <DataCard key={c} className="px-3 py-3 cursor-pointer hover:border-purple-accent/30 transition-colors" onClick={() => navigate(`/currencies/${c}`)}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[7px] text-label font-mono">#{idx + 1}</span>
                <span className="text-[16px] font-black text-foreground">{c}</span>
                <div className="ml-auto"><BiasChip bias={bias} /></div>
              </div>
              <div className="text-[10px] text-sub-text leading-relaxed">{safeText(textVal(view, "Geen specifieke view"))}</div>
            </DataCard>
          );
        })}
      </div>

      <hr className="border-card-border mb-4" />

      {/* 8. SCENARIOS */}
      <SectionLabel>SCENARIO'S</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {[
          { label: "BASIS", value: al.scenario_base, borderColor: "#6B7280" },
          { label: "OPWAARTS", value: al.scenario_upside, borderColor: "#16A34A" },
          { label: "NEERWAARTS", value: al.scenario_downside, borderColor: "#DC2626" },
        ].map((s) => (
          <DataCard key={s.label} className="px-4 py-3" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
            <div className="text-[8px] text-label uppercase tracking-[0.08em] mb-1.5 font-medium">{s.label}</div>
            <div className="text-[11px] text-sub-text leading-relaxed">
              {safeText(textVal(s.value, "Zie daily brief voor scenario context."))}
            </div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-4" />

      {/* 9. MONITORING & ACTIE */}
      <SectionLabel>MONITORING & ACTIE</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DataCard className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye size={13} className="text-label" />
            <span className="text-[8px] text-label uppercase tracking-wider font-medium">KEY WATCHPOINTS</span>
          </div>
          {/* FIX 4: bullet list for watchpoints */}
          {(() => {
            const items = parseWatchpoints(al.key_watchpoints);
            return items.length > 0 ? (
              <ul className="space-y-1">
                {items.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-accent mt-[3px] shrink-0">•</span>
                    <span className="text-[11px] text-sub-text leading-relaxed">{safeText(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[11px] text-sub-text leading-relaxed">{safeText(textVal(al.key_watchpoints, "Volg regime-indicatoren en CB communicatie"))}</div>
            );
          })()}
        </DataCard>
        <DataCard className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Target size={13} className="text-label" />
            <span className="text-[8px] text-label uppercase tracking-wider font-medium">TRADING IMPLICATIES</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">
            {safeText(textVal(al.trading_implications, "Positioneer conform macro regime — geen specifieke trade calls beschikbaar"))}
          </div>
        </DataCard>
      </div>
    </>
  );
}
