import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataCard, val, textVal, MarkdownBlock, queryWithRetry } from "@/components/ui-helpers";
import { BookOpen, GitMerge, CheckCircle, XCircle } from "lucide-react";

export default function Brief() {
  const [activeBriefTab, setActiveBriefTab] = useState("daily");
  const [snap, setSnap] = useState<any>(null);
  const [al, setAl] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (activeBriefTab === "alignment") {
      queryWithRetry(() => supabase.from("alignment_engine").select("*").order("alignment_date", { ascending: false }).limit(1), "Brief/alignment_engine")
        .then(data => { setAl((data as any[])?.[0] || null); setLoaded(true); });
    } else {
      queryWithRetry(() => supabase.from("period_snapshots").select("*").eq("period_type", activeBriefTab).order("period_start", { ascending: false }).limit(1), `Brief/period_snapshots/${activeBriefTab}`)
        .then(data => { setSnap((data as any[])?.[0] || null); setLoaded(true); });
    }
  }, [activeBriefTab]);

  const tabs = ["daily","weekly","monthly","alignment"];
  const tabLabels: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", alignment: "Alignment" };
  const tabIcons: Record<string, React.ElementType> = { daily: BookOpen, weekly: BookOpen, monthly: BookOpen, alignment: GitMerge };
  const isAlignment = activeBriefTab === "alignment";

  return (
    <DashboardLayout>
      <div className="bg-card border-b border-card-border px-7 flex -mx-7 -mt-7 mb-7">
        {tabs.map((t) => {
          const Icon = tabIcons[t];
          return (
            <button key={t} onClick={() => setActiveBriefTab(t)}
              className={`flex items-center gap-1.5 px-5 py-3 text-[12px] font-semibold border-b-2 transition-colors ${
                t === activeBriefTab ? "text-purple-accent border-b-purple-accent" : "text-label border-b-transparent hover:text-foreground"
              }`}>
              <Icon size={14} />
              {tabLabels[t]}
            </button>
          );
        })}
      </div>

      {!isAlignment ? (
        loaded && !snap ? (
          <div className="text-center text-label text-[13px] mt-10">Nog geen brief beschikbaar voor {activeBriefTab}</div>
        ) : snap && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[18px] font-bold text-foreground">{val(snap.headline)}</div>
              <span className="bg-secondary text-purple-accent px-2 py-[2px] text-[9px] rounded font-semibold">{val(snap.conviction_score)}/10</span>
            </div>
            <div className="text-[11px] text-sub-text mb-8">{textVal(snap.core_driver)}</div>

            <DataCard className="p-5 mb-8">
              <MarkdownBlock content={snap.summary_dashboard || snap.summary || snap.summary_micro} />
            </DataCard>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "BASIS", value: snap.scenario_base, border: "border-l-neutral-text" },
                { label: "OPWAARTS", value: snap.scenario_upside, border: "border-l-bullish-text" },
                { label: "NEERWAARTS", value: snap.scenario_downside, border: "border-l-bearish-text" },
              ].map((s) => (
                <DataCard key={s.label} className={`p-5 border-l-[3px] ${s.border}`}>
                  <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">{s.label}</div>
                  <div className="text-[11px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
                </DataCard>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DataCard className="p-5">
                <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">TE MONITOREN</div>
                <MarkdownBlock content={snap.what_to_watch || snap.what_to_watch_next} />
              </DataCard>
              <DataCard className="p-5">
                <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">HANDELIMPLICATIES</div>
                <MarkdownBlock content={snap.trading_implications} />
              </DataCard>
            </div>
          </>
        )
      ) : (
        loaded && !al ? (
          <div className="text-center text-label text-[13px] mt-10">Nog geen data beschikbaar</div>
        ) : al && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <GitMerge size={20} className="text-purple-accent" />
              <div className="text-[22px] font-bold text-foreground uppercase">{val(al.alignment_state)}</div>
              <span className="bg-secondary text-purple-accent px-2 py-[2px] text-[9px] rounded font-semibold">{val(al.conviction_score)}/10</span>
            </div>

            <DataCard className="p-5 mb-8">
              <MarkdownBlock content={al.macro_story || al.summary_dashboard} />
            </DataCard>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <DataCard className="p-5 border-l-[3px] border-l-bullish-text">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className="text-bullish-text" />
                  <span className="text-[0.65rem] text-label uppercase tracking-[0.08em]">WAT TE DOEN</span>
                </div>
                <MarkdownBlock content={al.what_to_do} />
              </DataCard>
              <DataCard className="p-5 border-l-[3px] border-l-bearish-text">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={14} className="text-bearish-text" />
                  <span className="text-[0.65rem] text-label uppercase tracking-[0.08em]">VERMIJD</span>
                </div>
                <MarkdownBlock content={al.what_to_avoid} />
              </DataCard>
            </div>

            <DataCard className="p-5 mb-8">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">KEY WATCHPOINTS</div>
              <MarkdownBlock content={al.key_watchpoints} />
            </DataCard>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "BASIS", value: al.scenario_base, border: "border-l-neutral-text" },
                { label: "OPWAARTS", value: al.scenario_upside, border: "border-l-bullish-text" },
                { label: "NEERWAARTS", value: al.scenario_downside, border: "border-l-bearish-text" },
              ].map((s) => (
                <DataCard key={s.label} className={`p-5 border-l-[3px] ${s.border}`}>
                  <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-2">{s.label}</div>
                  <div className="text-[11px] text-sub-text leading-relaxed">{textVal(s.value)}</div>
                </DataCard>
              ))}
            </div>

            <DataCard className="p-5">
              <div className="text-[0.65rem] text-label uppercase tracking-[0.08em] mb-3">HANDELIMPLICATIES</div>
              <MarkdownBlock content={al.trading_implications} />
            </DataCard>
          </>
        )
      )}
    </DashboardLayout>
  );
}
