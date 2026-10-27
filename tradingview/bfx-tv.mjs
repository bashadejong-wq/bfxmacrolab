#!/usr/bin/env node
// BFX Macro Overlay voor TradingView
//   node bfx-tv.mjs login                   eenmalig inloggen bij TradingView
//   node bfx-tv.mjs generate [--input x]    alleen Pine-code maken (out/bfx_macro_overlay.pine)
//   node bfx-tv.mjs check                   alleen sessie + BFX-layout controleren (geen editoractie)
//   node bfx-tv.mjs run                     maken + in TradingView zetten + melding
//   node bfx-tv.mjs acceptatie              run → herladen + versie controleren → tweede run → controleren
import { appendFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { config } from "./src/config.mjs";
import { generate } from "./src/generate.mjs";
import { EXIT } from "./src/logic.mjs";
import { notify } from "./src/notify.mjs";

const [command = "run", ...rest] = process.argv.slice(2);
const inputIdx = rest.indexOf("--input");
const input = inputIdx >= 0 ? rest[inputIdx + 1] : undefined;

/** Eén gestructureerde regel per uitvoering in logs/runs.jsonl. Nooit sleutels, cookies of tokens. */
function writeLog(entry) {
  mkdirSync(config.logDir, { recursive: true });
  appendFileSync(resolve(config.logDir, "runs.jsonl"), `${JSON.stringify(entry)}\n`);
}

function baseEntry(cmd) {
  return {
    run_id: randomUUID(),
    commando: cmd,
    start: new Date().toISOString(),
    eind: null,
    tijdzone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    resultaat: null,
    exitcode: null,
    reden: "",
    bias_datum: null,
    bias_versie: null,
    valuta: null,
    paren: null,
    agenda_versheid: null,
    events: null,
    invalidaties: null,
    pine_hash: null,
    snapshot_id: null,
    chart_url: null,
    layout_verwacht: config.tvLayoutName,
    layout_gezien: null,
    script: "BFX Macro Overlay",
    gecompileerd: null,
    opslag_bevestigd: null,
    chart_bijgewerkt: null,
    layout_opgeslagen: null,
    screenshot: null,
  };
}

function finish(entry, resultaat, exitcode, reden = "") {
  Object.assign(entry, { eind: new Date().toISOString(), resultaat, exitcode, reden });
  writeLog(entry);
  return exitcode;
}

const isoDay = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : null);

/** Genereren + valideren. Geeft { gen, stop } waarbij stop = { code, reden } bij ongeldige data. */
async function generateStep(entry) {
  // BFX_NOW (ISO-tijd) alleen voor tests: simuleert een ander moment voor de versheidscontrole
  const now = process.env.BFX_NOW ? Date.parse(process.env.BFX_NOW) : Date.now();
  const gen = await generate({ input, now });
  Object.assign(entry, {
    bias_datum: isoDay(gen.biasDatum),
    bias_versie: gen.biasVersie,
    valuta: gen.ccyCount,
    paren: gen.pairCount,
    agenda_versheid: gen.agendaTs ? new Date(gen.agendaTs).toISOString() : "ontbreekt",
    events: gen.eventCount,
    invalidaties: gen.invalidations,
    pine_hash: gen.hash,
    snapshot_id: gen.snapshotId,
  });
  console.log(`Pine-code gemaakt: ${gen.file}\n${gen.label} · ${gen.eventCount} events · BIAS ${entry.bias_datum} ${entry.bias_versie} · ${gen.pairCount} paren · hash ${gen.hash.slice(0, 12)}`);
  if (!gen.validation.ok) return { gen, stop: { code: EXIT.STOP_DATA, reden: gen.validation.reason } };
  if (gen.eventCount === 0) console.warn("Let op: geen events in de agenda; kaart toont 'geen medium/high-event'.");
  return { gen, stop: null };
}

async function runOnce(cmd) {
  const entry = baseEntry(cmd);
  let gen;
  try {
    const g = await generateStep(entry);
    gen = g.gen;
    if (g.stop) {
      await notify(`⏸ BFX Macro niet bijgewerkt: ${g.stop.reden}. De chart houdt de laatste goede versie.`);
      return { code: finish(entry, "stop", g.stop.code, g.stop.reden), entry, gen };
    }
  } catch (err) {
    await notify(`⚠️ BFX Macro: data ophalen mislukt.\n${err.message}`);
    return { code: finish(entry, "fout", EXIT.FOUT, `data ophalen: ${err.message}`), entry, gen };
  }
  if (cmd === "generate") return { code: finish(entry, "ok", EXIT.OK, gen.isTest ? "testinvoer" : ""), entry, gen };
  if (gen.isTest) return { code: finish(entry, "stop", EXIT.STOP_DATA, "testinvoer wordt nooit afgeleverd"), entry, gen };

  if (config.delivery === "manual") {
    await notify(`📈 BFX Macro klaar om te plakken (${entry.bias_datum})`, { document: gen.file });
    return { code: finish(entry, "ok", EXIT.OK, "handmatige aflevering"), entry, gen };
  }

  const { deliver } = await import("./src/deliver.mjs");
  const res = await deliver(gen.file);
  Object.assign(entry, {
    chart_url: res.steps.url,
    layout_gezien: res.steps.layoutName,
    gecompileerd: res.steps.compiled,
    opslag_bevestigd: res.steps.saved,
    chart_bijgewerkt: res.steps.chartUpdated,
    layout_opgeslagen: res.steps.layoutSaved,
    instanties_verwijderd: res.steps.removed,
    instanties_na_afloop: res.steps.instances,
    screenshot: res.screenshot,
  });
  if (res.ok) {
    await notify(`✅ BFX Macro bijgewerkt (BIAS ${entry.bias_datum}, snapshot ${entry.snapshot_id})`, { photo: res.screenshot });
    return { code: finish(entry, "ok", EXIT.OK), entry, gen };
  }
  const soort = res.code === EXIT.FOUT ? "fout" : "stop";
  await notify(`${soort === "stop" ? "⏸" : "⚠️"} BFX Macro niet bijgewerkt: ${res.message}`, { photo: res.screenshot });
  return { code: finish(entry, soort, res.code, res.message), entry, gen };
}

async function main() {
  if (command === "login") {
    const { login } = await import("./src/deliver.mjs");
    await login();
    return 0;
  }
  if (command === "check") {
    const entry = baseEntry("check");
    const { check } = await import("./src/deliver.mjs");
    const res = await check();
    Object.assign(entry, { chart_url: res.state.url, layout_gezien: res.state.layoutName, screenshot: res.screenshot });
    console.log(res.ok ? `OK: ingelogd, layout '${res.state.layoutName}'` : `STOP: ${res.reason}`);
    return finish(entry, res.ok ? "ok" : "stop", res.code, res.reason);
  }
  if (command === "generate" || command === "run") return (await runOnce(command)).code;
  if (command === "acceptatie") {
    const { verifyOnChart } = await import("./src/deliver.mjs");
    for (const ronde of [1, 2]) {
      const r = await runOnce(`acceptatie-run${ronde}`);
      if (r.code !== EXIT.OK) {
        console.error(`Acceptatie ronde ${ronde}: run niet geslaagd (exit ${r.code}): ${r.entry.reden}`);
        return r.code;
      }
      const v = await verifyOnChart(r.entry.snapshot_id);
      const entry = baseEntry(`acceptatie-controle${ronde}`);
      Object.assign(entry, { snapshot_id: r.entry.snapshot_id, pine_hash: r.entry.pine_hash, screenshot: v.screenshot, layout_gezien: config.tvLayoutName });
      // Geen duplicaten: precies één BFX-snapshot-id zichtbaar op de layout
      const dup = v.instances !== 1 || (v.seen ?? []).length > 1;
      const ok = v.ok && !dup;
      finish(entry, ok ? "ok" : "fout", ok ? EXIT.OK : EXIT.FOUT, ok ? "" : v.reason || `duplicaten: ${v.instances} instanties, snapshots ${v.seen.join(", ")}`);
      console.log(`Acceptatie ronde ${ronde}: ${ok ? "OK" : "MISLUKT"} · snapshot ${r.entry.snapshot_id} · gezien ${(v.seen ?? []).join(", ") || "geen"} · BFX-instanties ${v.instances}${ok ? "" : " · " + (v.reason || "")}`);
      if (!ok) return EXIT.FOUT;
      if (ronde === 1) await new Promise((res) => setTimeout(res, 61_000)); // nieuw snapshot-id (minuutresolutie)
    }
    return EXIT.OK;
  }
  console.error(`Onbekend commando '${command}'. Gebruik: login | generate | check | run | acceptatie`);
  return 2;
}

main().then((code) => process.exit(code ?? 0));
