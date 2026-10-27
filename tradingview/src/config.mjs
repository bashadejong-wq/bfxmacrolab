import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Minimale .env-loader, zodat we geen extra dependency nodig hebben.
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(resolve(ROOT, ".env"));

const env = (key, fallback = "") => process.env[key] ?? fallback;
const bool = (key, fallback) => {
  const v = process.env[key];
  return v === undefined || v === "" ? fallback : /^(1|true|ja|yes)$/i.test(v);
};
const num = (key, fallback) => {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && process.env[key] !== "" ? v : fallback;
};

export const config = {
  supabaseUrl: env("SUPABASE_URL"),
  supabaseKey: env("SUPABASE_KEY"),
  // Tijden in macro_events_calendar zonder tijdzone worden als UTC gelezen.
  eventTimesAreUtc: bool("EVENT_TIMES_ARE_UTC", true),
  daysBack: num("DAYS_BACK", 7),
  daysAhead: num("DAYS_AHEAD", 21),
  currencies: env("CURRENCIES", "USD,EUR,GBP,JPY,CHF,AUD,NZD,CAD")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean),
  minImpact: num("MIN_IMPACT", 2),

  delivery: env("DELIVERY", "auto"), // auto | manual
  tvChartUrl: env("TV_CHART_URL", "https://www.tradingview.com/chart/"),
  tvProfileDir: resolve(ROOT, env("TV_PROFILE_DIR", ".tv-profile")),
  headless: bool("HEADLESS", false),
  browserChannel: env("BROWSER_CHANNEL", ""), // bv. "chrome" om je geïnstalleerde Chrome te gebruiken

  telegramToken: env("TELEGRAM_BOT_TOKEN"),
  telegramChatId: env("TELEGRAM_CHAT_ID"),

  outDir: resolve(ROOT, "out"),
};
