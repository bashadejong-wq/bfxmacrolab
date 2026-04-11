import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { Sparkline } from "@/components/Sparkline";
import {
  TrendingUp, Activity, BarChart2, Users, Percent,
  Flame, Eye, Droplets, DollarSign, MoreHorizontal
} from "lucide-react";

const COUNTRIES = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF","CNY","SEK"];

const KPI_ICONS: Record<string, React.ElementType> = {
  BBP: TrendingUp, CPI: Activity, PMI: BarChart2, WERKLOOSHEID: Users, BELEIDSRENTE: Percent,
};

const CAT_ICONS: Record<string, React.ElementType> = {
  employment: Users, growth: TrendingUp, inflation: Flame,
  leading: Eye, liquidity: Droplets, money_markets: DollarSign,
};
function catIcon(cat: string) {
  const k = cat.toLowerCase().replace(/\s+/g, "_");
  for (const [key, Icon] of Object.entries(CAT_ICONS)) { if (k.includes(key)) return Icon; }
  return MoreHorizontal;
}

function trendColor(current: any, prev: any) {
  if (current == null || prev == null) return "";
  const c = Number(current), p = Number(prev);
  if (isNaN(c) || isNaN(p)) return "";
  if (c > p) return "text-bullish-text";
  if (c < p) return "text-bearish-text";
  return "text-label";
}

export default function MacroData() {
  const [activeCountry, setActiveCountry] = useState("USD");
  const [indicators, setIndicators] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    queryWithRetry(() =>
      supabase.from("macro_dashboard_indicators").select("*")
        .eq("country_code", activeCountry)
        .order("category").order("indicator_name"),
      `MacroData/${activeCountry}`
    ).then(data => { setIndicators((data as any[]) || []); setLoaded(true); });
  }, [activeCountry]);

  const findByKey = (keywords: string[]) =>
    indicators.find(ind => keywords.some(k => (ind.indicator_key || "").toLowerCase().includes(k)));

  const kpis = [
    { label: "BBP", item: findByKey(["gdp"]) },
    { label: "CPI", item: findByKey(["cpi"]) },
    { label: "PMI", item: findByKey(["ism","nmi","pmi"]) },
    { label: "WERKLOOSHEID", item: findByKey(["_ur","unemployment"]) },
    { label: "BELEIDSRENTE", item: findByKey(["bank_rate","fedfunds","policy_rate"]) },
  ];

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    indicators.forEach(ind => {
      const cat = ind.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ind);
    });
    return groups;
  }, [indicators]);

  const catOrder = ["employment","growth","inflation","leading","liquidity","money_markets","other"];
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const ai = catOrder.indexOf(a.toLowerCase()); const bi = catOrder.indexOf(b.toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <DashboardLayout>
      {/* Country selector */}
      <div className="bg-card border-b border-card-border px-4 md:px-7 flex overflow-x-auto -mx-4 md:-mx-7 -mt-4 md:-mt-7 mb-8">
        {COUNTRIES.map(c => (
          <button key={c} onClick={() => setActiveCountry(c)}
            className={`px-3 md:px-4 py-3 text-[12px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
              c === activeCountry ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
            }`}>{c}</button>
        ))}
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {kpis.map(kpi => {
          const Icon = KPI_ICONS[kpi.label] || BarChart2;
          const color = trendColor(kpi.item?.latest, kpi.item?.t_minus_1);
          return (
            <DataCard key={kpi.label} className="p-5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={14} className="text-label" />
                <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">{kpi.label}</span>
              </div>
              <div className={`text-[22px] font-extrabold font-mono mt-1 ${color || "text-foreground"}`}>
                {val(kpi.item?.latest)}
              </div>
              {kpi.item?.unit && <div className="text-[9px] text-label mt-0.5">{kpi.item.unit}</div>}
            </DataCard>
          );
        })}
      </div>

      <hr className="border-card-border mb-6" />

      {/* Data table */}
      {loaded && indicators.length === 0 ? (
        <div className="text-center text-label text-[14px] mt-10">Geen macro data beschikbaar voor deze selectie</div>
      ) : indicators.length > 0 && (
        <DataCard className="overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary">
                <th className="text-[9px] text-label uppercase text-left px-5 py-2.5 tracking-wide">Indicator</th>
                <th className="text-[9px] text-label uppercase text-center px-3 py-2.5 tracking-wide">Trend</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2.5 tracking-wide">T-3</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2.5 tracking-wide">T-2</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2.5 tracking-wide">T-1</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2.5 tracking-wide font-bold">Huidig</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2.5 tracking-wide">Gem.</th>
                <th className="text-[9px] text-label uppercase text-left px-5 py-2.5 tracking-wide">Datum</th>
              </tr>
            </thead>
            {sortedCats.map(category => {
              const CatIcon = catIcon(category);
              const items = grouped[category];
              return (
                <tbody key={category}>
                  {/* Category header row */}
                  <tr>
                    <td colSpan={8} className="px-5 py-2 bg-secondary">
                      <div className="flex items-center gap-1.5">
                        <CatIcon size={13} className="text-purple-accent" />
                        <span className="text-[0.65rem] text-purple-accent uppercase font-bold tracking-[0.1em]">{category}</span>
                      </div>
                    </td>
                  </tr>
                  {items.map((ind: any, i: number) => {
                    const color = trendColor(ind.latest, ind.t_minus_1);
                    return (
                      <tr key={`${category}-${i}`}
                        className={`border-b border-card-border ${i % 2 === 1 ? "bg-secondary/50" : "bg-card"}`}>
                         <td className="text-[11px] text-sub-text px-5 py-2">{val(ind.indicator_name)}</td>
                        <td className="px-3 py-2 text-center">
                          <Sparkline values={[ind.t_minus_6, ind.t_minus_5, ind.t_minus_4, ind.t_minus_3, ind.t_minus_2, ind.t_minus_1, ind.latest]} />
                        </td>
                        <td className="text-[11px] text-label font-mono px-5 py-2">{val(ind.t_minus_3)}</td>
                        <td className="text-[11px] text-label font-mono px-5 py-2">{val(ind.t_minus_2)}</td>
                        <td className="text-[11px] text-label font-mono px-5 py-2">{val(ind.t_minus_1)}</td>
                        <td className={`text-[12px] font-mono font-bold px-5 py-2 ${color || "text-foreground"}`}>{val(ind.latest)}</td>
                        <td className="text-[11px] text-label font-mono px-5 py-2">{val(ind.mean_7c)}</td>
                        <td className="text-[11px] text-label px-5 py-2">{fmtDate(ind.latest_date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </DataCard>
      )}
    </DashboardLayout>
  );
}
