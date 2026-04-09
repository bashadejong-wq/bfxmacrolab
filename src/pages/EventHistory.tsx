import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { ChevronDown, ChevronUp, Zap, Check, MailX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ── constants ─────────────────────────────────────────── */
const CATEGORIES = ["Alle", "inflation", "jobs", "central_bank", "growth", "geopolitical"];
const SUBCATS: Record<string, string[]> = {
  inflation: ["cpi", "core_cpi", "pce", "ppi"],
  jobs: ["nfp", "unemployment", "wages", "jobless_claims"],
  central_bank: ["fomc", "ecb", "boj", "boe", "rate_decision", "speech", "minutes"],
  growth: ["gdp", "pmi", "ism", "retail_sales"],
  geopolitical: ["trade", "fiscal", "conflict"],
};
const SURPRISES = ["Alle", "beat", "miss", "inline"];
const COUNTRIES = ["Alle", "US", "EU", "UK", "JP", "CN", "Global"];

const CAT_COLORS: Record<string, string> = {
  inflation: "#F97316",
  jobs: "#2563EB",
  central_bank: "#DC2626",
  growth: "#16A34A",
  geopolitical: "#8B5CF6",
};

const FLAG: Record<string, string> = {
  US: "🇺🇸", EU: "🇪🇺", UK: "🇬🇧", JP: "🇯🇵", CN: "🇨🇳", AU: "🇦🇺", Global: "🌍",
};

/* ── helpers ────────────────────────────────────────────── */
const n = (v: any) => (v == null || v === "" ? null : Number(v));
const fmtPct = (v: any) => {
  const num = n(v);
  if (num == null) return null;
  return num > 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
};
const fmtBp = (v: any) => {
  const num = n(v);
  if (num == null) return null;
  return num > 0 ? `+${num.toFixed(1)} bp` : `${num.toFixed(1)} bp`;
};
const chgColor = (v: any) => {
  const num = n(v);
  if (num == null) return "text-label";
  return num > 0 ? "text-bullish-text" : num < 0 ? "text-bearish-text" : "text-label";
};

const surpriseDir = (d: string | null) => (d || "").toLowerCase();

/* ── component ──────────────────────────────────────────── */
export default function EventHistory() {
  const [events, setEvents] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // filters
  const [cat, setCat] = useState("Alle");
  const [subcat, setSubcat] = useState("Alle");
  const [surprise, setSurprise] = useState("Alle");
  const [country, setCountry] = useState("Alle");

  useEffect(() => {
    setLoaded(false);
    const fn = async () => {
      let q = supabase.from("macro_event_reactions").select("*").order("event_date", { ascending: false }).limit(500);
      if (cat !== "Alle") q = q.eq("event_category", cat);
      if (subcat !== "Alle") q = q.eq("event_subcategory", subcat);
      if (country !== "Alle") q = q.ilike("event_country", country);
      return q;
    };
    queryWithRetry(fn, "EventHistory").then(data => {
      setEvents((data as any[]) || []);
      setExpandedId(null);
      setLoaded(true);
    });
  }, [cat, subcat, country]);

  // reset subcat when category changes
  useEffect(() => { setSubcat("Alle"); }, [cat]);

  const filtered = useMemo(() => {
    if (surprise === "Alle") return events;
    return events.filter(e => surpriseDir(e.surprise_direction) === surprise);
  }, [events, surprise]);

  /* ── stats ── */
  const stats = useMemo(() => {
    if (!filtered.length) return { total: 0, biggestBeat: null as any, biggestMiss: null as any, avgVix: 0 };
    let biggestBeat: any = null;
    let biggestMiss: any = null;
    let vixSum = 0;
    let vixCount = 0;
    filtered.forEach(e => {
      const spx = n(e.spx_d1_chg);
      if (spx != null) {
        if (!biggestBeat || spx > n(biggestBeat.spx_d1_chg)!) biggestBeat = e;
        if (!biggestMiss || spx < n(biggestMiss.spx_d1_chg)!) biggestMiss = e;
      }
      const vix = n(e.vix_d1_chg);
      if (vix != null) { vixSum += vix; vixCount++; }
    });
    return { total: filtered.length, biggestBeat, biggestMiss, avgVix: vixCount ? vixSum / vixCount : 0 };
  }, [filtered]);

  const subcatsForCat = cat !== "Alle" ? SUBCATS[cat] || [] : [];

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>Event History</h1>
          <p className="text-[12px] text-label mt-0.5">Marktreacties op macro events — laatste 12 maanden</p>
        </div>
        <span className="bg-purple-accent/10 text-purple-accent text-[11px] font-bold px-3 py-1.5 rounded-full">
          {filtered.length} events
        </span>
      </div>

      {/* FILTER BAR */}
      <div className="bg-card border border-card-border rounded-lg p-4 mb-5 sticky top-0 z-20 grid grid-cols-2 md:grid-cols-4 gap-3">
        <FilterSelect label="Categorie" value={cat} options={CATEGORIES} onChange={setCat} />
        <FilterSelect label="Subcategorie" value={subcat} options={["Alle", ...subcatsForCat]} onChange={setSubcat} disabled={cat === "Alle"} />
        <FilterSelect label="Verrassing" value={surprise} options={SURPRISES} onChange={setSurprise} />
        <FilterSelect label="Land" value={country} options={COUNTRIES} onChange={setCountry} />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Totaal Events" value={String(stats.total)} />
        <StatCard label="Grootste Beat" value={stats.biggestBeat ? stats.biggestBeat.event_name : "—"} sub={stats.biggestBeat ? `SPX ${fmtPct(stats.biggestBeat.spx_d1_chg) || "—"}` : ""} color="text-bullish-text" />
        <StatCard label="Grootste Miss" value={stats.biggestMiss ? stats.biggestMiss.event_name : "—"} sub={stats.biggestMiss ? `SPX ${fmtPct(stats.biggestMiss.spx_d1_chg) || "—"}` : ""} color="text-bearish-text" />
        <StatCard label="Gem. VIX Effect" value={stats.avgVix ? `${stats.avgVix > 0 ? "+" : ""}${stats.avgVix.toFixed(2)}` : "—"} color={stats.avgVix > 0 ? "text-bearish-text" : "text-bullish-text"} />
      </div>

      {/* TIMELINE */}
      {!loaded ? (
        <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <MailX size={40} className="mx-auto text-label mb-3" />
          <p className="text-label text-[13px]">Geen events gevonden voor deze filters</p>
        </div>
      ) : (
        <div className="relative pl-4 md:pl-6">
          {/* vertical timeline line */}
          <div className="absolute left-[7px] md:left-[11px] top-0 bottom-0 w-[2px] bg-card-border" />

          {filtered.map((e, idx) => {
            const isExpanded = expandedId === e.id;
            const dir = surpriseDir(e.surprise_direction);
            const badgeColor = dir === "beat" ? "bg-bullish-text" : dir === "miss" ? "bg-bearish-text" : "bg-neutral-text";

            return (
              <div key={e.id} className="relative mb-5">
                {/* timeline dot */}
                <div className={`absolute -left-4 md:-left-6 top-4 w-3 h-3 rounded-full border-2 border-background ${badgeColor}`} />

                {/* date column */}
                <div className="mb-1">
                  <span className="text-[11px] text-label font-medium">{fmtDate(e.event_date)}</span>
                  <SurprisePill direction={dir} />
                </div>

                {/* event card */}
                <DataCard className="p-4 ml-0 md:ml-2" onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                  {/* header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[16px]">{FLAG[e.event_country] || "🌍"}</span>
                      <span className="text-[15px] font-bold text-foreground truncate">{e.event_name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CatPill category={e.event_category} />
                      {isExpanded ? <ChevronUp size={14} className="text-label" /> : <ChevronDown size={14} className="text-label" />}
                    </div>
                  </div>

                  {/* actual vs expected */}
                  <div className="flex flex-wrap gap-4 text-[12px] mb-3">
                    <div>
                      <span className="text-label mr-1">Actual:</span>
                      <span className={`font-bold font-mono ${dir === "beat" ? "text-bullish-text" : dir === "miss" ? "text-bearish-text" : "text-foreground"}`}>
                        {val(e.actual_value)}
                      </span>
                    </div>
                    <div><span className="text-label mr-1">Verwacht:</span><span className="text-sub-text">{val(e.expected_value)}</span></div>
                    <div><span className="text-label mr-1">Vorig:</span><span className="text-sub-text">{val(e.previous_value)}</span></div>
                  </div>

                  {/* macro regime tag */}
                  {e.macro_regime && (
                    <span className="inline-block bg-secondary text-label text-[9px] font-semibold uppercase px-2 py-0.5 rounded mb-3">
                      {e.macro_regime}
                    </span>
                  )}

                  {/* reaction table */}
                  <ReactionTable event={e} />

                  {/* dominant reaction */}
                  {e.dominant_reaction && !isExpanded && (
                    <p className="text-[12px] text-sub-text italic mt-3 line-clamp-2">{e.dominant_reaction}</p>
                  )}

                  {/* priced in badge */}
                  <div className="flex items-center gap-2 mt-3">
                    {e.was_priced_in === true && (
                      <span className="inline-flex items-center gap-1 bg-secondary text-label text-[9px] font-semibold px-2 py-0.5 rounded">
                        <Check size={10} /> Ingeprijsd
                      </span>
                    )}
                    {e.was_priced_in === false && (
                      <span className="inline-flex items-center gap-1 bg-mixed-bg text-mixed-text text-[9px] font-semibold px-2 py-0.5 rounded">
                        <Zap size={10} /> Verrassing
                      </span>
                    )}
                  </div>

                  {/* analyst note (always visible if present) */}
                  {e.analyst_note && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 mt-3">
                      <p className="text-[12px] text-blue-800 dark:text-blue-300">{e.analyst_note}</p>
                    </div>
                  )}

                  {/* expanded section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-card-border space-y-3 animate-fade-in">
                      {e.dominant_reaction && (
                        <ExpandField label="Dominant Reaction" value={e.dominant_reaction} />
                      )}
                      {e.fx_reaction_summary && (
                        <ExpandField label="FX Reactie" value={e.fx_reaction_summary} />
                      )}
                      {e.rates_reaction_summary && (
                        <ExpandField label="Rates Reactie" value={e.rates_reaction_summary} />
                      )}
                      {e.equity_reaction_summary && (
                        <ExpandField label="Equity Reactie" value={e.equity_reaction_summary} />
                      )}
                      {e.market_surprise && (
                        <ExpandField label="Market Surprise" value={e.market_surprise} />
                      )}
                      {/* D+21 row */}
                      {(n(e.dxy_d21_chg) != null || n(e.spx_d21_chg) != null || n(e.gold_d21_chg) != null) && (
                        <div>
                          <p className="text-[9px] text-label uppercase font-semibold mb-1">D+21 Reactie</p>
                          <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
                            <MiniStat label="DXY" val={fmtPct(e.dxy_d21_chg)} raw={e.dxy_d21_chg} />
                            <MiniStat label="SPX" val={fmtPct(e.spx_d21_chg)} raw={e.spx_d21_chg} />
                            <MiniStat label="Gold" val={fmtPct(e.gold_d21_chg)} raw={e.gold_d21_chg} />
                            <MiniStat label="Oil" val={fmtPct(e.oil_d21_chg)} raw={e.oil_d21_chg} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </DataCard>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

/* ── sub-components ────────────────────────────────────── */

function FilterSelect({ label, value, options, onChange, disabled }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] text-label uppercase tracking-wide mb-1 font-medium">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-secondary border border-card-border rounded px-2 py-1.5 text-[11px] text-foreground disabled:opacity-40"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <DataCard className="p-3">
      <div className="text-[9px] text-label uppercase font-medium mb-1">{label}</div>
      <div className={`text-[14px] font-bold truncate ${color || "text-foreground"}`} style={{ fontFamily: "DM Mono, monospace" }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-sub-text font-mono mt-0.5">{sub}</div>}
    </DataCard>
  );
}

function SurprisePill({ direction }: { direction: string }) {
  const cls = direction === "beat"
    ? "bg-bullish-bg text-bullish-text"
    : direction === "miss"
    ? "bg-bearish-bg text-bearish-text"
    : "bg-neutral-bg text-neutral-text";
  return (
    <span className={`ml-2 px-2 py-[1px] text-[9px] font-semibold uppercase rounded ${cls}`}>
      {direction === "beat" ? "BEAT" : direction === "miss" ? "MISS" : "INLINE"}
    </span>
  );
}

function CatPill({ category }: { category: string | null }) {
  const c = (category || "").toLowerCase();
  const color = CAT_COLORS[c] || "#6B7280";
  return (
    <span
      className="px-2 py-[2px] text-[9px] font-semibold uppercase rounded text-white"
      style={{ backgroundColor: color }}
    >
      {category || "—"}
    </span>
  );
}

function ReactionTable({ event: e }: { event: any }) {
  const rows = [
    { label: "DXY", d1: fmtPct(e.dxy_d1_chg), d3: fmtPct(e.dxy_d3_chg), d5: fmtPct(e.dxy_d5_chg), r1: e.dxy_d1_chg, r3: e.dxy_d3_chg, r5: e.dxy_d5_chg },
    { label: "EUR/USD", d1: fmtPct(e.usdeur_d1_chg), d3: fmtPct(e.usdeur_d3_chg), d5: fmtPct(e.usdeur_d5_chg), r1: e.usdeur_d1_chg, r3: e.usdeur_d3_chg, r5: e.usdeur_d5_chg },
    { label: "USD/JPY", d1: fmtPct(e.usdjpy_d1_chg), d3: fmtPct(e.usdjpy_d3_chg), d5: fmtPct(e.usdjpy_d5_chg), r1: e.usdjpy_d1_chg, r3: e.usdjpy_d3_chg, r5: e.usdjpy_d5_chg },
    { label: "US 10Y", d1: fmtBp(e.us10y_d1_chg), d3: fmtBp(e.us10y_d3_chg), d5: fmtBp(e.us10y_d5_chg), r1: e.us10y_d1_chg, r3: e.us10y_d3_chg, r5: e.us10y_d5_chg },
    { label: "S&P 500", d1: fmtPct(e.spx_d1_chg), d3: fmtPct(e.spx_d3_chg), d5: fmtPct(e.spx_d5_chg), r1: e.spx_d1_chg, r3: e.spx_d3_chg, r5: e.spx_d5_chg },
    { label: "GOLD", d1: fmtPct(e.gold_d1_chg), d3: fmtPct(e.gold_d3_chg), d5: fmtPct(e.gold_d5_chg), r1: e.gold_d1_chg, r3: e.gold_d3_chg, r5: e.gold_d5_chg },
    { label: "OIL", d1: fmtPct(e.oil_d1_chg), d3: fmtPct(e.oil_d3_chg), d5: fmtPct(e.oil_d5_chg), r1: e.oil_d1_chg, r3: e.oil_d3_chg, r5: e.oil_d5_chg },
  ];

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[10px] min-w-[320px]">
        <thead>
          <tr className="text-label uppercase">
            <th className="text-left py-1 px-1 font-medium">Asset</th>
            <th className="text-right py-1 px-1 font-medium">D+1</th>
            <th className="text-right py-1 px-1 font-medium">D+3</th>
            <th className="text-right py-1 px-1 font-medium">D+5</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label} className="border-t border-card-border/50">
              <td className="py-1 px-1 font-semibold text-foreground">{r.label}</td>
              <td className={`py-1 px-1 text-right font-mono ${chgColor(r.r1)}`}>{r.d1 || "—"}</td>
              <td className={`py-1 px-1 text-right font-mono ${chgColor(r.r3)}`}>{r.d3 || "—"}</td>
              <td className={`py-1 px-1 text-right font-mono ${chgColor(r.r5)}`}>{r.d5 || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpandField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] text-label uppercase font-semibold mb-0.5">{label}</p>
      <p className="text-[12px] text-sub-text leading-relaxed">{value}</p>
    </div>
  );
}

function MiniStat({ label, val: v, raw }: { label: string; val: string | null; raw: any }) {
  return (
    <div>
      <span className="text-[9px] text-label">{label}</span>
      <div className={`text-[11px] font-mono ${chgColor(raw)}`}>{v || "—"}</div>
    </div>
  );
}
