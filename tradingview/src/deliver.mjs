import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config.mjs";

const MARKER = "BFX-MACRO-OVERLAY";
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

async function editorText(page) {
  return page.locator(`${EDITOR} .view-lines`).first().innerText().catch(() => "");
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

    // 2. Veiligheidscheck: alleen ons eigen script overschrijven
    await editor.click();
    await page.keyboard.press("ControlOrMeta+Home");
    await sleep(500);
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

    await page.keyboard.press("ControlOrMeta+Home");
    await sleep(500);
    if (version && !(await editorText(page)).includes(version)) {
      return fail("Code is niet goed geplakt (versieregel niet teruggevonden). Er is niet opgeslagen.");
    }

    // 4. Compilefouten? Dan niet opslaan.
    await sleep(2500);
    if ((await page.locator(`${EDITOR} .squiggly-error`).count()) > 0) {
      return fail("De nieuwe code bevat een compilefout; niet opgeslagen. Zie het Pine-bestand in de bijlage.");
    }

    // 5. Opslaan en (indien aanwezig) bijwerken op de chart
    await page.keyboard.press("ControlOrMeta+S");
    await sleep(3000);
    const update = await firstVisible(page, UPDATE_BUTTONS, 800);
    if (update) {
      await update.click();
      await sleep(3000);
    }

    await page.screenshot({ path: screenshot });
    await ctx.close();
    return { ok: true, message: `Bijgewerkt naar versie ${version}.`, screenshot };
  } catch (err) {
    return fail(`Onverwachte fout: ${err.message}`);
  }
}
