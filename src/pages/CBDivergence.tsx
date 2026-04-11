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
    <span className="bg-[#1D4ED8] text-[#93C5FD] px-2 py-[2px] text-[9px] rounded uppercase font-bold inline-flex items-center gap-1">
      <TrendingDown size={10} /> CUTTING
    </span>
  );
  if (lastMove != null && lastMove > 0) return (
    <span className="bg-[#7F1D1D] text-[#F87171] px-2 py-[2px] text-[9px] rounded uppercase font-bold inline-flex items-center gap-1">
      <TrendingUp size={10} /> HIKING
    </span>
  );
  return (
    <span className="bg-[#1F2937] text-[#9CA3AF] px-2 py-[2px] text-[9px] rounded uppercase font-bold inline-flex items-center gap-1">
      <Minus size={10} /> ON HOLD
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

  // Build divergence pairs
  const pairs: { a: any; b: any }[] = [];
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      const sA = stanceRank(filtered[i].stance);
      const sB = stanceRank(filtered[j].stance);
      if (sA !== sB) pairs.push({ a: filtered[i], b: filtered[j] });
    }
  }

  return (
    <DashboardLayout>
      <SectionLabel>CENTRAL BANK DIVERGENTIE</SectionLabel>

      {!loaded ? (
        <div className="text-center text-label text-[13px] mt-10">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-label text-[13px] mt-10">Geen CB data beschikbaar</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {filtered.map((cb) => {
              const moveNum = cb.last_move != null ? Number(cb.last_move) : null;
              return (
                <DataCard key={cb.country_code} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">{FLAGS[cb.country_code] || ""}</span>
                      <span className="text-[16px] font-bold text-foreground">{cb.country_name || cb.country_code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StanceBadge stance={cb.stance} />
                      <DirectionBadge lastMove={moveNum} />
                    </div>
                  </div>
                  <div className="flex items-end gap-3 mb-3">
                    <div>
                      <div className="text-[8px] text-label uppercase tracking-wider font-medium">HUIDIGE RENTE</div>
                      <div className="text-[28px] font-black text-foreground font-mono leading-none mt-1">
                        {cb.cb_rate != null ? `${Number(cb.cb_rate).toFixed(2)}%` : "—"}
                      </div>
                    </div>
                    <div className="mb-1">
                      <RateChange current={cb.cb_rate} prev={cb.cb_rate_prev} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[8px] text-label uppercase tracking-wider font-medium">LAATSTE VERGADERING</div>
                      <div className="text-[11px] text-sub-text mt-0.5">{fmtDate(cb.last_meeting)}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-label uppercase tracking-wider font-medium">LAATSTE ACTIE</div>
                      <div className="text-[11px] text-sub-text mt-0.5">{val(cb.last_move)}</div>
                    </div>
                  </div>
                </DataCard>
              );
            })}
          </div>

          <SectionLabel>CB DIVERGENTIE OVERZICHT</SectionLabel>
          <DataCard className="overflow-hidden overflow-x-auto mb-6">
            <table className="w-full min-w-[500px]">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Centrale Bank</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Rente</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Verandering</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Stance</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Richting</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Laatste Actie</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cb) => (
                  <tr key={cb.country_code} className="border-b border-card-border last:border-b-0">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <span>{FLAGS[cb.country_code] || ""}</span>
                        <span className="text-[12px] font-bold text-foreground">{cb.country_name || cb.country_code}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] font-mono font-bold text-foreground">
                      {cb.cb_rate != null ? `${Number(cb.cb_rate).toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <RateChange current={cb.cb_rate} prev={cb.cb_rate_prev} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StanceBadge stance={cb.stance} />
                    </td>
                    <td className="px-4 py-2.5">
                      <DirectionBadge lastMove={cb.last_move != null ? Number(cb.last_move) : null} />
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-sub-text">{val(cb.last_move)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataCard>

          {pairs.length > 0 && (
            <>
              <SectionLabel>DIVERGENTIE SIGNAAL</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {pairs.map(({ a, b }, i) => {
                  const aRank = stanceRank(a.stance);
                  const bRank = stanceRank(b.stance);
                  const aMore = aRank > bRank;
                  return (
                    <DataCard key={i} className="px-4 py-3">
                      <div className="text-[11px] text-foreground leading-snug">
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
