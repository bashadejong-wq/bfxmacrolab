// Append-only forwardlogboek STR_0.1-F (lokaal alternatief voor de databasetabel; geen database-schrijfacties).
//   node src/forward-log.mjs ingest <bestand|->   alertberichten (BFX_EXEC_0.1 / BFX_KAND_0.1, één JSON per regel) vastleggen
//   node src/forward-log.mjs verify               hashketen controleren
//   node src/forward-log.mjs report               evaluatie per paar × timeframe (zie forward-eval.mjs)
// Regels: nooit herschrijven of verwijderen; elke regel draagt de hash van de vorige; een afwijkende latere uitkomst
// wordt een 'correctie'-regel naast de oorspronkelijke, nooit een vervanging.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { config } from "./config.mjs";

export const LOG_FILE = resolve(config.logDir, "str-forward-log.jsonl");
const GENESIS = "0".repeat(64);

// Stabiele serialisatie (gesorteerde sleutels), zodat de hash niet afhangt van de veldvolgorde
export function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}
const sha = (s) => createHash("sha256").update(s).digest("hex");
export const rowHash = (r) => sha(r.prev + canonical({ seq: r.seq, recorded_at: r.recorded_at, type: r.type, data: r.data }));

export function readRows(file = LOG_FILE) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

export function append(type, data, { file = LOG_FILE, now = Date.now() } = {}) {
  const rows = readRows(file);
  const last = rows.at(-1);
  const row = { seq: (last?.seq ?? 0) + 1, recorded_at: new Date(now).toISOString(), type, data, prev: last?.hash ?? GENESIS };
  row.hash = rowHash(row);
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(row)}\n`);
  return row;
}

export function verify(file = LOG_FILE) {
  const rows = readRows(file);
  let prev = GENESIS;
  for (const [i, r] of rows.entries()) {
    if (r.seq !== i + 1 || r.prev !== prev || r.hash !== rowHash(r)) return { ok: false, regels: rows.length, gebroken_bij: r.seq ?? i + 1 };
    prev = r.hash;
  }
  return { ok: true, regels: rows.length, gebroken_bij: null };
}

/** Huidige stand per setup: ontstaan, eerste uitkomst en eventuele correcties (niets wordt overschreven). */
export function state(file = LOG_FILE) {
  const setups = new Map();
  for (const r of readRows(file)) {
    const id = r.data?.setup?.setup_id;
    if (r.type === "setup_ontstaan" && id) setups.set(id, { ontstaan: r.data, uitkomst: null, correcties: [] });
    if (r.type === "setup_uitkomst" && setups.has(id)) setups.get(id).uitkomst ??= r.data;
    if (r.type === "correctie" && setups.has(r.data.setup_id)) setups.get(r.data.setup_id).correcties.push(r.data);
  }
  return setups;
}

/** Eén alertbericht (string of object) vastleggen. Idempotent: hetzelfde ontstaan of dezelfde uitkomst wordt niet dubbel gelogd. */
export function ingestAlert(msg, opts = {}) {
  const m = typeof msg === "string" ? JSON.parse(msg) : msg;
  const done = [];
  if (m.schema === "BFX_KAND_0.1") {
    done.push(append("kandidaat", m, opts).seq);
    return done;
  }
  if (m.schema !== "BFX_EXEC_0.1") throw new Error(`onbekend schema: ${m.schema}`);
  const id = m.setup?.setup_id;
  if (!id) return done; // statuswissel zonder setup (bv. WATCH → ARMED): niet nodig voor het logboek
  const st = state(opts.file);
  if (!st.has(id)) done.push(append("setup_ontstaan", m, opts).seq);
  const s = state(opts.file).get(id);
  if (m.setup.uitkomst !== "open") {
    if (!s.uitkomst) done.push(append("setup_uitkomst", m, opts).seq);
    else if (s.uitkomst.setup.uitkomst !== m.setup.uitkomst || s.uitkomst.setup.r_bruto !== m.setup.r_bruto)
      done.push(append("correctie", { setup_id: id, reden: "afwijkende latere uitkomst (herberekening/providercorrectie)", oud: { uitkomst: s.uitkomst.setup.uitkomst, r_bruto: s.uitkomst.setup.r_bruto }, nieuw: { uitkomst: m.setup.uitkomst, r_bruto: m.setup.r_bruto } }, opts).seq);
  }
  return done;
}

/**
 * Providercorrectie: herbereken een setup met (gecorrigeerde) koersdata en leg een verschil vast als 'correctie'.
 * bars: [{t, h, l, c}] na de bevestiging; zelfde regels als de indicator (stop eerst, doel, verval na tMax bars).
 */
export function reconcile(setupId, bars, { tMax = 32, ...opts } = {}) {
  const s = state(opts.file).get(setupId);
  if (!s?.uitkomst) return null;
  const { entry, stop, doel, richting } = s.ontstaan.setup;
  const d = richting === "long" ? 1 : -1;
  const risk = Math.abs(entry - stop);
  let uitkomst = "open";
  let r = null;
  for (const [i, b] of bars.entries()) {
    if (d === 1 ? b.l <= stop : b.h >= stop) { uitkomst = "FAILED"; r = -1; break; }
    if (doel != null && (d === 1 ? b.h >= doel : b.l <= doel)) { uitkomst = "DOEL"; r = Math.abs(doel - entry) / risk; break; }
    if (i + 1 >= tMax) { uitkomst = "EXPIRED"; r = ((b.c - entry) * d) / risk; break; }
  }
  const oud = s.uitkomst.setup;
  const same = uitkomst === oud.uitkomst && (r == null || oud.r_bruto == null || Math.abs(r - oud.r_bruto) < 1e-6);
  if (same) return { gewijzigd: false };
  append("correctie", { setup_id: setupId, reden: "providercorrectie (herberekening met gecorrigeerde koersdata)", oud: { uitkomst: oud.uitkomst, r_bruto: oud.r_bruto }, nieuw: { uitkomst, r_bruto: r } }, opts);
  return { gewijzigd: true, uitkomst, r };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "ingest") {
    const txt = readFileSync(arg === "-" || !arg ? 0 : arg, "utf8");
    let n = 0;
    for (const line of txt.split("\n").map((l) => l.trim()).filter(Boolean)) n += ingestAlert(line).length;
    console.log(`${n} regels vastgelegd · ${JSON.stringify(verify())}`);
  } else if (cmd === "verify") console.log(JSON.stringify(verify()));
  else if (cmd === "report") {
    const { evaluate, formatReport } = await import("./forward-eval.mjs");
    console.log(formatReport(evaluate(state(), readRows())));
  } else console.log("gebruik: ingest <bestand|-> · verify · report");
}
