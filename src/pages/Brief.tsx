import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val, textVal, MarkdownBlock, RiskChip, queryWithRetry, getBiasColor, safeText, renderDashboardText, formatLabel, parseWatchpoints, fmtDate } from "@/components/ui-helpers";
import {
  BookOpen, GitMerge, CheckCircle, XCircle, AlertTriangle,
  Eye, Target, Star, Building2,
  Zap, Sun, TrendingUp, TrendingDown, RefreshCw, Crosshair, BarChart3
} from "lucide-react";

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

const REGIME_MAP: Record<string, React.ElementType> = {
  energy_shock: Zap, stagflation: TrendingUp, goldilocks: Sun,
  reflation: RefreshCw, deflation: TrendingDown, mixed: GitMerge,
};
function regimeIcon(r: string | null) {
  const k = (r || "").toLowerCase().replace(/[\s-]/g, "_");
  for (const [key, I] of Object.entries(REGIME_MAP)) { if (k.includes(key)) return I; }
  return GitMerge;
}

/* ---- Shared section header ---- */
function SectionHead({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-label" />
      <span className="text-[0.7rem] text-label uppercase tracking-[0.08em] font-semibold">{label}</span>
    </div>
  );
}

/* ---- Spacer between sections ---- */
function Divider() {
  return <hr className="border-card-border my-8" />;
}

/** Brief content without DashboardLayout — used inline in DWM */
export function BriefContent() {
  const [tab, setTab] = useState<"daily"|"weekly"|"monthly"|"alignment">("daily");
  const [snap, setSnap] = useState<any>(null);
  const [al, setAl] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setSnap(null);
    setAl(null);
    if (tab === "alignment") {
      queryWithRetry(() => supabase.from("alignment_engine").select("*").order("alignment_date", { ascending: false }).limit(1), "Brief/alignment")
        .then(data => { setAl((data as any[])?.[0] || null); setLoaded(true); });
    } else {
      queryWithRetry(() => supabase.from("period_snapshots").select("*").eq("period_type", tab).order("period_start", { ascending: false }).limit(1), `Brief/${tab}`)
        .then(data => { setSnap((data as any[])?.[0] || null); setLoaded(true); });
    }
  }, [tab]);

  const tabs: Array<{ key: typeof tab; label: string; icon: React.ElementType }> = [
    { key: "daily", label: "Daily", icon: BookOpen },
    { key: "weekly", label: "Weekly", icon: BookOpen },
    { key: "monthly", label: "Monthly", icon: BookOpen },
    { key: "alignment", label: "Alignment", icon: GitMerge },
  ];

  return (
    <>
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded transition-colors ${
              t.key === tab ? "bg-purple-accent text-white" : "bg-secondary text-label hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-[760px] mx-auto pb-16">
        {!loaded ? (
          <div className="text-center text-label text-[14px] mt-16">Laden...</div>
        ) : tab === "alignment" ? (
          al ? <AlignmentBrief al={al} /> : <Empty label="alignment" />
        ) : (
          snap ? <PeriodBrief snap={snap} period={tab} /> : <Empty label={tab} />
        )}
      </div>
    </>
  );
}

export default function Brief() {
  return (
    <DashboardLayout>
      <BriefContent />
    </DashboardLayout>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center mt-16">
      <BookOpen size={28} className="mx-auto text-label mb-3" />
      <div className="text-[14px] text-label">Nog geen brief beschikbaar voor {label}</div>
    </div>
  );
}

/* ---- Prose wrapper for reading sections ---- */
function Prose({ children }: { children: React.ReactNode }) {
  return <div className="text-[15px] text-sub-text leading-[1.75]">{children}</div>;
}

/* ===================== PERIOD BRIEF ===================== */
function PeriodBrief({ snap, period }: { snap: any; period: string }) {
  const RegimeIcon = regimeIcon(snap.macro_regime);
  const convictionPct = snap.conviction_score ? Math.min(Math.max((snap.conviction_score / 10) * 100, 0), 100) : 0;

  const macroStory = renderDashboardText(snap.summary_micro) 
    || renderDashboardText(snap.summary_dashboard) 
    || renderDashboardText(snap.summary) 
    || "";

  const watchpoints = snap.what_to_watch || snap.what_to_watch_next || snap.next_watchpoints;

  return (
    <>
      {/* ── Meta line ── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-[12px] text-label">{fmtDate(snap.period_start)}</span>
        <span className="flex items-center gap-1 bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">
          <RegimeIcon size={11} /> {formatLabel(snap.macro_regime) || "—"}
        </span>
        <RiskChip regime={snap.risk_regime} />
        <div className="flex items-center gap-1.5">
          <span className="text-[16px] font-extrabold text-purple-accent font-mono">{val(snap.conviction_score)}</span>
          <span className="text-[11px] text-label">/10</span>
          <div className="w-[100px] h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-purple-accent" style={{ width: `${convictionPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── 1. HEADLINE ── */}
      <h2 className="text-[24px] font-bold text-foreground leading-snug mb-2">
        {safeText(textVal(snap.headline, "Nog geen headline beschikbaar"))}
      </h2>

      <Divider />

      {/* ── 2. MACRO STORY ── */}
      <SectionHead icon={BookOpen} label="Macro Story" />
      <Prose>
        <MarkdownBlock content={macroStory} fallback="Nog geen macro samenvatting beschikbaar" />
      </Prose>

      <Divider />

      {/* ── 3. CORE DRIVER + FLOW CHAIN ── */}
      <SectionHead icon={Crosshair} label="Core Driver" />
      <DataCard className="p-5 mb-4">
        <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-2">CORE DRIVER</div>
        <Prose><MarkdownBlock content={safeText(snap.core_driver)} /></Prose>
      </DataCard>
      {snap.flow_chain && (
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-2">FLOW CHAIN</div>
          <Prose><MarkdownBlock content={safeText(snap.flow_chain)} /></Prose>
        </DataCard>
      )}

      <Divider />

      {/* ── 4. CENTRAL BANK ── */}
      <SectionHead icon={Building2} label="Central Bank Narrative" />
      <Prose><MarkdownBlock content={safeText(snap.cb_narrative)} /></Prose>

      <Divider />

      {/* ── 5. WHAT CHANGED ── */}
      <SectionHead icon={RefreshCw} label="What Changed" />
      <Prose><MarkdownBlock content={safeText(snap.what_changed)} /></Prose>

      <Divider />

      {/* ── 6. SCENARIOS ── */}
      <SectionHead icon={GitMerge} label="Scenarios" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        {[
          { label: "BASIS", value: snap.scenario_base, borderColor: "#6B7280" },
          { label: "OPWAARTS", value: snap.scenario_upside, borderColor: "#16A34A" },
          { label: "NEERWAARTS", value: snap.scenario_downside, borderColor: "#DC2626" },
        ].map(s => (
          <DataCard key={s.label} className="p-4" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-2">{s.label}</div>
            <div className="text-[13px] text-sub-text leading-[1.75]"><MarkdownBlock content={safeText(s.value)} /></div>
          </DataCard>
        ))}
      </div>

      <Divider />

      {/* ── 7. FX BIAS ── */}
      <SectionHead icon={BarChart3} label="FX Bias" />
      <div className="flex flex-wrap gap-2 mb-2">
        {FX.map(code => {
          const bias = snap[`${code.toLowerCase()}_bias`];
          const color = getBiasColor(bias);
          return (
            <span key={code} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-card-border bg-card">
              <span className="text-[10px] text-label font-semibold uppercase">{code}</span>
              <span className="text-[10px] font-bold uppercase" style={{ color }}>{val(bias)}</span>
            </span>
          );
        })}
      </div>

      <Divider />

      {/* ── 8. ASSET VIEWS ── */}
      <SectionHead icon={TrendingUp} label="Asset Views" />
      <div className="grid grid-cols-2 gap-4 mb-2">
        {[
          { label: "GOLD", value: snap.gold_view },
          { label: "OIL", value: snap.oil_view },
          { label: "S&P 500", value: snap.spx_view },
          { label: "NASDAQ", value: snap.nasdaq_view },
        ].map(a => (
          <DataCard key={a.label} className="p-4">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-2">{a.label}</div>
            <div className="text-[13px] text-sub-text leading-[1.75]"><MarkdownBlock content={safeText(a.value)} /></div>
          </DataCard>
        ))}
      </div>

      <Divider />

      {/* ── 9. TRADING IMPLICATIONS ── */}
      <SectionHead icon={Target} label="Trading Implicaties" />
      <Prose><MarkdownBlock content={safeText(snap.trading_implications)} /></Prose>

      <Divider />

      {/* ── 10. KEY WATCHPOINTS — FIX 4: bullet list ── */}
      <SectionHead icon={Eye} label="Key Watchpoints" />
      {(() => {
        const items = parseWatchpoints(watchpoints);
        if (items.length > 0) {
          return (
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-accent mt-[5px] shrink-0">•</span>
                  <span className="text-[15px] text-sub-text leading-[1.75]">{safeText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <Prose><MarkdownBlock content={safeText(watchpoints)} /></Prose>;
      })()}

      {/* ── 11. FORWARD IMPLICATIONS (if present) ── */}
      {(snap.next_week_focus || snap.high_conviction_next_month || snap.key_developments) && (
        <>
          <Divider />
          <SectionHead icon={TrendingUp} label="Forward Implications" />
          <Prose>
            <MarkdownBlock content={safeText(snap.next_week_focus || snap.high_conviction_next_month || snap.key_developments)} />
          </Prose>
        </>
      )}
    </>
  );
}

/* ===================== ALIGNMENT BRIEF ===================== */
function AlignmentBrief({ al }: { al: any }) {
  const stateKey = (al.alignment_state || "").toLowerCase();
  const isAligned = stateKey === "aligned";
  const isConflict = stateKey.includes("conflict");
  const stateBg = isAligned ? "#F0FDF4" : isConflict ? "#FEF2F2" : "#FFFBEB";
  const stateColor = isAligned ? "#16A34A" : isConflict ? "#DC2626" : "#D97706";
  const StateIcon = isAligned ? CheckCircle : isConflict ? AlertTriangle : GitMerge;
  const convictionPct = al.conviction_score ? Math.min(Math.max((al.conviction_score / 10) * 100, 0), 100) : 0;

  // FIX 1 + 8: use renderDashboardText with fallback
  const rawStory = al.macro_story || al.summary_dashboard || al.summary;
  const macroStory = renderDashboardText(rawStory) || "";

  return (
    <>
      {/* ── State hero ── */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2.5 px-5 py-3 rounded-lg border" style={{ background: stateBg, borderColor: stateColor }}>
          <StateIcon size={24} style={{ color: stateColor }} />
          <span className="text-[24px] font-black uppercase tracking-wide" style={{ color: stateColor }}>{formatLabel(al.alignment_state) || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[18px] font-extrabold text-purple-accent font-mono">{val(al.conviction_score)}</span>
          <span className="text-[11px] text-label">/10</span>
          <div className="w-[120px] h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-purple-accent" style={{ width: `${convictionPct}%` }} />
          </div>
        </div>
        <span className="text-[12px] text-label ml-auto">{fmtDate(al.alignment_date)}</span>
      </div>

      <Divider />

      {/* ── 1. MACRO STORY ── */}
      <SectionHead icon={BookOpen} label="Macro Story" />
      <Prose>
        <MarkdownBlock content={macroStory} fallback="Nog geen macro verhaal beschikbaar" />
      </Prose>

      <Divider />

      {/* ── 2. CORE DRIVER + FLOW CHAIN ── */}
      <SectionHead icon={Crosshair} label="Core Driver" />
      <DataCard className="p-5 mb-4">
        <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-2">CORE DRIVER</div>
        <Prose><MarkdownBlock content={safeText(al.core_driver)} /></Prose>
      </DataCard>
      {al.flow_chain && (
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-2">FLOW CHAIN</div>
          <Prose><MarkdownBlock content={safeText(al.flow_chain)} /></Prose>
        </DataCard>
      )}

      <Divider />

      {/* ── 3. CENTRAL BANK ── */}
      <SectionHead icon={Building2} label="Central Bank Narrative" />
      <Prose><MarkdownBlock content={safeText(al.cb_alignment_narrative || al.cb_view)} /></Prose>

      <Divider />

      {/* ── 4. SCENARIOS ── */}
      <SectionHead icon={GitMerge} label="Scenarios" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        {[
          { label: "BASIS", value: al.scenario_base, borderColor: "#6B7280" },
          { label: "OPWAARTS", value: al.scenario_upside, borderColor: "#16A34A" },
          { label: "NEERWAARTS", value: al.scenario_downside, borderColor: "#DC2626" },
        ].map(s => (
          <DataCard key={s.label} className="p-4" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-2">{s.label}</div>
            <div className="text-[13px] text-sub-text leading-[1.75]"><MarkdownBlock content={safeText(s.value)} /></div>
          </DataCard>
        ))}
      </div>

      <Divider />

      {/* ── 5. DO / AVOID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
        <DataCard className="p-5" style={{ borderLeft: "3px solid #16A34A" }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={15} className="text-bullish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">WAT TE DOEN</span>
          </div>
          <Prose><MarkdownBlock content={safeText(al.what_to_do)} /></Prose>
        </DataCard>
        <DataCard className="p-5" style={{ borderLeft: "3px solid #DC2626" }}>
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={15} className="text-bearish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VERMIJD</span>
          </div>
          <Prose><MarkdownBlock content={safeText(al.what_to_avoid)} /></Prose>
        </DataCard>
      </div>

      <Divider />

      {/* ── 6. HIGH / LOW CONVICTION ASSETS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={15} className="text-bullish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">HOOG CONVICTION ASSETS</span>
          </div>
          <Prose><MarkdownBlock content={safeText(al.high_conviction_assets)} /></Prose>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <XCircle size={15} className="text-bearish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VERMIJD ASSETS</span>
          </div>
          <Prose><MarkdownBlock content={safeText(al.low_conviction_assets)} /></Prose>
        </div>
      </div>

      <Divider />

      {/* ── 7. ASSET VIEWS ── */}
      <SectionHead icon={TrendingUp} label="Asset Views" />
      <div className="grid grid-cols-2 gap-4 mb-2">
        {[
          { label: "GOLD", value: al.gold_view },
          { label: "OIL", value: al.oil_view },
          { label: "S&P 500", value: al.spx_view },
          { label: "VIX", value: al.vix_view },
        ].map(a => (
          <DataCard key={a.label} className="p-4">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-2">{a.label}</div>
            <div className="text-[13px] text-sub-text leading-[1.75]"><MarkdownBlock content={safeText(a.value)} /></div>
          </DataCard>
        ))}
      </div>

      <Divider />

      {/* ── 8. TRADING IMPLICATIONS ── */}
      <SectionHead icon={Target} label="Trading Implicaties" />
      <Prose><MarkdownBlock content={safeText(al.trading_implications)} /></Prose>

      <Divider />

      {/* ── 9. KEY WATCHPOINTS — FIX 4: bullet list ── */}
      <SectionHead icon={Eye} label="Key Watchpoints" />
      {(() => {
        const items = parseWatchpoints(al.key_watchpoints);
        if (items.length > 0) {
          return (
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-accent mt-[5px] shrink-0">•</span>
                  <span className="text-[15px] text-sub-text leading-[1.75]">{safeText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <Prose><MarkdownBlock content={safeText(al.key_watchpoints)} /></Prose>;
      })()}

      {/* ── 10. CONFLICTS (if present) ── */}
      {al.conflicts && (
        <>
          <Divider />
          <SectionHead icon={AlertTriangle} label="Conflicts" />
          <Prose><MarkdownBlock content={safeText(al.conflicts)} /></Prose>
        </>
      )}
    </>
  );
}
