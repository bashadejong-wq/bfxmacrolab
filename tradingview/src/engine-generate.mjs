// Datablok voor de BFX CBO Research Engine 0.1 (aparte indicator, onderzoek).
// Leest dezelfde BFX-snapshot als de Compass (alleen lezen); schrijft out/bfx_cbo_engine.pine.
// De productiegenerator (generate.mjs) wordt niet gewijzigd.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config, ROOT } from "./config.mjs";
import { loadFromSupabase } from "./generate.mjs";
import { pickInvalidation, strategyStatus } from "./logic.mjs";

const CB = /rate decision|funds rate|cash rate|refinancing rate|deposit facility|bank rate|policy rate|overnight rate|fomc|ecb|boe |boj|rba|rbnz|snb|boc|monetary policy|press conference|mpc/i;
const str = (s) => `"${String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ")}"`;
const num = (v) => (Number.isFinite(Number(v)) ? String(Math.round(Number(v) * 10000) / 10000) : "na");
const cut = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

export function buildEngine(data) {
  const tpl = readFileSync(resolve(ROOT, "template/bfx_cbo_engine.pine"), "utf8");
  const biasDay = data.biasDatum ? new Date(data.biasDatum).toISOString().slice(0, 10) : null;
  const now = data.generatedAt;
  // Alleen high-impact events (gegroepeerd per tijd+valuta), komende 21 dagen + afgelopen 2 dagen (post-event-regime)
  const seen = new Set();
  const ev = [];
  for (const e of data.events) {
    if (e.impact < 3 || e.time < now - 2 * 86400000) continue;
    const k = `${e.time}|${e.ccy}`;
    if (seen.has(k)) continue;
    seen.add(k);
    ev.push(e);
  }
  ev.sort((a, b) => a.time - b.time);
  const lines = [
    `const string ENG_VERSION = ${str(new Date(now).toISOString().slice(0, 16).replace("T", " ") + " UTC")}`,
    `const int    ENG_GENERATED = ${Math.round(now)}`,
    `const int    BIAS_DATUM = ${data.biasDatum ?? 0}`,
    `const string BIAS_VERSIE = ${str(data.biasVersie)}`,
    // Kalenderdekking is niet bewezen compleet (gap): nooit 'geen events' claimen
    `const bool   CAL_COVERAGE_PROVEN = false`,
    `_engLoad() =>`,
    ...data.pairs.map((p) => `    addPair(${str(p.basis)}, ${str(p.quote)}, ${num(p.idx)}, ${str(p.label)}, ${str(p.status)}, ${str(cut(p.tekst, 120))})`),
    ...data.currencies.map((c) => `    addCcy(${str(c.ccy)}, ${num(c.idx)}, ${str(cut(c.kantelpunt, 140))})`),
    ...data.pairs
      .map((p) => pickInvalidation(data.outlookRows ?? [], `${p.basis}${p.quote}`, biasDay))
      .filter(Boolean)
      .map((o) => `    addInv(${str(o.paar)}, ${str(cut(o.tekst, 140))}, ${str(o.horizon)})`),
    ...ev.map((e) => `    addEv(${e.time}, ${str(e.ccy)}, ${CB.test(e.name) ? "true" : "false"}, ${str(cut(e.name, 40))})`),
    `    true`,
    `if barstate.isfirst`,
    `    _engLoad()`,
  ];
  const code = tpl.replace("{{DATA}}", lines.join("\n")).replace("{{VERSION}}", lines[0]);
  return { code, hash: createHash("sha256").update(code).digest("hex"), pairs: data.pairs.length, events: ev.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = await loadFromSupabase(Date.now());
  // strategiestatus komt al als code uit normalizeBias (p.status)
  void strategyStatus;
  const out = buildEngine(data);
  mkdirSync(config.outDir, { recursive: true });
  const file = resolve(config.outDir, "bfx_cbo_engine.pine");
  writeFileSync(file, out.code);
  console.log(`Engine-Pine: ${file} · ${out.pairs} paren · ${out.events} high-impact events · hash ${out.hash.slice(0, 12)} · ${out.code.length} bytes`);
}
