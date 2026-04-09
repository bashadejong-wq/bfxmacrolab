import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, textVal, BiasChip, ConfidenceChip, MarkdownBlock, LabelValue, fmtDate, queryWithRetry, getBiasColor, getBiasBackground } from "@/components/ui-helpers";
import { DollarSign, Star, TrendingUp, TrendingDown, Minus, Shield } from "lucide-react";

const CURRENCIES = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

export default function Currencies() {
  const { code } = useParams();
  const navigate = useNavigate();
  const activeCurrency = (code || "USD").toUpperCase();

  const [snap, setSnap] = useState<any>(null);
  const [biasHistory, setBiasHistory] = useState<any[]>([]);
  const [consensus, setConsensus] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([
      queryWithRetry(
        () => supabase.from("currency_macro_snapshots").select("*").eq("currency_code", activeCurrency).order("snapshot_date", { ascending: false }).limit(1),
        `Currencies/snap/${activeCurrency}`
      ),
      queryWithRetry(
        () => supabase.from("entity_bias").select("*").eq("entity_code", activeCurrency).order("snap_date", { ascending: false }).limit(5),
        `Currencies/entity_bias/${activeCurrency}`
      ),
      queryWithRetry(
        () => supabase.from("fx_consensus").select("*").in("entity_code", CURRENCIES).order("conviction_pct", { ascending: false }),
        "Currencies/fx_consensus"
      ),
    ]).then(([s, b, c]) => {
      setSnap((s as any[])?.[0] || null);
      setBiasHistory((b as any[]) || []);
      setConsensus((c as any[]) || []);
      setLoaded(true);
    });
  }, [activeCurrency]);

  // Derive bias: prefer snap.bias, fallback to latest entity_bias
  const effectiveBias = snap?.bias || biasHistory[0]?.bias || null;
  const latestEntityBias = biasHistory[0];

  return (
    <DashboardLayout>
      {/* Currency tabs */}
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-7">
        {CURRENCIES.map((c) => (
          <button key={c} onClick={() => navigate(`/currencies/${c}`)}
            className={`px-4 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
              c === activeCurrency ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
            }`}>{c}</button>
        ))}
      </div>

      {loaded && !snap ? (
        <div className="text-center text-label text-[13px] mt-10">
          Nog geen snapshot beschikbaar voor {activeCurrency}
          {latestEntityBias?.snap_date && (
            <div className="text-[11px] text-neutral-text mt-1">Laatste entity bias: {fmtDate(latestEntityBias.snap_date)}</div>
          )}
        </div>
      ) : snap && (
        <>
          {/* HERO */}
          <DataCard className="p-5 mb-4">
            <div className="grid grid-cols-3 items-center">
              <BiasChip bias={effectiveBias} size="lg" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <DollarSign size={20} className="text-purple-accent" />
                  <span className="text-[42px] font-black text-foreground tracking-tight">{activeCurrency}</span>
                </div>
                <div className="text-[10px] text-label">{fmtDate(snap.snapshot_date)}</div>
              </div>
              <div className="text-right">
                <div className="text-[0.65rem] text-label uppercase tracking-[0.08em]">BETROUWBAARHEID</div>
                <div className="mt-1"><ConfidenceChip confidence={snap.confidence} /></div>
              </div>
            </div>
            {/* Main driver + summary */}
            <div className="border-t border-card-border mt-4 pt-4">
              {snap.main_driver && (
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={12} className="text-purple-accent shrink-0" />
                  <span className="text-[11px] text-foreground font-semibold">{snap.main_driver}</span>
                </div>
              )}
              <div className="text-[11px] text-sub-text italic leading-relaxed">{textVal(snap.summary_short || snap.what_to_watch_next)}</div>
            </div>
          </DataCard>

          {/* MACRO FUNDAMENTALS */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <DataCard className="p-5">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">GROEI</div>
              <div className="grid grid-cols-2 gap-4">
                <LabelValue label="Nu" value={snap.growth_now} />
                <LabelValue label="Verwachting" value={snap.growth_expectation} />
              </div>
            </DataCard>
            <DataCard className="p-5">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">INFLATIE</div>
              <div className="grid grid-cols-2 gap-4">
                <LabelValue label="Nu" value={snap.inflation_now} />
                <LabelValue label="Verwachting" value={snap.inflation_expectation} />
              </div>
            </DataCard>
          </div>

          {/* CENTRALE BANK */}
          <DataCard className="p-5 mb-4">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">CENTRALE BANK</div>
            <div className="grid grid-cols-3 gap-4">
              <LabelValue label="STANCE" value={snap.cb_stance} />
              <LabelValue label="RICHTING" value={snap.cb_direction} />
              <LabelValue label="QE/QT" value={snap.cb_qe_qt} />
            </div>
          </DataCard>

          {/* YIELDS */}
          <DataCard className="p-5 mb-4">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">YIELDS</div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-[0.65rem] text-label uppercase">2J RENTE</div>
                <div className="text-[16px] font-bold text-foreground font-mono mt-1">{val(snap.yield_2y, "%")}</div>
              </div>
              <div>
                <div className="text-[0.65rem] text-label uppercase">10J RENTE</div>
                <div className="text-[16px] font-bold text-foreground font-mono mt-1">{val(snap.yield_10y, "%")}</div>
              </div>
              <div>
                <div className="text-[0.65rem] text-label uppercase">SPREAD VS USD</div>
                <div className="text-[16px] font-bold text-foreground font-mono mt-1">{activeCurrency === "USD" ? "—" : val(snap.rate_diff_vs_usd, "%")}</div>
              </div>
              <div>
                <div className="text-[0.65rem] text-label uppercase">CURVE REGIME</div>
                <div className="text-[16px] font-bold text-foreground font-mono mt-1">{val(snap.currency_yield_regime)}</div>
              </div>
            </div>
          </DataCard>

          {/* SENSITIVITY */}
          <DataCard className="p-5 mb-4">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">SENSITIVITY</div>
            <div className="grid grid-cols-5 gap-4">
              {[
                ["VIX", snap.vix_sensitivity],
                ["OLIE", snap.oil_sensitivity],
                ["GOUD", snap.gold_sensitivity],
                ["AANDELEN", snap.equity_sensitivity],
                ["COMMODITIES", snap.commodity_sensitivity],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="text-[0.65rem] text-label uppercase">{label}</div>
                  <div className="text-[11px] text-foreground mt-1">{val(value)}</div>
                </div>
              ))}
            </div>
          </DataCard>

          {/* TIMEFRAME BIAS */}
          <SectionLabel>TIMEFRAME BIAS</SectionLabel>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              ["KORTE TERMIJN", snap.short_term_bias],
              ["MIDDELLANG", snap.medium_term_bias],
              ["HOGE TF", snap.higher_tf_bias],
            ].map(([label, value]) => (
              <DataCard key={label as string} className="p-5 text-center">
                <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">{label}</div>
                <BiasChip bias={value as string} />
              </DataCard>
            ))}
          </div>

          {/* MONITORING */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <DataCard className="p-5 border-l-[3px] border-l-purple-accent">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">TE MONITOREN</div>
              <div className="text-[11px] text-sub-text leading-relaxed">{textVal(snap.what_to_watch_next)}</div>
            </DataCard>
            <DataCard className="p-5 border-l-[3px] border-l-bearish-text">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">INVALIDATIE</div>
              <div className="text-[11px] text-sub-text leading-relaxed">{textVal(snap.invalidation_risk)}</div>
            </DataCard>
            <DataCard className="p-5 border-l-[3px] border-l-bullish-text">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">VANDAAG</div>
              <div className="text-[11px] text-sub-text leading-relaxed">{textVal(snap.important_for_today)}</div>
            </DataCard>
          </div>

          {/* ENTITY BIAS HISTORY */}
          {biasHistory.length > 0 && (
            <>
              <SectionLabel>RECENTE BIAS SIGNALEN</SectionLabel>
              <DataCard className="overflow-hidden mb-8">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-[9px] text-label uppercase text-left px-5 py-2">Datum</th>
                      <th className="text-[9px] text-label uppercase text-left px-5 py-2">Bias</th>
                      <th className="text-[9px] text-label uppercase text-left px-5 py-2">Strength</th>
                      <th className="text-[9px] text-label uppercase text-left px-5 py-2">Conv.</th>
                      <th className="text-[9px] text-label uppercase text-left px-5 py-2">Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {biasHistory.map((b, i) => (
                      <tr key={i} className="border-b border-card-border hover:bg-secondary">
                        <td className="text-[11px] text-sub-text px-5 py-2.5">{fmtDate(b.snap_date)}</td>
                        <td className="px-5 py-2.5"><BiasChip bias={b.bias} /></td>
                        <td className="text-[11px] text-sub-text px-5 py-2.5">{val(b.bias_strength)}</td>
                        <td className="text-[11px] text-sub-text px-5 py-2.5">{val(b.confidence)}</td>
                        <td className="text-[11px] text-sub-text px-5 py-2.5 max-w-[200px] truncate">{val(b.main_driver)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataCard>
            </>
          )}

          {/* ANALYSE */}
          <div className="bg-secondary border border-card-border rounded-lg p-5 mb-8">
            <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">ANALYSE</div>
            <MarkdownBlock content={snap.summary_detailed || snap.summary_short} />
          </div>

          {/* G8 CONSENSUS */}
          <SectionLabel>G8 CONSENSUS</SectionLabel>
          <DataCard className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Code</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Bias</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Conviction</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Bullish</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Bearish</th>
                  <th className="text-[9px] text-label uppercase text-left px-5 py-2">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {consensus.map((c) => {
                  const isActive = c.entity_code === activeCurrency;
                  const top3 = consensus.slice(0, 3).map(x => x.entity_code);
                  const isTop3 = top3.includes(c.entity_code);
                  return (
                    <tr key={c.entity_code}
                      className={`border-b border-card-border cursor-pointer hover:bg-secondary transition-colors ${
                        isActive ? "bg-secondary border-l-[3px] border-l-purple-accent" : ""
                      }`}
                      onClick={() => navigate(`/currencies/${c.entity_code}`)}
                    >
                      <td className="text-[11px] font-bold px-5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {isTop3 && <Star size={10} className="text-mixed-text fill-mixed-text" />}
                          <span className="text-purple-accent">{c.entity_code}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5"><BiasChip bias={c.consensus_bias} /></td>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{val(c.conviction_pct, "%")}</td>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{c.bullish_count ?? 0}</td>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{c.bearish_count ?? 0}</td>
                      <td className="text-[11px] text-sub-text px-5 py-2.5">{c.total_count ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </DataCard>
        </>
      )}
    </DashboardLayout>
  );
}
