import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config, ROOT } from "./config.mjs";

const DAY = 86_400_000;
const MONTHS_NL = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

// ─── Bronnen ────────────────────────────────────────────────────

async function restGet(url, key, path, schema = "") {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  if (schema) headers["Accept-Profile"] = schema;
  const res = await fetch(`${url}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`Supabase ${path.split("?")[0]}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

function parseEventTime(value) {
  if (!value) return null;
  const s = String(value).trim().replace(" ", "T");
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  const ms = Date.parse(hasZone || !config.eventTimesAreUtc ? s : `${s}Z`);
  return Number.isFinite(ms) ? ms : null;
}

function impactLevel(impact, score) {
  const i = String(impact ?? "").toLowerCase();
  if (i === "high") return 3;
  if (i === "medium") return 2;
  if (i === "low") return 1;
  if (typeof score === "number") return score >= 7 ? 3 : score >= 4 ? 2 : 1;
  return 1;
}

/** Events uit de BFX Macro Lab-database (macro_events_calendar). */
async function loadEvents(now) {
  if (!config.supabaseUrl || !config.supabaseKey) {
    console.warn("SUPABASE_URL/SUPABASE_KEY niet ingesteld: geen events, alleen BIAS 5.0.");
    return [];
  }
  const from = new Date(now - config.daysBack * DAY).toISOString();
  const to = new Date(now + config.daysAhead * DAY).toISOString();
  const rows = await restGet(
    config.supabaseUrl,
    config.supabaseKey,
    `macro_events_calendar?select=event_datetime,event_currency,event_impact,importance_score,event_name,consensus,previous_value,actual_value,interpretation,market_impact_narrative` +
      `&event_datetime=gte.${from}&event_datetime=lte.${to}&event_currency=in.(${config.currencies.join(",")})&order=event_datetime.asc&limit=1000`,
    config.supabaseSchema,
  );
  return rows
    .map((r) => ({
      time: parseEventTime(r.event_datetime),
      ccy: String(r.event_currency ?? "").toUpperCase(),
      impact: impactLevel(r.event_impact, r.importance_score),
      name: r.event_name ?? "",
      consensus: r.consensus,
      previous: r.previous_value,
      actual: r.actual_value,
      detail: r.market_impact_narrative || r.interpretation || "",
    }))
    .filter((e) => e.time && e.ccy && e.name);
}

/** BIAS 5.0 uit mirror_bias50_paar, mirror_bias50 en mirror_bias50_samenvatting. */
async function loadBias() {
  if (!config.biasUrl || !config.biasKey) {
    console.warn("BIAS_SUPABASE_URL/BIAS_SUPABASE_KEY niet ingesteld: geen BIAS 5.0.");
    return { pairs: [], currencies: [], biasDatum: null, biasVersie: "" };
  }
  const get = (path) => restGet(config.biasUrl, config.biasKey, path);
  // select=* zodat een later toegevoegde kolom (bv. strategie_bevestiging per paar) vanzelf meekomt
  const [pairRows, ccyRows, sumRows] = await Promise.all([
    get("mirror_bias50_paar?select=*&order=sorteervolgorde.asc"),
    get("mirror_bias50?select=valuta,index,label,zekerheid,conflict,datum,versie"),
    get("mirror_bias50_samenvatting?select=valuta,strategie_bevestiging,samenvatting_tekst,kantelpunt_tekst"),
  ]);
  return normalizeBias(pairRows, ccyRows, sumRows);
}

export function normalizeBias(pairRows, ccyRows, sumRows = []) {
  const sum = new Map(sumRows.map((s) => [s.valuta, s]));
  const dates = [...pairRows, ...ccyRows].map((r) => r.datum).filter(Boolean).sort();
  const latest = dates.at(-1) ?? null;
  return {
    pairs: pairRows.map((p) => ({
      basis: p.basis,
      quote: p.quote,
      idx: Number(p.paar_index),
      label: p.paar_label ?? "",
      tekst: p.paar_richting_tekst ?? "",
      emmer: p.gelopen_emmer ?? "",
      z: Number(p.gelopen_z ?? 0),
      bevestiging: p.strategie_bevestiging ?? "",
    })),
    currencies: ccyRows.map((c) => ({
      ccy: c.valuta,
      idx: Number(c.index),
      label: c.label ?? "",
      zekerheid: c.zekerheid ?? "",
      conflict: Boolean(c.conflict),
      bevestiging: sum.get(c.valuta)?.strategie_bevestiging ?? "",
      kantelpunt: sum.get(c.valuta)?.kantelpunt_tekst ?? "",
      samenvatting: sum.get(c.valuta)?.samenvatting_tekst ?? "",
    })),
    biasDatum: latest ? Date.parse(`${latest}T00:00:00Z`) : null,
    biasVersie: [...pairRows, ...ccyRows].find((r) => r.versie)?.versie ?? "",
  };
}

export async function loadFromSupabase(now = Date.now()) {
  const [events, bias] = await Promise.all([loadEvents(now), loadBias()]);
  return { generatedAt: now, events, ...bias };
}

/** Leest een JSON-bestand (zie examples/): events + optioneel ruwe BIAS-rijen. */
export function loadFromFile(path) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  const bias = data.bias ? normalizeBias(data.bias.paar ?? [], data.bias.valuta ?? [], data.bias.samenvatting ?? []) : {};
  return {
    generatedAt: data.generatedAt ? Date.parse(data.generatedAt) : Date.now(),
    label: data.label,
    events: (data.events ?? []).map((e) => ({ ...e, time: Date.parse(e.time), ccy: e.ccy.toUpperCase() })),
    pairs: [],
    currencies: [],
    biasDatum: null,
    biasVersie: "",
    ...bias,
  };
}

/** Laatste werkdag (UTC-datum) waarop BIAS 5.0 ververst had moeten zijn (05:13 NL ≈ 04:13 UTC). */
export function expectedBiasDate(now = Date.now()) {
  const d = new Date(now - 4.5 * 3_600_000);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// ─── Omzetten naar Pine ─────────────────────────────────────────

const fmtNum = (v) => (v === null || v === undefined || v === "" ? null : String(v));

function statsLine(e) {
  const parts = [];
  if (fmtNum(e.actual)) parts.push(`act ${fmtNum(e.actual)}`);
  if (fmtNum(e.consensus)) parts.push(`cons ${fmtNum(e.consensus)}`);
  if (fmtNum(e.previous)) parts.push(`vorig ${fmtNum(e.previous)}`);
  return parts.join(" | ");
}

const num = (v) => (Number.isFinite(Number(v)) ? String(Math.round(Number(v) * 10000) / 10000) : "0.0");

function truncate(s, max) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function pineStr(s) {
  return `"${String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n")}"`;
}

/** Events met dezelfde tijd en valuta worden één label (bv. PCE + BBP + claims om 14:30). */
function groupEvents(events) {
  const groups = new Map();
  for (const e of events) {
    if (e.impact < config.minImpact) continue;
    const key = `${e.time}|${e.ccy}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.values()]
    .map((list) => {
      // Hoofdevent = hoogste impact; bij gelijke impact het event met een scenario-uitleg.
      list.sort((a, b) => b.impact - a.impact || Number(Boolean(b.detail)) - Number(Boolean(a.detail)));
      const main = list[0];
      const title = list.length > 1 ? `${main.name} +${list.length - 1}` : main.name;
      const stats = list
        .map((e) => (statsLine(e) ? (list.length > 1 ? `${e.name}: ${statsLine(e)}` : statsLine(e)) : ""))
        .filter(Boolean)
        .join("\n");
      const detail = [...new Set(list.map((e) => e.detail).filter(Boolean))].join("\n\n");
      return {
        time: main.time,
        ccy: main.ccy,
        impact: main.impact,
        title: truncate(title, 48),
        stats: truncate(stats.replace(/\n/g, " · "), 140),
        detail: truncate(detail, 600),
      };
    })
    .sort((a, b) => a.time - b.time);
}

function isoWeek(ms) {
  const d = new Date(ms);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  return Math.ceil(((t - yearStart) / DAY + 1) / 7);
}

function defaultLabel(events, generatedAt) {
  const upcoming = events.filter((e) => e.time >= generatedAt);
  const first = upcoming[0]?.time ?? generatedAt;
  const last = upcoming.at(-1)?.time ?? generatedAt;
  const d = (ms) => `${new Date(ms).getUTCDate()} ${MONTHS_NL[new Date(ms).getUTCMonth()]}`;
  return `Week ${isoWeek(generatedAt)} · ${d(first)} – ${d(last)}`;
}

export function buildPine(data) {
  const template = readFileSync(resolve(ROOT, "template/bfx_macro_overlay.pine"), "utf8");
  const events = groupEvents(data.events);
  const version = new Date(data.generatedAt).toISOString().slice(0, 16).replace("T", " ") + " UTC";
  const label = data.label || defaultLabel(events, data.generatedAt);

  const lines = [
    `const string VERSION    = ${pineStr(version)}`,
    `const int    GENERATED  = ${Math.round(data.generatedAt)}`,
    `const string DATA_LABEL = ${pineStr(label)}`,
    `const int    BIAS_DATUM = ${data.biasDatum ?? 0}`,
    `const string BIAS_VERSIE = ${pineStr(data.biasVersie)}`,
    `if barstate.isfirst`,
    `    int _count = ${events.length}`,
    ...events.map(
      (e) =>
        `    addEv(${e.time}, ${pineStr(e.ccy)}, ${e.impact}, ${pineStr(e.title)}, ${pineStr(e.stats)}, ${pineStr(e.detail)})`,
    ),
    ...data.pairs.map(
      (p) =>
        `    addPair(${pineStr(p.basis)}, ${pineStr(p.quote)}, ${num(p.idx)}, ${pineStr(p.label)}, ${pineStr(truncate(p.tekst, 160))}, ${pineStr(p.emmer)}, ${num(p.z)}, ${pineStr(truncate(p.bevestiging, 40))})`,
    ),
    ...data.currencies.map(
      (c) =>
        `    addCcy(${pineStr(c.ccy)}, ${num(c.idx)}, ${pineStr(c.label)}, ${pineStr(c.zekerheid)}, ${c.conflict ? "true" : "false"}, ${pineStr(truncate(c.bevestiging, 60))}, ${pineStr(truncate(c.kantelpunt, 400))}, ${pineStr(truncate(c.samenvatting, 700))})`,
    ),
  ];

  const code = template.replace("{{VERSION}}", version).replace("{{DATA}}", lines.join("\n"));
  return { code, version, label, eventCount: events.length, pairCount: data.pairs.length, biasDatum: data.biasDatum };
}

export async function generate({ input } = {}) {
  const data = input ? loadFromFile(input) : await loadFromSupabase();
  const result = buildPine(data);
  mkdirSync(config.outDir, { recursive: true });
  const file = resolve(config.outDir, "bfx_macro_overlay.pine");
  writeFileSync(file, result.code);
  return { ...result, file };
}
