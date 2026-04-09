import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, BiasChip, ConfidenceChip, MarkdownBlock, LabelValue } from "@/components/ui-helpers";

const CURRENCIES = ["USD","EUR","JPY","GBP","AUD","NZD","CAD","CHF"];

export default function Currencies() {
  const { code } = useParams();
  const navigate = useNavigate();
  const activeCurrency = (code || "USD").toUpperCase();

  const [snap, setSnap] = useState<any>(null);
  const [yields, setYields] = useState<any>(null);
  const [consensus, setConsensus] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [s, y, c] = await Promise.all([
        supabase.from("currency_macro_snapshots").select("*").eq("currency_code", activeCurrency).order("snapshot_date", { ascending: false }).limit(1),
        supabase.from("yields_live").select("*").order("fetch_date", { ascending: false }).limit(1),
        supabase.from("fx_consensus").select("*").in("entity_code", CURRENCIES).order("conviction_pct", { ascending: false }),
      ]);
      setSnap(s.data?.[0] || null);
      setYields(y.data?.[0] || null);
      setConsensus(c.data || []);
    };
    load();
  }, [activeCurrency]);

  return (
    <DashboardLayout>
      {/* Tab Bar */}
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-7">
        {CURRENCIES.map((c) => (
          <button key={c} onClick={() => navigate(`/currencies/${c}`)}
            className={`px-4 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
              c === activeCurrency ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
            }`}>{c}</button>
        ))}
      </div>

      {/* BLOCK 1 - Hero */}
      <DataCard className="p-6 mb-5">
        <div className="grid grid-cols-3 items-center">
          <BiasChip bias={snap?.bias} size="lg" />
          <div className="text-center">
            <div className="text-[48px] font-black text-foreground tracking-tight">{activeCurrency}</div>
            <div className="text-[10px] text-label">{val(snap?.snapshot_date)}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-label uppercase tracking-[0.08em]">BETROUWBAARHEID</div>
            <div className="mt-1"><ConfidenceChip confidence={snap?.confidence} /></div>
          </div>
        </div>
        <div className="border-t border-card-border mt-4 pt-4">
          <div className="text-[11px] text-sub-text italic leading-relaxed">{val(snap?.summary_short)}</div>
        </div>
      </DataCard>

      {/* BLOCK 2 - Macro Fundamentals */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <DataCard className="p-4">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">GROEI</div>
          <div className="grid grid-cols-2 gap-4">
            <LabelValue label="Nu" value={snap?.growth_now} />
            <LabelValue label="Verwachting" value={snap?.growth_expectation} />
          </div>
        </DataCard>
        <DataCard className="p-4">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">INFLATIE</div>
          <div className="grid grid-cols-2 gap-4">
            <LabelValue label="Nu" value={snap?.inflation_now} />
            <LabelValue label="Verwachting" value={snap?.inflation_expectation} />
          </div>
        </DataCard>
      </div>

      {/* BLOCK 3 - Centrale Bank */}
      <DataCard className="p-[16px_20px] mb-5">
        <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">CENTRALE BANK</div>
        <div className="grid grid-cols-3 gap-4">
          <LabelValue label="STANCE" value={snap?.cb_stance} />
          <LabelValue label="RICHTING" value={snap?.cb_direction} />
          <LabelValue label="QE/QT" value={snap?.cb_qe_qt} />
        </div>
      </DataCard>

      {/* BLOCK 4 - Yields */}
      <DataCard className="p-[16px_20px] mb-5">
        <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">YIELDS</div>
        <div className="grid grid-cols-4 gap-4">
          <div><div className="text-[9px] text-label uppercase">2J RENTE</div><div className="text-[16px] font-bold text-foreground font-mono mt-1">{val(snap?.yield_2y, "%")}</div></div>
          <div><div className="text-[9px] text-label uppercase">10J RENTE</div><div className="text-[16px] font-bold text-foreground font-mono mt-1">{val(snap?.yield_10y, "%")}</div></div>
          <div><div className="text-[9px] text-label uppercase">SPREAD VS USD</div><div className="text-[16px] font-bold text-foreground font-mono mt-1">{val(snap?.rate_diff_vs_usd, "%")}</div></div>
          <div><div className="text-[9px] text-label uppercase">US CURVE REGIME</div><div className="text-[16px] font-bold text-foreground font-mono mt-1">{val(yields?.curve_regime)}</div></div>
        </div>
      </DataCard>

      {/* BLOCK 5 - Sensitivity */}
      <DataCard className="p-[16px_20px] mb-5">
        <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">SENSITIVITY</div>
        <div className="grid grid-cols-5 gap-4">
          {[
            ["VIX", snap?.vix_sensitivity], ["OLIE", snap?.oil_sensitivity], ["GOUD", snap?.gold_sensitivity],
            ["AANDELEN", snap?.equity_sensitivity], ["COMMODITIES", snap?.commodity_sensitivity]
          ].map(([label, value]) => (
            <div key={label as string}><div className="text-[9px] text-label uppercase">{label}</div><div className="text-[11px] text-foreground mt-1">{val(value)}</div></div>
          ))}
        </div>
      </DataCard>

      {/* BLOCK 6 - Timeframe Bias */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ["KORTE TERMIJN", snap?.short_term_bias],
          ["MIDDELLANG", snap?.medium_term_bias],
          ["HOGE TF", snap?.higher_tf_bias],
        ].map(([label, value]) => (
          <DataCard key={label as string} className="p-4 text-center">
            <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">{label}</div>
            <BiasChip bias={value as string} />
          </DataCard>
        ))}
      </div>

      {/* BLOCK 7 - Monitoring */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <DataCard className="p-4 border-l-[3px] border-l-purple-accent">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">TE MONITOREN</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(snap?.what_to_watch_next)}</div>
        </DataCard>
        <DataCard className="p-4 border-l-[3px] border-l-bearish-text">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">INVALIDATIE</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(snap?.invalidation_risk)}</div>
        </DataCard>
        <DataCard className="p-4 border-l-[3px] border-l-bullish-text">
          <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-2">VANDAAG</div>
          <div className="text-[11px] text-sub-text leading-relaxed">{val(snap?.important_for_today)}</div>
        </DataCard>
      </div>

      {/* BLOCK 8 - Narratief */}
      <div className="bg-secondary border border-card-border rounded-lg p-5 mb-5">
        <div className="text-[9px] text-label uppercase tracking-[0.08em] mb-3">ANALYSE</div>
        <MarkdownBlock content={snap?.summary_detailed} fallback="Narratief wordt binnenkort gegenereerd..." />
      </div>

      {/* BLOCK 9 - G8 Consensus */}
      <SectionLabel>G8 CONSENSUS</SectionLabel>
      <DataCard className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-[9px] text-label uppercase text-left px-4 py-2">Code</th>
              <th className="text-[9px] text-label uppercase text-left px-4 py-2">Bias</th>
              <th className="text-[9px] text-label uppercase text-left px-4 py-2">Conviction</th>
              <th className="text-[9px] text-label uppercase text-left px-4 py-2">Bullish</th>
              <th className="text-[9px] text-label uppercase text-left px-4 py-2">Bearish</th>
            </tr>
          </thead>
          <tbody>
            {consensus.map((c) => (
              <tr key={c.entity_code}
                className={`border-b border-card-border cursor-pointer hover:bg-secondary transition-colors ${
                  c.entity_code === activeCurrency ? "bg-[#F5F0FF] border-l-[3px] border-l-purple-accent" : ""
                }`}
                onClick={() => navigate(`/currencies/${c.entity_code}`)}
              >
                <td className="text-[11px] text-sub-text px-4 py-2">{c.entity_code}</td>
                <td className="px-4 py-2"><BiasChip bias={c.consensus_bias} /></td>
                <td className="text-[11px] text-sub-text px-4 py-2">{val(c.conviction_pct, "%")}</td>
                <td className="text-[11px] text-sub-text px-4 py-2">{val(c.bullish_count)}</td>
                <td className="text-[11px] text-sub-text px-4 py-2">{val(c.bearish_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>
    </DashboardLayout>
  );
}
