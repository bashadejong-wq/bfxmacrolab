// BFX Structure Engine 0.1: contractcontroles op het template. Geen browser, geen netwerk, geen database.
// node --test test/structure-template.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { ROOT } from "../src/config.mjs";
import { buildStructure } from "../src/structure-generate.mjs";

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

test("HTF alleen van gesloten candles: elke request.security leest een [1]-functie met lookahead_on", () => {
  const htf = code.slice(code.indexOf("htfState(int L)"), code.indexOf("int h4Dir"));
  assert.match(htf, /\[d\[1\], g\[1\], p\[1\]\]/);
  assert.match(code, /ctxVals\(\) =>[\s\S]*?\[e\[1\], close\[1\], sl\[1\]\]/);
  assert.match(code, /dAtrV\(\) =>\n {4}float a = ta\.atr\(14\)\n {4}a\[1\]/);
  const calls = [...code.matchAll(/request\.security\(([^\n]*)\)/g)].map((m) => m[1]);
  assert.equal(calls.length, 4);
  for (const c of calls) assert.ok(/(htfState|ctxVals|dAtrV)\(/.test(c) && c.includes("lookahead_on"), c);
});

test("CBO-module: breakout alleen op close met body-eis, OB-R alleen bij acceptatie, eventblokkade zoals CBO_0.1", () => {
  const cbo = code.slice(code.indexOf("if barstate.isconfirmed and i_cbo and cboTF"), code.indexOf("var box xBxS"));
  assert.match(cbo, /bool up = close > xsHi/);
  assert.match(cbo, /outB \/ body >= c_body/);
  assert.ok(cbo.indexOf('addZone("OB-R"') > cbo.indexOf("xSt := 6"), "OB-R pas na ACCEPTATIE");
  assert.match(cbo, /if regimeOK and not evBlk and \(hhN - llN\) <= c_wMax \* atr/);
  assert.match(cbo, /if evBlk\n {12}xSt := 11/);
  assert.match(cbo, /else if xSt == 4 and evBlk\n {8}xSt := 11/);
  assert.match(code, /evPost and tfSec <= 3600 \? "post-event"/);
});

test("referentielijnen starten bij de wick-candle en tellen geraakt alleen op gesloten candles", () => {
  assert.match(code, /timeframe\.change\("D"\)/);
  assert.match(code, /rPDH := dH\n {4}rPDHt := dHT/);
  assert.match(code, /if barstate\.isconfirmed\n {4}if not na\(rPDH\) and na\(rPDHx\) and high > rPDH/);
});

test("elke HYPOTHESE-parameter staat met dezelfde standaard in het contract", () => {
  const inputs = [...tpl.matchAll(/^((?:h|c|r|e|g|k)_\w+)\s*=\s*input\.(?:int|float|bool)\(([\w.]+)/gm)];
  assert.ok(inputs.length >= 45);
  for (const [, name, def] of inputs) {
    const m = contract.match(new RegExp(`\\b${name} (\\w[\\w.]*)`));
    assert.ok(m, `${name} ontbreekt in het contract`);
    assert.equal(String(m[1]), String(def), `${name}: contract ${m[1]} ≠ template ${def}`);
  }
});

test("zonevarianten blijven gescheiden en zones hebben een stabiel ID", () => {
  assert.ok(code.includes('addZone("OB-P"') && code.includes('addZone("OB-F"') && code.includes('addZone("OB-R"'));
  assert.match(code, /syminfo\.ticker \+ "-" \+ timeframe\.period \+ "-" \+ kind \+ "-" \+ str\.format_time\(time\[k\], "yyyyMMdd-HHmm", "UTC"\)/);
  assert.ok(code.includes("hasZone(id)"), "dubbele zone-ID's worden niet opnieuw gemaakt");
});

test("generator vult het Structure-template met hetzelfde BFX-datablok (alleen lezen)", () => {
  const NOW = Date.UTC(2026, 9, 28, 9, 0);
  const out = buildStructure({
    generatedAt: NOW, biasDatum: Date.UTC(2026, 9, 28), biasVersie: "BIAS50_1.1",
    pairs: [{ basis: "EUR", quote: "USD", idx: -20, label: "BEARISH", status: "geen", tekst: "t" }],
    currencies: [], outlookRows: [],
    events: [{ time: NOW + 3600000, ccy: "USD", impact: 3, name: "FOMC Rate Decision" }],
  });
  assert.ok(out.code.includes("// BFX-STRUCTURE-ENGINE") && !out.code.includes("{{DATA}}") && !out.code.includes("{{VERSION}}"));
  assert.match(out.code, /const bool {3}CAL_COVERAGE_PROVEN = false/);
  assert.ok(out.code.includes('addEv(' + (NOW + 3600000) + ', "USD", true'));
  assert.equal(out.events, 1);
});

test("poorten: onbekend telt nooit als ok, CONFIRMED eist trigger+locatie+event+ruimte, historie vóór biasdatum = UNKNOWN", () => {
  assert.match(code, /int gData = not na\(pb\) and biasFresh and snapFresh and time >= BIAS_DATUM \? 1 : 0/);
  assert.match(code, /int gEvent = evBlk \? -1 : na\(evNext\) \? 0 : 1/);
  assert.match(code, /int gRoom = na\(roomR\) \? 0 :/);
  assert.match(code, /gTrig == 1 and gLoc == 1 and gEvent == 1 and gRoom == 1 and gHtf >= 1 and \(not g_needSweep or gSweep == 1\) \? 5/);
  // setups en de getoonde status alleen vanaf gesloten candles
  const conf = code.slice(code.indexOf("var int cs = 0"), code.indexOf("cPd := pdNow"));
  assert.match(conf, /if barstate\.isconfirmed\n {4}if sSt == 6/);
  assert.ok(!/strategy\.|alert\(/.test(code));
});
