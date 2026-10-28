// Datablok voor de BFX Structure Engine 0.1 (aparte indicator, onderzoek).
// Zelfde BFX-snapshot en datablok als de CBO-engine (alleen lezen); schrijft out/bfx_structure_engine.pine.
// Extra: {{HIST}} = biashistorie per dag (alleen forward-rijen), zodat elke bar de bias van dát moment gebruikt.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, config } from "./config.mjs";
import { buildEngine } from "./engine-generate.mjs";
import { loadFromSupabase } from "./generate.mjs";

export const STRUCTURE_TEMPLATE = "template/bfx_structure_engine.pine";
const HIST_DAYS = 120;

// "Eerst gezien" per biasdatum (lokaal, append-only): een dag mag nooit eerder gelden dan hij bestond
export const SEEN_FILE = resolve(config.outDir, "bias-eerst-gezien.json");
export const validFrom = (t, datum, seen = {}) => Math.max(t + 6 * 3600000, seen[datum] ?? Infinity);

// Alleen 'forward' (echte meting), nooit 'teruggerekend'; per datum en valuta één regel.
// Een datum zonder "eerst gezien" krijgt nu (de generator ziet hem op dit moment voor het eerst).
export function histLines(history = [], now = Date.now(), seen = {}) {
  const from = now - HIST_DAYS * 86400000;
  const dup = new Set();
  const rows = [];
  for (const h of history) {
    const t = Date.parse(`${h.datum}T00:00:00Z`);
    const idx = Number(h.index);
    if (h.bron !== "forward" || !Number.isFinite(t) || !Number.isFinite(idx) || t < from || t > now) continue;
    const k = `${t}|${h.valuta}`;
    if (dup.has(k)) continue;
    dup.add(k);
    seen[h.datum] ??= now;
    rows.push({ t: validFrom(t, h.datum, seen), ccy: String(h.valuta).toUpperCase(), idx });
  }
  rows.sort((a, b) => a.t - b.t || a.ccy.localeCompare(b.ccy));
  return [
    "_histLoad() =>",
    ...rows.map((r) => `    addHist(${r.t}, "${r.ccy}", ${Math.round(r.idx * 10000) / 10000})`),
    "    true",
    "if barstate.isfirst",
    "    _histLoad()",
  ];
}

export function buildStructure(data, seen = {}) {
  const out = buildEngine(data, STRUCTURE_TEMPLATE);
  const hist = histLines(data.history ?? [], data.generatedAt, seen);
  const tplSha = createHash("sha256").update(readFileSync(resolve(ROOT, STRUCTURE_TEMPLATE))).digest("hex");
  const code = out.code.replace("{{HIST}}", hist.join("\n")).replace("{{TPL_SHA}}", tplSha);
  return { ...out, code, hash: createHash("sha256").update(code).digest("hex"), histRows: hist.length - 4, seen, tplSha };
}

export const readSeen = () => (existsSync(SEEN_FILE) ? JSON.parse(readFileSync(SEEN_FILE, "utf8")) : {});
export function writeSeen(seen) {
  mkdirSync(config.outDir, { recursive: true });
  writeFileSync(SEEN_FILE, `${JSON.stringify(seen, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildStructure(await loadFromSupabase(Date.now()), readSeen());
  writeSeen(out.seen);
  mkdirSync(config.outDir, { recursive: true });
  const file = resolve(config.outDir, "bfx_structure_engine.pine");
  writeFileSync(file, out.code);
  console.log(`Structure-Pine: ${file} · ${out.pairs} paren · ${out.events} high-impact events · ${out.histRows} forward-biasrijen · hash ${out.hash.slice(0, 12)} · ${out.code.length} bytes`);
}
