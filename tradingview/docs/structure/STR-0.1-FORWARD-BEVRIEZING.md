# STR_0.1-F — forwardbevriezing BFX Structure Engine 0.1

**Besluit Bas (28-10-2026):** "Bevriezen + forward". Er komt nog geen databaselogboek, net als bij CBO_0.1-F.

| | |
|---|---|
| Versie | `STR_0.1-F` |
| Start | **2026-10-29 00:00 UTC** (01:00 Amsterdam) |
| Template | `template/bfx_structure_engine.pine` · sha256 `490257b297359e83fc9b070fc3a442fe9f8bb3c559b2c18d833831747afcfc55` |
| Branch | `research/structure-engine-0.1` (niet gemerged) |
| Layout | onderzoekslayout "BFX CBO Onderzoek" (DcotUC2P), niet productie |
| CBO_0.1-template | ongewijzigd, sha256 `6d9259d6…` |

## Bevroren parameters (standaardwaarden)

- **Structuur:** `h_lenS 10 · h_lenI 5 · h_lenF 2 · h_atrLen 14 · h_buf 0.05 · h_body false · h_swWick 0.3`
- **Zones:** `h_mit 50 · h_zAge 300 · h_zMaxH 1.5 · h_fvgLook 20`
- **CBO-module:** `c_volLen 20 · c_volPct 250 · c_lowVol 15 · c_highVol 85 · c_compVol 40 · c_erLen 20 · c_erTrend 0.35 · c_erChaos 0.12 · c_expMult 2.0 · c_nMin 8 · c_nMax 24 · c_wMax 1.25 · c_tol 0.15 · c_tMin 2 · c_nSeal 3 · c_expiry 2.0 · c_body 0.5 · c_accK 2`
- **Events:** `e_preCB 60 · e_postCB 120 · e_pre 30 · e_post 60 · e_disc 180`
- **Poorten:** `g_trigAge 3 · g_minRoom 1.0 · g_stopBuf 0.1 · g_swAge 24 · g_needSweep false · g_tMax 32` en `i_cbo true`
- **Macro:** BIAS_5.0, drempel ±15 op de paarindex van die bar. De bias van dag D geldt vanaf 06:00 UTC en is maximaal 96 uur geldig.

## Bewaking

- In de indicator zelf staat `fwdFrozen`. Wijkt één parameter af, dan toont de kaart **"ONGELDIG — parameters wijken af van STR_0.1"** en telt de meting niet mee.
  Getest op 28-10: swingpivot 10 → 11 gaf ONGELDIG (screenshot 09); terug naar 10 gaf weer bevroren (screenshot 08).
- `npm test` faalt als een standaardwaarde verandert zonder dat `fwdFrozen` meegaat, of als `FWD_START` verandert.

## Wat telt

- Box verzegeld én CONFIRMED-candle gesloten **ná** de start, met de bevroren parameters.
- Uitkomst in bruto R, alleen op prijs:
  - **FAILED** = −1;
  - **DOEL** = afstand doel / risico;
  - **EXPIRED** = R op de close na 32 bars.
- Op de kaart staat de regel FORWARD, en in de Data Window staan `Fwd n`, `Fwd hit %`, `Fwd gem R` en `Fwd open`.

## Wat nodig is om de meting te laten lopen

1. **Dagelijks een nieuw datablok.** `node src/structure-generate.mjs` en het script opnieuw in de onderzoekslayout zetten.
   Daarna **de layout opslaan**. Doe je dat niet, dan laadt de layout bij openen de vorige scriptversie (gezien op 28-10).
   Zonder nieuwe data wordt de bias na 96 uur UNKNOWN en ontstaan er geen setups meer.
   Dit automatiseren (een taak die TradingView opent) is een besluit van Bas, vanwege de regel van één sessie per account.
2. Op een TF met de poorten actief (15m, 30m, 1H, 4H) en op de majors.
   De indicator staat in de layout op EURUSD 30m. De telling geldt per paar en per TF, opnieuw berekend bij het openen.

## Grenzen

- Geen databaselogboek. Een correctie van de feed of van een forward-biasrij achteraf is niet te reconstrueren.
- n blijft lang klein, want een verzegelde box is zeldzaam (±5 per 22.000 bars op EURUSD 30m).
  **Serieus kijken na 8 weken, conclusies pas na 3 maanden.**
- Elke aanpassing van een regel of drempel wordt `STR_0.2-F` met een nieuwe start; de tellingen worden nooit gemengd.
