// Datablok van de CBO Research Engine: geen browser, geen netwerk, geen database.
// node --test test/engine-generate.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { ROOT } from "../src/config.mjs";
import { buildEngine } from "../src/engine-generate.mjs";

const NOW = Date.UTC(2026, 9, 27, 21, 0);
const H = 3600000;

function data(overrides = {}) {
  return {
    generatedAt: NOW,
    biasDatum: Date.UTC(2026, 9, 27),
    biasVersie: "BIAS50_1.1",
    pairs: [{ basis: "EUR", quote: "USD", idx: -13, label: "NEUTRAAL", status: "geen", tekst: 'zin met "quotes"\nen regel' }],
    currencies: [{ ccy: "EUR", idx: -5, kantelpunt: "x" }],
    outlookRows: [
      { paar_code: "EURUSD", periode: "2026-10-27", laag: "daily", invalidatie: "Als de spread boven 180 bp komt", horizon: "dagen" },
    ],
    events: [
      { time: NOW + 2 * H, ccy: "USD", impact: 3, name: "FOMC Rate Decision" },
      { time: NOW + 2 * H, ccy: "USD", impact: 3, name: "FOMC Statement" }, // zelfde tijd + valuta → één regel
      { time: NOW + 3 * H, ccy: "EUR", impact: 2, name: "German Ifo" }, // medium → weg
      { time: NOW - 3 * 86400000, ccy: "JPY", impact: 3, name: "BoJ oud" }, // ouder dan 2 dagen → weg
      { time: NOW + 5 * H, ccy: "GBP", impact: 3, name: "UK CPI" },
    ],
    ...overrides,
  };
}

test("vult het template volledig en houdt de onderzoeksmarker", () => {
  const { code } = buildEngine(data());
  assert.ok(code.includes("// BFX-CBO-ENGINE"));
  assert.ok(!code.includes("{{DATA}}") && !code.includes("{{VERSION}}"));
  assert.ok(code.includes('indicator("BFX CBO Research Engine 0.1"'));
});

test("kalenderdekking is nooit bewezen: geen 'geen events'-claim mogelijk", () => {
  const { code } = buildEngine(data({ events: [] }));
  assert.match(code, /const bool {3}CAL_COVERAGE_PROVEN = false/);
});

test("alleen high-impact events, één per tijd+valuta, niet ouder dan 2 dagen", () => {
  const out = buildEngine(data());
  assert.equal(out.events, 2);
  const ev = out.code.split("\n").filter((l) => l.startsWith("    addEv("));
  assert.equal(ev.length, 2);
  assert.ok(ev[0].includes('"USD", true')); // FOMC = centrale bank
  assert.ok(ev[1].includes('"GBP", false'));
  assert.ok(!out.code.includes("German Ifo") && !out.code.includes("BoJ oud"));
});

test("tekst wordt veilig als Pine-string geschreven", () => {
  const { code } = buildEngine(data());
  const line = code.split("\n").find((l) => l.startsWith("    addPair("));
  assert.ok(line.includes('zin met \\"quotes\\" en regel'));
});

test("invalidatie alleen uit de daily-regel van dezelfde biasdatum", () => {
  assert.ok(buildEngine(data()).code.includes('addInv("EURUSD", "Als de spread boven 180 bp komt"'));
  const ouder = data({ outlookRows: [{ paar_code: "EURUSD", periode: "2026-10-24", laag: "daily", invalidatie: "oud" }] });
  assert.ok(!buildEngine(ouder).code.includes(`addInv("EURUSD"`));
});

test("drempels in het template zijn als HYPOTHESE gelabeld en signalen alleen op bar close", () => {
  const tpl = readFileSync(resolve(ROOT, "template/bfx_cbo_engine.pine"), "utf8");
  assert.ok(tpl.includes("ONDERZOEKSVERSIE"));
  assert.ok(tpl.includes("GEEN BEWEZEN EDGE"));
  assert.ok(tpl.includes("alert.freq_once_per_bar_close"));
  assert.ok(!/alert\.freq_all|alert\.freq_once_per_bar\b/.test(tpl));
  assert.ok(!/\bstrategy\(|strategy\.entry/.test(tpl), "geen orders of strategy-calls");
  assert.ok(!/volume/i.test(tpl.replace(/\/\/.*$/gm, "")), "geen volume-afgeleide niveaus (CFD-volume)");
});
