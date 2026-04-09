import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, queryWithRetry } from "@/components/ui-helpers";
import { Grid3X3 } from "lucide-react";

const ASSETS = [
  { key: "dxy", label: "DXY" },
  { key: "eurusd", label: "EUR/USD" },
  { key: "usdjpy", label: "USD/JPY" },
  { key: "gbpusd", label: "GBP/USD" },
  { key: "gold", label: "Gold" },
  { key: "oil_wti", label: "Oil WTI" },
  { key: "spx", label: "S&P 500" },
  { key: "vix", label: "VIX" },
  { key: "audusd", label: "AUD/USD" },
  { key: "usdcad", label: "USD/CAD" },
];

function computeCorrelation(x: number[], y: number[]): number | null {
  if (x.length < 3 || x.length !== y.length) return null;
  const n = x.length;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function corrColor(r: number | null): string {
  if (r === null) return "hsl(0 0% 95%)";
  const abs = Math.abs(r);
  if (r > 0) return `hsl(142 ${Math.round(abs * 70)}% ${Math.round(95 - abs * 45)}%)`;
  return `hsl(0 ${Math.round(abs * 70)}% ${Math.round(95 - abs * 45)}%)`;
}

function corrText(r: number | null): string {
  if (r === null) return "—";
  return r.toFixed(2);
}

export default function Correlations() {
  const [data, setData] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queryWithRetry(
      () => supabase.from("market_data_live").select("*").order("fetch_date", { ascending: true }).limit(500),
      "Correlations"
    ).then(d => { setData((d as any[]) || []); setLoaded(true); });
  }, []);

  const matrix = useMemo(() => {
    if (data.length < 3) return null;
    const series: Record<string, number[]> = {};
    ASSETS.forEach(a => { series[a.key] = []; });

    data.forEach(row => {
      ASSETS.forEach(a => {
        series[a.key].push(row[a.key] != null ? Number(row[a.key]) : NaN);
      });
    });

    // Build returns (% change)
    const returns: Record<string, number[]> = {};
    ASSETS.forEach(a => {
      const vals = series[a.key];
      const ret: number[] = [];
      for (let i = 1; i < vals.length; i++) {
        if (!isNaN(vals[i]) && !isNaN(vals[i - 1]) && vals[i - 1] !== 0) {
          ret.push((vals[i] - vals[i - 1]) / vals[i - 1]);
        } else {
          ret.push(NaN);
        }
      }
      returns[a.key] = ret;
    });

    // Build correlation matrix
    const m: (number | null)[][] = [];
    for (let i = 0; i < ASSETS.length; i++) {
      const row: (number | null)[] = [];
      for (let j = 0; j < ASSETS.length; j++) {
        if (i === j) { row.push(1); continue; }
        const x = returns[ASSETS[i].key];
        const y = returns[ASSETS[j].key];
        // Filter paired non-NaN values
        const pairs: { a: number; b: number }[] = [];
        for (let k = 0; k < Math.min(x.length, y.length); k++) {
          if (!isNaN(x[k]) && !isNaN(y[k])) pairs.push({ a: x[k], b: y[k] });
        }
        row.push(computeCorrelation(pairs.map(p => p.a), pairs.map(p => p.b)));
      }
      m.push(row);
    }
    return m;
  }, [data]);

  if (!loaded) {
    return <DashboardLayout><div className="text-label text-[13px] mt-10 text-center">Laden...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-foreground">Correlation Matrix</h1>
        <p className="text-[12px] text-label mt-1">
          {data.length} datapunten — cross-asset correlaties op basis van dagelijkse returns
        </p>
      </div>

      {!matrix ? (
        <DataCard className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Grid3X3 size={28} className="text-purple-accent" />
            </div>
            <p className="text-[13px] text-label max-w-md leading-relaxed">
              Minimaal 3 datapunten nodig voor correlatie berekening.
              Naarmate de dagelijkse market data pipeline meer data verzamelt,
              wordt de correlatie matrix hier automatisch zichtbaar.
            </p>
            <div className="bg-secondary rounded-lg px-5 py-3 mt-2">
              <p className="text-[11px] text-label">
                📊 Huidige data: <span className="font-mono font-bold text-foreground">{data.length}</span> dagen
              </p>
            </div>
          </div>
        </DataCard>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: "hsl(0 70% 60%)" }} />
              <span className="text-[10px] text-label">Sterk negatief</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: "hsl(0 0% 95%)" }} />
              <span className="text-[10px] text-label">Geen correlatie</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: "hsl(142 70% 60%)" }} />
              <span className="text-[10px] text-label">Sterk positief</span>
            </div>
          </div>

          <DataCard className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-[9px] text-label uppercase px-2 py-2 text-left sticky left-0 bg-card z-10"></th>
                  {ASSETS.map(a => (
                    <th key={a.key} className="text-[9px] text-label uppercase px-2 py-2 text-center font-semibold whitespace-nowrap">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSETS.map((a, i) => (
                  <tr key={a.key}>
                    <td className="text-[10px] font-semibold text-foreground px-2 py-1.5 sticky left-0 bg-card z-10 whitespace-nowrap">
                      {a.label}
                    </td>
                    {matrix[i].map((r, j) => (
                      <td
                        key={j}
                        className="text-center px-1 py-1.5"
                        style={{ minWidth: 52 }}
                      >
                        <div
                          className="text-[10px] font-mono font-semibold rounded px-1 py-1"
                          style={{
                            background: corrColor(r),
                            color: r !== null && Math.abs(r) > 0.5 ? "#fff" : "#374151",
                          }}
                        >
                          {i === j ? "1.00" : corrText(r)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DataCard>

          {/* Notable correlations */}
          <div className="mt-6">
            <SectionLabel>Opvallende Correlaties</SectionLabel>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {(() => {
                const notable: { a: string; b: string; r: number }[] = [];
                for (let i = 0; i < ASSETS.length; i++) {
                  for (let j = i + 1; j < ASSETS.length; j++) {
                    const r = matrix[i][j];
                    if (r !== null && Math.abs(r) >= 0.4) {
                      notable.push({ a: ASSETS[i].label, b: ASSETS[j].label, r });
                    }
                  }
                }
                notable.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
                return notable.slice(0, 6).map((n, idx) => (
                  <DataCard key={idx} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-foreground">{n.a} ↔ {n.b}</span>
                      <span
                        className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{
                          background: corrColor(n.r),
                          color: Math.abs(n.r) > 0.5 ? "#fff" : "#374151",
                        }}
                      >
                        {n.r.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-label mt-1">
                      {n.r > 0.7 ? "Sterk positief gecorreleerd" :
                       n.r > 0.4 ? "Matig positief gecorreleerd" :
                       n.r < -0.7 ? "Sterk negatief gecorreleerd" :
                       "Matig negatief gecorreleerd"}
                    </p>
                  </DataCard>
                ));
              })()}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
