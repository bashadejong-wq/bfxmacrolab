import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val } from "@/components/ui-helpers";

const COUNTRIES = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF","CNY","SEK"];

export default function MacroData() {
  const [activeCountry, setActiveCountry] = useState("USD");
  const [indicators, setIndicators] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("macro_dashboard_indicators").select("*").eq("country_code", activeCountry).order("category", { ascending: true })
      .then(({ data }) => setIndicators(data || []));
  }, [activeCountry]);

  const findByKey = (keywords: string[]) => {
    return indicators.find(ind => keywords.some(k => (ind.indicator_key || "").toLowerCase().includes(k)));
  };

  const kpis = [
    { label: "BBP", item: findByKey(["gdp"]) },
    { label: "CPI", item: findByKey(["cpi"]) },
    { label: "PMI", item: findByKey(["ism","nmi","pmi"]) },
    { label: "WERKLOOSHEID", item: findByKey(["_ur","unemployment"]) },
    { label: "BELEIDSRENTE", item: findByKey(["bank_rate","fedfunds"]) },
  ];

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    indicators.forEach((ind) => {
      const cat = ind.category || "Overig";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ind);
    });
    return groups;
  }, [indicators]);

  return (
    <DashboardLayout>
      {/* Country Selector */}
      <div className="mb-5">
        <select
          value={activeCountry}
          onChange={(e) => setActiveCountry(e.target.value)}
          className="bg-card border border-card-border rounded-lg px-[14px] py-[10px] text-foreground text-[13px]"
        >
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {kpis.map((kpi) => (
          <DataCard key={kpi.label} className="p-[16px_18px]">
            <div className="text-[9px] text-label uppercase">{kpi.label}</div>
            <div className="text-[22px] font-extrabold text-foreground font-mono mt-1">{val(kpi.item?.latest)}</div>
          </DataCard>
        ))}
      </div>

      {/* Data Table */}
      {indicators.length === 0 ? (
        <div className="text-center text-label text-[13px] mt-10">Geen data voor {activeCountry}</div>
      ) : (
        <DataCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Indicator</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">T-3</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">T-2</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">T-1</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2 font-bold">Huidig</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Gem.</th>
                <th className="text-[9px] text-label uppercase text-left px-4 py-2">Datum</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([category, items]) => (
                <>
                  <tr key={`cat-${category}`} className="bg-secondary">
                    <td colSpan={7} className="px-4 py-2 text-[9px] text-purple-accent uppercase font-bold tracking-[0.1em]">{category}</td>
                  </tr>
                  {items.map((ind: any, i: number) => (
                    <tr key={`${category}-${i}`} className="border-b border-card-border hover:bg-secondary">
                      <td className="text-[11px] text-sub-text px-4 py-2">{val(ind.indicator_name)}</td>
                      <td className="text-[11px] text-sub-text font-mono px-4 py-2">{val(ind.t_minus_3)}</td>
                      <td className="text-[11px] text-sub-text font-mono px-4 py-2">{val(ind.t_minus_2)}</td>
                      <td className="text-[11px] text-sub-text font-mono px-4 py-2">{val(ind.t_minus_1)}</td>
                      <td className="text-[11px] text-foreground font-mono font-bold px-4 py-2">{val(ind.latest)}</td>
                      <td className="text-[11px] text-sub-text font-mono px-4 py-2">{val(ind.mean_7c)}</td>
                      <td className="text-[11px] text-sub-text px-4 py-2">{val(ind.latest_date)}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </DataCard>
      )}
    </DashboardLayout>
  );
}
