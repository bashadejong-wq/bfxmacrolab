// Beslisregels van de BFX TradingView-indicator, los van netwerk en browser zodat ze testbaar zijn.

export const DAY = 86_400_000;
export const TZ = "Europe/Amsterdam";
// BIAS_5.0 ververst om 05:13 NL; vanaf 05:30 NL (veiligheidsmarge) hoort de stand van vandaag er te zijn.
export const BIAS_READY_MINUTES = 5 * 60 + 30;
export const NEUTRAL_BAND = 15;

const tzPart = (t, type) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, [type]: "numeric", hourCycle: "h23" }).formatToParts(new Date(t)).find((x) => x.type === type).value);

/** Laatste werkdag (UTC-middernacht van die datum) waarop BIAS_5.0 ververst had moeten zijn. */
export function expectedBiasDate(now = Date.now()) {
  let t = now;
  if (tzPart(t, "hour") * 60 + tzPart(t, "minute") < BIAS_READY_MINUTES) t -= DAY;
  let d = Date.UTC(tzPart(t, "year"), tzPart(t, "month") - 1, tzPart(t, "day"));
  while ([0, 6].includes(new Date(d).getUTCDay())) d -= DAY;
  return d;
}

export const dayMs = (d) => Date.parse(`${d}T00:00:00Z`);

/**
 * Controleert de BIAS-snapshot. Geeft { ok, reason, ccyCount, pairCount, datum, versie }.
 * Eén datum en één versie voor alles; exact 8 valuta's en 28 paren; datum = verwachte datum.
 */
export function validateBias({ pairs = [], currencies = [], datums = [], versies = [] }, now = Date.now()) {
  const res = { ok: false, reason: "", ccyCount: currencies.length, pairCount: pairs.length, datum: null, versie: null };
  const ud = [...new Set(datums.filter(Boolean))];
  const uv = [...new Set(versies.filter(Boolean))];
  res.datum = ud.length === 1 ? ud[0] : null;
  res.versie = uv.length === 1 ? uv[0] : null;
  if (currencies.length !== 8) return { ...res, reason: `BIAS_5.0: ${currencies.length} valuta's in plaats van 8` };
  if (pairs.length !== 28) return { ...res, reason: `BIAS_5.0: ${pairs.length} paren in plaats van 28` };
  if (ud.length !== 1) return { ...res, reason: `BIAS_5.0: ${ud.length} verschillende datums (${ud.join(", ")})` };
  if (uv.length !== 1) return { ...res, reason: `BIAS_5.0: ${uv.length} verschillende versies` };
  const expected = expectedBiasDate(now);
  if (dayMs(res.datum) < expected) {
    return { ...res, reason: `BIAS_5.0 verouderd: stand van ${res.datum}, verwacht ${new Date(expected).toISOString().slice(0, 10)}` };
  }
  return { ...res, ok: true };
}

/** Strategiebevestiging: alleen 'bevestigd' is positief; onbekend is nooit positief. */
export function strategyStatus(bevestiging, status) {
  const s = String(status || bevestiging || "").trim().toLowerCase();
  if (!s) return { code: "ontbreekt", positive: false, text: "Strategie: data ontbreekt." };
  if (s.includes("verzegel")) return { code: "geen_stand", positive: false, text: "Strategie: nog niet te beoordelen — geen verzegelde strategiestand." };
  if (s.includes("opbouw")) return { code: "in_opbouw", positive: false, text: "Strategie: in opbouw — nog geen bevestiging." };
  if (s.includes("tegengesteld")) return { code: "tegengesteld", positive: false, text: "Strategie: tegengesteld — waarschuwing tegen de BIAS-richting." };
  if (s.includes("geen trade")) return { code: "geen_trade", positive: false, text: "Strategie: geen trade." };
  if (s === "bevestigd") return { code: "bevestigd", positive: true, text: "Strategie: bevestigd." };
  return { code: "onbekend", positive: false, text: `Strategie: onbekende status (${s}) — niet als bevestiging gelezen.` };
}

export const INVALIDATION_MISSING = "Paarinvalidatie: geen actuele, bij deze periode passende invalidatie beschikbaar.";

/**
 * Paarinvalidatie uit mirror_outlook_paar: alleen de daily-rij van exact de BIAS-datum,
 * met tekst, en geen nieuwere rij voor dat paar. Anders null.
 */
export function pickInvalidation(rows, paar, biasDatum) {
  const own = rows.filter((r) => r.paar_code === paar).sort((a, b) => String(b.periode).localeCompare(String(a.periode)));
  if (!own.length || !biasDatum) return null;
  const newest = own[0];
  if (newest.periode !== biasDatum) return null; // nieuwere of oudere periode dan de BIAS-stand
  const daily = own.find((r) => r.laag === "daily" && r.periode === biasDatum);
  if (!daily || !String(daily.invalidatie ?? "").trim()) return null;
  if (own.some((r) => r !== daily && r.periode === biasDatum && r.laag === "daily")) return null; // tegenstrijdig
  return { paar, tekst: daily.invalidatie, katalysator: daily.katalysator ?? "", horizon: daily.horizon ?? "", periode: daily.periode };
}

/** Bankconsensus alleen bij ≥3 banken, bekende einddatum (in de toekomst) en bekende ramingsdatum. */
export function usableConsensus(rows, now = Date.now()) {
  return rows.filter(
    (k) => Number(k.n_banken) >= 3 && k.einddatum && dayMs(k.einddatum) > now && k.laatste_raming_datum && /^[A-Z]{6}$/.test(k.paar ?? ""),
  );
}

/** Versheid van een tijdstempel: actueel / verouderd / ontbreekt. */
export function freshness(ts, maxAgeMs, now = Date.now()) {
  if (!ts) return "ontbreekt";
  return now - ts <= maxAgeMs ? "actueel" : "verouderd";
}

/** Eerstvolgende katalysator: eerst high, anders medium, alleen voor basis of quote. */
export function nextCatalyst(events, base, quote, now = Date.now()) {
  const rel = events.filter((e) => e.time >= now && (e.ccy === base || e.ccy === quote)).sort((a, b) => a.time - b.time);
  return rel.find((e) => e.impact >= 3) ?? rel.find((e) => e.impact === 2) ?? null;
}

/** Vier scenario's; ontbrekend blijft expliciet ontbrekend. */
export function scenarios(e) {
  const val = (s) => (String(s ?? "").trim() ? String(s).trim() : null);
  return { hoger: val(e?.up), inLijn: val(e?.inl), lager: val(e?.down), gemengd: val(e?.mix) };
}

// ─── Browsercontroles (B3/B4) ────────────────────────────────────

export const EXIT = { OK: 0, FOUT: 1, STOP_DATA: 2, STOP_SESSIE: 3, STOP_LAYOUT: 4, STOP_SCRIPT: 5, STOP_OPSLAAN: 6 };

/**
 * Controle vóór iedere editoractie. Geeft { ok, code, reason }.
 * state: { hasSession, isGuest, title, url, layoutName }, expected: { layoutId, layoutName }
 */
export function preflight(state, expected) {
  if (!expected.layoutId || !expected.layoutName) return { ok: false, code: EXIT.STOP_LAYOUT, reason: "TV_LAYOUT_ID of TV_LAYOUT_NAME niet ingesteld" };
  if (!state.hasSession || state.isGuest) return { ok: false, code: EXIT.STOP_SESSIE, reason: "uitgelogd: geen TradingView-sessie (gast)" };
  if (/sign in|log in|inloggen/i.test(state.title ?? "") && !/chart/i.test(state.title ?? "")) return { ok: false, code: EXIT.STOP_SESSIE, reason: "uitgelogd: loginpagina" };
  if (/chart not found|can.t open this chart/i.test(state.title ?? "")) return { ok: false, code: EXIT.STOP_LAYOUT, reason: "layout niet bereikbaar: Chart Not Found" };
  if (!String(state.url ?? "").includes(`/chart/${expected.layoutId}/`)) return { ok: false, code: EXIT.STOP_LAYOUT, reason: `verkeerde layout-id in URL (${stripQuery(state.url)})` };
  if ((state.layoutName ?? "").trim() !== expected.layoutName) {
    return { ok: false, code: EXIT.STOP_LAYOUT, reason: `layoutnaam wijkt af: '${state.layoutName ?? ""}' (verwacht '${expected.layoutName}')` };
  }
  return { ok: true, code: EXIT.OK, reason: "" };
}

/** URL zonder query of fragment (voor het logboek). */
export function stripQuery(url) {
  return String(url ?? "").split(/[?#]/)[0];
}

/** Na opslaan: { ok, code, reason } op basis van wat de editor toont. */
export function evaluateSave({ markerFound, versionFound, unsavedVisible, compileErrors, updateFound }) {
  if (!markerFound) return { ok: false, code: EXIT.STOP_SCRIPT, reason: "BFX-marker niet gevonden: verkeerd script open, niets overschreven" };
  if (!versionFound) return { ok: false, code: EXIT.STOP_SCRIPT, reason: "versieregel niet teruggevonden na plakken, niet opgeslagen" };
  if (compileErrors > 0) return { ok: false, code: EXIT.STOP_OPSLAAN, reason: "compilefout in de nieuwe code" };
  if (unsavedVisible) return { ok: false, code: EXIT.STOP_OPSLAAN, reason: "opslaan niet bevestigd ('Unsaved version' bleef staan)" };
  if (!updateFound) return { ok: false, code: EXIT.STOP_OPSLAAN, reason: "'Update on chart' niet gevonden: chart toont nog de vorige versie" };
  return { ok: true, code: EXIT.OK, reason: "" };
}
