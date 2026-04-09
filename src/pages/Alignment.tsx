import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, MarkdownBlock, queryWithRetry, getBiasColor } from "@/components/ui-helpers";
import {
  GitMerge, CheckCircle, XCircle, TrendingUp, AlertTriangle,
  DollarSign, BookOpen, Star, Eye, Target, GitCommit,
  Flame, Building2, Droplets
} from "lucide-react";

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

const MONTHS_NL = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
function fmtDate(v: any) {
  if (!v) return "—";
  try { const d = new Date(v); return isNaN(d.getTime()) ? String(v) : `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`; } catch { return String(v); }
}

function getViewBiasColor(text: string | null) {
  const t = (text || "").toLowerCase();
  if (t.includes("bullish")) return "#16A34A";
  if (t.includes("bearish")) return "#DC2626";
  return "#6B7280";
}

export default function Alignment() {
  const navigate = useNavigate();
  const [al, setAl] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queryWithRetry(() => supabase.from("alignment_engine").select("*").order("alignment_date", { ascending: false }).limit(1), "Alignment/alignment_engine")
      .then(data => { setAl((data as any[])?.[0] || null); setLoaded(true); });
  }, []);

  if (loaded && !al) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Nog geen data beschikbaar</div></DashboardLayout>;
  if (!al) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Laden...</div></DashboardLayout>;

  const stateKey = (al.alignment_state || "").toLowerCase();
  const isAligned = stateKey === "aligned";
  const isConflict = stateKey.includes("conflict");
  const stateBg = isAligned ? "#F0FDF4" : isConflict ? "#FEF2F2" : "#FFFBEB";
  const stateColor = isAligned ? "#16A34A" : isConflict ? "#DC2626" : "#D97706";
  const StateBorder = isAligned ? "#16A34A" : isConflict ? "#DC2626" : "#D97706";
  const StateIcon = isAligned ? CheckCircle : isConflict ? AlertTriangle : GitMerge;
  const convictionPct = al.conviction_score ? Math.min(Math.max((al.conviction_score / 10) * 100, 0), 100) : 0;

  return (
    <DashboardLayout>
      {/* 1. ALIGNMENT STATE HERO */}
      <div className="flex items-center gap-5 mb-6">
        <div className="flex items-center gap-3 px-6 py-4 rounded-lg border" style={{ background: stateBg, borderColor: stateColor }}>
          <StateIcon size={28} style={{ color: stateColor }} />
          <span className="text-[28px] font-black uppercase tracking-wide" style={{ color: stateColor }}>{val(al.alignment_state)}</span>
        </div>
        <div className="text-[12px] text-label">{fmtDate(al.alignment_date)}</div>
      </div>

      {/* 2. CONVICTION */}
      <DataCard className="p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">CONVICTION</div>
          <span className="text-[32px] font-black text-purple-accent font-mono leading-none">{val(al.conviction_score)}</span>
          <span className="text-[14px] text-label">/10</span>
          <div className="w-[200px] h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-purple-accent transition-all" style={{ width: `${convictionPct}%` }} />
          </div>
          <div className="ml-auto text-[11px] text-sub-text">{textVal(al.core_driver, "—")}</div>
        </div>
      </DataCard>

      <hr className="border-card-border mb-6" />

      {/* 3. MACRO STORY */}
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5"><BookOpen size={13} className="text-label" /> MACRO VERHAAL</span>
      </SectionLabel>
      <div className="bg-secondary border border-card-border rounded-lg p-5 mb-8">
        <div className="max-w-[720px] text-[13px] text-sub-text" style={{ lineHeight: 1.6 }}>
          <MarkdownBlock content={al.macro_story || al.summary_dashboard || al.summary_micro || al.summary} />
        </div>
      </div>

      <hr className="border-card-border mb-6" />

      {/* 4. WAT TE DOEN / VERMIJD */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5" style={{ borderLeft: "3px solid #16A34A" }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-bullish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">WAT TE DOEN</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al.what_to_do)}</div>
        </DataCard>
        <DataCard className="p-5" style={{ borderLeft: "3px solid #DC2626" }}>
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={14} className="text-bearish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VERMIJD</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al.what_to_avoid)}</div>
        </DataCard>
      </div>

      <hr className="border-card-border mb-6" />

      {/* 5. DAILY VS WEEKLY / WEEKLY VS MONTHLY */}
      <SectionLabel>TIMEFRAME VERGELIJKING</SectionLabel>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <GitCommit size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">DAILY VS WEEKLY</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al.daily_vs_weekly)}</div>
        </DataCard>
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <GitCommit size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">WEEKLY VS MONTHLY</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al.weekly_vs_monthly)}</div>
        </DataCard>
      </div>

      <hr className="border-card-border mb-6" />

      {/* 6. MACRO PILLARS */}
      <SectionLabel>MACRO PILAREN</SectionLabel>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "GROEI", value: al.growth_alignment || al.growth_view, icon: TrendingUp },
          { label: "INFLATIE", value: al.inflation_alignment || al.inflation_view, icon: Flame },
          { label: "CENTRALE BANK", value: al.cb_alignment_narrative || al.cb_view, icon: Building2 },
          { label: "LIQUIDITEIT", value: al.liquidity_alignment || al.liquidity_view, icon: Droplets },
        ].map(({ label, value, icon: Icon }) => (
          <DataCard key={label} className="p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={14} className="text-label" />
              <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">{label}</span>
            </div>
            <div className="text-[11px] text-sub-text leading-relaxed">{textVal(value)}</div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      {/* 7. HIGH CONVICTION / LOW CONVICTION */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5" style={{ borderLeft: "3px solid #16A34A" }}>
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-bullish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">HOOG CONVICTION</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al.high_conviction_assets)}</div>
        </DataCard>
        <DataCard className="p-5" style={{ borderLeft: "3px solid #DC2626" }}>
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={14} className="text-bearish-text" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VERMIJD</span>
          </div>
          <div className="text-[11px] text-sub-text leading-relaxed">{textVal(al.low_conviction_assets || al.what_to_avoid)}</div>
        </DataCard>
      </div>

      <hr className="border-card-border mb-6" />

      {/* 8. CURRENCY VIEWS */}
      <SectionLabel>CURRENCY VIEWS</SectionLabel>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {FX.map((c) => {
          const view = al?.[`${c.toLowerCase()}_view`];
          const dotColor = getViewBiasColor(view);
          return (
            <DataCard key={c} className="p-5" onClick={() => navigate(`/currencies/${c}`)}>
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign size={12} className="text-label" />
                <span className="text-[11px] font-bold uppercase" style={{ color: dotColor }}>{c}</span>
              </div>
              <div className="text-[11px] text-sub-text leading-snug">{textVal(view)}</div>
            </DataCard>
          );
        })}
      </div>

      <hr className="border-card-border mb-6" />

      {/* 9. SCENARIOS */}
      <SectionLabel>SCENARIO'S</SectionLabel>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "BASIS", value: al.scenario_base, borderColor: "#6B7280" },
          { label: "OPWAARTS", value: al.scenario_upside, borderColor: "#16A34A" },
          { label: "NEERWAARTS", value: al.scenario_downside, borderColor: "#DC2626" },
        ].map((s) => (
          <DataCard key={s.label} className="p-5" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2 font-medium">{s.label}</div>
            <div className="text-[11px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      {/* 10. WATCHPOINTS + TRADING */}
      <SectionLabel>MONITORING & ACTIE</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Eye size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">KEY WATCHPOINTS</span>
          </div>
          <MarkdownBlock content={al.key_watchpoints} />
        </DataCard>
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">TRADING IMPLICATIES</span>
          </div>
          <MarkdownBlock content={al.trading_implications} />
        </DataCard>
      </div>
    </DashboardLayout>
  );
}
