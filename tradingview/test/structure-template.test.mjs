// BFX Structure Engine 0.1: contractcontroles op het template. Geen browser, geen netwerk, geen database.
// node --test test/structure-template.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { ROOT } from "../src/config.mjs";

const tpl = readFileSync(resolve(ROOT, "template/bfx_structure_engine.pine"), "utf8");
const code = tpl.replace(/\/\/.*$/gm, "");
const contract = readFileSync(resolve(ROOT, "docs/structure/STRUCTUUR-CONTRACT-0.1.md"), "utf8");

test("onderzoeksmarker, v6 en eigen indicatornaam", () => {
  assert.ok(tpl.startsWith("//@version=6\n// BFX-STRUCTURE-ENGINE"));
  assert.ok(tpl.includes('indicator("BFX Structure Engine 0.1"'));
  assert.ok(tpl.includes("GEEN BEWEZEN EDGE"));
});

test("geen orders, geen signalen, geen volume, geen alerts in fase 1", () => {
  assert.ok(!/\bstrategy\(|strategy\.entry/.test(code), "geen strategy-calls");
  assert.ok(!/volume/i.test(code), "geen volume-afgeleide niveaus (CFD-volume)");
  assert.ok(!/alertcondition|alert\(/.test(code), "alerts komen pas later");
  assert.ok(!/\b(BUY|SELL|KOOP|VERKOOP)\b/.test(code), "geen koop/verkooplabels");
});

test("structuurlogica draait alleen op gesloten candles", () => {
  const step = code.slice(code.indexOf("stepLvl(Lvl s"), code.indexOf("pdOf(Lvl s)"));
  assert.match(step, /^ {4}if barstate\.isconfirmed$/m);
  // pivots worden pas ná de break/sweep-controle vervangen → bruikbaar vanaf de volgende bar
  assert.ok(step.indexOf("s.hi := Piv.new") > step.indexOf("s.hi.broken := true"));
  assert.match(code, /if barstate\.isconfirmed\n {4}updZones\(\)/);
});

test("HTF alleen van gesloten candles: [1]-waarden met lookahead_on", () => {
  const htf = code.slice(code.indexOf("htfState(int L)"), code.indexOf("int h4Dir"));
  assert.match(htf, /\[d\[1\], g\[1\], p\[1\]\]/);
  const calls = [...code.matchAll(/request\.security\(([^\n]*)\)/g)].map((m) => m[1]);
  assert.equal(calls.length, 2);
  for (const c of calls) assert.ok(c.includes("htfState(") && c.includes("lookahead_on"), c);
});

test("elke HYPOTHESE-parameter staat met dezelfde standaard in het contract", () => {
  const inputs = [...tpl.matchAll(/^(h_\w+)\s*=\s*input\.(?:int|float|bool)\(([\w.]+)/gm)];
  assert.ok(inputs.length >= 11);
  for (const [, name, def] of inputs) {
    const m = contract.match(new RegExp(`\\b${name} (\\w[\\w.]*)`));
    assert.ok(m, `${name} ontbreekt in het contract`);
    assert.equal(String(m[1]), String(def), `${name}: contract ${m[1]} ≠ template ${def}`);
  }
});

test("zonevarianten blijven gescheiden en zones hebben een stabiel ID", () => {
  assert.ok(code.includes('addZone("OB-P"') && code.includes('addZone("OB-F"'));
  assert.match(code, /syminfo\.ticker \+ "-" \+ timeframe\.period \+ "-" \+ kind \+ "-" \+ str\.format_time\(time\[k\], "yyyyMMdd-HHmm", "UTC"\)/);
  assert.ok(code.includes("hasZone(id)"), "dubbele zone-ID's worden niet opnieuw gemaakt");
});
