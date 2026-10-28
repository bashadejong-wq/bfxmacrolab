# Eindrapport STR_0.2 — modulaire Structure & Execution Engine (28-10-2026)

**Onderzoeksversie. Geen bewezen edge, geen forwardmeting, niet bevroren.** Niets gepusht, gemerged of gepubliceerd.
Productie, database, website, plugins/SKILLs en de LaunchAgent zijn niet aangeraakt.

---

## 1. Herstelpunt
- Git-tag **`herstel-str02-start-2810`** op `6da446f` (eind van de STR_0.1-F-controleronde, vóór elk 0.2-werk).
- Terugdraaien: `git reset --hard herstel-str02-start-2810` op de branch `research/structure-engine-0.1`.
- STR_0.1-F-template sha256 is ongewijzigd: `e1f5d32f1a6b4fdbbe823b2fe19cf5511d5cc3da14297dd212503f15cb09e277`. Dit wordt in `npm test` gecontroleerd.
- CBO_0.1-template is ongewijzigd: `6d9259d6…`.

## 2. Functiematrix
Zie `01-INVENTARIS-FUNCTIEMATRIX.md`. Daar staat per onderdeel: status, codeplaats, definitie, gewenst, origin/confirmed, repaint, TF, modus, filter, alert, test en wijziging.

## 3. Bestond al / ontbrak / gebouwd

| Bestond al (✅, alleen schakelaars toegevoegd) | Was onvolledig (◐ → afgemaakt) | Ontbrak (✕ → gebouwd) |
|---|---|---|
| Swing/internal/fractal, BoS, stages, HTF-structuur | CHoCH: telt niet meer impliciet mee; richting via `confDir` (stage ≥ 2) | **FVG** als eigen zonetype |
| OB-P, OB-F, OB-R, zone-lifecycle | Structuur-ID's en break-records per gebeurtenis (JSON) | **Failed breakout**, **acceptance** aan niveaus |
| Sweep, premium/EQ/discount | CBO-statemachine: **RETEST** + faal-/verloopreden + box-weergaveopties | **Displacement**, **ABSORPTION-PROXY** |
| Bias 5.0 per bar, events + blokkade | Zone-weergave per type en per status, gebruikte zones vervagen | **M/Q/Y open, PMH/PML, Asia / London OR / NY OR** (IANA-TZ) |
| Kaartmodi | Referentiestatussen (UNTOUCHED/TESTED/SWEPT/ACCEPTED/EXPIRED) | **Presets** (5), **TF-profielen**, **parameterhash** |
| | Poorten → **filtermotor** met gebruikerskeuze per filter | **Alerts per gebeurtenistype** + statusalerts (ARMED/CONFIRMED/invalidatie) |

## 4. Exacte definities
Zie `02-DEFINITIES-EN-INSTELLINGEN.md` §A1–A11 (confDir, break-record, failed breakout, acceptance, rejection, sweep, displacement, ABSORPTION-PROXY, FVG, referenties, CBO 0.2).

Aanvullingen uit de bouw:
- **Ruimte** (afstand tot de eerste ongeraakte referentie, in R) is pas meetbaar zodra er een stop is.
  - `?` houdt ARMED niet tegen, maar CONFIRMED wel.
  - `✕` houdt ook ARMED tegen.
- **ABSORPTION-PROXY-invalidatie:** als het niveau verdwijnt (gebroken) of wordt vervangen na ≥ `absMin` tests, telt dat als INVALID.
  - De structuurlaag markeert de break vóór deze stap. Daarom is het verdwijnen van het niveau het breaksignaal.
- **Stop:**
  - als CBO meetelt: de overkant van de actuele box ± 0,1 ATR;
  - anders: het tegenoverliggende bevestigde swingniveau ± 0,1 ATR.
- **Setup-sleutel:** één setup per box (CBO), of één per triggermoment (andere triggers).

## 5. Instellingenarchitectuur
- Per module zijn er drie schakelaars: **Tonen · Meetellen · Alert**. Zie `02-…` §B en de input-groepen ①–⑨ in de indicator.
- Filtermotor: 12 filters, elk met een soort:
  - **B** blokkeert: Bias, Events, HTF;
  - **F** voorwaarde: PD, Zone, CHoCH;
  - **R** ruimte;
  - **T** trigger: CBO, BoS, Sweep, Acceptance, ABS-PROXY.
- Regels:
  - Onbekend telt nooit als geslaagd.
  - Een filter dat meetelt maar niet zichtbaar is, staat op de kaart met `*`.
  - Zonder meetellende trigger komt de status nooit verder dan **ARMED**, met de tekst "geen trigger gekozen".
- Kaartsymbolen: ✓ geslaagd · ✕ mislukt · ~ bekend, laat door · ? ontbreekt · ○ alleen zichtbaar · – uit.

## 6. Presetmatrix
Zie `02-…` §C. In de presets CLEAN, INTRADAY, SWING en FULL RESEARCH tellen alleen Bias, Events, HTF, PD, Ruimte en CBO mee (getest).
Overrides bestaan alleen bij CUSTOM. Expanded toont dan het verschil met CLEAN, bijvoorbeeld "BoS T→TM · CBO TMA→TA".

## 7. Timeframeprofielen
Zie `02-…` §D.

| Chart-TF | Context-TF | Hash |
|---|---|---|
| 5/15m | 1H | eigen hash |
| 30m/1H | 4H | gedeelde hash (zelfde profiel) |
| 4H | D | eigen hash |
| D | W | eigen hash |

- HTF-waarden komen altijd uit `request.security(..., f()[1], lookahead_on)`, dus alleen van gesloten HTF-candles.

## 8. Prestatiecontrole
- **Runtime:** 25 cellen (5 presets × 15m/30m/1H/4H/D), 0 runtimefouten, geen "calculation takes too long". 14.000–23.700 bars geladen.
- **Compilatie** zonder fouten en zonder waarschuwingen. De waarschuwing over een voorwaardelijk aangeroepen daily-ATR is weggenomen: die wordt nu elke bar opgevraagd.
- **Objectlimieten:**
  - zones in geheugen maximaal 24 (afgeronde zones gaan eerst weg);
  - op de chart maximaal 2 zones (FULL RESEARCH 4);
  - referenties maximaal 3 (FULL RESEARCH 6);
  - 1 box;
  - lijnen/labels maximaal 10 per laag (`i_maxDraw`) binnen `max_*_count`;
  - 19 vaste referentieslots.
- **Lui rekenen:**
  - zones worden alleen gemaakt als ze getoond worden of als locatie meetellen;
  - het context-TF alleen als HTF meetelt of in Expanded;
  - de 4H/D-detailrijen alleen in Expanded;
  - de kaart alleen op de laatste bar;
  - tekenen alleen op de laatste bar.
- **Wel altijd gerekend:** structuur, sweeps, failed breakout, acceptance en ABSORPTION-PROXY. Dat zijn goedkope tellers op gesloten candles, en zo blijft de detectie gelijk over presets (aantoonbaar: dezelfde tellingen in elke preset).
- **Arrays:** geen onbegrensde arrays. Dit staat als test in `npm test`: elke `var`-array met push wordt begrensd of per bar geleegd. Datablok-arrays hebben een vaste omvang.

## 9. Testresultaten
- **`npm test`: 71/71 geslaagd**, waarvan 17 nieuwe 0.2-contracttests in `test/structure02-template.test.mjs`:
  - STR_0.1-hash;
  - presetmatrix;
  - hash dekt alle schakelaars en drempels;
  - filtermotor (10 scenario's);
  - richting d;
  - HTF `[1]`;
  - ABSORPTION-PROXY-label en invalidatie;
  - zones;
  - referenties en TZ;
  - kaartregels per modus;
  - alerts per type;
  - JSON-geldigheid;
  - arraygrenzen;
  - na-vergelijking.
- **Live, onderzoekslayout-kopie "BFX STR 0.2 Onderzoek"** (`kVrsdhKn`):
  - **Meetmatrix:** `meetmatrix-str02.md`.
  - **Samenspel / pariteit:** CBO-tellingen en swingbreaks zijn identiek aan STR_0.1 op 15m/30m/1H/4H. De nieuwe modules veranderen de bestaande detectie niet.
  - **Functioneel (CUSTOM, Expanded, EURUSD 30m):**

    | Test | Verwachting | Uitkomst |
    |---|---|---|
    | F1 geen trigger | trigger "(info)", hooguit ARMED, override zichtbaar | ✓ |
    | F2 BoS als trigger | Filters "BoS ?", stop = swing high, override "BoS T→TM" | ✓ |
    | F3 Bias niet meetellend | richting uit swing; Bias "○" | ✓ |
    | F4 PD verborgen maar meetellend | "PD* ✕" | ✓ |
    | F5 CHoCH tonen | CHoCH-labels zichtbaar, telt niet mee ("–") | ✓ |

  - **Herlaadcontrole:** `herlaadcontroles-str02.jsonl`.
    - 1e en 2e poging: VERSCHIL. Inputwijzigingen via de API maken de layout niet "vuil", dus TradingView bewaarde ze niet.
    - 3e poging: na een timeframewissel opgeslagen → **IDENTIEK**.
  - **STR_0.1-F-layout (DcotUC2P):** opnieuw geladen zonder opslaan → studies, zichtbaarheid, alle inputs en waarden **gelijk** aan de eindcontrole van 11:57. Alleen "Bars geladen" is +2 door nieuwe candles.
- **Fouten gevonden en hersteld tijdens het testen:**
  1. **Referenties werden nooit gezet.** `p != r.p` met een lege `r.p` is in Pine nooit waar. Daardoor waren alle referentielijnen leeg (PDH = ∅). Gefixt; nu PDH 1,11768, gelijk aan STR_0.1.
  2. **ABSORPTION-PROXY verliep nooit** (62 bevestigd / 0 ongeldig), door de volgorde van de stappen (zie §4). Gefixt; nu 234/273/215 verlopen/ongeldig tegenover 61–62 bevestigd.
  3. **Veldtoewijzing aan `refs.get(i).st`** compileerde niet. Opgelost via een tussenvariabele.
  4. **Ruimte `?` als wachtreden vóór er een box is.** Dat was ruis; ruimte is nu een eis voor CONFIRMED, niet voor ARMED.

## 10. Screenshots (zonder Data Window)
Map `docs/structure02/screenshots/`. Alle screenshots zijn op EURUSD 30m, ná de fixes.
- `P-{CLEAN,INTRADAY,SWING,FULL_RESEARCH,CUSTOM}-{Minimal,Compact,Expanded}.png`: 15 stuks, elke preset in elke modus.
- `F1…F5-*.png`: de functionele tests.

## 11. Bekende beperkingen
- **FULL RESEARCH** is druk: veel labels, en in de rechterrail overlappen labels soms (bijvoorbeeld "D Open" en "PDL"). Dat is bedoeld als onderzoeksweergave, niet als handelsweergave.
- **CBO bestaat niet op D.** Met CBO als trigger meetellend geeft D de status **N.V.T.** met de tekst "kies CUSTOM zonder CBO-trigger".
- **Donker thema is niet live getest in 0.2.** Wisselen zou de accountinstelling van Bas veranderen. De kleurlogica is dezelfde als in 0.1, waar die wel getest is.
- **De hash bevat bewust geen paar, timeframe of feed.** Die zijn aparte sleutels.
  - Het is een 31-bits vingerafdruk, geen cryptografische hash. Botsingen zijn theoretisch mogelijk.
- **Ongebruikte 0.1-inputs zijn blijven staan** (`i_alert`, `i_cbo`, `g_needSweep`). Ze hebben in 0.2 geen effect. Verwijderen zou de input-ID's verschuiven.
- **Statusalerts en gebeurtenisalerts zijn alleen als JSON getest.** Er is geen alert aangemaakt in TradingView.
- **Zones:** de cap van 24 wordt op alle TF's bereikt. Oudere afgeronde zones worden verwijderd. Dat is bedoeld, maar historische zone-entries van verwijderde zones bestaan niet meer.
- **Inputwijzigingen via de API** worden alleen bewaard als de layout om een andere reden "vuil" is. Dit geldt voor testautomatisering, niet voor Bas in de UI.

## 12. Onbewezen aannames
- Alle drempels zijn **HYPOTHESE**: fbBars 3, accK 2/0,5 ATR, displacement 1,5 ATR/70%, ABSORPTION-PROXY 0,1/20/3/0,5/1,0/10, FVG 0,2 ATR, refTol 0,1, chAge 24, retest 8/0,25.
- ABSORPTION-PROXY is een prijspatroon. Of het iets zegt over echte absorptie is **niet** onderzocht en kan met deze data ook niet onderzocht worden (geen orderflow).
- De strikte uitleg van regel 4 is een keuze: **alle** meetellende triggers moeten ✓ zijn binnen `g_trigAge` (3) bars, niet "één van de triggers". Zie besluit 3.
- De sessietijden (Asia 09–15 Tokio, London OR 08–09, NY OR 08–09) zijn conventies.
- Of presets onderling of met STR_0.1-F vergelijkbaar zijn, is niet aangetoond. Ze worden nooit samengevoegd.

## 13. Wijzigingen per bestand

| Bestand | Wijziging |
|---|---|
| `template/bfx_structure_engine_02.pine` | nieuw (2.082 regels): volledige 0.2-indicator |
| `src/structure-generate.mjs` | `STRUCTURE_TEMPLATE_02`, `--v02`, template als parameter |
| `test/structure02-template.test.mjs` | nieuw: 17 contracttests |
| `package.json` | 0.2-tests in `npm test` |
| `docs/structure02/01-…`, `02-…` | inventaris/matrix, definities/instellingen/presets/profielen (vóór de bouw) |
| `docs/structure02/03-EINDRAPPORT-STR02.md`, `meetmatrix-str02(.md/-ruw.txt)`, `herlaadcontroles-str02.jsonl`, `screenshots/` | bewijs |
| `template/bfx_structure_engine.pine` (STR_0.1-F) | **niet gewijzigd** |

## 14. Lokale commits (niet gepusht)
- `b057f13` inventaris en definities (vóór de bouw)
- `6b6d6c4` filtermotor, kaart, alerts, datavenster, tests
- `eaa095e` tests in `npm test`
- `dd2ef8f` fixes uit de live test
- de commit van dit rapport

GitHub staat nog op `240acfb` (`research/structure-engine-0.1`).

## 15. Bewijs: productie, database, website, `main` en LaunchAgent onaangeroerd (28-10, ±12:45)

| Onderdeel | Controle |
|---|---|
| Productiecode `bfxmacrolab-tradingview` | `ea1318a`, 0 gewijzigde bestanden (gelijk aan de nulmeting) |
| Productielayout "BFX Automatisering" (6b31RP4L) | niet geopend |
| Layout "😍Bas" (NlsYkVmV) | niet geopend |
| STR_0.1-F-layout DcotUC2P | niet gewijzigd (herlaadvergelijking §9); alleen als bron gebruikt voor "Make a copy" |
| Database | in deze opdracht geen enkele query |
| Website / Hercules / plugins / SKILLs | niet aangeraakt |
| GitHub | `main` `e2eb741`, `research/cbo-engine-0.1` `8b1e0ca`, `research/structure-engine-0.1` `240acfb`: niets gepusht |
| LaunchAgent | `nl.bfx.tradingview-overlay` en `nl.bfx.tradingview-structure` niet geladen |

- Bij de LaunchAgent-controle stond `nl.bfx.login-wachter` wel geladen. Die staat los van deze opdracht en is niet door mij aangeraakt.
- De TradingView-desktopapp was dicht. Het Playwright-profiel draaide zichtbaar (niet headless) en is na afloop afgesloten.

## 16. Wat is er nieuw in TradingView
- **Nieuw script "BFX Structure Engine 0.2"**, privé en niet gepubliceerd.
- **Nieuwe layout "BFX STR 0.2 Onderzoek"** (`kVrsdhKn`), een kopie van de onderzoekslayout:
  - STR 0.2 zichtbaar (CLEAN, Compact, linksboven, vóór de candles);
  - STR 0.1, CBO 0.1 en Macro verborgen.

## 17. Forward
- STR_0.2 heeft **geen** forwardstart. De kaart, de alerts en `fwdFrozen = false` zeggen allemaal "niet bevroren — geen meting".
- STR_0.1-F en CBO_0.1-F lopen ongewijzigd door onder hun eigen versienaam.

## 18. Besluiten die toestemming van Bas vragen
1. **Pushen** van de lokale commits naar `research/structure-engine-0.1`.
2. **Layout "BFX STR 0.2 Onderzoek" (kVrsdhKn) en het script** laten staan of verwijderen.
3. **Triggerregel:** moeten alle meetellende triggers samen ✓ zijn (nu zo), of is één trigger genoeg?
4. **Forwardmeting STR_0.2:** welke preset, welke hash, welk paar en TF, en welk startmoment. Dat wordt dan een nieuwe bevroren versie (bv. STR_0.2-F-CLEAN).
5. **Alerts aanmaken** in TradingView, voor statussen en/of gebeurtenistypen.
6. **CBO op D:** toestaan (nieuwe regels, nieuwe versie) of D alleen met andere triggers.
7. **Opruimen van ongebruikte 0.1-inputs** in een volgende versie. Dit verschuift de input-ID's.
8. **Donker-thema-test:** mag ik daarvoor tijdelijk het accountthema wisselen?
