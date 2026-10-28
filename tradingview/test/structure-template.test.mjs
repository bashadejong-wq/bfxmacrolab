// BFX Structure Engine 0.1: contractcontroles op het template. Geen browser, geen netwerk, geen database.
// node --test test/structure-template.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { ROOT } from "../src/config.mjs";
import { buildStructure, histLines } from "../src/structure-generate.mjs";

const tpl = readFileSync(resolve(ROOT, "template/bfx_structure_engine.pine"), "utf8");
const code = tpl.replace(/\/\/.*$/gm, "");
const contract = readFileSync(resolve(ROOT, "docs/structure/STRUCTUUR-CONTRACT-0.1.md"), "utf8");

test("onderzoeksmarker, v6 en eigen indicatornaam", () => {
  assert.ok(tpl.startsWith("//@version=6\n// BFX-STRUCTURE-ENGINE"));
  assert.ok(tpl.includes('indicator("BFX Structure Engine 0.1"'));
  assert.ok(tpl.includes("GEEN BEWEZEN EDGE"));
});

test("geen orders, geen signalen, geen volume", () => {
  assert.ok(!/\bstrategy\(|strategy\.entry/.test(code), "geen strategy-calls");
  assert.ok(!/volume/i.test(code), "geen volume-afgeleide niveaus (CFD-volume)");
  assert.ok(!/alertcondition/.test(code), "alleen alert() met JSON, geen alertcondition");
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
  assert.ok(out.code.includes("// BFX-STRUCTURE-ENGINE") && !/\{\{(DATA|VERSION|HIST)\}\}/.test(out.code));
  assert.match(out.code, /const bool {3}CAL_COVERAGE_PROVEN = false/);
  assert.ok(out.code.includes('addEv(' + (NOW + 3600000) + ', "USD", true'));
  assert.equal(out.events, 1);
});

test("poorten: onbekend telt nooit als ok, CONFIRMED eist trigger+locatie+event+ruimte, data = geldige bias per bar", () => {
  assert.match(code, /int gData = not na\(pIdxBar\) \? 1 : 0/);
  assert.match(code, /int {4}md = mdBar/);
  assert.match(code, /int gEvent = evBlk \? -1 : na\(evNext\) \? 0 : 1/);
  assert.match(code, /int gRoom = na\(roomR\) \? 0 :/);
  assert.match(code, /gTrig == 1 and gLoc == 1 and gEvent == 1 and gRoom == 1 and gHtf >= 1 and \(not g_needSweep or gSweep == 1\) \? 5/);
  // setups en de getoonde status alleen vanaf gesloten candles
  const conf = code.slice(code.indexOf("var int cs = 0"), code.indexOf("cPd := pdNow"));
  assert.match(conf, /if barstate\.isconfirmed\n {4}if sSt == 6/);
  assert.ok(!/strategy\./.test(code));
});

test("JSON-alert: precies één alert() bij een statuswissel, alleen op candle-close, schema BFX_EXEC_0.1", () => {
  const calls = [...code.matchAll(/^\s*alert\(/gm)];
  assert.equal(calls.length, 1, "één alert()-aanroep");
  assert.match(code, /if barstate\.isconfirmed and cs != csPrev and alertWanted\(cs, csPrev\)/);
  assert.match(code, /alert\(js, alert\.freq_once_per_bar_close\)/);
  assert.ok(!/alert\.freq_all|alert\.freq_once_per_bar\b/.test(code));
  for (const k of ["schema", "snapshot_id", "bar_close", "vorige_status", "macro", "poorten", "invalidatie", "onbekend", "let_op"])
    assert.ok(code.includes(`\\"${k}\\"`), `veld ${k} ontbreekt`);
  assert.match(code, /csPrev := cs\n {4}cs := sSt == 6/);
});

test("kaartmodi: Minimal 4 regels, Compact met BIAS/STRUCTUUR/LOCATIE/TRIGGER/EVENT/SETUP/POORTEN, Expanded zonder onderzoekstellingen", () => {
  const kaart = code.slice(code.indexOf("if barstate.islast\n    tb.clear"), code.indexOf("jsStr(string s)"));
  const minimal = kaart.slice(kaart.indexOf('if i_mode == "Minimal"'), kaart.indexOf("    else\n"));
  assert.equal((minimal.match(/\brow[12]\(/g) || []).length, 4);
  for (const label of ["BIAS", "STRUCTUUR", "LOCATIE", "TRIGGER", "EVENT", "SETUP", "POORTEN"]) assert.ok(kaart.includes(`"${label}"`), label);
  assert.ok(!/"(Tellingen|Hypothesen|CBO-tellingen|Zones gemaakt)"/.test(kaart), "onderzoekstellingen horen in de Data Window");
  const expanded = kaart.slice(kaart.indexOf('if i_mode == "Expanded"'));
  assert.ok((expanded.match(/\brow[12]\(/g) || []).length <= 9, "Expanded voegt hooguit 9 regels toe");
});

test("JSON-alert is geldige JSON, ook met aanhalingstekens in teksten en onbekende getallen", () => {
  const expr = code.match(/string js = (.*)\n/)[1];
  assert.ok(!/\b(and|or|not)\b/.test(expr.replace(/"(?:[^"\\]|\\.)*"/g, "")), "expressie moet zonder Pine-operatoren naar JS te vertalen zijn");
  const ctx = {
    jsStr: (s) => JSON.stringify(String(s)), jsNum: (v) => (v == null || Number.isNaN(v) ? "null" : String(v)),
    na: (v) => v == null, str: { tostring: String, format_time: () => "2026-10-28T09:00:00Z" },
    syminfo: { tickerid: "FX:EURUSD", prefix: "FX" }, timeframe: { period: "30" }, time_close: 0,
    ENG_VERSION: "2026-10-28 08:09 UTC", ENG_GENERATED: 1793174400000, BIAS_VERSIE: "BIAS50_1.2", BIAS_DATUM: 1793145600000,
    setupName: (s) => ["N.V.T.", "UNKNOWN", "BLOCKED", "WATCH", "ARMED"][s], cs: 4, csPrev: 3, md: -1, pIdx: -16.1, biasFresh: true,
    ctxNm: "4H", ctxDir: -1, ctxStg: 3, dirTxt: () => "Bearish", stgTxt: () => "continuation", lS: { dir: -1, stage: 3 }, lI: { dir: 1, stage: 1 },
    cPd: null, cboName: () => 'BOX "VERZEGELD"', xSt: 4, xId: "EURUSD:30:1:2", az: null, gj: '"data":"ok","ruimte":"onbekend"',
    pIdxBar: -16.1, FWD_VERSIE: "STR_0.1-F", fwdFrozen: true, fwdNow: false,
    sSt: 0, sS: null, stopP: 1.1135, sTgtN: "", frDn: "PDL", sT: null, frD: null, cRoom: null, evBlk: false, evNext: {}, unk: '"ruimte"',
  };
  const js = new Function(...Object.keys(ctx), `return ${expr};`)(...Object.values(ctx));
  const o = JSON.parse(js);
  assert.equal(o.schema, "BFX_EXEC_0.1");
  assert.equal(o.status, "ARMED");
  assert.equal(o.vorige_status, "WATCH");
  assert.equal(o.cbo.state, 'BOX "VERZEGELD"');
  assert.equal(o.structuur.pd_pct, null);
  assert.deepEqual(o.onbekend, ["ruimte"]);
  assert.equal(o.let_op, "decision support — geen order");
  assert.deepEqual(o.forward, { versie: "STR_0.1-F", geldig: true, telt_mee: false });
  assert.equal(o.macro.index, -16.1);
});

test("stop en ruimte nooit van een oude box", () => {
  assert.match(code, /float stopP = na\(xsHi\) or md == 0 or not \(xSt == 4 or xSt == 5 or accRecent\) \? na :/);
});

test("forwardbevriezing STR_0.1-F: elke HYPOTHESE-standaard staat exact in fwdFrozen, start 29-10 00:00 UTC", () => {
  const frozen = code.match(/^bool fwdFrozen = (.*)$/m)?.[1];
  assert.ok(frozen, "fwdFrozen ontbreekt");
  const inputs = [...tpl.matchAll(/^((?:h|c|e|g)_\w+)\s*=\s*input\.(?:int|float|bool)\(([\w.]+)/gm)];
  assert.ok(inputs.length >= 40, `slechts ${inputs.length} parameters`);
  for (const [, name, def] of inputs) {
    const m = frozen.match(new RegExp(`\\b${name} == ([\\w.]+)`));
    assert.ok(m, `${name} ontbreekt in fwdFrozen`);
    assert.equal(String(m[1]), String(def), `${name}: bevroren ${m[1]} ≠ standaard ${def}`);
  }
  assert.ok(frozen.startsWith("i_cbo and "));
  assert.match(code, /FWD_START = timestamp\("UTC", 2026, 10, 29, 0, 0\)/);
  assert.match(code, /sFwd := fwdFrozen and time_close >= FWD_START and xsT >= FWD_START/);
});

test("biashistorie: alleen forward-rijen, dedup per dag+valuta, max 120 dagen, paarindex = (basis − quote)/2 vanaf 06:00 UTC", () => {
  const NOW = Date.UTC(2026, 9, 28, 9, 0);
  const lines = histLines([
    { datum: "2026-10-26", valuta: "EUR", index: 0.47, bron: "teruggerekend" },
    { datum: "2026-10-27", valuta: "EUR", index: -9.495, bron: "forward" },
    { datum: "2026-10-27", valuta: "EUR", index: -9.495, bron: "forward" },
    { datum: "2026-10-28", valuta: "usd", index: 19.2429, bron: "forward" },
    { datum: "2026-05-01", valuta: "USD", index: 5, bron: "forward" },
    { datum: "2026-10-29", valuta: "USD", index: 1, bron: "forward" },
  ], NOW);
  const add = lines.filter((l) => l.startsWith("    addHist("));
  assert.deepEqual(add, [`    addHist(${Date.UTC(2026, 9, 27)}, "EUR", -9.495)`, `    addHist(${Date.UTC(2026, 9, 28)}, "USD", 19.2429)`]);
  assert.equal(lines[0], "_histLoad() =>");
  assert.match(code, /bpT\.push\(hT\.get\(i\) \+ 6 \* 3600000\)\n {20}bpI\.push\(\(hI\.get\(i\) - hI\.get\(j\)\) \/ 2\)/);
  assert.match(code, /time_close - bpT\.get\(bp\) <= 96 \* 3600000/);
});
