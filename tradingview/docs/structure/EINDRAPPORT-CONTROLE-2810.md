# Eindrapport controle STR_0.1-F — 28-10-2026

Opdracht: geen nieuwe functies; de huidige oplevering controleren en herstellen. Niets mergen, pushen of publiceren.
Niets wijzigen aan productie, de database of de website, en de automatische taak niet activeren.
**Geen edgeclaim.** De oplevering bewijst dat de programmaregels kloppen, nog niet dat het een betrouwbaar handelssysteem is.

Branch `research/structure-engine-0.1`, lokaal t/m de laatste commit van vandaag. **Niet gepusht**: GitHub staat nog op `240acfb`.
Template-sha256 bij de forwardstart: `e1f5d32f1a6b4fdbbe823b2fe19cf5511d5cc3da14297dd212503f15cb09e277`.

## 1. Wat aantoonbaar werkt (live in TradingView getest, 11:31–11:57)

| Test | Uitkomst | Bewijs |
|---|---|---|
| Compilatie (Pine v6) | zonder fouten, 6× in deze ronde | console "saved", geen error |
| Opslaan + verse herlaadcontrole **na elke test** | 10 van de 11 IDENTIEK; 1 VERSCHIL gevonden en opgelost (zie §5) | `herlaadcontroles-2810.jsonl` |
| Parameterwijziging | swingpivot 11 → "STR_0.1-F · ONGELDIG — parameters wijken af"; terug op 10 → bevroren | `11-parameter-ongeldig.png` |
| Verouderde data (bias > 96 u) | "GEEN RICHTING · UNKNOWN — wacht op actuele Bias 5.0 (forward-bias ouder dan 96 u …)" | `12-test-verouderde-bias.png` |
| Ontbrekende eventdekking | Event "dekking onbekend", poort "Event ?", geen CONFIRMED mogelijk | `13-test-geen-eventdekking.png` |
| Sessieconflict | met het profiel open: "TradingView-profiel is al open" → exit 8 (zou niets aanraken); eerder vandaag ook "desktopapp open (Bas)" | live uitgevoerd |
| Meetmatrix | 7 paren × 15m/30m/1H/4H = 28 cellen, 0 runtimefouten, per cel een eigen telling | `meetmatrix-2810.md` |
| CBO-module = CBO_0.1 | steekproef 6/6 gelijk (EURUSD, GBPUSD, USDJPY × 30m/1H); eerder vandaag 35/35 | — |
| Providervergelijking | structuur FXCM ≈ OANDA (±1–3%); **CBO wijkt sterk af** (GBPUSD 41 tegen 101 kandidaten) | zie §4 |
| Macro-tegenstrijdigheid | verklaard: dezelfde formule, andere snapshotdatum; in de layout staat nu alleen het geldige oordeel | `MACRO-WAARDEN-HERKOMST.md` |
| Eindtoestand | Compact, FX:EURUSD 30, pivot 10, Fwd geldig = 1, datablok 29.886.406, bias −16,13, WATCH | EINDCONTROLE IDENTIEK |

## 2. Wat alleen structureel getest is (`npm test` 54/54, geen browser)

- **Forwardlogboek:**
  - hashketen; aangepaste regel → gevonden;
  - idempotente verwerking;
  - afwijkende latere uitkomst → `correctie`, oorspronkelijke blijft staan.
- **Feedcorrectie-simulatie:** herberekening met een gecorrigeerde piek → `DOEL → FAILED` als correctie.
- **Evaluatie:** 28 cellen, geen totaal, netto na spread-aannames, minima vooraf vastgelegd.
- **Alert-JSON** (statuswissel, setupblok, kandidaten) is geldige JSON, ook met aanhalingstekens en `null`.
- **Dagelijkse taak:**
  - bias "gereed" alleen bij drie kloppende signalen;
  - wachten op een late bias;
  - sessiebewaking;
  - geen productie- of eigen layout in de code.
- **Bias per bar:** alleen forward-rijen; geldig vanaf max(06:00 UTC, eerst gezien); 96 uur.
- **Bevriezing:** elke standaardwaarde staat in `fwdFrozen`; startmoment vast.

## 3. Wat nog onbewezen is

- **Elke edge.** Er zijn 0 forwardsetups (de start is 29-10 00:00 UTC). Retrospectief zijn er geen bewijsbare STR-setups, omdat de bias pas sinds 27-10 forward bestaat.
- **Alerts in de praktijk.** De berichten zijn getest als JSON, maar er is nog geen alert aangemaakt in TradingView en geen enkel bericht echt ontvangen.
- **Het logboek in de praktijk.** Er is nog geen route van TradingView naar het logboek (webhook of export), want dat vraagt een besluit.
- **De dagelijkse taak live.** Alleen de droogtest is gedaan. Elke stap is vandaag wel met de hand uitgevoerd, maar nooit als één automatische run.
- **Netto-uitkomsten.** De spreads zijn aannames, geen brokerdata.
- **Vergelijkbaarheid van cellen.** Er wordt niets opgeteld tot dat is aangetoond.

## 4. Belangrijke bevindingen

1. **De macro-"tegenstrijdigheid" was een datumverschil**, geen formulefout.
   - Macropaneel −12,96 en CBO-kaart −13,0: bias van 27-10, snapshot 27-10 avond, "verouderd".
   - Structure −16,13: bias van 28-10, available_at 04:13 UTC, geldig sinds 06:00 UTC.
   - EURUSD ging tussen beide dagen over de drempel −15.
2. **CBO is gevoelig voor de feed.** OANDA geeft 1,4–2,5× zoveel CBO-kandidaten als FXCM. Een CBO-meting geldt dus alleen voor de feed waarop hij loopt (FX = FXCM).
   Resultaten mogen niet tussen brokers worden overgedragen.
3. **Een verborgen indicator rekent niet.** Met de CBO-kaart verborgen telt CBO_0.1-F op dat moment niet zichtbaar mee.
   Er gaat niets verloren: bij tonen rekent hij alles opnieuw uit de koershistorie. Voor een doorlopende CBO-meting is dus een eigen chart of een logboek nodig.
4. **Een nieuwe scriptversie zet de kaart achter de candles.** De oplossing is `bringToFront` en daarna de layout opslaan (getest: blijft bewaard). Die stap staat nu in de dagelijkse taak.
5. **Wijzigingen via de API aan de zichtbaarheid worden niet in de layout bewaard.** Via het legenda-oogje wel. Dit kwam uit de herlaadcontrole van T1.

## 5. Wat visueel is verbeterd

Voor/na: `07-modus-*.png` (fase 4) tegenover `14-eind-*.png`.

- **Minimal:** 3 regels: richting, status + reden, volgende actie. Het onderzoekslabel staat in de kopregel.
- **Compact:** 6 korte regels (kop met label · status + volgende stap · structuur · locatie · trigger · event).
  Poorten, forward en research zijn weg uit Compact.
- **Expanded:** het bewijs (poorten, ✓, ✕/?, bias-herkomst met available_at, invalidatie, zones, CBO, plan, structuur) en een apart blok
  "research (niet voor handelsbeslissingen)" met STR_0.1-F en V1–V6.
- **Geen candle-tekst meer:** "breakout-close" en "closes buiten de box" zijn nu "uitbraak" en "bevestiging buiten de box".
- **Chart:**
  - 1 box (alleen de actuele CBO-box, anders de vormende);
  - 2 zones in totaal (eerst 2 per richting);
  - 3 referenties;
  - labels voor CBO, EQ en de referenties in een vaste kolom rechts.
- **Onderzoekslayout:**
  - het macropaneel en de CBO-kaart zijn **verborgen** (niet verwijderd, terug te zetten met het oogje);
  - het macropaneel is ingeklapt tot 30 px;
  - de kaart staat linksboven onder de legenda, ondoorzichtig en vóór de candles.
- De screenshots zijn gemaakt zonder geopende Data Window.

## 6. Toestemming die nog van Bas nodig is

1. **Pushen** van de lokale commits van vandaag naar `research/structure-engine-0.1`.
2. **Dagelijkse taak activeren** (`voorstel-nl.bfx.tradingview-structure.plist`, werkdagen 06:05). Eventueel eerst één live proefrun.
3. **Alerts aanmaken** in TradingView ("Any alert() function call"), voor statuswissels en kandidaten.
   Ook: op welke charts? 28 cellen betekent 28 charts of alerts.
4. **Logboekroute:** (a) databasetabel + Edge Function + webhook (`voorstel-str-forward-log.sql`, niet uitgevoerd) of (b) lokaal via export/ingest.
5. **Brokerkosten:** echte spreads en slippage in plaats van de aannames.
6. **CBO_0.1-F doorlopend meten:** de CBO-indicator zichtbaar laten op een eigen chart, of via het logboek.
7. Of het macropaneel en de CBO-kaart in de **onderzoekslayout** verborgen mogen blijven. De **productielayout** is niet aangeraakt.

## 7. Bewijs dat productie, database, website en LaunchAgent onaangeraakt zijn

| Onderdeel | Controle (28-10, 11:58) |
|---|---|
| Productiecode | worktree `bfxmacrolab-tradingview` staat op `ea1318a`, 0 gewijzigde bestanden (gelijk aan de nulmeting) |
| Productielayout "BFX Automatisering" (6b31RP4L) | niet geopend; alle browserwerk alleen op DcotUC2P ("BFX CBO Onderzoek") |
| LaunchAgent | `nl.bfx.tradingview-overlay` niet geladen (alleen de plist aanwezig, zoals bij de nulmeting); geen `nl.bfx.tradingview-structure` geïnstalleerd |
| Database | alleen **SELECT**-query's (gereedheid, schrijftijden, historietellingen); geen DDL/DML; SQL-voorstel niet uitgevoerd |
| Website / Hercules | niet aangeraakt |
| GitHub | `main` `e2eb741`, `research/cbo-engine-0.1` `8b1e0ca`, `research/structure-engine-0.1` `240acfb` (niets gepusht) |
| CBO_0.1-template | sha256 `6d9259d6…` ongewijzigd |
