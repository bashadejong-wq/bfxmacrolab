import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, BiasChip, RiskChip, MarkdownBlock, fmtDate, queryWithRetry, getBiasColor } from "@/components/ui-helpers";
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
function getRegimeIcon(regime: string | null) {
  const r = (regime || "").toLowerCase().replace(/[\s-]/g, "_");
  for (const [k, I] of Object.entries(REGIME_ICONS)) { if (r.includes(k)) return I; }
  return GitMerge;
}

function StatusTag({ label, status }: { label: string; status: string | null }) {
  const s = (status || "").toLowerCase();
  const color = s === "complete" || s === "processed" ? "text-bullish-text bg-bullish-bg" :
    s === "pending" ? "text-mixed-text bg-mixed-bg" : "text-neutral-text bg-neutral-bg";
  return <span className={`${color} px-1.5 py-[1px] text-[8px] rounded font-semibold uppercase`}>{label}: {val(status)}</span>;
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
      supabase.from("report_analysis").select("id,analysis_date,title,macro_regime,confidence_score,status,raw_report_id")
        .order("created_at", { ascending: false }).limit(50),
      "Reports/list"
    ).then(async (data) => {
      const analyses = (data as any[]) || [];
      // Fetch raw_reports for file_name
      const rawIds = analyses.map(a => a.raw_report_id).filter(Boolean);
      let rawMap: Record<number, any> = {};
      if (rawIds.length > 0) {
        const rawData = await queryWithRetry(() =>
          supabase.from("raw_reports").select("id,file_name,source,report_date").in("id", rawIds),
          "Reports/raw_reports"
        );
        ((rawData as any[]) || []).forEach(r => { rawMap[r.id] = r; });
      }
      setReports(analyses.map(a => ({ ...a, raw: rawMap[a.raw_report_id] || null })));
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
    Promise.all([
      queryWithRetry(() => supabase.from("report_analysis").select("*").eq("id", activeReportId).limit(1), "Reports/detail"),
      queryWithRetry(() => supabase.from("entity_bias").select("*").eq("context_id", activeReportId).eq("context_type", "report").order("entity_class"), "Reports/entity_bias"),
    ]).then(([d, b]) => {
      setDetail((d as any[])?.[0] || null);
      setBiasData((b as any[]) || []);
    });
  }, [activeReportId]);

  const RegimeIcon = detail ? getRegimeIcon(detail.macro_regime) : GitMerge;
  const convictionPct = detail?.confidence_score ? Math.min(Math.max((detail.confidence_score / 10) * 100, 0), 100) : 0;

  return (
    <DashboardLayout>
      <div className="flex -mx-7 -mt-7 min-h-screen">
        {/* LEFT PANEL — Report List */}
        <div className="w-[300px] min-w-[300px] bg-card border-r border-card-border h-screen overflow-y-auto sticky top-0">
          <div className="px-5 py-3 border-b border-card-border flex items-center gap-2">
            <FileText size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">RAPPORTEN</span>
            <span className="ml-auto text-[9px] text-label font-mono">{reports.length}</span>
          </div>
          {reports.length === 0 && <div className="p-5 text-center text-[11px] text-label">Nog geen rapporten gevonden</div>}
          {reports.map((r) => (
            <div key={r.id}
              className={`px-5 py-3 border-b border-card-border cursor-pointer transition-colors ${
                r.id === activeReportId ? "bg-secondary border-l-[3px] border-l-purple-accent" : "hover:bg-secondary"
              }`}
              onClick={() => selectReport(r.id)}
            >
              <div className="flex items-center gap-1.5">
                <FileText size={11} className="text-label shrink-0" />
                <span className="text-[11px] text-foreground font-medium leading-snug truncate flex-1">
                  {val(r.raw?.file_name || r.title)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-neutral-bg text-neutral-text px-1.5 py-[1px] text-[8px] rounded uppercase font-semibold">{val(r.macro_regime)}</span>
                {r.confidence_score != null && (
                  <span className="bg-purple-accent/10 text-purple-accent px-1.5 py-[1px] text-[8px] rounded font-mono font-bold">{r.confidence_score}/10</span>
                )}
                <span className="ml-auto text-[9px] text-label">{fmtDate(r.analysis_date || r.raw?.report_date)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT PANEL — Report Detail */}
        <div className="flex-1 p-7 overflow-y-auto">
          {!activeReportId ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <FileText size={32} className="text-label" />
              <span className="text-[13px] text-label">Selecteer een rapport uit de lijst</span>
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center h-full text-[13px] text-label">Laden...</div>
          ) : (
            <>
              {/* HEADER */}
              <div className="mb-2">
                <div className="text-[18px] font-bold text-foreground leading-snug">{val(detail.title)}</div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] text-label">{fmtDate(detail.analysis_date)}</span>
                  <span className="flex items-center gap-1 bg-neutral-bg text-neutral-text px-2 py-[2px] text-[9px] rounded uppercase font-semibold">
                    <RegimeIcon size={11} /> {val(detail.macro_regime)}
                  </span>
                  <RiskChip regime={detail.risk_regime} />
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[18px] font-extrabold text-purple-accent font-mono">{val(detail.confidence_score)}</span>
                    <span className="text-[11px] text-label">/10</span>
                    <div className="w-[120px] h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-purple-accent transition-all" style={{ width: `${convictionPct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-[12px] text-sub-text mt-2">{textVal(detail.core_driver, "—")}</div>
              </div>

              {/* 5. METADATA BAR */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                {detail.raw_report_id && (
                  <span className="text-[8px] text-label bg-neutral-bg px-1.5 py-[1px] rounded font-mono">src: {val(reports.find(r => r.id === activeReportId)?.raw?.source)}</span>
                )}
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

/* ===================== COMPACT TAB ===================== */
function CompactTab({ detail }: { detail: any }) {
  return (
    <>
      <div className="max-w-[680px] text-[13px] text-sub-text leading-[1.7] mb-6">
        <MarkdownBlock content={detail.summary_micro || detail.summary_short} fallback="Nog geen compacte samenvatting beschikbaar" />
      </div>
      <hr className="border-card-border mb-5" />
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">SCENARIO'S</div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "BASIS", value: detail.scenario_base, borderColor: "#6B7280" },
          { label: "OPWAARTS", value: detail.scenario_upside, borderColor: "#16A34A" },
          { label: "NEERWAARTS", value: detail.scenario_downside, borderColor: "#DC2626" },
        ].map(s => (
          <div key={s.label} className="bg-secondary border border-card-border rounded-lg p-4" style={{ borderLeft: `3px solid ${s.borderColor}` }}>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2 font-medium">{s.label}</div>
            <div className="text-[11px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
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
      {/* Summary */}
      <div className="max-w-[680px] text-[13px] text-sub-text leading-[1.7] mb-6">
        <MarkdownBlock content={detail.summary_dashboard || detail.summary_full} fallback="Nog geen dashboard samenvatting beschikbaar" />
      </div>

      <hr className="border-card-border mb-5" />

      {/* FX BIAS */}
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">FX BIAS</div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {FX_CODES.map(code => {
          const bias = detail[`${code.toLowerCase()}_bias`];
          const reason = detail[`${code.toLowerCase()}_reason`];
          const color = getBiasColor(bias);
          return (
            <div key={code} className="bg-secondary border border-card-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={12} className="text-label" />
                <span className="text-[10px] font-bold uppercase" style={{ color }}>{code}</span>
                <span className="text-[9px] font-semibold uppercase ml-auto" style={{ color }}>{val(bias)}</span>
              </div>
              <div className="text-[10px] text-label leading-snug">{val(reason)}</div>
            </div>
          );
        })}
      </div>

      {/* ASSET BIAS */}
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">ASSET BIAS</div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {ASSETS.map(({ label, bias, reason, icon: Icon }) => {
          const color = getBiasColor(bias);
          return (
            <div key={label} className="bg-secondary border border-card-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-label" />
                <span className="text-[10px] font-bold uppercase">{label}</span>
                <span className="text-[9px] font-semibold uppercase ml-auto" style={{ color }}>{val(bias)}</span>
              </div>
              <div className="text-[10px] text-label leading-snug">{val(reason)}</div>
            </div>
          );
        })}
      </div>

      {/* RATES */}
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">RENTES</div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {RATES.map(({ label, bias, reason }) => {
          const color = getBiasColor(bias);
          return (
            <div key={label} className="bg-secondary border border-card-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Percent size={12} className="text-label" />
                <span className="text-[10px] font-bold uppercase">{label}</span>
                <span className="text-[9px] font-semibold uppercase ml-auto" style={{ color }}>{val(bias)}</span>
              </div>
              <div className="text-[10px] text-label leading-snug">{val(reason)}</div>
            </div>
          );
        })}
      </div>

      {/* ENTITY BIAS TABLE */}
      <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-3">ENTITY BIAS</div>
      {biasData.length === 0 ? (
        <div className="text-[11px] text-label italic">Nog geen entity bias data voor dit rapport</div>
      ) : (
        <div className="border border-card-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Klasse</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Code</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Bias</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Strength</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Driver</th>
              </tr>
            </thead>
            <tbody>
              {biasData.map((b, i) => {
                const classKey = (b.entity_class || "").toLowerCase();
                const ClassIcon = ASSET_CLASS_ICONS[classKey] || DollarSign;
                return (
                  <tr key={i} className="border-b border-card-border last:border-b-0 hover:bg-secondary">
                    <td className="text-[10px] text-sub-text px-4 py-2">
                      <span className="flex items-center gap-1"><ClassIcon size={11} className="text-label" />{val(b.entity_class)}</span>
                    </td>
                    <td className="text-[10px] text-foreground font-bold px-4 py-2">{val(b.entity_code)}</td>
                    <td className="px-4 py-2"><BiasChip bias={b.bias} /></td>
                    <td className="text-[10px] text-sub-text px-4 py-2">{val(b.bias_strength)}</td>
                    <td className="text-[10px] text-sub-text px-4 py-2 max-w-[200px] truncate">{val(b.main_driver)}</td>
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
    { label: "CENTRALE BANK NARRATIEF", value: detail.cb_narrative, icon: Building2 },
    { label: "FLOW CHAIN", value: detail.flow_chain, icon: ArrowRight },
    { label: "TRADING IMPLICATIES", value: detail.trading_implications, icon: Target },
    { label: "KEY WATCHPOINTS", value: detail.key_watchpoints, icon: Eye },
    { label: "WAT VERANDERDE", value: detail.what_changed, icon: RefreshCw },
    { label: "FORWARD IMPLICATIONS", value: detail.forward_implications, icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-6">
      {sections.map(({ label, value, icon: Icon, fallback }) => (
        <div key={label}>
          <div className="flex items-center gap-1.5 mb-2">
            <Icon size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">{label}</span>
          </div>
          <div className="max-w-[720px] text-[12px] text-sub-text leading-[1.7]">
            <MarkdownBlock content={value} fallback={fallback || "Nog geen analyse beschikbaar"} />
          </div>
          <hr className="border-card-border mt-5" />
        </div>
      ))}
    </div>
  );
}
