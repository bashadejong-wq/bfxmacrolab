import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";

const FLAGS: Record<string, string> = {
  US: "🇺🇸", EUR: "🇪🇺", JPY: "🇯🇵", GBP: "🇬🇧",
};

function StanceBadge({ stance }: { stance: string | null }) {
  const s = (stance || "").toLowerCase();
  const styles =
    s.includes("hawkish") ? "bg-[#2E1065] text-[#A78BFA]" :
    s.includes("dovish") ? "bg-[#1E3A5F] text-[#93C5FD]" :
    "bg-[#1F2937] text-[#9CA3AF]";
  return (
    <span className={`${styles} px-2 py-[2px] text-[9px] rounded uppercase font-semibold inline-block`}>
      {stance || "—"}
    </span>
  );
}

function DirectionBadge({ lastMove }: { lastMove: number | null }) {
  if (lastMove != null && lastMove < 0) return (
    <span className="bg-[#1D4ED8] text-[#93C5FD] px-3 py-1 text-[11px] rounded uppercase font-bold inline-flex items-center gap-1">
      <TrendingDown size={12} /> CUTTING
    </span>
  );
  if (lastMove != null && lastMove > 0) return (
    <span className="bg-[#7F1D1D] text-[#F87171] px-3 py-1 text-[11px] rounded uppercase font-bold inline-flex items-center gap-1">
      <TrendingUp size={12} /> HIKING
    </span>
  );
  return (
    <span className="bg-[#1F2937] text-[#9CA3AF] px-3 py-1 text-[11px] rounded uppercase font-bold inline-flex items-center gap-1">
      <Minus size={12} /> ON HOLD
    </span>
  );
}

function RateChange({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return <Minus size={14} className="text-label" />;
  const diff = current - prev;
  if (Math.abs(diff) < 0.001) return <Minus size={14} className="text-label" />;
  if (diff > 0) return (
    <span className="flex items-center gap-1 text-[#4ADE80] text-[11px] font-mono font-bold">
      <TrendingUp size={12} /> +{diff.toFixed(2)}%
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[#F87171] text-[11px] font-mono font-bold">
      <TrendingDown size={12} /> {diff.toFixed(2)}%
    </span>
  );
}

const STANCE_RANK: Record<string, number> = { hawkish: 3, "cautiously hawkish": 2, neutral: 1, "cautiously dovish": 0, dovish: -1 };
function stanceRank(s: string | null): number {
  const key = (s || "").toLowerCase();
  for (const [k, v] of Object.entries(STANCE_RANK)) { if (key.includes(k)) return v; }
  return 1;
}

export default function CBDivergence() {
  const [data, setData] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queryWithRetry(
      () => supabase.from("v_cb_rate_comparison").select("*"),
      "CBDivergence/rates"
    ).then((d) => {
      setData((d as any[]) || []);
      setLoaded(true);
    });
  }, []);

  const filtered = data;

  const pairs: { a: any; b: any }[] = [];
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      const sA = stanceRank(filtered[i].stance);
      const sB = stanceRank(filtered[j].stance);
      if (sA !== sB) pairs.push({ a: filtered[i], b: filtered[j] });
    }
  }

  // Divergence meter: position CBs on hawk-dove spectrum
  const spectrum = filtered.map(cb => ({
    name: cb.country_name || cb.country_code,
    code: cb.country_code,
    rank: stanceRank(cb.stance),
    stance: cb.stance,
  })).sort((a, b) => b.rank - a.rank);

  return (
    <DashboardLayout>
      <div className="inst-section-label">CENTRAL BANK DIVERGENTIE</div>

      {!loaded ? (
        <div className="text-center text-label text-[13px] mt-10">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-label text-[13px] mt-10">Geen CB data beschikbaar</div>
      ) : (
        <>
          {/* CB CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 section-gap">
            {filtered.map((cb) => {
              const moveNum = cb.last_move != null ? Number(cb.last_move) : null;
              return (
                <DataCard key={cb.country_code} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[24px]">{FLAGS[cb.country_code] || ""}</span>
                      <span className="text-[18px] font-bold text-foreground">{cb.country_name || cb.country_code}</span>
                    </div>
                    <DirectionBadge lastMove={moveNum} />
                  </div>
                  <div className="flex items-end gap-4 mb-4">
                    <div>
                      <div className="text-[10px] text-label uppercase tracking-[0.12em] font-semibold">HUIDIGE RENTE</div>
                      <div className="inst-metric mt-1">
                        {cb.cb_rate != null ? `${Number(cb.cb_rate).toFixed(2)}%` : "—"}
                      </div>
                    </div>
                    <div className="mb-1">
                      <RateChange current={cb.cb_rate} prev={cb.cb_rate_prev} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-card-border">
                    <StanceBadge stance={cb.stance} />
                    <div className="text-[11px] text-label">{fmtDate(cb.last_meeting)}</div>
                    <div className="text-[11px] text-sub-text ml-auto">{val(cb.last_move)}</div>
                  </div>
                </DataCard>
              );
            })}
          </div>

          {/* DIVERGENCE METER */}
          {spectrum.length > 1 && (
            <div className="section-gap">
              <div className="inst-section-label">HAWK — DOVE SPECTRUM</div>
              <DataCard className="p-6">
                <div className="relative h-12 bg-secondary rounded-full overflow-hidden mb-3">
                  <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-[#1D4ED8]/10 to-transparent" />
                  <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#DC2626]/10 to-transparent" />
                  {spectrum.map((cb) => {
                    const minRank = -1, maxRank = 3;
                    const pct = ((cb.rank - minRank) / (maxRank - minRank)) * 100;
                    return (
                      <div key={cb.code} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${Math.min(Math.max(pct, 5), 95)}%`, transform: 'translate(-50%, -50%)' }}>
                        <span className="text-[10px] font-bold text-foreground bg-card px-2 py-0.5 rounded shadow-sm border border-card-border">{FLAGS[cb.code] || ""} {cb.code}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-label uppercase tracking-wider">
                  <span>DOVISH</span>
                  <span>HAWKISH</span>
                </div>
              </DataCard>
            </div>
          )}

          {/* TABLE */}
          <div className="section-gap">
            <div className="inst-section-label">CB DIVERGENTIE OVERZICHT</div>
            <DataCard className="overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-[9px] text-label uppercase text-left px-6 py-2.5">Centrale Bank</th>
                    <th className="text-[9px] text-label uppercase text-left px-6 py-2.5">Rente</th>
                    <th className="text-[9px] text-label uppercase text-left px-6 py-2.5">Verandering</th>
                    <th className="text-[9px] text-label uppercase text-left px-6 py-2.5">Stance</th>
                    <th className="text-[9px] text-label uppercase text-left px-6 py-2.5">Richting</th>
                    <th className="text-[9px] text-label uppercase text-left px-6 py-2.5">Laatste Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cb) => (
                    <tr key={cb.country_code} className="border-b border-card-border last:border-b-0 zebra-row">
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-2">
                          <span>{FLAGS[cb.country_code] || ""}</span>
                          <span className="text-[12px] font-bold text-foreground">{cb.country_name || cb.country_code}</span>
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[12px] font-mono font-bold text-foreground">
                        {cb.cb_rate != null ? `${Number(cb.cb_rate).toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <RateChange current={cb.cb_rate} prev={cb.cb_rate_prev} />
                      </td>
                      <td className="px-6 py-3">
                        <StanceBadge stance={cb.stance} />
                      </td>
                      <td className="px-6 py-3">
                        <DirectionBadge lastMove={cb.last_move != null ? Number(cb.last_move) : null} />
                      </td>
                      <td className="px-6 py-3 text-[11px] text-sub-text">{val(cb.last_move)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataCard>
          </div>

          {/* DIVERGENCE SIGNALS */}
          {pairs.length > 0 && (
            <>
              <div className="inst-section-label">DIVERGENTIE SIGNAAL</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pairs.map(({ a, b }, i) => {
                  const aRank = stanceRank(a.stance);
                  const bRank = stanceRank(b.stance);
                  const aMore = aRank > bRank;
                  return (
                    <DataCard key={i} className="p-4">
                      <div className="text-[12px] text-foreground leading-snug">
                        <span className={aMore ? "text-[#F87171] font-bold" : "text-[#93C5FD] font-bold"}>
                          {a.country_name || a.country_code}
                        </span>
                        <span className="text-label mx-2">vs</span>
                        <span className={!aMore ? "text-[#F87171] font-bold" : "text-[#93C5FD] font-bold"}>
                          {b.country_name || b.country_code}
                        </span>
                      </div>
                      <div className="text-[10px] text-sub-text mt-1">
                        {a.stance || "—"} vs {b.stance || "—"}
                      </div>
                    </DataCard>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
