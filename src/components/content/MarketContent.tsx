import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DataCard, SectionLabel, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { BarChart2, DollarSign, Package, Activity, AlertTriangle, Clock, Shield } from "lucide-react";

function DeltaLabel({ value, inverted = false }: { value: number | null | undefined; inverted?: boolean }) {
  if (value === null || value === undefined) return null;
  const positive = value > 0;
  const color = inverted ? (positive ? "#DC2626" : "#16A34A") : (positive ? "#16A34A" : "#DC2626");
  const sign = positive ? "+" : "";
  return <span className="text-[10px] font-mono font-bold" style={{ color }}>{sign}{value.toFixed(2)}%</span>;
}

function DeltaPts({ value, inverted = false }: { value: number | null | undefined; inverted?: boolean }) {
  if (value === null || value === undefined) return null;
  const positive = value > 0;
  const color = inverted ? (positive ? "#DC2626" : "#16A34A") : (positive ? "#16A34A" : "#DC2626");
  const sign = positive ? "+" : "";
  return <span className="text-[10px] font-mono font-bold" style={{ color }}>{sign}{Number(value).toFixed(2)}</span>;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function deriveRiskTone(vixRegime: string | null, creditRegime: string | null) {
  const vr = (vixRegime || "").toLowerCase();
  const cr = (creditRegime || "").toLowerCase();
  const vixHigh = vr === "elevated" || vr === "stress" || vr === "extreme" || vr === "crisis";
  const creditStress = cr.includes("stress") || cr.includes("crisis") || cr.includes("widening");
  if (vixHigh && creditStress) return { label: "RISK-OFF", color: "#DC2626", bg: "#FEF2F2" };
  if (vixHigh) return { label: "RISK-OFF LITE", color: "#D97706", bg: "#FFFBEB" };
  if ((cr.includes("low") || cr.includes("normal")) && vr === "low") return { label: "RISK-ON", color: "#16A34A", bg: "#F0FDF4" };
  return { label: "NEUTRAL", color: "#6B7280", bg: "#F5F5F5" };
}

export default function MarketContent() {
  const navigate = useNavigate();
  const [m, setM] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    const data = await queryWithRetry(() => supabase.from("v_market_delta").select("*").limit(1), "Market/v_market_delta");
    setM((data as any[])?.[0] || null);
    setLoaded(true);
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [fetchData]);

  if (loaded && !m) return <div className="text-center text-label text-[13px] mt-10">Nog geen marktdata beschikbaar</div>;
  if (!m) return <div className="text-center text-label text-[13px] mt-10">Laden...</div>;

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

  const creditImplication = (regime: string | null) => {
    const c = (regime || "").toLowerCase();
    if (c.includes("stress") || c.includes("crisis")) return "Credit spreads onder druk — verhoogd systemisch risico signaal";
    if (c.includes("elevated") || c.includes("widening")) return "Spreads verbreden — markt prijst hogere risicopremie in";
    if (c.includes("low") || c.includes("normal")) return "Normale credit spreads — geen systemisch stress signaal";
    return "Credit regime onbekend";
  };

  const risk = deriveRiskTone(m.vix_regime, m.credit_regime);
  const staleAge = daysSince(m.today_date);

  return (
    <>
      {staleAge > 1 && (
        <div className="flex items-center gap-2 bg-mixed-bg text-mixed-text px-4 py-2 rounded-lg mb-4 text-[11px] font-medium">
          <AlertTriangle size={14} />
          Marktdata bijgewerkt op {fmtDate(m.today_date)} — mogelijk verouderd
        </div>
      )}

      <div className="rounded-lg px-5 py-4 mb-6 border" style={{ backgroundColor: risk.bg, borderColor: risk.color + "33" }}>
        <div className="flex items-center gap-3">
          <Shield size={20} style={{ color: risk.color }} />
          <div>
            <div className="text-[10px] text-label uppercase tracking-wider font-medium">RISK TOON</div>
            <div className="text-[22px] font-extrabold uppercase" style={{ color: risk.color }}>{risk.label}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`${vixBadgeColor} px-2 py-[2px] text-[8px] rounded uppercase font-semibold`}>VIX {val(m.vix_regime)}</span>
            <span className={`${creditColor(m.credit_regime)} px-2 py-[2px] text-[8px] rounded uppercase font-semibold`}>CREDIT {val(m.credit_regime)}</span>
          </div>
        </div>
      </div>

      <SectionLabel>VOLATILITEIT & DOLLAR</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <DataCard className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={14} className="text-label" />
            <span className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium">VIX</span>
          </div>
          <div className="text-[36px] font-extrabold text-foreground font-mono mt-1">{val(m.vix)}</div>
          <div className="flex items-center gap-2 mt-2">
            <DeltaPts value={m.vix_delta} inverted />
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
          <div className="flex items-center gap-2 mt-2">
            <DeltaLabel value={m.dxy_pct} />
            {m.dxy_delta != null && <DeltaPts value={m.dxy_delta} />}
          </div>
        </DataCard>
      </div>

      <hr className="border-card-border mb-6" />

      <SectionLabel><span className="inline-flex items-center gap-1.5"><BarChart2 size={13} className="text-label" /> AANDELEN</span></SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { l: "SPX", v: m.spx, pct: m.spx_pct, delta: m.spx_delta },
          { l: "NDX", v: m.ndx, pct: m.ndx_pct, delta: m.ndx_delta },
          { l: "DJI", v: m.dji, pct: null, delta: null },
        ].map(({ l, v, pct }) => (
          <DataCard key={l} className="p-5">
            <div className="text-[24px] font-bold text-foreground font-mono">{val(v)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{l}</div>
            <div className="flex items-center gap-2 mt-1.5"><DeltaLabel value={pct} /></div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      <SectionLabel><span className="inline-flex items-center gap-1.5"><DollarSign size={13} className="text-label" /> FX</span></SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: "EURUSD", value: m.eurusd, pct: m.eurusd_pct, nav: "/currencies/EUR" },
          { label: "USDJPY", value: m.usdjpy, pct: m.usdjpy_pct, nav: "/currencies/JPY" },
          { label: "GBPUSD", value: m.gbpusd, pct: m.gbpusd_pct, nav: "/currencies/GBP" },
          { label: "AUDUSD", value: m.audusd, pct: m.audusd_delta, nav: "/currencies/AUD" },
        ].map(p => (
          <DataCard key={p.label} className="p-5" onClick={() => navigate(p.nav)}>
            <div className="text-[16px] font-bold text-foreground font-mono">{val(p.value)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{p.label}</div>
            <div className="mt-1"><DeltaLabel value={p.pct} /></div>
          </DataCard>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "NZDUSD", value: m.nzdusd, pct: m.nzdusd_delta, nav: "/currencies/NZD" },
          { label: "USDCAD", value: m.usdcad, pct: m.usdcad_delta, nav: "/currencies/CAD", inverted: true },
          { label: "USDCHF", value: m.usdchf, pct: m.usdchf_delta, nav: "/currencies/CHF", inverted: true },
        ].map(p => (
          <DataCard key={p.label} className="p-5" onClick={() => navigate(p.nav)}>
            <div className="text-[16px] font-bold text-foreground font-mono">{val(p.value)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{p.label}</div>
            <div className="mt-1"><DeltaPts value={p.pct} inverted={(p as any).inverted} /></div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      <SectionLabel><span className="inline-flex items-center gap-1.5"><Package size={13} className="text-label" /> GRONDSTOFFEN</span></SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {[
          { l: "GOLD", v: m.gold, pct: m.gold_pct },
          { l: "SILVER", v: m.silver, pct: m.silver_delta },
          { l: "OIL WTI", v: m.oil_wti || m.oil_brent, pct: m.oil_pct },
        ].map(({ l, v, pct }) => (
          <DataCard key={l} className="p-5">
            <div className="text-[16px] font-bold text-foreground font-mono">{val(v)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{l}</div>
            <div className="mt-1"><DeltaLabel value={pct} /></div>
          </DataCard>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { l: "OIL BRENT", v: m.oil_brent, pct: null },
          { l: "COPPER", v: m.copper, pct: m.copper_delta },
          { l: "NATGAS", v: m.natgas, pct: m.natgas_delta },
        ].map(({ l, v, pct }) => (
          <DataCard key={l} className="p-5">
            <div className="text-[16px] font-bold text-foreground font-mono">{val(v)}</div>
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mt-1">{l}</div>
            <div className="mt-1"><DeltaPts value={pct} /></div>
          </DataCard>
        ))}
      </div>

      <hr className="border-card-border mb-6" />

      <SectionLabel><span className="inline-flex items-center gap-1.5"><Activity size={13} className="text-label" /> CREDIT</span></SectionLabel>
      <div className="flex items-center gap-2 mb-3">
        <span className={`${creditColor(m.credit_regime)} px-3 py-1 text-[11px] rounded uppercase font-bold`}>{val(m.credit_regime)}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-1">HY SPREAD</div>
          <div className="text-[20px] font-bold text-foreground font-mono">{val(m.hy_spread)}</div>
          <div className="mt-1"><DeltaPts value={m.hy_delta} inverted /></div>
        </DataCard>
        <DataCard className="p-5">
          <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] font-medium mb-1">BBB SPREAD</div>
          <div className="text-[20px] font-bold text-foreground font-mono">{val(m.bbb_spread)}</div>
        </DataCard>
      </div>
      <div className="text-[10px] text-sub-text italic mb-8">{creditImplication(m.credit_regime)}</div>

      <div className="flex items-center gap-1.5 text-[9px] text-label">
        <Clock size={10} />
        Bijgewerkt {fmtDate(m.today_date)}
      </div>
    </>
  );
}
