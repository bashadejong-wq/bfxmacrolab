// Datablok voor de BFX Structure Engine 0.1 (aparte indicator, onderzoek).
// Zelfde BFX-snapshot en datablok als de CBO-engine (alleen lezen); schrijft out/bfx_structure_engine.pine.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config.mjs";
import { buildEngine } from "./engine-generate.mjs";
import { loadFromSupabase } from "./generate.mjs";

export const STRUCTURE_TEMPLATE = "template/bfx_structure_engine.pine";
export const buildStructure = (data) => buildEngine(data, STRUCTURE_TEMPLATE);

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildStructure(await loadFromSupabase(Date.now()));
  mkdirSync(config.outDir, { recursive: true });
  const file = resolve(config.outDir, "bfx_structure_engine.pine");
  writeFileSync(file, out.code);
  console.log(`Structure-Pine: ${file} · ${out.pairs} paren · ${out.events} high-impact events · hash ${out.hash.slice(0, 12)} · ${out.code.length} bytes`);
}
