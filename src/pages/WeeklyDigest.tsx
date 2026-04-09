import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, SectionLabel, BiasChip, RiskChip, MarkdownBlock, val, fmtDate, queryWithRetry } from "@/components/ui-helpers";
import { BookOpen, TrendingUp, Shield, Zap, Globe, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

export default function WeeklyDigest() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    queryWithRetry(
      () => supabase.from("period_snapshots")
        .select("*")
        .in("period_type", ["weekly", "monthly"])
        .order("period_end", { ascending: false })
        .limit(20),
      "WeeklyDigest"
    ).then(data => { setSnapshots((data as any[]) || []); setLoaded(true); });
  }, []);

  if (!loaded) {
    return <DashboardLayout><div className="text-label text-[13px] mt-10 text-center">Laden...</div></DashboardLayout>;
  }

  if (snapshots.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
            <BookOpen size={28} className="text-purple-accent" />
          </div>
          <h2 className="text-[18px] font-bold text-foreground">Weekly Digest</h2>
          <p className="text-[13px] text-label text-center max-w-md leading-relaxed">
            De weekly digest wordt automatisch gegenereerd uit period snapshots.
            Kom terug na de volgende workflow run voor de wekelijkse samenvatting.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const weekly = snapshots.filter(s => s.period_type === "weekly");
  const monthly = snapshots.filter(s => s.period_type === "monthly");
  const latest = weekly[0] || snapshots[0];

  const currencies = [
    { code: "USD", bias: latest?.usd_bias },
    { code: "EUR", bias: latest?.eur_bias },
    { code: "JPY", bias: latest?.jpy_bias },
    { code: "GBP", bias: latest?.gbp_bias },
    { code: "AUD", bias: latest?.aud_bias },
    { code: "NZD", bias: latest?.nzd_bias },
    { code: "CAD", bias: latest?.cad_bias },
    { code: "CHF", bias: latest?.chf_bias },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-foreground">Weekly Digest</h1>
        <p className="text-[12px] text-label mt-1">Automatische samenvatting uit period snapshots</p>
      </div>

      {/* Latest snapshot hero */}
      {latest && (
        <DataCard className="p-6 mb-6 border-l-4 border-l-purple-accent">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] bg-purple-accent/10 text-purple-accent px-2 py-0.5 rounded font-semibold uppercase">
              {latest.period_label || latest.period_type}
            </span>
            <span className="text-[11px] text-label">
              {fmtDate(latest.period_start)} — {fmtDate(latest.period_end)}
            </span>
          </div>
          {latest.headline && (
            <h2 className="text-[16px] font-bold text-foreground mb-3 leading-snug">{latest.headline}</h2>
          )}

          {/* Regime badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {latest.macro_regime && (
              <span className="bg-secondary text-sub-text px-2 py-1 rounded text-[10px] font-medium">
                Macro: {latest.macro_regime}
              </span>
            )}
            <RiskChip regime={latest.risk_regime} />
            {latest.liquidity_regime && (
              <span className="bg-secondary text-sub-text px-2 py-1 rounded text-[10px] font-medium">
                Liquiditeit: {latest.liquidity_regime}
              </span>
            )}
            {latest.conviction_score != null && (
              <span className="bg-purple-accent/10 text-purple-accent px-2 py-1 rounded text-[10px] font-bold">
                Conviction: {latest.conviction_score}/10
              </span>
            )}
          </div>

          {/* Core driver */}
          {latest.core_driver && (
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-1">
                <Zap size={12} className="text-purple-accent" />
                <span className="text-[0.6rem] text-label uppercase font-semibold">Core Driver</span>
              </div>
              <p className="text-[12px] text-sub-text leading-relaxed">{latest.core_driver}</p>
            </div>
          )}

          {/* Summary */}
          {latest.summary && (
            <div className="mb-4">
              <MarkdownBlock content={latest.summary} />
            </div>
          )}
        </DataCard>
      )}

      {/* Currency biases */}
      <SectionLabel>Valuta Bias</SectionLabel>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {currencies.map(c => (
          <DataCard key={c.code} className="p-3 text-center">
            <div className="text-[12px] font-bold text-foreground mb-1">{c.code}</div>
            <BiasChip bias={c.bias} />
          </DataCard>
        ))}
      </div>

      {/* Key sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {latest?.scenario_base && (
          <DataCard className="p-5">
            <SectionLabel>📊 Base Scenario</SectionLabel>
            <MarkdownBlock content={latest.scenario_base} />
          </DataCard>
        )}
        {latest?.scenario_upside && (
          <DataCard className="p-5">
            <SectionLabel>🟢 Upside Scenario</SectionLabel>
            <MarkdownBlock content={latest.scenario_upside} />
          </DataCard>
        )}
        {latest?.scenario_downside && (
          <DataCard className="p-5">
            <SectionLabel>🔴 Downside Scenario</SectionLabel>
            <MarkdownBlock content={latest.scenario_downside} />
          </DataCard>
        )}
        {latest?.trading_implications && (
          <DataCard className="p-5">
            <SectionLabel>💡 Trading Implicaties</SectionLabel>
            <MarkdownBlock content={latest.trading_implications} />
          </DataCard>
        )}
      </div>

      {/* Asset views */}
      {(latest?.gold_view || latest?.oil_view || latest?.spx_view) && (
        <>
          <SectionLabel>Asset Views</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Gold", view: latest?.gold_view },
              { label: "Oil", view: latest?.oil_view },
              { label: "S&P 500", view: latest?.spx_view },
              { label: "VIX", view: latest?.vix_view },
              { label: "US 2Y", view: latest?.us_2y_view },
              { label: "US 10Y", view: latest?.us_10y_view },
              { label: "Curve", view: latest?.curve_view },
              { label: "Real Yield", view: latest?.real_yield_view },
            ].filter(a => a.view).map(a => (
              <DataCard key={a.label} className="p-4">
                <div className="text-[0.6rem] text-label uppercase font-semibold mb-1">{a.label}</div>
                <div className="text-[11px] text-sub-text leading-relaxed">{a.view}</div>
              </DataCard>
            ))}
          </div>
        </>
      )}

      {/* Historical snapshots */}
      {weekly.length > 1 && (
        <>
          <SectionLabel>Eerdere Weken</SectionLabel>
          <div className="space-y-3">
            {weekly.slice(1).map((snap) => (
              <DataCard
                key={snap.id}
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === snap.id ? null : snap.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-label">{fmtDate(snap.period_start)} — {fmtDate(snap.period_end)}</span>
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-sub-text">{snap.period_label}</span>
                    <RiskChip regime={snap.risk_regime} />
                  </div>
                  {expanded === snap.id ? <ChevronUp size={14} className="text-label" /> : <ChevronDown size={14} className="text-label" />}
                </div>
                {snap.headline && (
                  <p className="text-[12px] text-foreground font-medium mt-2">{snap.headline}</p>
                )}
                {expanded === snap.id && snap.summary && (
                  <div className="mt-3 pt-3 border-t border-card-border">
                    <MarkdownBlock content={snap.summary} />
                  </div>
                )}
              </DataCard>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
