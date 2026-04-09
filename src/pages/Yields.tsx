import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, MarkdownBlock, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { TrendingUp, TrendingDown, Minus, Percent, DollarSign, Activity } from "lucide-react";

/* Curve shape inline SVG glyph — 40x20 */
function CurveGlyph({ regime }: { regime: string | null }) {
  const r = (regime || "").toLowerCase();
  let d = "M4 10 L36 10"; // flat
  if (r.includes("steep")) d = "M4 16 L20 10 L36 4";
  else if (r.includes("invert")) d = "M4 4 L20 10 L36 16";
  return (
    <svg width={40} height={20} viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={d} stroke="#7C3AED" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function curveIcon(regime: string | null) {
  const r = (regime || "").toLowerCase();
  if (r.includes("steep")) return TrendingUp;
  if (r.includes("invert")) return TrendingDown;
  return Minus;
}

function curveIconColor(regime: string | null) {
  const r = (regime || "").toLowerCase();
  if (r.includes("steep")) return "text-bullish-text";
  if (r.includes("invert")) return "text-bearish-text";
  return "text-label";
}

const spreadColor = (v: any) => {
  if (v === null || v === undefined) return "";
  return Number(v) > 0 ? "text-bullish-text" : Number(v) < 0 ? "text-bearish-text" : "";
};

export default function Yields() {
  const navigate = useNavigate();
  const [y, setY] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queryWithRetry(() => supabase.from("yields_live").select("*").order("fetch_date", { ascending: false }).limit(1), "Yields/yields_live")
      .then(data => { setY((data as any[])?.[0] || null); setLoaded(true); });
  }, []);

  if (loaded && !y) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Nog geen yield data beschikbaar</div></DashboardLayout>;
  if (!y) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Laden...</div></DashboardLayout>;

  const CurveIcon = curveIcon(y.curve_regime);
  const cColor = curveIconColor(y.curve_regime);

  const rows = [
    { code: "USD", y2: y.us_2y, y10: y.us_10y, diff: null, s2s10s: y.us_2s10s },
    { code: "EUR", y2: y.eur_2y, y10: y.eur_10y, diff: y.diff_eur_10y, s2s10s: y.eur_2s10s },
    { code: "JPY", y2: y.jpy_2y, y10: y.jpy_10y, diff: y.diff_jpy_10y, s2s10s: y.jpy_2s10s },
    { code: "GBP", y2: y.gbp_2y, y10: y.gbp_10y, diff: y.diff_gbp_10y, s2s10s: y.gbp_2s10s },
    { code: "AUD", y2: y.aud_2y, y10: y.aud_10y, diff: y.diff_aud_10y, s2s10s: y.aud_2s10s },
    { code: "CAD", y2: y.cad_2y, y10: y.cad_10y, diff: y.diff_cad_10y, s2s10s: y.cad_2s10s },
    { code: "NZD", y2: y.nzd_2y, y10: y.nzd_10y, diff: y.diff_nzd_10y, s2s10s: y.nzd_2s10s },
    { code: "CHF", y2: y.chf_2y, y10: y.chf_10y, diff: y.diff_chf_10y, s2s10s: y.chf_2s10s },
  ];

  return (
    <DashboardLayout>
      {/* 1. TOP CARDS — US Treasury */}
      <SectionLabel>US TREASURY CURVE</SectionLabel>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "2 JAAR", value: y.us_2y, sub: null },
          { label: "5 JAAR", value: y.us_5y, sub: null },
          { label: "10 JAAR", value: y.us_10y, sub: y.us_real_10y != null ? `Reëel: ${y.us_real_10y}%` : null },
          { label: "30 JAAR", value: y.us_30y, sub: null },
        ].map(item => (
          <DataCard key={item.label} className="p-5">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent size={13} className="text-label" />
              <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">{item.label}</span>
            </div>
            <div className="text-[22px] font-bold text-foreground font-mono mt-1">{val(item.value, "%")}</div>
            {item.sub && <div className="text-[10px] text-label mt-1">{item.sub}</div>}
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      {/* 2. CURVE REGIME BANNER */}
      <DataCard className="p-5 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <CurveIcon size={20} className={cColor} />
          <span className={`text-[20px] font-extrabold uppercase ${cColor}`}>{val(y.curve_regime)}</span>
          <CurveGlyph regime={y.curve_regime} />
          {y.curve_signal && (
            <span className="text-[11px] text-sub-text ml-2">{y.curve_signal}</span>
          )}
        </div>
        {y.curve_interpretation && (
          <div className="text-[12px] text-sub-text leading-relaxed mt-3 max-w-[680px]">{y.curve_interpretation}</div>
        )}
      </DataCard>

      <hr className="border-card-border mb-6" />

      {/* 3. KEY METRICS */}
      <SectionLabel>KEY METRICS</SectionLabel>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "2S10S", value: y.us_2s10s, colored: true },
          { label: "REËEL 10J", value: y.us_real_10y, colored: false },
          { label: "BREAKEVEN 10J", value: y.breakeven_10y, colored: false },
          { label: "3M10Y", value: y.us_3m10y, colored: true },
        ].map(item => (
          <DataCard key={item.label} className="p-5">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-1">{item.label}</div>
            <div className={`text-[18px] font-bold font-mono mt-1 ${item.colored ? spreadColor(item.value) || "text-foreground" : "text-foreground"}`}>
              {val(item.value, "%")}
            </div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      {/* 4. G10 YIELDS TABLE */}
      <SectionLabel>G10 YIELDS</SectionLabel>
      <DataCard className="overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2.5">Currency</th>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2.5">2Y</th>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2.5">10Y</th>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2.5">Spread vs USD</th>
              <th className="text-[9px] text-label uppercase text-left px-5 py-2.5">2s10s</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.code} className="border-b border-card-border last:border-b-0 hover:bg-secondary cursor-pointer" onClick={() => navigate(`/currencies/${r.code}`)}>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={12} className="text-purple-accent" />
                    <span className="text-[12px] text-purple-accent font-bold">{r.code}</span>
                  </div>
                </td>
                <td className="text-[12px] text-sub-text font-mono px-5 py-2.5">{val(r.y2, "%")}</td>
                <td className="text-[12px] text-sub-text font-mono px-5 py-2.5">{val(r.y10, "%")}</td>
                <td className={`text-[12px] font-mono px-5 py-2.5 ${spreadColor(r.diff)}`}>{r.diff === null ? "—" : val(r.diff, "%")}</td>
                <td className={`text-[12px] font-mono px-5 py-2.5 ${spreadColor(r.s2s10s)}`}>{val(r.s2s10s, "%")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>

      <hr className="border-card-border mb-6" />

      {/* 5. YIELD ANALYSIS */}
      <div className="flex items-center gap-1.5 mb-3">
        <Activity size={15} className="text-label" />
        <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">YIELD ANALYSE</span>
      </div>
      <div className="bg-secondary border border-card-border rounded-lg p-5">
        <div className="text-[13px] text-sub-text leading-[1.7] max-w-[680px]">
          {y.curve_interpretation ? y.curve_interpretation : <span className="italic text-label">Nog geen analyse beschikbaar</span>}
        </div>
        <div className="text-[9px] text-label mt-4">Bijgewerkt {fmtDate(y.fetch_date)}</div>
      </div>
    </DashboardLayout>
  );
}
