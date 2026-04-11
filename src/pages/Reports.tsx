import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, BiasChip, RiskChip, MarkdownBlock, fmtDate, queryWithRetry, getBiasColor, safeText, renderDashboardText, formatLabel, parseWatchpoints } from "@/components/ui-helpers";
import {
  FileText, DollarSign, Package, BarChart2, Percent,
  Building2, Target, Eye, RefreshCw, ArrowRightLeft, ArrowRight,
  Zap, Sun, TrendingUp, TrendingDown, GitMerge
} from "lucide-react";

const ASSET_CLASS_ICONS: Record<string, React.ElementType> = {
  fx: DollarSign, currency: DollarSign, commodity: Package, equity: BarChart2, rates: Percent,
};

const FX = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

const REGIME_ICONS: Record<string, React.ElementType> = {
  energy_shock: Zap, stagflation: TrendingUp, goldilocks: Sun,
  reflation: RefreshCw, deflation: TrendingDown, mixed: GitMerge,
};
const REGIME_COLORS: Record<string, { bg: string; text: string }> = {
  energy_shock: { bg: "#FFFBEB", text: "#D97706" },
  stagflation: { bg: "#FEF2F2", text: "#DC2626" },
  reflation: { bg: "#F0FDF4", text: "#16A34A" },
  goldilocks: { bg: "#F0FDF4", text: "#16A34A" },
  deflation: { bg: "#FEF2F2", text: "#DC2626" },
  mixed: { bg: "#F5F5F5", text: "#6B7280" },
};

function getRegimeIcon(regime: string | null) {
  const r = (regime || "").toLowerCase().replace(/[\s-]/g, "_");
  for (const [k, I] of Object.entries(REGIME_ICONS)) { if (r.includes(k)) return I; }
  return GitMerge;
}
function getRegimeStyle(regime: string | null) {
  const r = (regime || "").toLowerCase().replace(/[\s-]/g, "_");
  for (const [k, s] of Object.entries(REGIME_COLORS)) { if (r.includes(k)) return s; }
  return { bg: "#F5F5F5", text: "#6B7280" };
}

/** Replace "no specific information" reasons with a proper fallback */
function cleanReason(code: string, bias: string | null, reason: string | null): string {
  const r = (reason || "").toLowerCase();
  if (!reason || reason.trim() === "" || reason === "null" || r.includes("no specific information") || r.includes("no information")) {
    const b = (bias || "neutral").toLowerCase();
    return `${code}: ${b} — geen divergentie vs USD gedetecteerd (low conviction)`;
  }
  return reason;
}
function cleanAssetReason(asset: string, bias: string | null, reason: string | null): string {
  const r = (reason || "").toLowerCase();
  if (!reason || reason.trim() === "" || reason === "null" || r.includes("no specific information") || r.includes("no information")) {
    const b = (bias || "neutral").toLowerCase();
    return `${asset}: ${b} — geen directe driver in dit rapport (low conviction)`;
  }
  return reason;
}

function StatusTag({ label, status }: { label: string; status: string | null }) {
  const s = (status || "").toLowerCase();
  const isProcessing = s === "processing";
  const color = s === "complete" || s === "processed" ? "text-bullish-text bg-bullish-bg" :
    isProcessing ? "text-mixed-text bg-mixed-bg" :
    s === "pending" ? "text-neutral-text bg-neutral-bg" : "text-neutral-text bg-neutral-bg";
  return (
    <span className={`${color} px-1.5 py-[1px] text-[8px] rounded font-semibold uppercase inline-flex items-center gap-1`}>
      {isProcessing && <span className="w-[5px] h-[5px] rounded-full bg-mixed-text animate-pulse" />}
      {label}: {val(status)}
    </span>
  );
}

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<any[]>([]);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [biasData, setBiasData] = useState<any[]>([]);
  const [tab, setTab] = useState<"compact"|"dashboard"|"volledig">("compact");

  useEffect(() => {
    queryWithRetry(() =>
      supabase.from("v_reports_latest").select("*")
        .order("report_date", { ascending: false }).limit(50),
      "Reports/list"
    ).then((data) => {
      setReports((data as any[]) || []);
    });
    const idParam = searchParams.get("id");
    if (idParam) setActiveReportId(Number(idParam));
  }, []);

  const selectReport = (id: number) => {
    setActiveReportId(id);
    setTab("compact");
    setSearchParams({ id: String(id) });
  };

  useEffect(() => {
    if (!activeReportId) { setDetail(null); setBiasData([]); return; }
    // Find analysis_id from reports list
    const report = reports.find(r => r.id === activeReportId || r.analysis_id === activeReportId);
    const analysisId = report?.analysis_id || activeReportId;
    Promise.all([
      queryWithRetry(() => supabase.from("report_analysis").select("*").eq("id", analysisId).limit(1), "Reports/detail"),
      queryWithRetry(() => supabase.from("entity_bias").select("*").eq("context_id", String(analysisId)).eq("context_type", "report").order("entity_class"), "Reports/entity_bias"),
    ]).then(([d, b]) => {
      setDetail((d as any[])?.[0] || null);
      setBiasData((b as any[]) || []);
    });
  }, [activeReportId, reports]);

  const RegimeIcon = detail ? getRegimeIcon(detail.macro_regime) : GitMerge;
  const convictionPct = detail?.confidence_score ? Math.min(Math.max((detail.confidence_score / 10) * 100, 0), 100) : 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row -mx-4 md:-mx-7 -mt-4 md:-mt-7 min-h-screen">
        {/* LEFT PANEL — Report List */}
        <div className={`w-full md:w-[300px] md:min-w-[300px] bg-card border-b md:border-b-0 md:border-r border-card-border md:h-screen overflow-y-auto md:sticky md:top-0 ${activeReportId ? "hidden md:block" : ""}`}>
          <div className="px-5 py-3 border-b border-card-border flex items-center gap-2">
            <FileText size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">RAPPORTEN</span>
            <span className="ml-auto text-[9px] text-label font-mono">{reports.length}</span>
          </div>
          {reports.length === 0 && <div className="p-5 text-center text-[11px] text-label">Nog geen rapporten gevonden</div>}
          {reports.map((r) => {
            const rId = r.analysis_id || r.id;
            const regimeStyle = getRegimeStyle(r.macro_regime);
            return (
              <div key={rId}
                className={`px-5 py-3 border-b border-card-border cursor-pointer transition-colors ${
                  rId === activeReportId ? "bg-secondary border-l-[3px] border-l-purple-accent" : "hover:bg-secondary"
                }`}
                onClick={() => selectReport(rId)}
              >
                <div className="flex items-center gap-1.5">
                  <FileText size={11} className="text-label shrink-0" />
                  <span className="text-[11px] text-foreground font-medium leading-snug truncate flex-1">
                    {val(r.title || r.summary_ultra_short || `Rapport #${rId}`)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-1.5 py-[1px] text-[8px] rounded uppercase font-semibold" style={{ backgroundColor: regimeStyle.bg, color: regimeStyle.text }}>
                    {val(r.macro_regime)}
                  </span>
                  {r.confidence_score != null && (
                    <span className="bg-purple-accent/10 text-purple-accent px-1.5 py-[1px] text-[8px] rounded font-mono font-bold">{r.confidence_score}/10</span>
                  )}
                  <span className="ml-auto text-[9px] text-label">{fmtDate(r.report_date || r.analysis_date)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT PANEL — Report Detail */}
        <div className="flex-1 p-4 md:p-7 overflow-y-auto">
          {!activeReportId ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-10 md:py-0">
              <FileText size={32} className="text-label" />
              <span className="text-[13px] text-label">Selecteer een rapport uit de lijst</span>
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center h-full text-[13px] text-label">Laden...</div>
          ) : (
            <>
              {/* Mobile back button */}
              <button
                className="md:hidden flex items-center gap-1 text-[11px] text-purple-accent font-semibold mb-3"
                onClick={() => { setActiveReportId(null); setSearchParams({}); }}
              >
                ← Terug naar lijst
              </button>
              {/* HEADER */}
              <div className="mb-2">
                <div className="text-[18px] font-bold text-foreground leading-snug">{val(detail.title)}</div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] text-label">{fmtDate(detail.analysis_date)}</span>
                  {(() => {
                    const rs = getRegimeStyle(detail.macro_regime);
                    return (
                      <span className="flex items-center gap-1 px-2 py-[2px] text-[9px] rounded uppercase font-semibold" style={{ backgroundColor: rs.bg, color: rs.text }}>
                        <RegimeIcon size={11} /> {formatLabel(detail.macro_regime) || "—"}
                      </span>
                    );
                  })()}
                  <RiskChip regime={detail.risk_regime} />
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[18px] font-extrabold text-purple-accent font-mono">{val(detail.confidence_score)}</span>
                    <span className="text-[11px] text-label">/10</span>
                    <div className="w-[120px] h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-purple-accent transition-all" style={{ width: `${convictionPct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-[12px] text-sub-text mt-2">{safeText(textVal(detail.core_driver, "—"))}</div>
              </div>

              {/* 5. METADATA BAR */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-[8px] text-label bg-neutral-bg px-1.5 py-[1px] rounded font-mono">v: {val(detail.workflow_version)}</span>
                <StatusTag label="P1" status={detail.pass1_status} />
                <StatusTag label="P2" status={detail.pass2_status} />
                {detail.status && <StatusTag label="Status" status={detail.status} />}
              </div>

              {/* TABS */}
              <div className="bg-card border-b border-card-border flex mb-0 rounded-t-lg">
                {([["Compact","compact"],["Dashboard","dashboard"],["Volledig","volledig"]] as const).map(([label, key]) => (
                  <button key={key} onClick={() => setTab(key as any)}
                    className={`px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
                      key === tab ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
                    }`}>{label}</button>
                ))}
              </div>

              {/* TAB CONTENT */}
              <DataCard className="p-5 rounded-t-none mb-6">
                {tab === "compact" && <CompactTab detail={detail} />}
                {tab === "dashboard" && <DashboardTab detail={detail} biasData={biasData} />}
                {tab === "volledig" && <VolledigTab detail={detail} />}
              </DataCard>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---- Shared prose wrapper ---- */
function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[720px] text-[14px] text-sub-text leading-[1.7]">{children}</div>;
}
function SHead({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} className="text-label" />
      <span className="text-[0.7rem] text-label uppercase tracking-[0.08em] font-semibold">{label}</span>
    </div>
  );
}
function Spacer() {
  return <hr className="border-card-border my-7" />;
}

/* ===================== COMPACT TAB ===================== */
function CompactTab({ detail }: { detail: any }) {
  return (
    <>
      <h2 className="text-[20px] font-bold text-foreground leading-snug mb-1">{textVal(detail.title, "—")}</h2>
      {detail.core_driver && (
        <div className="text-[13px] text-label mb-3">{detail.core_driver}</div>
      )}

      {detail.summary_short && (
        <div className="max-w-[720px] text-[13px] text-sub-text leading-[1.6] mb-4 italic border-l-2 border-purple-accent/30 pl-4">
          {detail.summary_short}
        </div>
      )}

      {/* 6. Flow chain summary */}
      {detail.flow_chain_summary && (
        <div className="text-[12px] text-label italic mb-4">{detail.flow_chain_summary}</div>
      )}

      <Spacer />

      <SHead icon={FileText} label="Samenvatting" />
      <Prose>
        <MarkdownBlock content={detail.summary_micro || detail.summary_short} fallback="Nog geen compacte samenvatting beschikbaar" />
      </Prose>

      {/* What Stands Out */}
      {detail.what_stands_out && (
        <>
          <Spacer />
          <SHead icon={Eye} label="Wat valt op" />
          <div className="bg-secondary border border-card-border rounded-lg p-4 max-w-[720px]">
            <div className="text-[13px] text-foreground leading-[1.7] font-semibold"><MarkdownBlock content={detail.what_stands_out} /></div>
          </div>
        </>
      )}

      {/* Forward Implications */}
      {detail.forward_implications && (
        <>
          <Spacer />
          <SHead icon={ArrowRightLeft} label="Forward Implications" />
          <Prose><MarkdownBlock content={detail.forward_implications} /></Prose>
        </>
      )}

      {/* Transmission Mechanism */}
      {detail.transmission_mechanism && (
        <>
          <Spacer />
          <SHead icon={ArrowRight} label="Transmission Mechanism" />
          <Prose><MarkdownBlock content={detail.transmission_mechanism} /></Prose>
        </>
      )}

      {/* Priced-in block */}
      {(detail.priced_in_assessment || detail.priced_in) && (
        <>
          <Spacer />
          <SHead icon={Eye} label="Wat is ingeprijsd" />
          <Prose>
            <MarkdownBlock content={detail.priced_in_assessment || detail.priced_in} />
          </Prose>
        </>
      )}

      <Spacer />

      <SHead icon={GitMerge} label="Scenario's" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "BASIS", value: detail.scenario_base, borderColor: "#6B7280" },
          { label: "OPWAARTS", value: detail.scenario_upside, borderColor: "#16A34A" },
          { label: "NEERWAARTS", value: detail.scenario_downside, borderColor: "#DC2626" },
        ].map(s => (
          <div key={s.label} className="bg-secondary border border-card-border rounded-lg p-4" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2 font-medium">{s.label}</div>
            <div className="text-[13px] text-sub-text leading-[1.7]"><MarkdownBlock content={s.value} /></div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ===================== DASHBOARD TAB ===================== */
function DashboardTab({ detail, biasData }: { detail: any; biasData: any[] }) {
  const FX_CODES = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];
  const ASSETS = [
    { label: "GOLD", bias: detail.gold_bias, reason: detail.gold_reason, icon: Package },
    { label: "OIL", bias: detail.oil_bias, reason: detail.oil_reason, icon: Package },
    { label: "SPX", bias: detail.spx_bias, reason: detail.spx_reason, icon: BarChart2 },
    { label: "NASDAQ", bias: detail.nasdaq_bias, reason: detail.nasdaq_reason, icon: BarChart2 },
  ];
  const RATES = [
    { label: "US 10Y", bias: detail.us10y_bias, reason: detail.us10y_reason },
    { label: "DE 10Y", bias: detail.de10y_bias, reason: detail.de10y_reason },
  ];

  return (
    <>
      <SHead icon={FileText} label="Dashboard Samenvatting" />
      <Prose>
        <MarkdownBlock content={renderDashboardText(detail.summary_dashboard || detail.summary_full)} fallback="Nog geen dashboard samenvatting beschikbaar" />
      </Prose>

      <Spacer />

      <SHead icon={ArrowRight} label="Flow Chain" />
      <Prose><MarkdownBlock content={detail.flow_chain} /></Prose>

      <Spacer />

      <SHead icon={Building2} label="Central Bank Narrative" />
      <Prose><MarkdownBlock content={detail.cb_narrative} /></Prose>

      <Spacer />

      <SHead icon={RefreshCw} label="What Changed" />
      <Prose><MarkdownBlock content={detail.what_changed} /></Prose>

      <Spacer />

      {/* FX BIAS with cleaned reasons */}
      <SHead icon={DollarSign} label="FX Bias" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        {FX_CODES.map(code => {
          const bias = detail[`${code.toLowerCase()}_bias`];
          const reason = detail[`${code.toLowerCase()}_reason`];
          const color = getBiasColor(bias);
          const displayReason = cleanReason(code, bias, reason);
          return (
            <div key={code} className="bg-secondary border border-card-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={12} className="text-label" />
                <span className="text-[11px] font-bold uppercase" style={{ color }}>{code}</span>
                <span className="text-[10px] font-semibold uppercase ml-auto" style={{ color }}>{val(bias)}</span>
              </div>
              <div className="text-[11px] text-sub-text leading-snug mt-1">{displayReason}</div>
            </div>
          );
        })}
      </div>

      <Spacer />

      {/* ASSET BIAS with cleaned reasons */}
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">ASSET BIAS</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        {ASSETS.map(({ label, bias, reason, icon: Icon }) => {
          const color = getBiasColor(bias);
          const displayReason = cleanAssetReason(label, bias, reason);
          return (
            <div key={label} className="bg-secondary border border-card-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-label" />
                <span className="text-[11px] font-bold uppercase">{label}</span>
                <span className="text-[10px] font-semibold uppercase ml-auto" style={{ color }}>{val(bias)}</span>
              </div>
              <div className="text-[11px] text-sub-text leading-snug mt-1">{displayReason}</div>
            </div>
          );
        })}
      </div>

      <Spacer />

      {/* RATES */}
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">RENTES</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        {RATES.map(({ label, bias, reason }) => {
          const color = getBiasColor(bias);
          const displayReason = cleanAssetReason(label, bias, reason);
          return (
            <div key={label} className="bg-secondary border border-card-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Percent size={12} className="text-label" />
                <span className="text-[11px] font-bold uppercase">{label}</span>
                <span className="text-[10px] font-semibold uppercase ml-auto" style={{ color }}>{val(bias)}</span>
              </div>
              <div className="text-[11px] text-sub-text leading-snug mt-1">{displayReason}</div>
            </div>
          );
        })}
      </div>

      <Spacer />

      {/* ENTITY BIAS TABLE — enhanced */}
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">ENTITY BIAS</div>
      {biasData.length === 0 ? (
        <div className="text-[11px] text-label italic">Nog geen entity bias data voor dit rapport</div>
      ) : (
        <div className="border border-card-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-[9px] text-label uppercase text-left px-3 py-1.5">Klasse</th>
                <th className="text-[9px] text-label uppercase text-left px-3 py-1.5">Code</th>
                <th className="text-[9px] text-label uppercase text-left px-3 py-1.5">Bias</th>
                <th className="text-[9px] text-label uppercase text-left px-3 py-1.5">Strength</th>
                <th className="text-[9px] text-label uppercase text-left px-3 py-1.5">Driver</th>
              </tr>
            </thead>
            <tbody>
              {biasData.map((b, i) => {
                const classKey = (b.entity_class || "").toLowerCase();
                const ClassIcon = ASSET_CLASS_ICONS[classKey] || DollarSign;
                const biasLower = (b.bias || "").toLowerCase();
                const biasColor = biasLower === "bullish" ? "#16A34A" : biasLower === "bearish" ? "#DC2626" : biasLower === "mixed" ? "#D97706" : "#6B7280";
                const driverText = textVal(b.main_driver, "—");
                const driverDisplay = driverText === "—" && biasLower !== "neutral" ? "(zie rapport context)" : driverText;
                return (
                  <tr key={i} className="border-b border-card-border last:border-b-0 hover:bg-secondary">
                    <td className="text-[10px] text-sub-text px-3 py-2">
                      <span className="flex items-center gap-1"><ClassIcon size={11} className="text-label" />{val(b.entity_class)}</span>
                    </td>
                    <td className="text-[10px] text-foreground font-bold px-3 py-2">{val(b.entity_code)}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-[2px] text-[9px] rounded uppercase font-semibold" style={{ backgroundColor: biasColor + "1A", color: biasColor }}>
                        {val(b.bias)}
                      </span>
                    </td>
                    <td className="text-[10px] text-sub-text px-3 py-2">{val(b.bias_strength)}</td>
                    <td className="text-[11px] text-sub-text px-3 py-2 italic">{safeText(driverDisplay)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ===================== VOLLEDIG TAB ===================== */
function VolledigTab({ detail }: { detail: any }) {
  const sections = [
    { label: "UITGEBREIDE SAMENVATTING", value: detail.summary_detailed || detail.summary_full, icon: FileText, fallback: "Uitgebreide samenvatting nog niet beschikbaar" },
    { label: "TRADING IMPLICATIES", value: detail.trading_implications, icon: Target },
    { label: "KEY WATCHPOINTS", value: detail.key_watchpoints, icon: Eye },
    { label: "FORWARD IMPLICATIONS", value: detail.forward_implications, icon: ArrowRightLeft },
    { label: "WAT VERANDERDE", value: detail.what_changed, icon: RefreshCw },
    { label: "CENTRALE BANK NARRATIEF", value: detail.cb_narrative, icon: Building2 },
    { label: "FLOW CHAIN", value: detail.flow_chain, icon: ArrowRight },
    { label: "YIELD SIGNAL", value: detail.yield_signal, icon: Percent },
    { label: "YIELD CURVE", value: detail.yield_curve_narrative, icon: Percent },
    { label: "YIELD DIFFERENTIALS", value: detail.yield_differentials_view, icon: Percent },
    { label: "YIELD FX IMPLICATIE", value: detail.yield_fx_implication, icon: DollarSign },
    { label: "TERM PREMIUM", value: detail.term_premium_narrative, icon: Percent },
    { label: "PRICED-IN ASSESSMENT", value: detail.priced_in_assessment || detail.priced_in, icon: Eye },
    { label: "MARKET SENSITIVITY", value: detail.market_sensitivity, icon: Zap },
    { label: "TRANSMISSION MECHANISM", value: detail.transmission_mechanism, icon: ArrowRight },
    { label: "WHY IT MATTERS", value: detail.why_it_matters, icon: Target },
    { label: "WHAT STANDS OUT", value: detail.what_stands_out, icon: Eye },
    { label: "COMMODITY ANALYSIS", value: detail.commodity_analysis, icon: Package },
    { label: "EQUITY RISK VIEW", value: detail.equity_risk_view, icon: BarChart2 },
    { label: "CROSS CURRENCY VIEW", value: detail.cross_currency_view, icon: DollarSign },
    { label: "CURRENCY DEEP ANALYSIS", value: detail.currency_deep_analysis, icon: DollarSign },
    { label: "KEY POINTS", value: detail.key_points, icon: FileText },
    { label: "IMPORTANT TODAY", value: detail.important_today || detail.important_for_today, icon: Zap },
    { label: "IMPORTANT THIS WEEK", value: detail.important_this_week, icon: Eye },
    { label: "IMPORTANT THIS MONTH", value: detail.important_this_month, icon: Eye },
  ].filter(s => s.value && String(s.value).trim() !== "" && s.value !== "null");

  return (
    <div className="space-y-7">
      {sections.map(({ label, value, icon: Icon, fallback }) => (
        <div key={label}>
          <SHead icon={Icon} label={label} />
          <Prose>
            <MarkdownBlock content={value} fallback={fallback || "Nog geen analyse beschikbaar"} />
          </Prose>
        </div>
      ))}
      {sections.length === 0 && (
        <div className="text-[13px] text-label italic">Geen volledige analyse beschikbaar voor dit rapport</div>
      )}
    </div>
  );
}
