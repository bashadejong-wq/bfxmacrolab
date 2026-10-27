import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config.mjs";
import { EXIT, evaluateSave, preflight, stripQuery } from "./logic.mjs";

const MARKER = "BFX-MACRO-OVERLAY";
const SCRIPT_NAME = "BFX Macro Overlay";
const EDITOR = ".monaco-editor";

// TradingView verandert af en toe de interface; daarom meerdere varianten per knop.
const PINE_BUTTONS = [
  '[data-name="pine-dialog-button"]',
  'button[aria-label="Pine"]',
  'button[aria-label*="Pine Editor"]',
  'button[data-tooltip*="Pine"]',
  'button:has-text("Pine Editor")',
];
const UPDATE_BUTTONS = ['button:has-text("Update on chart")', 'button[title*="Update on chart"]', 'button:has-text("Bijwerken op grafiek")'];

export const layoutUrl = (id = config.tvLayoutId) => `https://www.tradingview.com/chart/${id}/`;

/** Altijd met zichtbaar venster: headless trekt de TradingView-sessie in. */
async function launch() {
  if (config.headless) console.warn("HEADLESS=true genegeerd: TradingView-aflevering draait altijd met zichtbaar venster.");
  const { chromium } = await import("playwright");
  mkdirSync(config.tvProfileDir, { recursive: true });
  return chromium.launchPersistentContext(config.tvProfileDir, {
    headless: false,
    channel: config.browserChannel || undefined,
    viewport: { width: 1600, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function firstVisible(page, selectors, timeout = 1500) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout }).catch(() => false)) return loc;
  }
  return null;
}

/**
 * Scrolt de editor tot regel 1 zichtbaar is. Het wiel-event wordt rechtstreeks op het editor-element afgevuurd
 * (geen muisbeweging), zodat de chart er nooit door kan in- of uitzoomen.
 */
async function scrollToTop(page) {
  const ed = page.locator(EDITOR).first();
  if (!(await ed.count())) return false;
  for (let i = 0; i < 40; i++) {
    await ed
      .evaluate((el) => {
        const target = el.querySelector(".monaco-scrollable-element") ?? el;
        for (let k = 0; k < 10; k++) target.dispatchEvent(new WheelEvent("wheel", { deltaY: -30000, bubbles: true, cancelable: true }));
      })
      .catch(() => {});
    await sleep(300);
    const first = await page.locator(`${EDITOR} .line-numbers`).evaluateAll((els) => Math.min(...els.map((e) => Number(e.textContent) || 1e9))).catch(() => 1e9);
    if (first <= 1) return true;
  }
  return false;
}

const digits = (t) => String(t ?? "").replace(/\D/g, "");

/** BFX Macro-legendarijen op de geopende layout: [{ text }] */
async function bfxLegendItems(page) {
  return page.locator('[data-qa-id="legend-source-item"]').filter({ hasText: "BFX Macro" });
}

/**
 * Verwijdert BFX Macro-instanties van de geopende (BFX-)layout, behalve de instantie die keepSnapshot toont.
 * keepSnapshot = null → alle BFX-instanties weg. Geeft het aantal verwijderde.
 */
async function removeBfxInstances(page, keepSnapshot = null) {
  let removed = 0;
  for (let guard = 0; guard < 8; guard++) {
    const items = await bfxLegendItems(page);
    const n = await items.count();
    let target = null;
    for (let i = 0; i < n; i++) {
      const it = items.nth(i);
      const txt = await it.innerText().catch(() => "");
      if (!keepSnapshot || !digits(txt).includes(String(keepSnapshot))) {
        target = it;
        break;
      }
    }
    if (!target) break;
    // Selecteer de instantie via haar legendatitel en verwijder met Delete (de verwijderknop reageert niet betrouwbaar)
    const before = n;
    await target.locator('[data-qa-id*="legend-source-title"]').first().click().catch(() => {});
    await sleep(500);
    await page.keyboard.press("Delete");
    await sleep(1500);
    if ((await (await bfxLegendItems(page)).count()) >= before) break; // niets verwijderd: niet eindeloos proberen
    removed += 1;
  }
  return removed;
}

/** Aantal BFX Macro-instanties op de geopende layout. */
export async function countBfxInstances(page) {
  return (await bfxLegendItems(page)).count();
}

/** Snapshot-id's die als tekst op de pagina staan (legenda toont ze met duizendtalscheiding). */
export async function snapshotsOnPage(page) {
  const body = await page.evaluate(() => document.body.innerText).catch(() => "");
  return [...new Set((body.match(/\b20\d(?:[,.\u202f\u00a0 ]?\d{3}){3}\b/g) ?? []).map((x) => Number(x.replace(/\D/g, ""))))];
}

/** Slaat de layout expliciet op via het layoutmenu (niet op autosave vertrouwen). */
async function saveLayout(page) {
  const menu = page.locator('[data-name="save-load-menu"]').first();
  if (!(await menu.isVisible().catch(() => false))) return false;
  await menu.click();
  await sleep(800);
  const item = page.getByText("Save layout", { exact: true }).first();
  const enabled = await item.isVisible().catch(() => false);
  if (enabled) await item.click().catch(() => {});
  else await page.keyboard.press("Escape");
  await sleep(3000);
  // Bevestiging van TradingView zelf
  return page.locator('button[aria-label="All changes saved"]').first().count().then((n) => n > 0).catch(() => false);
}

async function editorText(page) {
  // De editor toont spaties als non-breaking spaces; normaliseer voor vergelijkingen.
  const txt = await page.locator(`${EDITOR} .view-lines`).first().innerText().catch(() => "");
  return txt.replace(/ /g, " ");
}

/** Cookiebanner: kies de privacyvriendelijke optie, als die er staat. */
async function declineCookies(page) {
  const btn = await firstVisible(page, ['button:has-text("Don\'t allow")', 'button:has-text("Niet toestaan")', 'button:has-text("Reject all")'], 500);
  if (btn) await btn.click().catch(() => {});
}

/**
 * TradingView staat één actieve sessie per account toe. Toont deze browser 'Session disconnected',
 * klik dan op 'Connect' (een andere sessie, bv. Chrome, raakt zijn verbinding tijdelijk kwijt).
 * Geeft true als er opnieuw verbonden is.
 */
export async function reconnectIfDisconnected(page) {
  const modal = page.getByText("Session disconnected", { exact: false }).first();
  if (!(await modal.isVisible({ timeout: 1000 }).catch(() => false))) return false;
  const btn = page.getByRole("button", { name: "Connect", exact: true }).first();
  if (!(await btn.isVisible().catch(() => false))) return false;
  await btn.click();
  await sleep(6000);
  return !(await modal.isVisible().catch(() => false));
}

/** Sessie- en layoutstatus van de geopende pagina (geen geheimen: alleen ja/nee en namen). */
async function pageState(ctx, page) {
  const cookies = await ctx.cookies("https://www.tradingview.com");
  const hasSession = cookies.some((c) => c.name === "sessionid" && c.value);
  const info = await page
    .evaluate(() => {
      const el = [...document.querySelectorAll("[aria-label]")].find((e) => /Active layout:/.test(e.getAttribute("aria-label")));
      const m = el?.getAttribute("aria-label").match(/Active layout:\s*(.+)$/m);
      return { username: window.user?.username ?? null, layoutName: m ? m[1].trim() : null };
    })
    .catch(() => ({ username: null, layoutName: null }));
  return {
    hasSession,
    isGuest: !info.username || info.username === "Guest",
    title: await page.title(),
    url: page.url(),
    layoutName: info.layoutName,
  };
}

/** Opent 'BFX Macro Overlay' via het Open script-venster van de Pine Editor. */
async function openScriptByName(page, editor) {
  await editor.click();
  await page.keyboard.press("ControlOrMeta+O");
  await sleep(1500);
  await page.keyboard.insertText(SCRIPT_NAME);
  await sleep(2000);
  const item = page.getByText(SCRIPT_NAME, { exact: true }).last();
  if (await item.isVisible().catch(() => false)) await item.click();
  else await page.keyboard.press("Enter");
  await sleep(4000);
  await scrollToTop(page);
}

/** Opent een browser waarin je één keer handmatig inlogt bij TradingView. */
export async function login() {
  const ctx = await launch();
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto("https://www.tradingview.com/#signin");
  console.log(
    "Log in bij TradingView in het geopende venster.\n" +
      `Open daarna de layout '${config.tvLayoutName}' en in de Pine Editor het script '${SCRIPT_NAME}'.\n` +
      "Sluit het browservenster als je klaar bent; de sessie blijft bewaard.",
  );
  await new Promise((r) => ctx.on("close", r));
}

/**
 * Alleen-lezen controle van sessie en layout (geen editoractie). Voor tests en de acceptatieronde.
 * Geeft { ok, code, reason, state }.
 */
export async function check() {
  const ctx = await launch();
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  try {
    await page.goto(layoutUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
    await sleep(8000);
    await declineCookies(page);
    const reconnected = await reconnectIfDisconnected(page);
    if (reconnected) console.log("TradingView: sessie was verbroken door een andere browser; opnieuw verbonden (Connect).");
    const state = await pageState(ctx, page);
    const pf = preflight(state, { layoutId: config.tvLayoutId, layoutName: config.tvLayoutName });
    const screenshot = resolve(config.outDir, "check.png");
    await page.screenshot({ path: screenshot }).catch(() => {});
    return { ...pf, state: { ...state, url: stripQuery(state.url) }, screenshot, reconnected };
  } finally {
    await ctx.close();
  }
}

/**
 * Vervangt de code van het BFX-script en werkt de indicator op de BFX-layout bij.
 * Geeft { ok, code, message, screenshot, steps }; gooit alleen bij onverwachte fouten.
 */
export async function deliver(pineFile) {
  const code = readFileSync(pineFile, "utf8");
  const version = code.match(/^\/\/ Versie: (.+)$/m)?.[1] ?? "";
  mkdirSync(config.outDir, { recursive: true });
  const screenshot = resolve(config.outDir, "last-run.png");
  const steps = { url: "", layoutName: null, script: SCRIPT_NAME, compiled: false, saved: false, chartUpdated: false, layoutSaved: false, removed: 0, instances: null, reconnected: false };

  const ctx = await launch();
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const stop = async (code, message) => {
    await page.screenshot({ path: screenshot }).catch(() => {});
    await ctx.close();
    return { ok: false, code, message, screenshot, steps };
  };

  try {
    // 0. Uitsluitend de BFX-layout; nooit terugvallen op /chart/ of een andere layout
    await page.goto(layoutUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
    await sleep(8000);
    await declineCookies(page);
    const reconnected = await reconnectIfDisconnected(page);
    if (reconnected) console.log("TradingView: sessie was verbroken door een andere browser; opnieuw verbonden (Connect).");
    const state = await pageState(ctx, page);
    steps.reconnected = reconnected;
    steps.url = stripQuery(state.url);
    steps.layoutName = state.layoutName;
    const pf = preflight(state, { layoutId: config.tvLayoutId, layoutName: config.tvLayoutName });
    if (!pf.ok) return stop(pf.code, pf.reason);

    // 1. Pine Editor openen (als die nog niet open staat)
    if (!(await page.locator(EDITOR).first().isVisible().catch(() => false))) {
      const btn = await firstVisible(page, PINE_BUTTONS);
      if (!btn) return stop(EXIT.STOP_SCRIPT, "knop voor de Pine Editor niet gevonden (TradingView-interface gewijzigd?)");
      await btn.click();
      await page.locator(EDITOR).first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
    }
    const editor = page.locator(EDITOR).first();
    if (!(await editor.isVisible().catch(() => false))) return stop(EXIT.STOP_SCRIPT, "Pine Editor opende niet");

    // 2. Veiligheidscheck: alleen ons eigen script overschrijven
    await editor.click();
    await scrollToTop(page);
    if (!(await editorText(page)).includes(MARKER)) await openScriptByName(page, editor);
    if (!(await editorText(page)).includes(MARKER)) {
      return stop(EXIT.STOP_SCRIPT, `in de Pine Editor staat niet het script '${SCRIPT_NAME}' (marker ontbreekt); niets overschreven`);
    }

    // 3. Code vervangen via het klembord (plakken voorkomt auto-aanvulling van haakjes)
    await editor.click();
    await page.keyboard.press("ControlOrMeta+A");
    const pasted = await page
      .evaluate(async (text) => {
        await navigator.clipboard.writeText(text);
        return true;
      }, code)
      .catch(() => false);
    if (pasted) await page.keyboard.press("ControlOrMeta+V");
    else await page.keyboard.insertText(code);
    await sleep(1500);
    await scrollToTop(page);
    const text = await editorText(page);
    const markerFound = text.includes(MARKER);
    const versionFound = !version || text.includes(version);
    if (!markerFound || !versionFound) {
      return stop(EXIT.STOP_SCRIPT, evaluateSave({ markerFound, versionFound }).reason);
    }

    // 4. Opslaan en wachten tot 'Unsaved version' weg is (compileren duurt ±10 s)
    // Focus in de editor (scrollen beweegt alleen de muis) en opslaan; tot 3 pogingen, opnieuw opslaan is onschadelijk
    const unsaved = page.getByText(/Unsaved version|Niet-opgeslagen versie/).first();
    let unsavedVisible = true;
    for (let poging = 0; poging < 3 && unsavedVisible; poging++) {
      await editor.click();
      await page.keyboard.press("ControlOrMeta+S");
      await sleep(2000);
      for (let i = 0; i < 15 && unsavedVisible; i++) {
        unsavedVisible = await unsaved.isVisible().catch(() => false);
        if (unsavedVisible) await sleep(1000);
      }
      steps.saveAttempts = poging + 1;
    }
    const compileErrors = await page.locator(`${EDITOR} .squiggly-error`).count();
    steps.compiled = compileErrors === 0;
    steps.saved = !unsavedVisible;

    // 5. Indicator op de chart: TradingView werkt hem bij het opslaan vaak zelf bij; anders 'Update on chart'.
    //    Bewijs in beide gevallen: het nieuwe snapshot-id staat in de legenda van de BFX-layout.
    const snapshot = code.match(/^const int    SNAPSHOT_ID = (\d+)$/m)?.[1] ?? "";
    let verdict = evaluateSave({ markerFound, versionFound, unsavedVisible, compileErrors, updateFound: true });
    if (!verdict.ok) return stop(verdict.code, verdict.reason);
    const waitSnapshot = async (secs) => {
      for (let i = 0; i < secs; i++) {
        if (snapshot && (await snapshotsOnPage(page)).includes(Number(snapshot))) return true;
        await sleep(1000);
      }
      return false;
    };
    // a) TradingView werkt de gekoppelde instantie bij het opslaan vaak zelf bij
    let onChart = await waitSnapshot(15);
    // b) anders 'Update on chart'
    if (!onChart) {
      const update = await firstVisible(page, UPDATE_BUTTONS, 1500);
      if (update) {
        await update.click();
        onChart = await waitSnapshot(20);
      }
    }
    // c) anders: BFX-instanties op deze layout weg en de nieuwe versie toevoegen
    if (!onChart) {
      steps.removed += await removeBfxInstances(page, null);
      const add = await firstVisible(page, ['button[title="Add to chart"]', 'button[aria-label="Add to chart"]', 'button:has-text("Add to chart")'], 2000);
      if (!add) return stop(EXIT.STOP_OPSLAAN, "'Update on chart' en 'Add to chart' niet gevonden");
      await add.click();
      onChart = await waitSnapshot(30);
    }
    // Precies één BFX-instantie: oude rijen zonder het nieuwe snapshot verwijderen
    if (onChart) steps.removed += await removeBfxInstances(page, snapshot);
    steps.instances = await countBfxInstances(page);
    steps.chartUpdated = onChart;
    verdict = evaluateSave({ markerFound, versionFound, unsavedVisible, compileErrors, updateFound: onChart });
    if (!verdict.ok) return stop(verdict.code, `nieuwe versie (snapshot ${snapshot}) niet zichtbaar op de chart`);
    await sleep(3000);
    // Automatische prijsschaal herstellen (een verdwaalde muiswielactie kan hem uitzetten); alleen deze BFX-layout
    steps.autoScale = await page
      .evaluate(() => {
        const ps = window.TradingViewApi?.activeChart?.()?.getPanes?.()[0]?.getMainSourcePriceScale?.();
        if (!ps) return null;
        if (!ps.isAutoScale()) ps.setAutoScale(true);
        // Standaard zoom/staafbreedte van de BFX-layout herstellen
        try { window.TradingViewApi.activeChart().executeActionById("chartReset"); } catch (e) {}
        return ps.isAutoScale();
      })
      .catch(() => null);
    // Layout expliciet opslaan, zodat de bijgewerkte indicator na herladen blijft staan
    steps.layoutSaved = await saveLayout(page);
    if (!steps.layoutSaved) return stop(EXIT.STOP_OPSLAAN, "layout niet bevestigd opgeslagen ('All changes saved' ontbreekt)");

    await page.screenshot({ path: screenshot });
    await ctx.close();
    return { ok: true, code: EXIT.OK, message: `Bijgewerkt naar versie ${version}.`, screenshot, steps };
  } catch (err) {
    return stop(EXIT.FOUT, `onverwachte fout: ${err.message}`);
  }
}

/**
 * Herlaadt de BFX-layout in een nieuwe browser en leest de 'bijgewerkt'-tekst van de indicator:
 * bewijs dat de layout de nieuwe versie bewaard heeft. Geeft { ok, reason, seen, screenshot }.
 */
export { saveLayout };

export async function verifyOnChart(expectedStamp) {
  const ctx = await launch();
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const screenshot = resolve(config.outDir, "verify.png");
  try {
    await page.goto(layoutUrl(), { waitUntil: "domcontentloaded", timeout: 60_000 });
    await sleep(12000);
    await declineCookies(page);
    const reconnected = await reconnectIfDisconnected(page);
    if (reconnected) console.log("TradingView: sessie was verbroken door een andere browser; opnieuw verbonden (Connect).");
    const state = await pageState(ctx, page);
    const pf = preflight(state, { layoutId: config.tvLayoutId, layoutName: config.tvLayoutName });
    await page.screenshot({ path: screenshot }).catch(() => {});
    if (!pf.ok) return { ok: false, reason: pf.reason, seen: null, screenshot };
    // De legenda toont het snapshot-id als tekst (de tabel zelf is canvas)
    const seen = await snapshotsOnPage(page);
    const instances = await countBfxInstances(page);
    const ok = seen.includes(Number(expectedStamp)) && instances === 1;
    const reason = ok ? "" : instances !== 1 ? `${instances} BFX-instanties op de layout (verwacht 1)` : `snapshot ${expectedStamp} niet zichtbaar op de BFX-layout (gezien: ${seen.join(", ") || "geen"})`;
    return { ok, reason, seen, instances, screenshot };
  } finally {
    await ctx.close();
  }
}
