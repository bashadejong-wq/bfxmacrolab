import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val, textVal, BiasChip, RiskChip, MarkdownBlock, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { FileText, DollarSign, Package, BarChart2 } from "lucide-react";

const ASSET_CLASS_ICONS: Record<string, React.ElementType> = {
  fx: DollarSign, currency: DollarSign, commodity: Package, equity: BarChart2, rates: BarChart2,
};

export default function Reports() {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<any[]>([]);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [biasData, setBiasData] = useState<any[]>([]);
  const [summaryTab, setSummaryTab] = useState("micro");

  useEffect(() => {
    queryWithRetry(() => supabase.from("report_analysis").select("id,analysis_date,title,macro_regime,confidence_score,pass1_status").order("analysis_date", { ascending: false }).limit(50), "Reports/report_analysis/list")
      .then(data => setReports((data as any[]) || []));
    const idParam = searchParams.get("id");
    if (idParam) setActiveReportId(Number(idParam));
  }, []);

  useEffect(() => {
    if (!activeReportId) { setDetail(null); setBiasData([]); return; }
    Promise.all([
      queryWithRetry(() => supabase.from("report_analysis").select("*").eq("id", activeReportId).limit(1), "Reports/report_analysis/detail"),
      queryWithRetry(() => supabase.from("entity_bias").select("*").eq("context_id", activeReportId).eq("context_type", "report").order("entity_class", { ascending: true }), "Reports/entity_bias"),
    ]).then(([d, b]) => {
      setDetail((d as any[])?.[0] || null);
      setBiasData((b as any[]) || []);
    });
  }, [activeReportId]);

  const summaryContent = summaryTab === "micro" ? detail?.summary_micro :
    summaryTab === "dashboard" ? (detail?.summary_dashboard || detail?.summary_full) :
    detail?.summary_full;

  return (
    <DashboardLayout>
      <div className="flex -mx-7 -mt-7 min-h-screen">
        {/* Left Panel */}
        <div className="w-[280px] min-w-[280px] bg-card border-r border-card-border h-screen overflow-y-auto sticky top-0">
          <div className="px-5 py-3 border-b border-card-border flex items-center gap-2">
            <FileText size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em]">RAPPORTEN</span>
          </div>
          {reports.length === 0 && <div className="p-5 text-center text-[11px] text-label">Nog geen rapporten gevonden</div>}
          {reports.map((r) => (
            <div key={r.id}
              className={`px-5 py-3 border-b border-card-border cursor-pointer transition-colors ${
                r.id === activeReportId ? "bg-secondary border-l-[3px] border-l-purple-accent" : "hover:bg-secondary"
              }`}
              onClick={() => setActiveReportId(r.id)}
            >
              <div className="text-[9px] text-label">{fmtDate(r.analysis_date)}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <FileText size={11} className="text-label shrink-0" />
                <span className="text-[12px] text-sub-text font-medium leading-snug truncate">{val(r.title)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-secondary text-purple-accent px-2 py-[2px] text-[9px] rounded uppercase font-semibold">{val(r.macro_regime)}</span>
                {r.confidence_score != null && <span className="text-[9px] text-label font-mono">{r.confidence_score}/10</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-7 overflow-y-auto">
          {!activeReportId ? (
            <div className="flex items-center justify-center h-full text-[13px] text-neutral-text">Selecteer een rapport</div>
          ) : !detail ? (
            <div className="flex items-center justify-center h-full text-[13px] text-label">Laden...</div>
          ) : (
            <>
              <div className="mb-8">
                <div className="text-[18px] font-bold text-foreground">{val(detail.title)}</div>
                <div className="text-[10px] text-label mt-1">{fmtDate(detail.analysis_date)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-secondary text-purple-accent px-2 py-[2px] text-[9px] rounded uppercase font-semibold">{val(detail.macro_regime)}</span>
                  <RiskChip regime={detail.risk_regime} />
                  <span className="text-[11px] text-foreground font-mono font-semibold">{detail.confidence_score != null ? `${detail.confidence_score}/10` : "—"}</span>
                </div>
                <div className="text-[11px] text-sub-text mt-2">{textVal(detail.core_driver)}</div>
              </div>

              <div className="bg-card border-b border-card-border flex mb-0 rounded-t-lg">
                {[["Compact","micro"],["Dashboard","dashboard"],["Volledig","full"]].map(([label, key]) => (
                  <button key={key} onClick={() => setSummaryTab(key)}
                    className={`px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
                      key === summaryTab ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent"
                    }`}>{label}</button>
                ))}
              </div>
              <DataCard className="p-5 rounded-t-none mb-8">
                <MarkdownBlock content={summaryContent} fallback="Geen samenvatting beschikbaar" />
              </DataCard>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "BASIS", value: detail.scenario_base, border: "border-l-neutral-text" },
                  { label: "OPWAARTS", value: detail.scenario_upside, border: "border-l-bullish-text" },
                  { label: "NEERWAARTS", value: detail.scenario_downside, border: "border-l-bearish-text" },
                ].map((s) => (
                  <DataCard key={s.label} className={`p-5 border-l-[3px] ${s.border}`}>
                    <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">{s.label}</div>
                    <div className="text-[11px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
                  </DataCard>
                ))}
              </div>

              <DataCard className="overflow-hidden mb-8">
                {biasData.length === 0 ? (
                  <div className="p-5 text-center text-[11px] text-label">Nog geen bias data voor dit rapport</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-[9px] text-label uppercase text-left px-5 py-2">Klasse</th>
                        <th className="text-[9px] text-label uppercase text-left px-5 py-2">Code</th>
                        <th className="text-[9px] text-label uppercase text-left px-5 py-2">Bias</th>
                        <th className="text-[9px] text-label uppercase text-left px-5 py-2">Strength</th>
                        <th className="text-[9px] text-label uppercase text-left px-5 py-2">Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {biasData.map((b, i) => {
                        const classKey = (b.entity_class || "").toLowerCase();
                        const ClassIcon = ASSET_CLASS_ICONS[classKey] || DollarSign;
                        return (
                          <tr key={i} className="border-b border-card-border hover:bg-secondary">
                            <td className="text-[11px] text-sub-text px-5 py-2.5">
                              <div className="flex items-center gap-1"><ClassIcon size={12} className="text-label" />{val(b.entity_class)}</div>
                            </td>
                            <td className="text-[11px] text-foreground font-bold px-5 py-2.5">{val(b.entity_code)}</td>
                            <td className="px-5 py-2.5"><BiasChip bias={b.bias} /></td>
                            <td className="text-[11px] text-sub-text px-5 py-2.5">{val(b.bias_strength)}</td>
                            <td className="text-[11px] text-sub-text px-5 py-2.5">{val(b.main_driver)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </DataCard>

              <div className="grid grid-cols-2 gap-4">
                <DataCard className="p-5">
                  <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">HANDELIMPLICATIES</div>
                  <MarkdownBlock content={detail.trading_implications} />
                </DataCard>
                <DataCard className="p-5">
                  <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">WATCHPOINTS</div>
                  <MarkdownBlock content={detail.key_watchpoints} />
                </DataCard>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
