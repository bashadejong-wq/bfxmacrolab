import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config.mjs";

const MARKER = "BFX-MACRO-OVERLAY";
const SCRIPT_NAME = "BFX Macro Overlay";
// Naar regel 1 in de editor: op macOS ⌘↑ (⌘Home doet daar niets), elders Ctrl+Home.
const DOC_START = process.platform === "darwin" ? "Meta+ArrowUp" : "Control+Home";
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

async function launch() {
  const { chromium } = await import("playwright");
  mkdirSync(config.tvProfileDir, { recursive: true });
  return chromium.launchPersistentContext(config.tvProfileDir, {
    headless: config.headless,
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

/** Scrolt de editor naar regel 1 (muiswiel werkt los van sneltoetsen en besturingssysteem). */
async function scrollToTop(page) {
  const box = await page.locator(EDITOR).first().boundingBox().catch(() => null);
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 15; i++) await page.mouse.wheel(0, -20000);
  await sleep(600);
}

async function editorText(page) {
  // De editor toont spaties als non-breaking spaces; normaliseer voor vergelijkingen.
  const txt = await page.locator(`${EDITOR} .view-lines`).first().innerText().catch(() => "");
  return txt.replace(/\u00a0/g, " ");
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
  await editor.click().catch(() => {});
  await page.keyboard.press(DOC_START);
    await scrollToTop(page);
  await sleep(500);
}

/** Cookiebanner: kies de privacyvriendelijke optie, als die er staat. */
async function declineCookies(page) {
  const btn = await firstVisible(page, ['button:has-text("Don\'t allow")', 'button:has-text("Niet toestaan")', 'button:has-text("Reject all")'], 500);
  if (btn) await btn.click().catch(() => {});
}

/** Opent een browser waarin je één keer handmatig inlogt bij TradingView. */
export async function login() {
  const ctx = await launch();
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto("https://www.tradingview.com/#signin");
  console.log(
    "Log in bij TradingView in het geopende venster.\n" +
      "Open daarna een chart → Pine Editor → het script 'BFX Macro Overlay' (zie README, eerste keer).\n" +
      "Sluit het browservenster als je klaar bent; de sessie blijft bewaard.",
  );
  await new Promise((r) => ctx.on("close", r));
}

/**
 * Vervangt de code van het open BFX-script in de Pine Editor en slaat op.
 * Geeft { ok, message, screenshot } terug; gooit alleen bij onverwachte fouten.
 */
export async function deliver(pineFile) {
  const code = readFileSync(pineFile, "utf8");
  const version = code.match(/^\/\/ Versie: (.+)$/m)?.[1] ?? "";
  mkdirSync(config.outDir, { recursive: true });
  const screenshot = resolve(config.outDir, "last-run.png");

  const ctx = await launch();
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const fail = async (message) => {
    await page.screenshot({ path: screenshot }).catch(() => {});
    await ctx.close();
    return { ok: false, message, screenshot };
  };

  try {
    await page.goto(config.tvChartUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await sleep(8000);
    await declineCookies(page);
    console.log(`TradingView: ${page.url()} · ${await page.title()}`);

    if (await firstVisible(page, ['button:has-text("Sign in")', 'a:has-text("Sign in")', 'button:has-text("Inloggen")'], 500)) {
      return fail("Niet ingelogd bij TradingView. Draai `node bfx-tv.mjs login` en log opnieuw in.");
    }

    // 1. Pine Editor openen (als die nog niet open staat)
    if (!(await page.locator(EDITOR).first().isVisible().catch(() => false))) {
      const btn = await firstVisible(page, PINE_BUTTONS);
      if (!btn) return fail("Knop voor de Pine Editor niet gevonden (TradingView-interface gewijzigd?).");
      await btn.click();
      await page.locator(EDITOR).first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
    }
    const editor = page.locator(EDITOR).first();
    if (!(await editor.isVisible().catch(() => false))) return fail("Pine Editor opende niet.");

    // 2. Veiligheidscheck: alleen ons eigen script overschrijven.
    //    Staat een ander script open, open dan eerst 'BFX Macro Overlay' via Open script (⌘O).
    await editor.click();
    await page.keyboard.press(DOC_START);
    await scrollToTop(page);
    await sleep(500);
    if (!(await editorText(page)).includes(MARKER)) {
      await openScriptByName(page, editor);
    }
    if (!(await editorText(page)).includes(MARKER)) {
      return fail(
        "In de Pine Editor staat niet het script 'BFX Macro Overlay'. Open dat script één keer handmatig in de Pine Editor; er is niets overschreven.",
      );
    }

    // 3. Code vervangen via het klembord (plakken voorkomt auto-aanvulling van haakjes)
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

    await page.keyboard.press(DOC_START);
    await scrollToTop(page);
    await sleep(500);
    if (version && !(await editorText(page)).includes(version)) {
      const seen = (await editorText(page)).replace(/\s+/g, " ").slice(0, 160);
      return fail(`Code is niet goed geplakt (versieregel niet teruggevonden). Er is niet opgeslagen. Editor toont: ${seen}`);
    }

    // 4. Compilefouten? Dan niet opslaan.
    await sleep(2500);
    if ((await page.locator(`${EDITOR} .squiggly-error`).count()) > 0) {
      return fail("De nieuwe code bevat een compilefout; niet opgeslagen. Zie het Pine-bestand in de bijlage.");
    }

    // 5. Opslaan en (indien aanwezig) bijwerken op de chart
    await page.keyboard.press("ControlOrMeta+S");
    // Groot script: compileren + opslaan duurt ±10 s. Wacht tot 'Unsaved version' weg is.
    const unsaved = page.getByText(/Unsaved version|Niet-opgeslagen versie/).first();
    await sleep(2000);
    let saved = false;
    for (let i = 0; i < 45; i++) {
      if (!(await unsaved.isVisible().catch(() => false))) { saved = true; break; }
      await sleep(1000);
    }
    if (!saved) return fail("Opslaan niet bevestigd binnen 45 s (TradingView toont nog 'Unsaved version').");
    if ((await page.locator(`${EDITOR} .squiggly-error`).count()) > 0) {
      return fail("Na opslaan meldt de Pine Editor een fout. Zie de schermafdruk.");
    }
    // Een indicator op de chart blijft op de versie waarmee hij is toegevoegd: werk hem bij
    // en geef TradingView tijd om de layout automatisch op te slaan.
    const update = await firstVisible(page, UPDATE_BUTTONS, 2000);
    if (!update) return fail("Opgeslagen, maar 'Update on chart' niet gevonden: de indicator op de chart toont nog de vorige versie.");
    await update.click();
    await sleep(8000);

    await page.screenshot({ path: screenshot });
    await ctx.close();
    return { ok: true, message: `Bijgewerkt naar versie ${version}.`, screenshot };
  } catch (err) {
    return fail(`Onverwachte fout: ${err.message}`);
  }
}
