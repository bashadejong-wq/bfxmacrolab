// Dagelijkse verversing van de BFX Structure Engine 0.1 in de ONDERZOEKSLAYOUT (voorstel; niet geactiveerd).
//   node src/structure-deliver.mjs --dry     alleen genereren + controleren (geen browser)
//   node src/structure-deliver.mjs           genereren → plakken → opslaan → layout opslaan → herladen → versie controleren
// Veiligheid: alleen layout "BFX CBO Onderzoek"; alleen plakken als de editor "BFX Structure Engine 0.1" toont;
// nooit headless (TradingView trekt dan de sessie in); geen productielayout, geen database-schrijfacties.
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config.mjs";
import { loadFromSupabase } from "./generate.mjs";
import { notify } from "./notify.mjs";
import { buildStructure, readSeen, writeSeen } from "./structure-generate.mjs";

export const LAYOUT_ID = "DcotUC2P";
export const LAYOUT_NAME = "BFX CBO Onderzoek";
export const SCRIPT = "BFX Structure Engine 0.1";
export const MARKER = "// BFX-STRUCTURE-ENGINE";
export const EXIT = { OK: 0, DATA: 2, SESSIE: 3, LAYOUT: 4, EDITOR: 5, COMPILE: 6, VERIFY: 7, FOUT: 9 };
// Ingelogd TradingView-profiel van de productietaak (zelfde account; de taken draaien na elkaar, nooit tegelijk)
const PROFILE = process.env.STR_TV_PROFILE || "/Users/bashajong/Claude/bfxmacrolab-tradingview/tradingview/.tv-profile";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const day = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Datacontrole vóór TradingView wordt aangeraakt. Puur, dus testbaar. */
export function preflightStructure(out, biasDatum, now) {
  if (!out.code.startsWith("//@version=6\n" + MARKER)) return { ok: false, reden: "marker ontbreekt" };
  if (/\{\{(DATA|VERSION|HIST)\}\}/.test(out.code)) return { ok: false, reden: "datablok niet volledig ingevuld" };
  if (!biasDatum || day(biasDatum) !== day(now)) return { ok: false, reden: `bias van vandaag ontbreekt (laatste ${biasDatum ? day(biasDatum) : "geen"})`, wacht: true };
  if (out.pairs < 28) return { ok: false, reden: `te weinig paren (${out.pairs})` };
  if (out.histRows < 8) return { ok: false, reden: `te weinig forward-biasrijen (${out.histRows})` };
  return { ok: true, reden: "" };
}

function log(entry) {
  mkdirSync(config.logDir, { recursive: true });
  appendFileSync(resolve(config.logDir, "structure-runs.jsonl"), `${JSON.stringify(entry)}\n`);
}

async function generateChecked(entry, tries, waitMin) {
  for (let i = 1; ; i++) {
    const now = Date.now();
    const data = await loadFromSupabase(now);
    const seen = readSeen();
    const out = buildStructure(data, seen);
    const pf = preflightStructure(out, data.biasDatum, now);
    Object.assign(entry, { bias_datum: data.biasDatum ? day(data.biasDatum) : null, paren: out.pairs, events: out.events, bias_rijen: out.histRows, hash: out.hash, datablok_id: Math.round(data.generatedAt / 60000), poging: i });
    if (pf.ok) {
      writeSeen(out.seen);
      mkdirSync(config.outDir, { recursive: true });
      writeFileSync(resolve(config.outDir, "bfx_structure_engine.pine"), out.code);
      return out;
    }
    if (!pf.wacht || i >= tries) throw Object.assign(new Error(pf.reden), { code: EXIT.DATA });
    await sleep(waitMin * 60000);
  }
}

// Leest één waarde uit de Data Window van de Structure Engine (bv. "Datablok-id (min)")
async function dataWindowValue(page, label) {
  const tgl = page.locator('[aria-label="Object tree and data window"]').first();
  if ((await tgl.getAttribute("aria-pressed").catch(() => null)) !== "true") await tgl.click().catch(() => {});
  await sleep(1500);
  await page.getByText("Data window", { exact: true }).first().click().catch(() => {});
  await sleep(2500);
  return page.evaluate((lab) => {
    const ds = [...document.querySelectorAll("div")].filter((d) => (d.innerText || "").includes(lab) && (d.innerText || "").includes("S BoS"));
    ds.sort((a, b) => a.innerText.length - b.innerText.length);
    const m = ds[0]?.innerText.split("\n").join(" ").match(new RegExp(lab.replace(/[()]/g, "\\$&") + "\\s+([\\d.,\\s\\u202f\\u00a0]+)"));
    return m ? Number(m[1].replace(/[^\d]/g, "").replace(/0{5}$/, "")) : null;
  }, label);
}

async function deliverToTradingView(entry, out) {
  const { chromium } = await import("playwright");
  const { reconnectIfDisconnected } = await import("./deliver.mjs");
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1600, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const fail = (code, reden) => Object.assign(new Error(reden), { code });
  try {
    await page.goto(`https://www.tradingview.com/chart/${LAYOUT_ID}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(9000);
    entry.sessie_hersteld = await reconnectIfDisconnected(page);
    const st = await page.evaluate(() => ({ user: window.user?.username ?? null, layout: ([...document.querySelectorAll("[aria-label]")].find((e) => /Active layout:/.test(e.getAttribute("aria-label")))?.getAttribute("aria-label") ?? "").split("Active layout:")[1]?.trim() ?? null }));
    if (!st.user) throw fail(EXIT.SESSIE, "niet ingelogd in TradingView");
    if (st.layout !== LAYOUT_NAME) throw fail(EXIT.LAYOUT, `verkeerde layout: ${st.layout}`);

    // Pine Editor openen en zo nodig verbreden (hij kan rechts dichtgeklapt zitten)
    const pine = page.locator('[data-name="pine-dialog-button"]').first();
    if ((await pine.getAttribute("aria-pressed").catch(() => null)) !== "true") await pine.click();
    await sleep(3000);
    let box = await page.locator(".monaco-editor").first().boundingBox();
    if (box && box.width < 300) {
      const host = await page.locator(".tv-script-widget").first().boundingBox();
      const x = (host?.x ?? box.x) - 2;
      await page.mouse.move(x, 500);
      await page.mouse.down();
      await page.mouse.move(700, 500, { steps: 15 });
      await page.mouse.up();
      await sleep(1500);
      box = await page.locator(".monaco-editor").first().boundingBox();
    }
    const title = await page.evaluate((s) => [...document.querySelectorAll("*")].some((e) => e.children.length === 0 && (e.innerText || "").trim() === s && e.getBoundingClientRect().y < 100 && e.getBoundingClientRect().x > 700), SCRIPT);
    if (!box || box.width < 300 || !title) throw fail(EXIT.EDITOR, `editor niet bruikbaar (breedte ${box?.width ?? 0}, titel ${title ? "ok" : "niet " + SCRIPT})`);

    // Plakken en opslaan
    const t0 = Date.now();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.press("Meta+A");
    await page.evaluate(async (t) => navigator.clipboard.writeText(t), out.code);
    await page.keyboard.press("Meta+V");
    await sleep(2000);
    await page.keyboard.press("Meta+S");
    let consoleTxt = "";
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      consoleTxt = await page.evaluate(() => [...document.querySelectorAll("[class*=console], [class*=Console]")].map((e) => e.innerText).sort((a, b) => b.length - a.length)[0] ?? "");
      if (consoleTxt.split("\n").slice(-3).some((l) => l.includes(`"${SCRIPT}" saved.`))) break;
    }
    const tail = consoleTxt.split("\n").slice(-4).join(" | ");
    entry.console = tail.slice(0, 300);
    if (!tail.includes(`"${SCRIPT}" saved.`) || /error/i.test(tail)) throw fail(EXIT.COMPILE, `niet opgeslagen of compileerfout: ${tail.slice(0, 160)}`);

    // Chart bijwerken: staat er "Add to chart", dan is de instantie losgekoppeld → nieuwe toevoegen, oude verwijderen
    const studies = () => page.evaluate(() => TradingViewApi.activeChart().getAllStudies().map((s) => [s.id, s.name]));
    const before = (await studies()).filter(([, n]) => n === SCRIPT).map(([id]) => id);
    const add = page.getByRole("button", { name: "Add to chart" }).first();
    if (await add.isVisible({ timeout: 1500 }).catch(() => false)) {
      await add.click();
      await sleep(12000);
      for (const id of before) await page.evaluate((i) => TradingViewApi.activeChart().removeEntity(i), id);
      entry.instantie_vervangen = true;
    }
    const n = (await studies()).filter(([, nm]) => nm === SCRIPT).length;
    if (n !== 1) throw fail(EXIT.VERIFY, `${n} instanties van ${SCRIPT} op de chart`);

    // Layout expliciet opslaan (anders laadt de layout na openen de vorige scriptversie)
    await page.locator('[data-name="save-load-menu"]').first().click();
    await sleep(1000);
    await page.getByText("Save layout", { exact: true }).first().click().catch(() => page.keyboard.press("Escape"));
    await sleep(3000);
    entry.layout_opgeslagen = true;

    // Herladen en controleren dat de nieuwe datablokversie draait
    await page.goto(`https://www.tradingview.com/chart/${LAYOUT_ID}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(12000);
    const seenId = await dataWindowValue(page, "Datablok-id (min)");
    entry.datablok_gezien = seenId;
    entry.duur_s = Math.round((Date.now() - t0) / 1000);
    const shot = resolve(config.logDir, `structure-${day(Date.now())}.png`);
    await page.screenshot({ path: shot }).catch(() => {});
    entry.screenshot = shot;
    if (seenId !== entry.datablok_id) throw fail(EXIT.VERIFY, `na herladen datablok ${seenId} ≠ verwacht ${entry.datablok_id}`);
  } finally {
    await ctx.close().catch(() => {});
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dry = process.argv.includes("--dry");
  const entry = { start: new Date().toISOString(), modus: dry ? "dry" : "run", layout: LAYOUT_NAME, script: SCRIPT };
  let code = EXIT.OK;
  try {
    const out = await generateChecked(entry, dry ? 1 : 4, 20);
    if (!dry) await deliverToTradingView(entry, out);
    entry.resultaat = "ok";
  } catch (e) {
    code = e.code ?? EXIT.FOUT;
    entry.resultaat = "fout";
    entry.reden = String(e.message).slice(0, 300);
  }
  entry.eind = new Date().toISOString();
  entry.exitcode = code;
  log(entry);
  if (!dry) await notify(code === 0 ? `BFX Structure Engine: datablok ${entry.bias_datum} in onderzoekslayout gezet en gecontroleerd.` : `BFX Structure Engine: verversing MISLUKT (${entry.reden}). Forwardmeting loopt door tot de bias 96 u oud is.`);
  console.log(JSON.stringify(entry));
  process.exit(code);
}
