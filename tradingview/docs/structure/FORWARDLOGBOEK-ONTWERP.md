# Append-only forwardlogboek STR_0.1-F — ontwerp

**Status:** het lokale alternatief is gebouwd en getest. De databasevariant is alleen een **voorstel** (`voorstel-str-forward-log.sql`) en is niet uitgevoerd.
Een Pine-teller alleen is onvoldoende, want die rekent bij elk herladen opnieuw uit de koershistorie.
Het logboek legt elke setup vast **op het moment dat hij ontstaat**, en de uitkomst apart.

## Velden (per setup, in het alertbericht `BFX_EXEC_0.1` → `setup`)

| Gevraagd | Veld |
|---|---|
| versie en codehash | `forward.versie` (STR_0.1-F), `forward.template_sha256` (door de generator in de code gezet) |
| snapshot-ID | `snapshot_id` (ENG_GENERATED), `datablok` |
| symbool en provider | `symbol` (bv. FX:EURUSD), `feed` (FX = FXCM) |
| timeframe | `timeframe` |
| box-, zone-, sweep- en structuur-ID | `setup.box_id`, `setup.zone_id`, `setup.sweep_id`, `setup.structuur_id` (vastgelegd bij ontstaan) |
| Bias-versie, waarde en available_at | `setup.bias.versie`, `setup.bias.waarde`, `setup.bias.available_at` (= geldig-vanaf: max(D 06:00 UTC, eerst gezien)) |
| entry, stop, doel en expiry | `setup.entry`, `setup.stop`, `setup.doel` (+ `doel_naam`), `setup.expiry` (bevestiging + 32 bars) |
| eventstatus | `event` (vrij/blok/onbekend) |
| setupstatus | `status`, `vorige_status` |
| timestamp van bevestiging | `setup.bevestigd_op` |
| uiteindelijke uitkomst | `setup.uitkomst` (FAILED/DOEL/EXPIRED), `setup.r_bruto`, `mfe_r`, `mae_r` |
| providercorrectie | logregel `correctie` (oud → nieuw); nooit een vervanging |

Kandidaten voor alle varianten gaan via `BFX_KAND_0.1`: het type, de richting en het variantmasker,
plus de afgeronde gestandaardiseerde metingen met R, MFE, MAE en risico.

## Proces

1. **Bron:** TradingView-alert op "BFX Structure Engine 0.1" met *Any alert() function call*. Bas maakt die alert aan; ik doe dat niet.
2. **Transport**, twee mogelijkheden:
   - **(a) voorstel:** een webhook naar een Supabase Edge Function met een eigen geheim, die schrijft in `bfx_lab.str_forward_log` (append-only trigger). Daarvoor is toestemming nodig voor de DB, de Edge Function en de webhook-URL.
   - **(b) lokaal, nu bruikbaar:** het alertlog van TradingView exporteren of kopiëren, en `node src/forward-log.mjs ingest <bestand>` draaien.
3. **Opslag:** elke regel krijgt `seq`, `recorded_at`, `prev` en `hash`. Er wordt nooit herschreven.
   - `verify` controleert de keten.
   - Dubbele berichten worden genegeerd (idempotent).
   - Een afwijkende latere uitkomst wordt een `correctie`.
4. **Providercorrectie:** `reconcile(setup_id, bars)` herberekent met (gecorrigeerde) koersdata, met dezelfde regels als de indicator. Een verschil wordt een `correctie`.
5. **Evaluatie:** `node src/forward-log.mjs report` (zie `VARIANTEN-EN-EVALUATIE-VOORAF.md`).

## Lokaal getest (`test/forward-log.test.mjs`)

- Hashketen; aangepaste regel 1 → `gebroken_bij: 1`.
- Idempotente verwerking; de uitkomst wordt één keer vastgelegd; een afwijkende uitkomst wordt een correctie en de oorspronkelijke blijft staan.
- Providercorrectie-simulatie: dezelfde koersen → geen correctie; een gecorrigeerde piek → `DOEL → FAILED` als correctie.
- Evaluatie: 28 cellen, geen totaal, netto na de spread-aanname, en minima die vooraf vastliggen.

## Beperkingen

- Bij route (b) is `recorded_at` het moment van verwerken, niet van ontvangst. Het bewijs dat iets vóór de uitkomst is vastgelegd, is dan zwakker.
  Route (a) legt het ontvangstmoment in de database vast.
- Zonder een alert in TradingView ontstaan er geen berichten. De Pine-teller blijft dan de enige (zwakkere) bron.
