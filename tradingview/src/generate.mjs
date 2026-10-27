import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config, ROOT } from "./config.mjs";

const DAY = 86_400_000;
const MONTHS_NL = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

// ─── Bronnen ────────────────────────────────────────────────────

async function supabaseGet(path) {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error("SUPABASE_URL en SUPABASE_KEY ontbreken in tradingview/.env");
  }
  const res = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: config.supabaseKey, Authorization: `Bearer ${config.supabaseKey}` },
  });
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

/** Haalt events en bias uit Supabase en zet ze om naar het neutrale invoerformaat. */
export async function loadFromSupabase(now = Date.now()) {
  const from = new Date(now - config.daysBack * DAY).toISOString();
  const to = new Date(now + config.daysAhead * DAY).toISOString();
  const ccyList = config.currencies.join(",");

  const rows = await supabaseGet(
    `macro_events_calendar?select=event_datetime,event_currency,event_impact,importance_score,event_name,consensus,previous_value,actual_value,interpretation,market_impact_narrative` +
      `&event_datetime=gte.${from}&event_datetime=lte.${to}&event_currency=in.(${ccyList})&order=event_datetime.asc&limit=1000`,
  );

  const events = rows
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

  const biasRows = await supabaseGet(
    `entity_bias?select=entity_code,bias,bias_strength,main_driver,invalidation,snap_date&order=snap_date.desc&limit=500`,
  );
  const seen = new Set();
  const biases = [];
  for (const b of biasRows) {
    const ccy = String(b.entity_code ?? "").toUpperCase();
    if (!config.currencies.includes(ccy) || seen.has(ccy)) continue;
    seen.add(ccy);
    biases.push({
      ccy,
      bias: b.bias ?? "",
      strength: b.bias_strength ?? "",
      driver: b.main_driver ?? "",
      invalidation: b.invalidation ?? "",
    });
  }

  return { generatedAt: now, events, biases };
}

/** Leest een JSON-bestand in hetzelfde formaat (zie examples/). */
export function loadFromFile(path) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  return {
    generatedAt: data.generatedAt ? Date.parse(data.generatedAt) : Date.now(),
    label: data.label,
    events: data.events.map((e) => ({ ...e, time: Date.parse(e.time), ccy: e.ccy.toUpperCase() })),
    biases: data.biases ?? [],
  };
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
    `if barstate.isfirst`,
    `    int _count = ${events.length}`,
    ...events.map(
      (e) =>
        `    addEv(${e.time}, ${pineStr(e.ccy)}, ${e.impact}, ${pineStr(e.title)}, ${pineStr(e.stats)}, ${pineStr(e.detail)})`,
    ),
    ...data.biases.map(
      (b) =>
        `    addBias(${pineStr(b.ccy)}, ${pineStr(truncate(b.bias, 20))}, ${pineStr(truncate(b.strength, 16))}, ${pineStr(truncate(b.driver, 60))}, ${pineStr(truncate(b.invalidation, 200))})`,
    ),
  ];

  const code = template.replace("{{VERSION}}", version).replace("{{DATA}}", lines.join("\n"));
  return { code, version, label, eventCount: events.length, biasCount: data.biases.length };
}

export async function generate({ input } = {}) {
  const data = input ? loadFromFile(input) : await loadFromSupabase();
  const result = buildPine(data);
  mkdirSync(config.outDir, { recursive: true });
  const file = resolve(config.outDir, "bfx_macro_overlay.pine");
  writeFileSync(file, result.code);
  return { ...result, file };
}
