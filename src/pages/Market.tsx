import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { BarChart2, DollarSign, Package, Activity, AlertTriangle } from "lucide-react";

export default function Market() {
  const navigate = useNavigate();
  const [m, setM] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    const data = await queryWithRetry(() => supabase.from("market_data_live").select("*").order("fetch_date", { ascending: false }).limit(1), "Market/market_data_live");
    setM((data as any[])?.[0] || null);
    setLoaded(true);
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [fetchData]);

  if (loaded && !m) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Nog geen marktdata beschikbaar</div></DashboardLayout>;
  if (!m) return <DashboardLayout><div className="text-center text-label text-[13px] mt-10">Laden...</div></DashboardLayout>;

  const vr = (m.vix_regime || "").toLowerCase();
  const vixElevated = vr === "elevated" || vr === "stress" || vr === "extreme" || vr === "crisis";
  const vixBadgeColor = vr === "low" ? "bg-bullish-bg text-bullish-text"
    : vr === "elevated" ? "bg-mixed-bg text-mixed-text"
    : vr === "stress" || vr === "extreme" || vr === "crisis" ? "bg-bearish-bg text-bearish-text"
    : "bg-neutral-bg text-neutral-text";

  const creditColor = (regime: string | null) => {
    const c = (regime || "").toLowerCase();
    if (c.includes("low") || c.includes("normal")) return "bg-bullish-bg text-bullish-text";
    if (c.includes("elevated") || c.includes("widening")) return "bg-mixed-bg text-mixed-text";
    if (c.includes("stress") || c.includes("crisis")) return "bg-bearish-bg text-bearish-text";
    return "bg-neutral-bg text-neutral-text";
  };

  return (
    <DashboardLayout>
      {/* 1. VOLATILITY & DOLLAR */}
      <SectionLabel>VOLATILITEIT & DOLLAR</SectionLabel>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VIX</span>
          </div>
          <div className="text-[36px] font-extrabold text-foreground font-mono mt-1">{val(m.vix)}</div>
          <div className="flex items-center gap-1.5 mt-2">
            {vixElevated && <AlertTriangle size={13} className="text-bearish-text" />}
            <span className={`${vixBadgeColor} px-2 py-[2px] text-[9px] rounded uppercase font-semibold`}>{val(m.vix_regime)}</span>
          </div>
        </DataCard>
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">DXY</span>
          </div>
          <div className="text-[36px] font-extrabold text-foreground font-mono mt-1">{val(m.dxy)}</div>
          {m.dxy_trade_weighted != null && (
            <div className="text-[10px] text-label mt-2">Trade-weighted: {m.dxy_trade_weighted}</div>
          )}
        </DataCard>
      </div>

      <hr className="border-card-border mb-6" />

      {/* 2. EQUITIES */}
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5"><BarChart2 size={13} className="text-label" /> AANDELEN</span>
      </SectionLabel>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[["SPX", m.spx],["NDX", m.ndx],["DJI", m.dji]].map(([l, v]) => (
          <DataCard key={l as string} className="p-5">
            <div className="text-[24px] font-bold text-foreground font-mono">{val(v)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{l}</div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      {/* 3. FX */}
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5"><DollarSign size={13} className="text-label" /> FX</span>
      </SectionLabel>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "EURUSD", value: m.eurusd, nav: "/currencies/EUR" },
          { label: "USDJPY", value: m.usdjpy, nav: "/currencies/JPY" },
          { label: "GBPUSD", value: m.gbpusd, nav: "/currencies/GBP" },
          { label: "AUDUSD", value: m.audusd, nav: "/currencies/AUD" },
        ].map(p => (
          <DataCard key={p.label} className="p-5" onClick={() => navigate(p.nav)}>
            <div className="text-[16px] font-bold text-foreground font-mono">{val(p.value)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{p.label}</div>
          </DataCard>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "NZDUSD", value: m.nzdusd, nav: "/currencies/NZD" },
          { label: "USDCAD", value: m.usdcad, nav: "/currencies/CAD" },
          { label: "USDCHF", value: m.usdchf, nav: "/currencies/CHF" },
        ].map(p => (
          <DataCard key={p.label} className="p-5" onClick={() => navigate(p.nav)}>
            <div className="text-[16px] font-bold text-foreground font-mono">{val(p.value)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{p.label}</div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      {/* 4. COMMODITIES */}
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5"><Package size={13} className="text-label" /> GRONDSTOFFEN</span>
      </SectionLabel>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[["GOLD", m.gold],["SILVER", m.silver],["OIL WTI", m.oil_wti]].map(([l, v]) => (
          <DataCard key={l as string} className="p-5">
            <div className="text-[16px] font-bold text-foreground font-mono">{val(v)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{l}</div>
          </DataCard>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[["OIL BRENT", m.oil_brent],["COPPER", m.copper],["NATGAS", m.natgas]].map(([l, v]) => (
          <DataCard key={l as string} className="p-5">
            <div className="text-[16px] font-bold text-foreground font-mono">{val(v)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{l}</div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      {/* 5. CREDIT */}
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5"><Activity size={13} className="text-label" /> CREDIT</span>
      </SectionLabel>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-1">HY SPREAD</div>
          <div className="text-[20px] font-bold text-foreground font-mono">{val(m.hy_spread)}</div>
        </DataCard>
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-1">BBB SPREAD</div>
          <div className="text-[20px] font-bold text-foreground font-mono">{val(m.bbb_spread)}</div>
        </DataCard>
      </div>
      <div className="flex items-center gap-2 mb-8">
        <span className={`${creditColor(m.credit_regime)} px-2 py-[2px] text-[9px] rounded uppercase font-semibold`}>{val(m.credit_regime)}</span>
      </div>

      {/* Updated */}
      <div className="text-[9px] text-label">Bijgewerkt {fmtDate(m.fetch_date)}</div>
    </DashboardLayout>
  );
}
