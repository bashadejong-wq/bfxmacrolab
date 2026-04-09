import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val, BiasChip, RiskChip, MarkdownBlock, fmtDate, queryWithRetry } from "@/components/ui-helpers";

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
      const detailRow = (d as any[])?.[0] || null;
      if (detailRow) setDetail(detailRow);
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
          <div className="px-[18px] py-[14px] border-b border-card-border">
            <span className="text-[9px] text-label uppercase tracking-[0.08em]">RAPPORTEN</span>
          </div>
          {reports.length === 0 && <div className="p-4 text-center text-[11px] text-label">Geen rapporten gevonden</div>}
          {reports.map((r) => (
            <div key={r.id}
              className={`px-[18px] py-3 border-b border-card-border cursor-pointer transition-colors ${
                r.id === activeReportId ? "bg-[#F5F0FF] border-l-[3px] border-l-purple-accent" : "hover:bg-secondary"
              }`}
              onClick={() => setActiveReportId(r.id)}
            >
              <div className="text-[9px] text-label">{fmtDate(r.analysis_date)}</div>
              <div className="text-[12px] text-sub-text font-medium leading-snug mt-1 hover:text-foreground truncate">{val(r.title)}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-[#F5F0FF] text-purple-accent px-2 py-[2px] text-[9px] rounded uppercase">{val(r.macro_regime)}</span>
                <div className={`w-2 h-2 rounded-full ${r.pass1_status === "complete" ? "bg-bullish-text" : "bg-neutral-bg"}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-7 overflow-y-auto">
          {!activeReportId ? (
            <div className="flex items-center justify-center h-full text-[13px] text-neutral-text">← Selecteer een rapport</div>
          ) : !detail ? (
            <div className="flex items-center justify-center h-full text-[13px] text-label">Laden...</div>
          ) : (
            <>
              <div className="mb-5">
                <div className="text-[18px] font-bold text-foreground">{val(detail.title)}</div>
                <div className="text-[10px] text-label mt-1">{fmtDate(detail.analysis_date)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-[#F5F0FF] text-purple-accent px-2 py-[2px] text-[9px] rounded uppercase">{val(detail.macro_regime)}</span>
                  <RiskChip regime={detail.risk_regime} />
                  <span className="text-[11px] text-foreground font-semibold">{val(detail.confidence_score)}</span>
                </div>
                <div className="text-[11px] text-sub-text mt-2">{val(detail.core_driver)}</div>
              </div>

              <div className="bg-card border-b border-card-border flex mb-0 rounded-t-lg">
                {[["Compact","micro"],["Dashboard","dashboard"],["Volledig","full"]].map(([label, key]) => (
                  <button key={key} onClick={() => setSummaryTab(key)}
                    className={`px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
                      key === summaryTab ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent"
                    }`}>{label}</button>
                ))}
              </div>
              <DataCard className="p-5 rounded-t-none mb-5">
                <MarkdownBlock content={summaryContent} fallback="Geen samenvatting beschikbaar" />
              </DataCard>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "BASIS", value: detail.scenario_base, border: "border-l-neutral-bg" },
                  { label: "OPWAARTS", value: detail.scenario_upside, border: "border-l-bullish-text" },
                  { label: "NEERWAARTS", value: detail.scenario_downside, border: "border-l-bearish-text" },
                ].map((s) => (
                  <DataCard key={s.label} className={`p-4 border-l-[3px] ${s.border}`}>
                    <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">{s.label}</div>
                    <div className="text-[11px] text-sub-text leading-relaxed">{val(s.value)}</div>
                  </DataCard>
                ))}
              </div>

              <DataCard className="overflow-hidden mb-5">
                {biasData.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-label">Geen bias data voor dit rapport</div>
                ) : (
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
                      {biasData.map((b, i) => (
                        <tr key={i} className="border-b border-card-border hover:bg-secondary">
                          <td className="text-[11px] text-sub-text px-4 py-2">{val(b.entity_class)}</td>
                          <td className="text-[11px] text-foreground font-bold px-4 py-2">{val(b.entity_code)}</td>
                          <td className="px-4 py-2"><BiasChip bias={b.bias} /></td>
                          <td className="text-[11px] text-sub-text px-4 py-2">{val(b.bias_strength)}</td>
                          <td className="text-[11px] text-sub-text px-4 py-2">{val(b.main_driver)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </DataCard>

              <div className="grid grid-cols-2 gap-3">
                <DataCard className="p-5">
                  <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">HANDELIMPLICATIES</div>
                  <MarkdownBlock content={detail.trading_implications} />
                </DataCard>
                <DataCard className="p-5">
                  <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">WATCHPOINTS</div>
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
