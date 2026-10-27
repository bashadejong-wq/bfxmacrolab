#!/usr/bin/env node
// BFX Macro Overlay voor TradingView
//   node bfx-tv.mjs login                   eenmalig inloggen bij TradingView
//   node bfx-tv.mjs generate [--input x]    alleen Pine-code maken (out/bfx_macro_overlay.pine)
//   node bfx-tv.mjs run [--input x]         maken + in TradingView zetten + melding
import { config } from "./src/config.mjs";
import { expectedBiasDate, generate } from "./src/generate.mjs";
import { notify } from "./src/notify.mjs";

const [command = "run", ...rest] = process.argv.slice(2);
const inputIdx = rest.indexOf("--input");
const input = inputIdx >= 0 ? rest[inputIdx + 1] : undefined;

async function main() {
  if (command === "login") {
    const { login } = await import("./src/deliver.mjs");
    await login();
    return;
  }

  if (command !== "generate" && command !== "run") {
    console.error(`Onbekend commando '${command}'. Gebruik: login | generate | run`);
    process.exit(2);
  }

  let gen;
  try {
    gen = await generate({ input });
  } catch (err) {
    await notify(`⚠️ BFX Macro: data ophalen mislukt.\n${err.message}`);
    process.exit(1);
  }
  const biasDay = gen.biasDatum ? new Date(gen.biasDatum).toISOString().slice(0, 10) : null;
  const biasOld = !input && gen.biasDatum && gen.biasDatum < expectedBiasDate();
  const summary =
    `${gen.label} · ${gen.eventCount} events · BIAS 5.0 ${biasDay ? `van ${biasDay} (${gen.pairCount} paren)` : "ontbreekt"}` +
    (biasOld ? `\n⚠️ BIAS 5.0 is niet van vandaag; de indicator toont de waarden van ${biasDay}.` : "");
  console.log(`Pine-code gemaakt: ${gen.file}\n${summary}`);

  if (command === "generate") return;

  // BIAS_5.0 niet van vandaag: niets overschrijven, de chart houdt de laatste goede stand.
  if (biasOld || (!input && !gen.biasDatum)) {
    await notify(`⏸ BFX Macro niet bijgewerkt: BIAS_5.0 is niet van vandaag (${biasDay ?? "ontbreekt"}). De chart houdt de vorige stand.`);
    process.exit(0);
  }

  if (config.delivery === "manual") {
    await notify(`📈 BFX Macro klaar om te plakken\n${summary}`, { document: gen.file });
    return;
  }

  const { deliver } = await import("./src/deliver.mjs");
  const result = await deliver(gen.file);
  if (result.ok) {
    await notify(`✅ BFX Macro bijgewerkt in TradingView\n${summary}`, { photo: result.screenshot });
  } else {
    await notify(`⚠️ BFX Macro: automatisch bijwerken mislukt\n${result.message}\nPlak de bijlage handmatig in de Pine Editor.`, {
      photo: result.screenshot,
      document: gen.file,
    });
    process.exit(1);
  }
}

main();
