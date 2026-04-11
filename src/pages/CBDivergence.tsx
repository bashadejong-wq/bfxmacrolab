import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";

const FLAGS: Record<string, string> = {
  US: "🇺🇸", EUR: "🇪🇺", JPY: "🇯🇵", GBP: "🇬🇧",
};
const SHOW_CODES = ["US", "EUR", "JPY", "GBP"];

function StanceBadge({ stance }: { stance: string | null }) {
  const s = (stance || "").toLowerCase();
  const styles =
    s.includes("hawkish") ? "bg-purple-accent/15 text-purple-accent" :
    s.includes("dovish") ? "bg-blue-500/15 text-blue-400" :
    "bg-secondary text-label";
  return (
    <span className={`${styles} px-2 py-[2px] text-[9px] rounded uppercase font-semibold inline-block`}>
      {stance || "—"}
    </span>
  );
}

function RateChange({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return <Minus size={14} className="text-label" />;
  const diff = current - prev;
  if (Math.abs(diff) < 0.001) return <Minus size={14} className="text-label" />;
  if (diff > 0) return (
    <span className="flex items-center gap-1 text-bullish-text text-[11px] font-mono font-bold">
      <TrendingUp size={12} /> +{diff.toFixed(2)}%
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-bearish-text text-[11px] font-mono font-bold">
      <TrendingDown size={12} /> {diff.toFixed(2)}%
    </span>
  );
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

  const filtered = data.filter(r => SHOW_CODES.includes(r.country_code));

  return (
    <DashboardLayout>
      <SectionLabel>CENTRAL BANK DIVERGENTIE</SectionLabel>

      {!loaded ? (
        <div className="text-center text-label text-[13px] mt-10">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-label text-[13px] mt-10">Geen CB data beschikbaar</div>
      ) : (
        <>
          {/* Card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {filtered.map((cb) => (
              <DataCard key={cb.country_code} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[20px]">{FLAGS[cb.country_code] || ""}</span>
                    <span className="text-[16px] font-bold text-foreground">{cb.country_name || cb.country_code}</span>
                  </div>
                  <StanceBadge stance={cb.stance} />
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
            ))}
          </div>

          {/* Divergence summary table */}
          <SectionLabel>CB DIVERGENTIE OVERZICHT</SectionLabel>
          <DataCard className="overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Centrale Bank</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Rente</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Verandering</th>
                  <th className="text-[8px] text-label uppercase text-left px-4 py-2">Stance</th>
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
                    <td className="px-4 py-2.5 text-[11px] text-sub-text">{val(cb.last_move)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataCard>
        </>
      )}
    </DashboardLayout>
  );
}
