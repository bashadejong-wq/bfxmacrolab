// Herverbinden bij 'Session disconnected' op een nagebootste pagina (geen netwerk, geen TradingView).
// node --test test/reconnect.test.mjs
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { reconnectIfDisconnected } from "../src/deliver.mjs";

const MODAL = `<div id="m"><h2>Session disconnected</h2><p>Your session ended because your account was accessed from another browser or device.</p>
<button onclick="document.getElementById('m').remove()">Connect</button></div>`;

let browser;
before(async () => (browser = await chromium.launch({ headless: true })));
after(async () => browser?.close());

test("melding aanwezig: klikt Connect en meldt herstel", async () => {
  const page = await browser.newPage();
  await page.setContent(MODAL);
  assert.equal(await reconnectIfDisconnected(page), true);
  assert.equal(await page.getByText("Session disconnected").count(), 0);
});

test("geen melding: doet niets", async () => {
  const page = await browser.newPage();
  await page.setContent("<p>Chart</p><button>Connect</button>");
  assert.equal(await reconnectIfDisconnected(page), false);
});
