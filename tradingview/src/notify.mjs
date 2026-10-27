import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { config } from "./config.mjs";

const enabled = () => Boolean(config.telegramToken && config.telegramChatId);

async function call(method, form) {
  const res = await fetch(`https://api.telegram.org/bot${config.telegramToken}/${method}`, { method: "POST", body: form });
  if (!res.ok) console.error(`Telegram ${method} mislukt: HTTP ${res.status} ${await res.text()}`);
}

/** Stuurt een bericht met optioneel een screenshot en/of het Pine-bestand. Faalt nooit hard. */
export async function notify(text, { photo, document } = {}) {
  console.log(text);
  if (!enabled()) return;
  try {
    if (photo) {
      const form = new FormData();
      form.append("chat_id", config.telegramChatId);
      form.append("caption", text.slice(0, 1000));
      form.append("photo", new Blob([readFileSync(photo)]), basename(photo));
      await call("sendPhoto", form);
    } else {
      const form = new FormData();
      form.append("chat_id", config.telegramChatId);
      form.append("text", text);
      await call("sendMessage", form);
    }
    if (document) {
      const form = new FormData();
      form.append("chat_id", config.telegramChatId);
      form.append("caption", "Pine-code (handmatig plakken in de Pine Editor)");
      form.append("document", new Blob([readFileSync(document)]), basename(document));
      await call("sendDocument", form);
    }
  } catch (err) {
    console.error(`Telegram-melding mislukt: ${err.message}`);
  }
}
