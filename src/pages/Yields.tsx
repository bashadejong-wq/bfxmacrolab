import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, MarkdownBlock, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { TrendingUp, TrendingDown, Minus, Percent, DollarSign } from "lucide-react";

const curveIcon = (regime: string | null) => {
  const r = (regime || "").toLowerCase();
  if (r.includes("steep")) return <TrendingUp size={16} className="text-bullish-text" />;
  if (r.includes("flat")) return <Minus size={16} className="text-mixed-text" />;
  if (r.includes("invert")) return <TrendingDown size={16} className="text-bearish-text" />;
  return <Minus size={16} className="text-neutral-text" />;
};

const curveColor = (regime: string | null) => {
  const r = (regime || "").toLowerCase();
  if (r.includes("bull_steep")) return "text-bullish-text";
  if (r.includes("bear_steep")) return "text-mixed-text";
  if (r.includes("bull_flat")) return "text-purple-accent";
  if (r.includes("bear_flat")) return "text-bearish-text";
  return "text-neutral-text";
};

type YieldRow = { code: string; y2: any; y10: any; diff: any; s2s10s: any };

export default function Yields() {
  const navigate = useNavigate();
  const [y, setY] = useState<any>(null);
  const [snap, setSnap] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      queryWithRetry(() => supabase.from("yields_live").select("*").order("fetch_date", { ascending: false }).limit(1), "Yields/yields_live"),
      queryWithRetry(() => supabase.from("period_snapshots").select("*").eq("period_type", "daily").order("period_start", { ascending: false }).limit(1), "Yields/period_snapshots"),
    ]).then(([yData, sData]) => {
      setY((yData as any[])?.[0] || null);
      setSnap((sData as any[])?.[0] || null);
    });
  }, []);

  const rows: YieldRow[] = y ? [
    { code: "USD", y2: y.us_2y, y10: y.us_10y, diff: null, s2s10s: y.us_2s10s },
    { code: "EUR", y2: y.eur_2y, y10: y.eur_10y, diff: y.diff_eur_10y, s2s10s: y.eur_2s10s },
    { code: "JPY", y2: y.jpy_2y, y10: y.jpy_10y, diff: y.diff_jpy_10y, s2s10s: y.jpy_2s10s },
    { code: "GBP", y2: y.gbp_2y, y10: y.gbp_10y, diff: y.diff_gbp_10y, s2s10s: y.gbp_2s10s },
    { code: "AUD", y2: y.aud_2y, y10: y.aud_10y, diff: y.diff_aud_10y, s2s10s: y.aud_2s10s },
    { code: "CAD", y2: y.cad_2y, y10: y.cad_10y, diff: y.diff_cad_10y, s2s10s: y.cad_2s10s },
    { code: "NZD", y2: y.nzd_2y, y10: y.nzd_10y, diff: y.diff_nzd_10y, s2s10s: y.nzd_2s10s },
    { code: "CHF", y2: y.chf_2y, y10: y.chf_10y, diff: y.diff_chf_10y, s2s10s: y.chf_2s10s },
  ] : [];

  const spreadColor = (v: any) => {
    if (v === null || v === undefined) return "";
    return Number(v) > 0 ? "text-bullish-text" : Number(v) < 0 ? "text-bearish-text" : "";
  };

  return (
    <DashboardLayout>
      <SectionLabel>US TREASURY CURVE</SectionLabel>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "2 JAAR", value: y?.us_2y },
          { label: "5 JAAR", value: y?.us_5y },
          { label: "10 JAAR", value: y?.us_10y, sub: `Reeel: ${val(y?.us_real_10y, "%")}` },
          { label: "30 JAAR", value: y?.us_30y },
        ].map((item) => (
          <DataCard key={item.label} className="p-5">
            <div className="flex items-center gap-1 mb-1">
              <Percent size={12} className="text-label" />
              <span className="text-[0.65rem] text-label uppercase">{item.label}</span>
            </div>
            <div className="text-[20px] font-bold text-foreground font-mono mt-1">{val(item.value, "%")}</div>
            {item.sub && <div className="text-[10px] text-label mt-1">{item.sub}</div>}
          </DataCard>
        ))}
      </div>

      <DataCard className="p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {curveIcon(y?.curve_regime)}
            <span className={`text-[18px] font-extrabold ${curveColor(y?.curve_regime)}`}>{val(y?.curve_regime)}</span>
          </div>
          <span className="text-[11px] text-sub-text">{val(snap?.curve_view)}</span>
        </div>
      </DataCard>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[["REEEL 10J", y?.us_real_10y],["BREAKEVEN", y?.breakeven_10y],["2S10S", y?.us_2s10s],["3M10Y", y?.us_3m10y]].map(([label, value]) => (
          <DataCard key={label as string} className="p-5">
            <div className="text-[0.65rem] text-label uppercase">{label}</div>
            <div className="text-[16px] font-bold text-foreground font-mono mt-1">{val(value, "%")}</div>
          </DataCard>
        ))}
      </div>

      <SectionLabel>G10 YIELDS</SectionLabel>
      <DataCard className="overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2">Currency</th>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2">2J</th>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2">10J</th>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2">Spread vs US 10J</th>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2">2s10s</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-card-border hover:bg-secondary cursor-pointer" onClick={() => navigate(`/currencies/${r.code}`)}>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={12} className="text-purple-accent" />
                    <span className="text-[12px] text-purple-accent font-bold">{r.code}</span>
                  </div>
                </td>
                <td className="text-[12px] text-sub-text font-mono px-5 py-2.5">{val(r.y2, "%")}</td>
                <td className="text-[12px] text-sub-text font-mono px-5 py-2.5">{val(r.y10, "%")}</td>
                <td className={`text-[12px] font-mono px-5 py-2.5 ${spreadColor(r.diff)}`}>{r.diff === null ? "—" : val(r.diff, "%")}</td>
                <td className="text-[12px] text-sub-text font-mono px-5 py-2.5">{val(r.s2s10s, "%")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>

      <div className="bg-secondary border border-card-border rounded-lg p-5">
        <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">YIELD ANALYSE</div>
        <MarkdownBlock content={snap?.yield_narrative} />
        <div className="text-[9px] text-neutral-text mt-4">Bijgewerkt {fmtDate(y?.fetch_date)}</div>
      </div>
    </DashboardLayout>
  );
}
