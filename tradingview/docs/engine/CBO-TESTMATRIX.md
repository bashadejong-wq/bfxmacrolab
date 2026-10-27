# CBO testmatrix

## Varianten (vooraf vast — niet uitbreiden zonder nieuwe versie)
| ID | Trigger | Bevestiging |
|---|---|---|
| V1 | breakout-close (body buiten box, close-location ≥ H) | direct |
| V2 | V1 + eerste retest binnen r_max bars | close terug in richting |
| V3 | V1 + k closes buiten box | geen close terug in box |

## Parameters (hypothesen; per stuk max. 3 waarden → geen onbeperkte grid)
| H | Betekenis | Waarden |
|---|---|---|
| n_min | min. boxduur (bars) | 8, 12, 16 |
| H_w | max. boxbreedte | 1,0 / 1,25 / 1,5 × ATR(14, trigger) |
| n_seal | bars zonder nieuwe extreem | 2, 3 |
| r_max (V2) | max. bars tot retest | 4, 8 |
| k (V3) | closes buiten box | 2, 3 |
| chase | max. breakoutbar-range | 1,5 / 2,0 × boxbreedte |
| ruimte | min. ruimte tot tegengestelde referentie | 1,0 / 1,5 R |
Totaal ±3·3·2·(2+2)·2·2 = 288 combinaties per profiel — **alle** rapporteren; selecteren op stabiliteit (buurtgemiddelde), niet op top-1.

## Dimensies
Paren (11) × profiel (2) × sessie (Asia/London/NY/overlap) × regime (5 handelbaar) × variant (3) × richting (long/short).

## Functionele tests (Pine, zonder markt)
- State-overgangen op synthetische reeksen (box vormt → seal → breakout → retest/mislukt/verlopen)
- Reload-identiek: zelfde box-ID's en states na herladen (vergelijk alert-log met historische herberekening)
- Geen gebruik van `timenow` in regels; geen niet-bevestigde HTF-waarden
- Synthetische charts → engine uit + waarschuwing
- Event-blok: box vervalt bij start pre-venster

## Visuele tests (presentatie)
5m/15m/30m/1h/4h · EURUSD/USDJPY/GBPJPY · licht/donker · 1440×900/1920×1080 · watchlist aan/uit · Minimal/Compact/Expanded.

---

## Resultaten nachtronde 27/28-10-2026

Omgeving: TradingView-layout **BFX CBO Onderzoek** (DcotUC2P), feed FXCM (`FX:`), script *BFX CBO Research Engine 0.1* (eigen script, los van *BFX Macro Overlay*). Productielayout BFX Automatisering (6b31RP4L) niet gewijzigd.

### Compile en runtime

| Test | Resultaat |
|---|---|
| Compile in TradingView | **geslaagd** na 2 fixes (lokale functie in lokaal bereik → globaal; `ta.lowest` uit lokaal bereik gehaald). Geen waarschuwingen. |
| Runtimefouten op chart | geen, in alle combinaties hieronder (legenda zonder foutmarkering, tabel getekend) |
| Reload | layout herladen → EURUSD 30m, 1× CBO-engine, 1× Compass, nieuwste scriptversie (datavenster-plots aanwezig) |
| Reload-identiek (aggregaat) | EURUSD 30m vóór/na herladen gelijk: 64 kandidaten, 5 verzegeld, V1 n=5 |
| Browservrije tests (`npm test`) | 28/28 (22 bestaand + 6 nieuw voor engine-generate) |

### Paren × timeframes (runtime + meting)

7 majors × 15m/30m/1H/4H = 28 combinaties: alle zonder runtimefout. Meetwaarden: CBO-RETRO-METING-0.1.md.
Extra visueel: 5m (executionlaag-melding), D (contextlaag-melding).

### Toestanden en weergave

| Geval | Verwacht | Gezien | Screenshot |
|---|---|---|---|
| 30m Intraday | engine aan, trigger 30 | ✔ | 01, 02 |
| 5m | "5 = executionlaag; primaire bevestiging komt van 30" | ✔ | 06 |
| D | contextlaag, geen detectie | ✔ (na fix: geen post-event-regime meer op D) | 07 |
| Profiel Swing op 30m | "chart-TF past niet bij profiel Swing" | ✔ | 08 |
| 1H Auto | Swing · ctx D · structuur 240 · trigger 60 | ✔ | — |
| Heikin Ashi | "UIT — synthetische chart" | ✔ | 04 |
| Donkere achtergrond | lichte tekst, donker paneel | ✔ | 03 |
| Minimal | 3 regels (macro, CBO, event) | ✔ | 05 |
| Expanded | onderzoeksregels, tellingen, V1/V2/V3 apart | ✔ | 02 |
| Macro neutraal | "MACRO NIET HANDELBAAR" | ✔ (alle paren neutraal op 27-10) | 01 |
| Kosten | "KOSTEN ONBEKEND" / "netto kosten onbekend" | ✔ | 01, 02 |
| Event | "vrij · USD FOMC … over 20u"; dekking nooit als bewezen | ✔ (`CAL_COVERAGE_PROVEN = false`) | 01 |

### Niet getest (open)

- **BEVESTIGD / ACTIEF / RETEST live** in beeld: kwamen in de huidige bars niet voor; alleen historisch geteld.
- **GOEDE BREAKOUT — GEEN HANDELBARE RUIMTE** en **EVENT BLOCK** live: niet voorgekomen tijdens de test.
- **Macro handelbaar** (|index| ≥ 15): op 27-10 had geen major-paar dat; niet zichtbaar te maken zonder data te verzinnen.
- Synthetische state-overgangen (zonder markt): Pine heeft geen testharnas; niet gebouwd.
- 11 paren uit het meetcontract: alleen de 7 USD-majors getest.
- Schermmaten 1440/1920 en watchlist aan/uit: alleen 1600×1000 getest.
- Historische boxen in Expanded: aangemaakt in code, visueel niet bevestigd (zeldzaam; buiten beeld).

## Traceerbaarheid

| Vereiste | Ontwerpdocument | Implementatiebestand | Test | Resultaat |
|---|---|---|---|---|
| Aparte indicator, productie onaangeroerd | BFX-EXECUTION-ENGINE-ARCHITECTUUR | template/bfx_cbo_engine.pine, src/engine-generate.mjs | layoutcheck 6b31RP4L + git ea1318a | ✔ |
| ONDERZOEKSVERSIE — GEEN BEWEZEN EDGE | CBO-PRESENTATIE-SPEC | pine regel 3, tabelrij | engine-generate.test #6, screenshot 01 | ✔ |
| Drempels = HYPOTHESE | CBO-RISICOS-EN-ANTI-OVERFITTING | input-groepen "HYPOTHESE-parameters" | test #6, instellingen | ✔ |
| Alleen bevestigde bars | CBO-STATE-MACHINE | `barstate.isconfirmed` op alle overgangen | codecontrole, reload-identiek | ✔ (aggregaat) |
| HTF zonder lookahead-lek | CBO-STATE-MACHINE | `htf()` = `expr[1]` + `lookahead_on` | codecontrole | ✔ |
| Alerts alleen op bar close | CBO-STATE-MACHINE | `alert.freq_once_per_bar_close` | test #6 | ✔ |
| Geen CFD-volume-niveaus | CBO-DATAVELDEN-EN-GAPS | geen `volume` in code | test #6 | ✔ |
| Geen orders/broker | BESLISNOTITIE | geen `strategy.*` | test #6 | ✔ |
| Kalender nooit "geen events" | CBO-DATAVELDEN-EN-GAPS | `CAL_COVERAGE_PROVEN = false` | test #2, screenshot 01 | ✔ |
| Alleen high-impact events, dedup | CBO-DATAVELDEN-EN-GAPS | engine-generate.mjs | test #3 | ✔ |
| Invalidatie uit BIAS-dag | CBO-DATAVELDEN-EN-GAPS | `pickInvalidation` (productie-logica, alleen gelezen) | test #5 | ✔ |
| 5m = executionlaag | CBO-PRESENTATIE-SPEC | rolbepaling module 3 | screenshot 06 | ✔ |
| Synthetische chart → uit | CBO-0.1-MEETCONTRACT | `chart.is_heikinashi` e.a. | screenshot 04 | ✔ |
| Thema automatisch | CBO-PRESENTATIE-SPEC | `chart.bg_color` | screenshot 03 | ✔ |
| V1/V2/V3 apart gemeten | CBO-TESTMATRIX | per-variant arrays + datavenster | meting 28 combinaties | ✔ |
| Kosten onbekend tenzij opgegeven | CBO-0.1-MEETCONTRACT | `k_known=false` | screenshot 01/02 | ✔ (afwijking, zie hieronder) |
| Ontwikkel/validatie-splitsing | CBO-0.1-MEETCONTRACT | **niet geïmplementeerd** | — | ✖ zie CBO-RETRO-METING |
| Baselines 1, 3, 4, 5 | CBO-0.1-MEETCONTRACT | **niet geïmplementeerd** | — | ✖ open |
| Bar Magnifier | CBO-0.1-MEETCONTRACT | n.v.t. (indicator, geen strategy) → stop eerst binnen bar | codecontrole | ~ conservatieve vervanging |
| Kaart ≤ 25% breed, auto-Minimal < 1200 px | CBO-PRESENTATIE-SPEC | Pine kent geen schermbreedte | screenshot 01/02 | ✖ Compact ±35%, Expanded ±45% |
| Bias als voorwaarde voor GEEN CONTEXT → CONTEXT GELDIG | CBO-STATE-MACHINE | detectie draait ook zonder bias; bias bepaalt alleen "handelbaar" | screenshot 01 | ~ bewust: meet CBO zonder bias (baseline 2) |
