import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { BarChart2, DollarSign, Package, Percent, TrendingUp, TrendingDown } from "lucide-react";

export default function Market() {
  const navigate = useNavigate();
  const [m, setM] = useState<any>(null);

  const fetchData = useCallback(async () => {
    const data = await queryWithRetry(() => supabase.from("market_data_live").select("*").order("fetch_date", { ascending: false }).limit(1), "Market/market_data_live");
    setM((data as any[])?.[0] || null);
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [fetchData]);

  const vixRegimeColor = (r: string | null) => {
    const v = (r || "").toLowerCase();
    return v === "elevated" ? "text-mixed-text" : v === "extreme" ? "text-bearish-text" : v === "low" ? "text-bullish-text" : "text-label";
  };

  return (
    <DashboardLayout>
      <SectionLabel>VOLATILITY & DOLLAR</SectionLabel>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart2 size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase">VIX</span>
          </div>
          <div className="text-[36px] font-extrabold text-foreground font-mono mt-1">{val(m?.vix)}</div>
          <div className={`text-[11px] font-bold mt-1 ${vixRegimeColor(m?.vix_regime)}`}>{val(m?.vix_regime)}</div>
        </DataCard>
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase">DXY</span>
          </div>
          <div className="text-[36px] font-extrabold text-foreground font-mono mt-1">{val(m?.dxy_trade_weighted || m?.dxy)}</div>
        </DataCard>
      </div>

      <SectionLabel>EQUITIES</SectionLabel>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[["SPX", m?.spx],["NDX", m?.ndx],["DJI", m?.dji]].map(([l,v]) => (
          <DataCard key={l as string} className="p-5">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart2 size={12} className="text-label" />
              <span className="text-[0.65rem] text-label uppercase">{l}</span>
            </div>
            <div className="text-[24px] font-bold text-foreground font-mono mt-1">{val(v)}</div>
          </DataCard>
        ))}
      </div>

      <SectionLabel>FX</SectionLabel>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "EURUSD", value: m?.eurusd, nav: "/currencies/EUR" },
          { label: "USDJPY", value: m?.usdjpy, nav: "/currencies/JPY" },
          { label: "GBPUSD", value: m?.gbpusd, nav: "/currencies/GBP" },
          { label: "AUDUSD", value: m?.audusd, nav: "/currencies/AUD" },
        ].map((p) => (
          <DataCard key={p.label} className="p-5" onClick={() => navigate(p.nav)}>
            <div className="flex items-center gap-1.5 mb-1"><DollarSign size={12} className="text-label" /><span className="text-[0.65rem] text-label uppercase">{p.label}</span></div>
            <div className="text-[15px] font-bold text-foreground font-mono mt-1">{val(p.value)}</div>
          </DataCard>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "NZDUSD", value: m?.nzdusd, nav: "/currencies/NZD" },
          { label: "USDCAD", value: m?.usdcad, nav: "/currencies/CAD" },
          { label: "USDCHF", value: m?.usdchf, nav: "/currencies/CHF" },
          { label: "BTCUSD", value: m?.btcusd, nav: "" },
        ].map((p) => (
          <DataCard key={p.label} className="p-5" onClick={p.nav ? () => navigate(p.nav) : undefined}>
            <div className="flex items-center gap-1.5 mb-1"><DollarSign size={12} className="text-label" /><span className="text-[0.65rem] text-label uppercase">{p.label}</span></div>
            <div className="text-[15px] font-bold text-foreground font-mono mt-1">{val(p.value)}</div>
          </DataCard>
        ))}
      </div>

      <SectionLabel>COMMODITIES</SectionLabel>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[["GOLD", m?.gold],["SILVER", m?.silver],["OIL WTI", m?.oil_wti]].map(([l,v]) => (
          <DataCard key={l as string} className="p-5">
            <div className="flex items-center gap-1.5 mb-1"><Package size={12} className="text-label" /><span className="text-[0.65rem] text-label uppercase">{l}</span></div>
            <div className="text-[15px] font-bold text-foreground font-mono mt-1">{val(v)}</div>
          </DataCard>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[["OIL BRENT", m?.oil_brent],["COPPER", m?.copper],["NATGAS", m?.natgas]].map(([l,v]) => (
          <DataCard key={l as string} className="p-5">
            <div className="flex items-center gap-1.5 mb-1"><Package size={12} className="text-label" /><span className="text-[0.65rem] text-label uppercase">{l}</span></div>
            <div className="text-[15px] font-bold text-foreground font-mono mt-1">{val(v)}</div>
          </DataCard>
        ))}
      </div>

      <SectionLabel>CREDIT</SectionLabel>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-1"><Percent size={12} className="text-label" /><span className="text-[0.65rem] text-label uppercase">HY SPREAD</span></div>
          <div className="text-[18px] font-bold text-foreground font-mono mt-1">{val(m?.hy_spread)}</div>
          <div className="text-[9px] text-label mt-1">{val(m?.credit_regime)}</div>
        </DataCard>
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-1"><Percent size={12} className="text-label" /><span className="text-[0.65rem] text-label uppercase">BBB SPREAD</span></div>
          <div className="text-[18px] font-bold text-foreground font-mono mt-1">{val(m?.bbb_spread)}</div>
        </DataCard>
      </div>

      <div className="text-[9px] text-neutral-text">Bijgewerkt {fmtDate(m?.fetch_date)}</div>
    </DashboardLayout>
  );
}
