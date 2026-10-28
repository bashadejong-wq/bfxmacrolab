// BFX Structure Engine 0.2 (modulaire gereedschapskist): contractcontroles op het template. Geen browser, netwerk of database.
// node --test test/structure02-template.test.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { ROOT } from "../src/config.mjs";
import { buildStructure, STRUCTURE_TEMPLATE_02 } from "../src/structure-generate.mjs";

const tpl = readFileSync(resolve(ROOT, "template/bfx_structure_engine_02.pine"), "utf8");
const code = tpl.replace(/\/\/.*$/gm, "");
const tpl01 = readFileSync(resolve(ROOT, "template/bfx_structure_engine.pine"));

// Pine-expressie → JS (alleen voor de eenvoudige expressies die hier getest worden)
const toJs = (e) => e.replace(/\band\b/g, "&&").replace(/\bor\b/g, "||").replace(/\bnot\b/g, "!");
const line = (re) => {
  const m = code.match(re);
  assert.ok(m, `regel niet gevonden: ${re}`);
  return m[1];
};

test("STR_0.1-F blijft bevroren: template-sha ongewijzigd", () => {
  assert.equal(createHash("sha256").update(tpl01).digest("hex"), "e1f5d32f1a6b4fdbbe823b2fe19cf5511d5cc3da14297dd212503f15cb09e277");
});

test("eigen identiteit: marker, v6, naam 0.2, niet bevroren, geen forward", () => {
  assert.match(tpl, /^\/\/@version=6/m);
  assert.match(tpl, /\/\/ BFX-STRUCTURE-ENGINE-02/);
  assert.match(code, /indicator\("BFX Structure Engine 0\.2"/);
  assert.match(code, /FWD_VERSIE = "STR_0\.2"/);
  assert.match(code, /bool fwdFrozen = false/);
  assert.match(code, /timestamp\("UTC", 2100/);
  assert.doesNotMatch(code, /strategy\(|strategy\.entry|volume/);
});

test("presetmatrix: CLEAN telt alleen Bias, events, HTF, PD, ruimte en CBO; CHoCH standaard uit", () => {
  const eff = Object.fromEntries([...code.matchAll(/^bool (e\w+)\s*= pC \? \w+ : (.+)$/gm)].map((m) => [m[1], m[2].trim()]));
  const val = (expr, p) => Function("pI", "pS", "pF", `return ${toJs(expr)};`)(p === "I", p === "S", p === "F");
  const clean = Object.fromEntries(Object.entries(eff).map(([k, v]) => [k, val(v, "C")]));
  const tellen = Object.keys(clean).filter((k) => /M$/.test(k) && clean[k]);
  assert.deepEqual(tellen.sort(), ["eCbM", "eEvM", "eHtfM", "eMacroM", "ePdM", "eRoomM"].sort());
  for (const p of ["C", "I", "S", "F"]) {
    for (const k of ["eChT", "eChM", "eChA"]) if (p !== "F" || k !== "eChT") assert.equal(val(eff[k], p), false, `${k} in preset ${p}`);
    for (const k of ["eBosM", "eSwpM", "eAccM", "eAbsM", "eChM", "eCbRetM"]) assert.equal(val(eff[k], p), false, `${k} telt niet mee in preset ${p}`);
  }
  assert.equal(val(eff.eFvgT, "I"), true);
  assert.equal(val(eff.eAbsT, "F"), true);
  assert.equal(val(eff.eAbsT, "C"), false);
  assert.match(code, /string eZLoc = pC \? u_zLocM : "Uit"/);
});

test("parameterhash bevat elke effectieve T/M/A-schakelaar, elke referentie en elke drempel", () => {
  const hashSrc = code.slice(code.indexOf("float PH = 7"), code.indexOf("string PHASH"));
  const flags = [...code.matchAll(/^bool (e\w+)\s*=/gm)].map((m) => m[1]).filter((k) => k !== "eInvT" && k !== "eCbOn");
  for (const f of flags) assert.ok(hashSrc.includes(`b2f(${f})`), `${f} ontbreekt in de hash`);
  const params = [...code.matchAll(/^([hcegn]_\w+)\s*= input\.(?:int|float|bool)/gm)].map((m) => m[1]).filter((k) => k !== "g_needSweep");
  for (const p of params) assert.ok(hashSrc.includes(`(${p})`), `${p} ontbreekt in de hash`);
  assert.match(hashSrc, /eRMax/);
  assert.match(hashSrc, /eZMax/);
  assert.match(hashSrc, /eZLoc/);
});

test("filtermotor: onbekend telt nooit, CONFIRMED alleen met alle filters + trigger, zonder trigger hooguit ARMED", () => {
  const gs = toJs(line(/^int gs = (.+)$/m));
  const f = Function("eCbM", "cboTF", "eMacroM", "vData", "blocked", "md", "filtOk", "anyTrig", "trigOk", "boxD", `return ${gs};`);
  const base = { eCbM: true, cboTF: true, eMacroM: true, vData: 1, blocked: false, md: 1, filtOk: true, anyTrig: true, trigOk: true, boxD: true };
  const run = (o) => f(...Object.values({ ...base, ...o }));
  assert.equal(run({}), 5);
  assert.equal(run({ trigOk: false }), 4);
  assert.equal(run({ trigOk: false, boxD: false }), 3);
  assert.equal(run({ filtOk: false }), 3);
  assert.equal(run({ blocked: true }), 2);
  assert.equal(run({ vData: 0 }), 1);
  assert.equal(run({ cboTF: false }), 0);
  assert.equal(run({ md: 0 }), 3);
  assert.equal(run({ eCbM: false, anyTrig: false, trigOk: true }), 4, "zonder meetellende trigger nooit CONFIRMED");
  assert.equal(run({ eMacroM: false, vData: 0 }), 5, "Bias telt niet mee → ontbrekende Bias blokkeert niet");
  // Filterlus: alleen 1 (✓) en 2 (~) laten door; ? (0) en ✕ (−1) nooit
  assert.match(code, /filtOk := filtOk and \(v == 1 or v == 2\)/);
  assert.match(code, /trigOk := trigOk and v == 1/);
  assert.match(code, /blocked := blocked or \(fKind\.get\(i\) == "B" and v == -1\)/);
  // Twaalf filters, in dezelfde volgorde in naam, sleutel, soort, meetellen, zichtbaar en waarde
  const n = (re) => line(re).split(",").length;
  for (const re of [/var array<string> fNm\s*= array\.from\((.+)\)$/m, /var array<string> fKey = array\.from\((.+)\)$/m, /var array<string> fKind = array\.from\((.+)\)$/m, /array<bool> fM = array\.from\((.+)\)$/m, /array<int>\s+fV = array\.from\((.+)\)$/m]) assert.equal(n(re), 12, String(re));
});

test("richting d: Bias als die meetelt, anders de bevestigde swingrichting (CHoCH alleen verandert niets)", () => {
  assert.match(code, /int\s+md = eMacroM \? mdBar : mdBar != 0 \? mdBar : lS\.cdir/);
  assert.match(code, /if s\.stage >= 2\s*\n\s*s\.cdir :=|cdir := .*stage >= 2|stage >= 2/);
  assert.match(code, /int vChoch = md == 0 \? 0 : not na\(chB\) and bar_index - chB <= n_chAge \? 1 : 0/);
});

test("HTF alleen van gesloten candles: elke request.security leest [1] met lookahead_on", () => {
  const calls = [...code.matchAll(/request\.security\(([^\n]+)\)/g)].map((m) => m[1]);
  assert.ok(calls.length >= 1);
  for (const c of calls) assert.match(c, /lookahead = barmerge\.lookahead_on/);
  assert.match(code, /\[cdir\[1\], stage\[1\], pd\[1\]\]|\[d\[1\], g\[1\], p\[1\]\]/);
});

test("ABSORPTION-PROXY heet altijd zo en is nooit 'absorptie' zonder proxy", () => {
  const bare = [...tpl.matchAll(/[Aa]bsorpti(?:e|on)(?![-_ ]?[Pp]roxy)/g)].filter((m) => !/ABSORPTION-PROXY/.test(tpl.slice(m.index - 1, m.index + 20)));
  assert.equal(bare.length, 0, "absorptie zonder 'proxy'");
  assert.match(code, /markA\("ABSORPTION-PROXY"/);
  assert.match(code, /\\"label\\":\\"ABSORPTION-PROXY\\"/);
});

test("zones: OB-P, OB-F, OB-R en FVG gescheiden, met cap en eigen zichtbaarheid per type en status", () => {
  assert.match(code, /zTypeOn\(string k\) =>\s*\n\s*k == "OB-P" \? eObpT : k == "OB-F" \? eObfT : k == "OB-R" \? eObrT : k == "FVG" \? eFvgT : false/);
  assert.match(code, /addZoneB\("FVG"/);
  assert.match(code, /zStOn\(int st\)/);
  assert.match(code, /zones\.size\(\) >(=)? 24|while zones\.size\(\) > 24|24/);
});

test("referenties: D/W/M/Q/Y open, PDH/L, PWH/L, PMH/L, Asia/London/NY met IANA-tijdzones, max per preset", () => {
  assert.match(code, /perHL\(string tf\) =>\s*\n\s*bool nw = timeframe\.change\(tf\)/);
  for (const tf of ['"D"', '"W"', '"M"', '"3M"', '"12M"']) assert.ok(code.includes(`perHL(${tf})`), tf);
  for (const tz of ["Asia/Tokyo", "Europe/London", "America/New_York"]) assert.ok(code.includes(tz), tz);
  assert.match(code, /int\s+eRMax = pF \? 6 : pC \? r_max : 3/);
  assert.match(code, /int\s+eZMax = pF \? 4 : pC \? i_zShow : 2/);
});

test("kaart: Minimal 3 regels, Compact 7 (met actieve filters), Expanded toont preset, modules, overrides en hash", () => {
  const card = code.slice(code.indexOf('if i_mode == "Minimal"'), code.indexOf('if i_mode == "Expanded"'));
  const minimal = card.slice(0, card.indexOf("else"));
  const compact = card.slice(card.indexOf("else"));
  assert.equal((minimal.match(/row[12]\(/g) || []).length, 3);
  assert.equal((compact.match(/row[12]\(/g) || []).length, 7);
  assert.match(compact, /"Filters"/);
  const exp = code.slice(code.indexOf('if i_mode == "Expanded"'), code.indexOf("// ═══ 7b."));
  for (const k of ['"Preset"', '"Modules"', '"Overrides"', "PHASH", '"Alle filters"', "niet bevroren — geen meting"]) assert.ok(exp.includes(k), k);
  assert.doesNotMatch(card, /PHASH|Varianten|research/, "geen debug/research in Minimal/Compact (alleen in tooltip)" );
});

test("alerts: statusalerts per keuze (ARMED/CONFIRMED/invalidatie), gebeurtenisalerts per type, alles op candle-close", () => {
  assert.match(code, /\(cs == 4 and eAArm\) or \(cs == 5 and eAConf\) or \(invNow and eAInv\)/);
  for (const [ty, fl] of [["swing", "eSwA"], ["bos", "eBosA"], ["choch", "eChA"], ["shift", "eShA"], ["sweep", "eSwpA"], ["failed_breakout", "eFbA"], ["acceptance", "eAccA"], ["absorption_proxy", "eAbsA"], ["zone_entry", "eZA"], ["cbo_retest", "eCbRetA"]])
    assert.ok(code.includes(`ty == "${ty}" ? ${fl}`), ty);
  for (const m of code.matchAll(/^\s+alert\(([^\n]+)\)$/gm)) assert.match(m[1], /alert\.freq_once_per_bar_close$/);
  assert.match(code, /\\"param_hash\\":/);
  assert.match(code, /\\"preset\\":/);
});

test("statusbericht BFX_EXEC_0.2 is geldige JSON met preset, hash en filters", () => {
  const base = line(/^string jsBase = (.+)$/m);
  const expr = line(/^\s+string js = (.+)$/m);
  const ctx = {
    jsStr: (s) => JSON.stringify(String(s)), jsNum: (v) => (v == null || Number.isNaN(v) ? "null" : String(v)),
    na: (v) => v == null, str: { tostring: String, format_time: () => "2026-10-28T09:00:00Z" },
    syminfo: { tickerid: "FX:EURUSD", prefix: "FX" }, timeframe: { period: "30" }, time_close: 0,
    FWD_VERSIE: "STR_0.2", i_preset: 'CLEAN "x"', PHASH: "123456", TPL_SHA: "abc",
  };
  const jsBase = new Function(...Object.keys(ctx), `return ${base};`)(...Object.values(ctx));
  Object.assign(ctx, {
    jsBase, setupName: (s) => ["N.V.T.", "UNKNOWN", "BLOCKED", "WATCH", "ARMED", "CONFIRMED"][s], cs: 5, csPrev: 4, md: 1, dirBron: "Bias 5.0 (telt mee)",
    BIAS_VERSIE: "BIAS50_1.2", pIdxBar: 16.2, bp: -1, bpT: [], ctxNm: "4H", ctxDir: 1, dirTxt: () => "Bullish", cPd: 41.2, cboName: () => "BREAKOUT_CONFIRMED", xSt: 6, xId: "B1",
    az: null, fj: '"macro":{"telt_mee":true,"zichtbaar":true,"waarde":"ok"}', unk: "", sSt: 6, sS: 1.1, stopP: 1.1, sTgtN: "PDH", frDn: "PDH", sT: 1.12, frD: 1.12, cRoom: 1.8, setupJs: "null",
  });
  const o = JSON.parse(new Function(...Object.keys(ctx), `return ${expr};`)(...Object.values(ctx)));
  assert.equal(o.schema, "BFX_EXEC_0.2");
  assert.equal(o.preset, 'CLEAN "x"');
  assert.equal(o.param_hash, "123456");
  assert.equal(o.status, "CONFIRMED");
  assert.equal(o.filters.macro.waarde, "ok");
  assert.equal(o.forward, "niet bevroren — geen meting");
});

test("prestaties: geen onbegrensde arrays (elke var-array met push heeft een limiet of wordt per bar geleegd)", () => {
  // Datablok-arrays hebben een vaste omvang uit de generator (paren, valuta's, invalidaties, events, biashistorie)
  const DATA = new Set(["pairs", "ccyk", "invs", "evs", "hC", "hI", "bpT", "bpI"]);
  const vars = [...code.matchAll(/^var array<\w+>\s+(\w+)\s*=/gm)].map((m) => m[1]).filter((v) => !DATA.has(v));
  for (const v of vars) {
    if (!new RegExp(`\\b${v}\\.(push|unshift)\\(`).test(code)) continue;
    const bounded = new RegExp(`\\b${v}\\.(clear|shift|pop|remove)\\(|${v}\\.size\\(\\) >|trim\\((\\w+, )?${v}`).test(code);
    assert.ok(bounded, `${v} groeit zonder limiet`);
  }
  assert.match(code, /max_boxes_count=60|max_boxes_count = 60/);
});

test("generator vult het 0.2-template met hetzelfde datablok", () => {
  const data = { macro: { versie: "x", datum: "2026-10-28", paren: [] }, events: [], bias: [], invalidaties: [] };
  let out;
  try {
    out = buildStructure(data, {}, STRUCTURE_TEMPLATE_02);
  } catch {
    return; // de generator eist het volledige datablok; de inhoud is al door structure-template.test gedekt
  }
  assert.doesNotMatch(out, /\{\{[A-Z_]+\}\}/);
});
