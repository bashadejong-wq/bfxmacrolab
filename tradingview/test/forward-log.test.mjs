// Append-only forwardlogboek + evaluatie: geen browser, geen netwerk, geen database.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { evaluate, MINIMA } from "../src/forward-eval.mjs";
import { append, ingestAlert, readRows, reconcile, state, verify } from "../src/forward-log.mjs";

const tmp = () => join(mkdtempSync(join(tmpdir(), "strlog-")), "log.jsonl");
const exec = (over = {}) => ({
  schema: "BFX_EXEC_0.1", symbol: "FX:EURUSD", feed: "FX", timeframe: "30", status: "CONFIRMED",
  setup: { setup_id: "EURUSD:30:1:2@20261029-0800", bevestigd_op: "2026-10-29T08:00:00Z", richting: "short", entry: 1.112, stop: 1.114, doel: 1.108, doel_naam: "PDL",
    expiry: "2026-10-29T24:00:00Z", box_id: "EURUSD:30:1:2", zone_id: "", sweep_id: "", structuur_id: "x", bias: { versie: "BIAS50_1.2", waarde: -16.1, available_at: "2026-10-29T06:00:00Z" },
    regime: "balans", telt_mee: true, uitkomst: "open", r_bruto: null, mfe_r: 0, mae_r: 0, ...over },
});

test("hashketen: elke regel draagt de hash van de vorige; knoeien wordt gevonden", () => {
  const f = tmp();
  append("verversing", { a: 1 }, { file: f, now: 1 });
  append("verversing", { a: 2 }, { file: f, now: 2 });
  assert.deepEqual(verify(f), { ok: true, regels: 2, gebroken_bij: null });
  const lines = readFileSync(f, "utf8").trim().split("\n");
  writeFileSync(f, `${lines[0].replace('"a":1', '"a":9')}\n${lines[1]}\n`);
  assert.equal(verify(f).ok, false);
  assert.equal(verify(f).gebroken_bij, 1);
});

test("ingest is idempotent; uitkomst één keer; afwijkende latere uitkomst wordt een correctie, nooit een vervanging", () => {
  const f = tmp();
  ingestAlert(exec(), { file: f });
  ingestAlert(exec(), { file: f });
  assert.equal(readRows(f).length, 1);
  ingestAlert(exec({ uitkomst: "DOEL", r_bruto: 2, mfe_r: 2.1, mae_r: 0.3 }), { file: f });
  ingestAlert(exec({ uitkomst: "DOEL", r_bruto: 2 }), { file: f });
  assert.deepEqual(readRows(f).map((r) => r.type), ["setup_ontstaan", "setup_uitkomst"]);
  ingestAlert(exec({ uitkomst: "FAILED", r_bruto: -1 }), { file: f });
  const st = state(f).get("EURUSD:30:1:2@20261029-0800");
  assert.equal(st.uitkomst.setup.uitkomst, "DOEL", "oorspronkelijke uitkomst blijft staan");
  assert.deepEqual(st.correcties[0].nieuw, { uitkomst: "FAILED", r_bruto: -1 });
  assert.ok(verify(f).ok);
});

test("providercorrectie-simulatie: herberekening met gecorrigeerde koersen legt een correctie vast", () => {
  const f = tmp();
  ingestAlert(exec(), { file: f });
  ingestAlert(exec({ uitkomst: "DOEL", r_bruto: 2 }), { file: f });
  // Zelfde koersen → geen correctie
  assert.deepEqual(reconcile("EURUSD:30:1:2@20261029-0800", [{ h: 1.1125, l: 1.1079, c: 1.108 }], { file: f }), { gewijzigd: false });
  // Provider corrigeert een piek: high raakt nu eerst de stop
  const r = reconcile("EURUSD:30:1:2@20261029-0800", [{ h: 1.1141, l: 1.1079, c: 1.108 }], { file: f });
  assert.deepEqual(r, { gewijzigd: true, uitkomst: "FAILED", r: -1 });
  assert.equal(state(f).get("EURUSD:30:1:2@20261029-0800").correcties.length, 1);
  assert.ok(verify(f).ok);
});

test("evaluatie: 28 cellen (7 paren × 4 TF), geen totaal, netto na spread, minima vooraf vastgelegd", () => {
  const f = tmp();
  ingestAlert(exec(), { file: f });
  ingestAlert(exec({ uitkomst: "DOEL", r_bruto: 2, mfe_r: 2.1, mae_r: 0.3 }), { file: f });
  append("kandidaat", { schema: "BFX_KAND_0.1", symbol: "FX:EURUSD", timeframe: "30", regime: "balans", telt_mee: true,
    afgerond: [{ type: "cbo_acceptatie", start: "2026-10-29T09:00:00Z", richting: "long", varianten: 25, risk: 0.001, r: 1.5, mfe_r: 1.6, mae_r: 0.2 }] }, { file: f });
  const ev = evaluate(state(f), readRows(f), { now: Date.parse("2026-11-05T00:00:00Z") });
  assert.equal(ev.matrix.length, 28);
  assert.match(ev.totaal, /niet berekend/);
  const c = ev.matrix.find((m) => m.paar === "EURUSD" && m.tf === "30");
  assert.equal(c.str.n, 1);
  assert.equal(c.str.r_bruto_gem, 2);
  assert.ok(Math.abs(c.str.r_netto_gem - (2 - (0.6 + 0.4) * 0.0001 / 0.002)) < 1e-9);
  assert.equal(c.str.oordeel, "onvoldoende data — geen conclusie");
  assert.equal(c.varianten["V1 CBO"].n, 1);
  assert.equal(c.varianten["V4 Bias+CBO"].n, 1);
  assert.equal(c.varianten["V5 Bias+Structure+CBO"].n, 1);
  assert.equal(c.varianten["V3 Structure"].n, 0);
  assert.deepEqual(MINIMA, { n: 30, dagen: 20, regimes: 2, weken: 12 });
});
