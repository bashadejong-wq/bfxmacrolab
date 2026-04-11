import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, BiasChip, ConfidenceChip, MarkdownBlock, LabelValue, fmtDate, queryWithRetry, getBiasColor, getBiasBackground } from "@/components/ui-helpers";
import { DollarSign, Star, TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, Eye, Zap, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CorrelationsContent from "@/components/content/CorrelationsContent";

const CURRENCIES = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

const SENSITIVITY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  vix: { bg: "#FFFBEB", color: "#D97706", label: "VIX" },
  oil: { bg: "#FFF7ED", color: "#EA580C", label: "OLIE" },
  gold: { bg: "#FAF5FF", color: "#7C3AED", label: "GOUD" },
  equity: { bg: "#FEF2F2", color: "#DC2626", label: "AANDELEN" },
  commodity: { bg: "#F5F5F5", color: "#6B7280", label: "COMMODITIES" },
};

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  const s = score ?? 0;
  const pct = Math.min(Math.max((s / 10) * 100, 0), 100);
  const color = s >= 7 ? "#16A34A" : s >= 4 ? "#D97706" : "#DC2626";
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] text-label uppercase tracking-wider font-medium">{label}</span>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{s > 0 ? s : "—"}</span>
      </div>
      <div className="w-full h-[3px] rounded-full bg-[#E5E7EB] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function SensitivityPill({ type, value }: { type: string; value: string | null }) {
  const style = SENSITIVITY_STYLES[type] || SENSITIVITY_STYLES.commodity;
  const v = (value || "").toLowerCase();
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-md" style={{ backgroundColor: style.bg }}>
      <span className="text-[9px] font-bold uppercase" style={{ color: style.color }}>{style.label}</span>
      <span className="text-[10px] font-semibold uppercase" style={{ color: style.color }}>{val(value)}</span>
    </div>
  );
}


export default function Currencies() {
  const { code } = useParams();
  const navigate = useNavigate();
  const activeCurrency = (code || "USD").toUpperCase();

  const [snap, setSnap] = useState<any>(null);
  const [ranking, setRanking] = useState<any>(null);
  const [biasHistory, setBiasHistory] = useState<any[]>([]);
  const [fxRanking, setFxRanking] = useState<any[]>([]);
  const [yieldData, setYieldData] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([
      queryWithRetry(
        () => supabase.from("latest_currency_macro").select("*").eq("currency_code", activeCurrency).limit(1),
        `Currencies/snap/${activeCurrency}`
      ),
      queryWithRetry(
        () => supabase.from("v_fx_currency_ranking").select("*").eq("entity_code", activeCurrency).limit(1),
        `Currencies/ranking/${activeCurrency}`
      ),
      queryWithRetry(
        () => supabase.from("entity_bias").select("*").eq("entity_code", activeCurrency).order("snap_date", { ascending: false }).limit(5),
        `Currencies/entity_bias/${activeCurrency}`
      ),
      queryWithRetry(
        () => supabase.from("v_fx_currency_ranking").select("*").order("rank", { ascending: true }).limit(8),
        "Currencies/fx_ranking"
      ),
      queryWithRetry(
        () => supabase.from("v_yield_pattern_intelligence").select("*").limit(1),
        "Currencies/yield_pattern"
      ),
    ]).then(([s, r, b, g, y]) => {
      setSnap((s as any[])?.[0] || null);
      setRanking((r as any[])?.[0] || null);
      setBiasHistory((b as any[]) || []);
      setFxRanking((g as any[]) || []);
      setYieldData((y as any[])?.[0] || null);
      setLoaded(true);
    });
  }, [activeCurrency]);

  const effectiveBias = ranking?.bias_label || snap?.bias || biasHistory[0]?.bias || null;
  const r = ranking; // alias
  const ccy = activeCurrency.toLowerCase();

  // Yield fields mapped per currency
  const yieldInfo = yieldData ? {
    y2: yieldData[`${ccy}_2y`],
    y10: yieldData[`${ccy}_10y`],
    spread: yieldData[`${ccy}_spread_vs_usd`] ?? yieldData[`diff_${ccy}_10y`],
    pattern: yieldData[`${ccy}_yield_pattern`],
    fxImpl: yieldData[`${ccy}_fx_implication`],
    s2s10s: yieldData[`${ccy}_2s10s`],
  } : {};

  // Fallback for yields from snap
  const y2 = yieldInfo.y2 ?? snap?.yield_2y;
  const y10 = yieldInfo.y10 ?? snap?.yield_10y;
  const spreadVsUsd = yieldInfo.spread ?? snap?.rate_diff_vs_usd;
  const yieldPattern = yieldInfo.pattern ?? r?.currency_yield_regime ?? snap?.currency_yield_regime;
  const fxImplication = yieldInfo.fxImpl;

  const spreadColor = (v: any) => {
    if (v == null || v === "—") return "#6B7280";
    const n = typeof v === "number" ? v : parseFloat(v);
    if (isNaN(n)) return "#6B7280";
    return n > 0 ? "#16A34A" : n < 0 ? "#DC2626" : "#6B7280";
  };

  const fallbackEmpty = (v: any, fallback: string) => {
    if (!v || v === "" || v === "null" || v === "undefined" || (typeof v === "string" && v.trim() === "")) return fallback;
    return v;
  };

  return (
    <DashboardLayout>
      {/* Currency tabs */}
      <div className="bg-card border-b border-card-border px-4 md:px-7 flex overflow-x-auto -mx-4 md:-mx-7 -mt-4 md:-mt-7 mb-5">
        {CURRENCIES.map((c) => (
          <button key={c} onClick={() => navigate(`/currencies/${c}`)}
            className={`px-3 md:px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
              c === activeCurrency ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
            }`}>{c}</button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loaded && !snap && !ranking ? (
            <div className="text-center text-label text-[13px] mt-10">
              Nog geen snapshot beschikbaar voor {activeCurrency}
            </div>
          ) : (snap || ranking) && (
            <>
              {/* 1. CURRENCY HEADER */}
              <DataCard className="px-4 py-3 mb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-purple-accent" />
                      <span className="text-[32px] font-black text-foreground tracking-tight">{activeCurrency}</span>
                    </div>
                    <BiasChip bias={effectiveBias} />
                    {r?.conviction && (
                      <span className="bg-secondary text-label px-2 py-[2px] text-[9px] rounded uppercase font-semibold">
                        conviction: {r.conviction}
                      </span>
                    )}
                    {r?.rank && (
                      <span className="bg-purple-accent/10 text-purple-accent px-2 py-[2px] text-[9px] rounded font-mono font-bold">
                        #{r.rank} / 8
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-label">{fmtDate(r?.snapshot_date || snap?.snapshot_date)}</div>
                </div>
                {(r?.main_driver || snap?.main_driver) && (
                  <div className="flex items-center gap-2 mt-2 border-t border-card-border pt-2">
                    <Shield size={11} className="text-purple-accent shrink-0" />
                    <span className="text-[11px] text-foreground font-semibold">Driver: {r?.main_driver || snap?.main_driver}</span>
                  </div>
                )}
                {snap?.summary_short && (
                  <div className="text-[11px] text-sub-text italic leading-relaxed mt-1.5 max-w-[720px]">{snap.summary_short}</div>
                )}
              </DataCard>

              {/* 2. MACRO PILLARS */}
              <SectionLabel>MACRO PILLARS</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {[
                  { label: "GROEI", score: r?.score_growth, direction: snap?.growth_now || snap?.growth_expectation, narrative: snap?.growth_now ? `Nu: ${snap.growth_now}` : null },
                  { label: "INFLATIE", score: r?.score_inflation, direction: snap?.inflation_now || snap?.inflation_expectation, narrative: snap?.inflation_now ? `Nu: ${snap.inflation_now}` : null },
                  { label: "CENTRALE BANK", score: r?.score_cb, direction: r?.cb_stance || snap?.cb_stance, narrative: r?.cb_direction || snap?.cb_direction ? `Richting: ${r?.cb_direction || snap?.cb_direction}` : null },
                  { label: "LIQUIDITEIT", score: r?.score_liquidity, direction: snap?.liquidity_conditions || snap?.liquidity_impact, narrative: null },
                ].map(({ label, score, direction, narrative }) => (
                  <DataCard key={label} className="px-3 py-3">
                    <ScoreBar score={score} label={label} />
                    {direction && <div className="text-[10px] text-sub-text mt-1.5 truncate">{val(direction)}</div>}
                    {narrative && <div className="text-[9px] text-label mt-0.5">{narrative}</div>}
                  </DataCard>
                ))}
              </div>

              {/* Macro fundamentals text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <DataCard className="px-3 py-3">
                  <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1.5">GROEI</div>
                  <div className="grid grid-cols-2 gap-3">
                    <LabelValue label="Nu" value={snap?.growth_now} />
                    <LabelValue label="Verwachting" value={snap?.growth_expectation} />
                  </div>
                </DataCard>
                <DataCard className="px-3 py-3">
                  <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1.5">INFLATIE</div>
                  <div className="grid grid-cols-2 gap-3">
                    <LabelValue label="Nu" value={snap?.inflation_now} />
                    <LabelValue label="Verwachting" value={snap?.inflation_expectation} />
                  </div>
                </DataCard>
              </div>

              {/* 3. CENTRALE BANK */}
              <DataCard className="px-3 py-3 mb-3">
                <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-2">CENTRALE BANK</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <div className="text-[8px] text-label uppercase">STANCE</div>
                    <div className="text-[12px] font-bold text-foreground mt-0.5">{val(r?.cb_stance || snap?.cb_stance)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-label uppercase">RICHTING</div>
                    <div className="text-[12px] font-bold text-foreground mt-0.5">{val(r?.cb_direction || snap?.cb_direction)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-label uppercase">QE/QT</div>
                    <div className="text-[12px] font-bold text-foreground mt-0.5">{val(snap?.cb_qe_qt)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-label uppercase">SPREAD VS USD</div>
                    <div className="text-[12px] font-bold font-mono mt-0.5" style={{ color: spreadColor(r?.rate_diff_vs_usd ?? snap?.rate_diff_vs_usd) }}>
                      {activeCurrency === "USD" ? "—" : val(r?.rate_diff_vs_usd ?? snap?.rate_diff_vs_usd, "%")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-label uppercase">CARRY BIAS</div>
                    <div className="mt-0.5"><BiasChip bias={r?.carry_bias || snap?.carry_bias} /></div>
                  </div>
                </div>
              </DataCard>

              {/* 4. YIELDS */}
              <DataCard className="px-3 py-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] text-label uppercase tracking-wider font-medium">YIELDS</span>
                  {yieldPattern && (
                    <span className="bg-purple-accent/10 text-purple-accent px-2 py-[1px] text-[8px] rounded font-mono font-bold uppercase">
                      {yieldPattern}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-[8px] text-label uppercase">2J RENTE</div>
                    <div className="text-[16px] font-bold text-foreground font-mono mt-0.5">{val(y2, "%")}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-label uppercase">10J RENTE</div>
                    <div className="text-[16px] font-bold text-foreground font-mono mt-0.5">{val(y10, "%")}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-label uppercase">SPREAD VS USD</div>
                    <div className="text-[16px] font-bold font-mono mt-0.5" style={{ color: spreadColor(spreadVsUsd) }}>
                      {activeCurrency === "USD" ? "—" : spreadVsUsd != null ? `${Number(spreadVsUsd) > 0 ? "+" : ""}${spreadVsUsd}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-label uppercase">2S10S</div>
                    <div className="text-[16px] font-bold text-foreground font-mono mt-0.5">{val(yieldInfo.s2s10s)}</div>
                  </div>
                </div>
                {fxImplication && (
                  <div className="text-[11px] text-sub-text italic mt-2 border-t border-card-border pt-2 leading-relaxed">
                    {fxImplication}
                  </div>
                )}
              </DataCard>

              {/* 5. TIMEFRAME BIAS */}
              <SectionLabel>TIMEFRAME BIAS</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {[
                  { label: "KORTE TERMIJN", value: r?.short_term_bias || snap?.short_term_bias },
                  { label: "MIDDELLANG", value: r?.medium_term_bias || snap?.medium_term_bias },
                  { label: "HOGE TF", value: r?.higher_tf_bias || snap?.higher_tf_bias },
                ].map(({ label, value }) => {
                  const driver = r?.main_driver || snap?.main_driver;
                  return (
                    <DataCard key={label} className="px-3 py-3 text-center">
                      <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-1.5">{label}</div>
                      <BiasChip bias={value as string} />
                      {driver && <div className="text-[9px] text-label mt-1.5 truncate">— {driver}</div>}
                    </DataCard>
                  );
                })}
              </div>

              {/* 6. SENSITIVITY */}
              <SectionLabel>SENSITIVITY</SectionLabel>
              <div className="flex flex-wrap gap-2 mb-3">
                <SensitivityPill type="vix" value={snap?.vix_sensitivity} />
                <SensitivityPill type="oil" value={snap?.oil_sensitivity} />
                <SensitivityPill type="gold" value={snap?.gold_sensitivity} />
                <SensitivityPill type="equity" value={snap?.equity_sensitivity} />
                <SensitivityPill type="commodity" value={snap?.commodity_sensitivity} />
              </div>

              {/* 8. MONITORING CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <DataCard className="px-3 py-3 border-l-[3px] border-l-purple-accent">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Eye size={11} className="text-purple-accent" />
                    <span className="text-[8px] text-label uppercase tracking-wider font-medium">TE MONITOREN</span>
                  </div>
                  <div className="text-[11px] text-sub-text leading-relaxed">
                    {fallbackEmpty(r?.what_to_watch_next || snap?.what_to_watch_next, "Volg yield differential en CB communicatie")}
                  </div>
                </DataCard>
                <DataCard className="px-3 py-3 border-l-[3px] border-l-bearish-text">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle size={11} className="text-bearish-text" />
                    <span className="text-[8px] text-label uppercase tracking-wider font-medium">INVALIDATIE</span>
                  </div>
                  <div className="text-[11px] text-sub-text leading-relaxed">
                    {fallbackEmpty(r?.invalidation_risk || snap?.invalidation_risk, "Geen specifiek invalidatieniveau — volg yield differential en CB communicatie")}
                  </div>
                </DataCard>
                <DataCard className="px-3 py-3 border-l-[3px] border-l-bullish-text">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap size={11} className="text-bullish-text" />
                    <span className="text-[8px] text-label uppercase tracking-wider font-medium">VANDAAG</span>
                  </div>
                  <div className="text-[11px] text-sub-text leading-relaxed">
                    {fallbackEmpty(r?.important_for_today || snap?.important_for_today, "Geen specifiek dagelijks signaal — volg macro kalender")}
                  </div>
                </DataCard>
              </div>

              {/* ENTITY BIAS HISTORY */}
              {biasHistory.length > 0 && (
                <>
                  <SectionLabel>RECENTE BIAS SIGNALEN</SectionLabel>
                  <DataCard className="overflow-hidden mb-3 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Datum</th>
                          <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Bias</th>
                          <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Strength</th>
                          <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Conv.</th>
                          <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Driver</th>
                        </tr>
                      </thead>
                      <tbody>
                        {biasHistory.map((b, i) => (
                          <tr key={i} className="border-b border-card-border hover:bg-secondary">
                            <td className="text-[10px] text-sub-text px-4 py-2">{fmtDate(b.snap_date)}</td>
                            <td className="px-4 py-2"><BiasChip bias={b.bias} /></td>
                            <td className="text-[10px] text-sub-text px-4 py-2">{val(b.bias_strength)}</td>
                            <td className="text-[10px] text-sub-text px-4 py-2">{val(b.confidence)}</td>
                            <td className="text-[10px] text-sub-text px-4 py-2 max-w-[200px]">{val(b.main_driver)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataCard>
                </>
              )}

              {/* ANALYSE */}
              {(snap?.summary_detailed || snap?.summary_short) && (
                <div className="bg-secondary border border-card-border rounded-lg px-4 py-3 mb-3">
                  <div className="text-[8px] text-label uppercase tracking-wider font-medium mb-2">ANALYSE</div>
                  <div className="max-w-[720px] text-[14px] text-sub-text leading-[1.7]">
                    <MarkdownBlock content={snap.summary_detailed || snap.summary_short} />
                  </div>
                </div>
              )}

              {/* FX CURRENCY RANKING */}
              <SectionLabel>FX CURRENCY RANKING</SectionLabel>
              <DataCard className="overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">#</th>
                      <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Currency</th>
                       <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Bias</th>
                      <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Conviction</th>
                      <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Bull / Bear</th>
                      <th className="text-[8px] text-label uppercase text-left px-4 py-1.5">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fxRanking.map((c, i) => {
                      const code = c.entity_code;
                      const isActive = code === activeCurrency;
                      const bl = (c.bias_label || "neutral").toLowerCase();
                      const biasClass = bl === "bullish" ? "bg-bullish-bg text-bullish-text" : bl === "bearish" ? "bg-bearish-bg text-bearish-text" : bl.includes("weinig") ? "bg-neutral-bg text-[#D1D5DB] italic" : "bg-neutral-bg text-neutral-text";
                      const FLAG: Record<string, string> = { USD: "🇺🇸", EUR: "🇪🇺", JPY: "🇯🇵", GBP: "🇬🇧", AUD: "🇦🇺", NZD: "🇳🇿", CAD: "🇨🇦", CHF: "🇨🇭" };
                      return (
                        <tr key={code || i}
                          className={`border-b border-card-border cursor-pointer hover:bg-secondary transition-colors ${
                            isActive ? "bg-secondary border-l-[3px] border-l-purple-accent" : ""
                          }`}
                          onClick={() => navigate(`/currencies/${code}`)}
                        >
                          <td className="text-[11px] font-mono font-bold text-label px-4 py-2.5">{c.rank || i + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px]">{FLAG[code] || ""}</span>
                              <span className="text-[12px] font-bold text-foreground">{code}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-[2px] rounded text-[9px] font-bold uppercase ${biasClass}`}>{c.bias_label || "neutral"}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] font-semibold uppercase text-label">{c.conviction || "—"}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-bullish-text font-semibold">{c.bull_count ?? 0}</span>
                              <span className="text-[8px] text-label">/</span>
                              <span className="text-[10px] font-mono text-bearish-text font-semibold">{c.bear_count ?? 0}</span>
                            </div>
                          </td>
                          <td className="text-[10px] text-sub-text px-4 py-2.5 max-w-[220px] truncate">{val(c.raw_score)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </DataCard>
            </>
          )}
        </TabsContent>

        <TabsContent value="correlations">
          <CorrelationsContent />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

