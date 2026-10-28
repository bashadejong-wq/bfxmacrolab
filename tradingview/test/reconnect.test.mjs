// Herverbinden bij 'Session disconnected' op een nagebootste pagina: geen browser, geen netwerk.
// De nagebootste pagina heeft precies de Playwright-methodes die reconnectIfDisconnected gebruikt.
// node --test test/reconnect.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { reconnectIfDisconnected } from "../src/deliver.mjs";

/** Pagina met (of zonder) de TradingView-melding 'Session disconnected' en een knop 'Connect'. */
function fakePage({ modal, connectButton = true }) {
  const state = { modal, clicks: 0 };
  const locator = (visible, onClick) => ({
    first: () => locator(visible, onClick),
    isVisible: async () => visible(),
    click: async () => onClick?.(),
  });
  return {
    state,
    getByText: (text) => locator(() => state.modal && /Session disconnected/.test(text)),
    getByRole: (role, { name } = {}) =>
      locator(
        () => role === "button" && name === "Connect" && connectButton,
        () => {
          state.clicks += 1;
          state.modal = false; // TradingView sluit de melding na Connect
        },
      ),
  };
}

test("melding aanwezig: klikt Connect en meldt herstel", async () => {
  const page = fakePage({ modal: true });
  assert.equal(await reconnectIfDisconnected(page), true);
  assert.equal(page.state.clicks, 1);
  assert.equal(page.state.modal, false);
});

test("geen melding: doet niets", async () => {
  const page = fakePage({ modal: false });
  assert.equal(await reconnectIfDisconnected(page), false);
  assert.equal(page.state.clicks, 0);
});
