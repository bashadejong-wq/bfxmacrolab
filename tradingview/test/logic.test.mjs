// node --test test/   (geen netwerk of browser nodig)
import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import {
  EXIT,
  INVALIDATION_MISSING,
  evaluateSave,
  expectedBiasDate,
  freshness,
  nextCatalyst,
  pickInvalidation,
  preflight,
  scenarios,
  strategyStatus,
  usableConsensus,
  validateBias,
} from "../src/logic.mjs";
import { buildPine } from "../src/generate.mjs";

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const at = (s) => Date.parse(s);

// ─── B1: versheid, zomer/wintertijd, weekend ─────────────────────
test("verwachte BIAS-datum: zomer, winter, voor/na verversing, weekend, DST-wissel", () => {
  const cases = [
    ["2026-07-15T03:45:00Z", "2026-07-15"], // zomer wo 05:45 NL: na verversing
    ["2026-07-15T03:00:00Z", "2026-07-14"], // zomer wo 05:00 NL: vóór verversing
    ["2026-11-04T04:45:00Z", "2026-11-04"], // winter wo 05:45 NL
    ["2026-11-02T04:00:00Z", "2026-10-30"], // winter ma 05:00 NL → vrijdag
    ["2026-10-31T10:00:00Z", "2026-10-30"], // zaterdag
    ["2026-11-01T10:00:00Z", "2026-10-30"], // zondag
    ["2026-10-25T00:30:00Z", "2026-10-23"], // nacht van de wissel naar wintertijd (zo)
    ["2026-03-30T03:40:00Z", "2026-03-30"], // ma na wissel naar zomertijd, 05:40 NL
    ["2026-03-30T03:20:00Z", "2026-03-27"], // ma 05:20 NL, vóór marge → vrijdag
  ];
  for (const [t, want] of cases) assert.equal(iso(expectedBiasDate(at(t))), want, t);
});

const pairs28 = Array.from({ length: 28 }, (_, i) => ({ basis: `B${i}`, quote: "Q" }));
const ccy8 = Array.from({ length: 8 }, (_, i) => ({ ccy: `C${i}` }));
const now = at("2026-10-27T10:00:00Z");

test("BIAS actueel met 8 valuta's en 28 paren is geldig", () => {
  const v = validateBias({ pairs: pairs28, currencies: ccy8, datums: ["2026-10-27"], versies: ["BIAS50_1.1"] }, now);
  assert.equal(v.ok, true);
});
test("verouderde BIAS stopt", () => {
  const v = validateBias({ pairs: pairs28, currencies: ccy8, datums: ["2026-10-26"], versies: ["BIAS50_1.1"] }, now);
  assert.equal(v.ok, false);
  assert.match(v.reason, /verouderd/);
});
test("minder dan 28 paren stopt", () => {
  const v = validateBias({ pairs: pairs28.slice(1), currencies: ccy8, datums: ["2026-10-27"], versies: ["x"] }, now);
  assert.equal(v.ok, false);
  assert.match(v.reason, /27 paren/);
});
test("gemengde datums stoppen", () => {
  const v = validateBias({ pairs: pairs28, currencies: ccy8, datums: ["2026-10-27", "2026-10-26"], versies: ["x"] }, now);
  assert.equal(v.ok, false);
});

// ─── B2: strategiestatus ─────────────────────────────────────────
test("strategie: geen verzegelde stand = letterlijke tekst, niet positief", () => {
  const s = strategyStatus("geen verzegelde strategiestand", null);
  assert.equal(s.text, "Strategie: nog niet te beoordelen — geen verzegelde strategiestand.");
  assert.equal(s.positive, false);
});
test("strategie: ontbrekend, onbekend, tegengesteld, opbouw, geen trade, bevestigd", () => {
  assert.equal(strategyStatus("", null).code, "ontbreekt");
  const onb = strategyStatus("misschien goed", null);
  assert.equal(onb.code, "onbekend");
  assert.equal(onb.positive, false);
  assert.equal(strategyStatus("tegengesteld", null).code, "tegengesteld");
  assert.equal(strategyStatus("in opbouw", null).code, "in_opbouw");
  assert.equal(strategyStatus("geen trade", null).code, "geen_trade");
  assert.equal(strategyStatus("bevestigd", null).positive, true);
  assert.equal(strategyStatus("bevestigd maar oud", null).positive, false); // alleen exact 'bevestigd'
});

// ─── I1/I2: katalysator en scenario's ────────────────────────────
const ev = (h, ccy, impact, extra = {}) => ({ time: at(`2026-10-28T${h}:00Z`), ccy, impact, ...extra });
test("katalysator: eerst high, anders medium, alleen basis/quote", () => {
  const events = [ev("08:00", "EUR", 2), ev("10:00", "GBP", 3), ev("18:00", "USD", 3)];
  assert.equal(nextCatalyst(events, "EUR", "USD", now).ccy, "USD");
  assert.equal(nextCatalyst([ev("08:00", "EUR", 2)], "EUR", "USD", now).ccy, "EUR");
  assert.equal(nextCatalyst([], "EUR", "USD", now), null); // ontbrekende events
});
test("scenario's: aanwezig en ontbrekend blijven gescheiden", () => {
  const s = scenarios({ up: "Hoger: …", down: "", inl: null, mix: "Gemengd: …" });
  assert.deepEqual(s, { hoger: "Hoger: …", inLijn: null, lager: null, gemengd: "Gemengd: …" });
});

// ─── I3: invalidatie ─────────────────────────────────────────────
const out = [
  { paar_code: "EURUSD", laag: "daily", periode: "2026-10-27", invalidatie: "Als …", horizon: "dagen" },
  { paar_code: "EURUSD", laag: "weekly", periode: "2026-10-26", invalidatie: "Als …", horizon: "weken" },
];
test("invalidatie: actueel bij gelijke daily-periode", () => {
  assert.equal(pickInvalidation(out, "EURUSD", "2026-10-27").tekst, "Als …");
});
test("invalidatie: verouderd of nieuwer dan BIAS, of ander paar → geen", () => {
  assert.equal(pickInvalidation(out, "EURUSD", "2026-10-28"), null);
  assert.equal(pickInvalidation(out, "EURUSD", "2026-10-26"), null);
  assert.equal(pickInvalidation(out, "GBPUSD", "2026-10-27"), null);
  assert.equal(pickInvalidation([{ ...out[0], invalidatie: "  " }], "EURUSD", "2026-10-27"), null);
  assert.match(INVALIDATION_MISSING, /^Paarinvalidatie: geen actuele/);
});

// ─── I4/I6: versheid en consensus ────────────────────────────────
test("versheid: actueel, verouderd, ontbreekt", () => {
  assert.equal(freshness(now - 1000, 3600_000, now), "actueel");
  assert.equal(freshness(now - 7200_000, 3600_000, now), "verouderd");
  assert.equal(freshness(null, 3600_000, now), "ontbreekt");
});
test("consensus: 2 banken weg, 3 banken blijft; zonder einddatum/ramingsdatum weg", () => {
  const base = { paar: "EURUSD", einddatum: "2026-12-31", laatste_raming_datum: "2026-10-16" };
  assert.equal(usableConsensus([{ ...base, n_banken: 2 }], now).length, 0);
  assert.equal(usableConsensus([{ ...base, n_banken: 3 }], now).length, 1);
  assert.equal(usableConsensus([{ ...base, n_banken: 3, einddatum: null }], now).length, 0);
  assert.equal(usableConsensus([{ ...base, n_banken: 3, laatste_raming_datum: null }], now).length, 0);
});

// ─── B3/B4: sessie en layout ─────────────────────────────────────
const exp = { layoutId: "AbC123", layoutName: "BFX Automatisering" };
const good = { hasSession: true, isGuest: false, title: "EURUSD 1.11 BFX Automatisering", url: "https://www.tradingview.com/chart/AbC123/?symbol=X", layoutName: "BFX Automatisering" };
test("preflight: alles goed", () => assert.equal(preflight(good, exp).ok, true));
test("preflight: uitgelogd (geen sessie of gast)", () => {
  assert.equal(preflight({ ...good, hasSession: false }, exp).code, EXIT.STOP_SESSIE);
  assert.equal(preflight({ ...good, isGuest: true }, exp).code, EXIT.STOP_SESSIE);
});
test("preflight: Chart Not Found", () => {
  const r = preflight({ ...good, title: "Chart Not Found — TradingView" }, exp);
  assert.equal(r.code, EXIT.STOP_LAYOUT);
  assert.match(r.reason, /niet bereikbaar/);
});
test("preflight: verkeerde layout-id of layoutnaam", () => {
  assert.equal(preflight({ ...good, url: "https://www.tradingview.com/chart/NlsYkVmV/" }, exp).code, EXIT.STOP_LAYOUT);
  assert.equal(preflight({ ...good, layoutName: "😍Bas" }, exp).code, EXIT.STOP_LAYOUT);
  assert.equal(preflight(good, { layoutId: "", layoutName: "BFX Automatisering" }).code, EXIT.STOP_LAYOUT);
});

// ─── Aflevering: marker, compile, opslaan, update ────────────────
const ok = { markerFound: true, versionFound: true, unsavedVisible: false, compileErrors: 0, updateFound: true };
test("aflevering: alles bevestigd", () => assert.equal(evaluateSave(ok).ok, true));
test("aflevering: marker ontbreekt, compilefout, opslag niet bevestigd, update ontbreekt", () => {
  assert.equal(evaluateSave({ ...ok, markerFound: false }).code, EXIT.STOP_SCRIPT);
  assert.equal(evaluateSave({ ...ok, compileErrors: 2 }).code, EXIT.STOP_OPSLAAN);
  assert.equal(evaluateSave({ ...ok, unsavedVisible: true }).code, EXIT.STOP_OPSLAAN);
  assert.equal(evaluateSave({ ...ok, updateFound: false }).code, EXIT.STOP_OPSLAAN);
});

// ─── Tweede identieke run: zelfde invoer → zelfde code (idempotent) ─
test("buildPine is deterministisch bij gelijke invoer", () => {
  const data = {
    generatedAt: at("2026-10-27T05:45:00Z"),
    events: [],
    pairs: [{ basis: "EUR", quote: "USD", idx: -12.96, label: "Neutral", tekst: "USD sterker.", emmer: "1-2", z: 1.1, bevestiging: "Strategie: nog niet te beoordelen — geen verzegelde strategiestand.", status: "geen_stand" }],
    currencies: [],
    biasDatum: at("2026-10-27T00:00:00Z"),
    biasVersie: "BIAS50_1.1",
    history: [],
    consensus: [],
    outlookRows: out,
    agendaTs: null,
  };
  const h = (c) => createHash("sha256").update(c).digest("hex");
  const a = buildPine(data);
  const b = buildPine(data);
  assert.equal(h(a.code), h(b.code));
  assert.equal(a.invalidations, 1);
  assert.match(a.code, /geen verzegelde strategiestand/);
  assert.doesNotMatch(a.code, /hercules-dev\.com/); // geen volledige URL in de kaart
});
