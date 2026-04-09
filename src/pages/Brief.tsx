import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val, textVal, MarkdownBlock, RiskChip, queryWithRetry, getBiasColor } from "@/components/ui-helpers";
import {
  BookOpen, GitMerge, CheckCircle, XCircle, AlertTriangle,
  Eye, Target, Star,
  Zap, Sun, TrendingUp, TrendingDown, RefreshCw
} from "lucide-react";

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];
const MONTHS_NL = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
function fmtDate(v: any) {
  if (!v) return "—";
  try { const d = new Date(v); return isNaN(d.getTime()) ? String(v) : `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`; } catch { return String(v); }
}

const REGIME_MAP: Record<string, React.ElementType> = {
  energy_shock: Zap, stagflation: TrendingUp, goldilocks: Sun,
  reflation: RefreshCw, deflation: TrendingDown, mixed: GitMerge,
};
function regimeIcon(r: string | null) {
  const k = (r || "").toLowerCase().replace(/[\s-]/g, "_");
  for (const [key, I] of Object.entries(REGIME_MAP)) { if (k.includes(key)) return I; }
  return GitMerge;
}

export default function Brief() {
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
    <DashboardLayout>
      {/* Tab bar */}
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
                t.key === tab ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
              }`}>
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content area — reading-optimized max-width */}
      <div className="max-w-[780px] mx-auto">
        {!loaded ? (
          <div className="text-center text-label text-[14px] mt-16">Laden...</div>
        ) : tab === "alignment" ? (
          al ? <AlignmentBrief al={al} /> : <Empty label="alignment" />
        ) : (
          snap ? <PeriodBrief snap={snap} period={tab} /> : <Empty label={tab} />
        )}
      </div>
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

/* ===================== PERIOD BRIEF (Daily / Weekly / Monthly) ===================== */
function PeriodBrief({ snap, period }: { snap: any; period: string }) {
  const RegimeIcon = regimeIcon(snap.macro_regime);
  const convictionPct = snap.conviction_score ? Math.min(Math.max((snap.conviction_score / 10) * 100, 0), 100) : 0;

  return (
    <>
      {/* Date + regime line */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-[12px] text-label">{fmtDate(snap.period_start)}</span>
        <span className="flex items-center gap-1 bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">
          <RegimeIcon size={11} /> {val(snap.macro_regime)}
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

      {/* Headline */}
      <div className="flex items-start gap-2.5 mb-6">
        <BookOpen size={22} className="text-label mt-[2px] shrink-0" />
        <h1 className="text-[22px] font-bold text-foreground leading-snug">{textVal(snap.headline, "Nog geen headline beschikbaar")}</h1>
      </div>

      <hr className="border-card-border mb-6" />

      {/* Macro story */}
      <div className="text-[14px] text-sub-text leading-[1.75] mb-8">
        <MarkdownBlock content={snap.summary_micro || snap.summary_dashboard || snap.summary} fallback="Nog geen macro samenvatting beschikbaar" />
      </div>

      <hr className="border-card-border mb-6" />

      {/* Scenarios — compact row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "BASIS", value: snap.scenario_base, borderColor: "#6B7280" },
          { label: "OPWAARTS", value: snap.scenario_upside, borderColor: "#16A34A" },
          { label: "NEERWAARTS", value: snap.scenario_downside, borderColor: "#DC2626" },
        ].map(s => (
          <DataCard key={s.label} className="p-4" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-1.5">{s.label}</div>
            <div className="text-[12px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      {/* FX Bias pills */}
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">FX BIAS</div>
      <div className="flex flex-wrap gap-2 mb-8">
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

      <hr className="border-card-border mb-6" />

      {/* Watchpoints + Trading */}
      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Eye size={15} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">KEY WATCHPOINTS</span>
          </div>
          <div className="text-[13px] text-sub-text leading-[1.7]">
            <MarkdownBlock content={snap.what_to_watch || snap.what_to_watch_next || snap.next_watchpoints} />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={15} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">TRADING IMPLICATIES</span>
          </div>
          <div className="text-[13px] text-sub-text leading-[1.7]">
            <MarkdownBlock content={snap.trading_implications} />
          </div>
        </div>
      </div>
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

  return (
    <>
      {/* State hero */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2.5 px-5 py-3 rounded-lg border" style={{ background: stateBg, borderColor: stateColor }}>
          <StateIcon size={24} style={{ color: stateColor }} />
          <span className="text-[24px] font-black uppercase tracking-wide" style={{ color: stateColor }}>{val(al.alignment_state)}</span>
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

      <hr className="border-card-border mb-6" />

      {/* Macro story */}
      <div className="text-[14px] text-sub-text leading-[1.75] mb-8">
        <MarkdownBlock content={al.macro_story || al.summary_dashboard || al.summary} fallback="Nog geen macro verhaal beschikbaar" />
      </div>

      <hr className="border-card-border mb-6" />

      {/* Do / Avoid */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <DataCard className="p-5" style={{ borderLeft: "3px solid #16A34A" }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={15} className="text-bullish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">WAT TE DOEN</span>
          </div>
          <div className="text-[13px] text-sub-text leading-[1.7]">
            <MarkdownBlock content={al.what_to_do} />
          </div>
        </DataCard>
        <DataCard className="p-5" style={{ borderLeft: "3px solid #DC2626" }}>
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={15} className="text-bearish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VERMIJD</span>
          </div>
          <div className="text-[13px] text-sub-text leading-[1.7]">
            <MarkdownBlock content={al.what_to_avoid} />
          </div>
        </DataCard>
      </div>

      <hr className="border-card-border mb-6" />

      {/* High conviction / Avoid assets */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={15} className="text-bullish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">HOOG CONVICTION ASSETS</span>
          </div>
          <div className="text-[13px] text-sub-text leading-[1.7]">
            <MarkdownBlock content={al.high_conviction_assets} />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <XCircle size={15} className="text-bearish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VERMIJD ASSETS</span>
          </div>
          <div className="text-[13px] text-sub-text leading-[1.7]">
            <MarkdownBlock content={al.low_conviction_assets} />
          </div>
        </div>
      </div>

      <hr className="border-card-border mb-6" />

      {/* Watchpoints */}
      <div className="flex items-center gap-1.5 mb-3">
        <Eye size={15} className="text-label" />
        <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">KEY WATCHPOINTS</span>
      </div>
      <div className="text-[13px] text-sub-text leading-[1.7]">
        <MarkdownBlock content={al.key_watchpoints} />
      </div>
    </>
  );
}
