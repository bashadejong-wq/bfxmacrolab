# Huidige stand — audit (read-only, 27-10-2026 ±22:40 NL)

Gecontroleerd zonder iets te wijzigen. Bewijs = bestand/regel in de **niet-gecommitte werkmap** van
`bfxmacrolab-tradingview` (branch `claude/tradingview-macro-overlay`, laatste commit `ea1318a`).

## 0. Wat er nu staat (exact)

| Onderdeel | Stand |
|---|---|
| Git | 3 bestanden gewijzigd, **niet gecommit**: `template/bfx_macro_overlay.pine` (+445/−257 regels), `src/deliver.mjs` (28 regels), `bfx-tv.mjs` (1 regel). Herstelpunt: tag `herstel-tv-redesign-voor` (= `ea1318a`). |
| TradingView BFX-layout (`6b31RP4L`) | Script-versie van run `202610272129` (Fase 1-ontwerp, spacer 3, oude muiswiel-scroll) staat erop; 1 instantie. Daarna hebben de testmatrix-scripts de layout-zoom/symbool aangeraakt (laatste toestand EURUSD 4h, Compact, watchlist open). Chart is sterk ingezoomd (staafbreedte) door eerdere muiswielacties. |
| Laatste runs | 21:29 `run ok` (snapshot …2129); 21:35 `run stop 5` — "marker ontbreekt": nieuwe scrollmethode (JS-wheel op editor) vond regel 1 niet; **niets overschreven**. |
| LaunchAgent | **Geladen**, runs = 1, last exit 0. Volgende start **wo 28-10 05:45** met de **huidige werkmap** (incl. niet-goedgekeurde wijzigingen). Verwacht gedrag: waarschijnlijk opnieuw veilige stop (exit 5); bij succes zou het Fase 1-ontwerp worden afgeleverd. Niet aangepast (geen toestemming). |
| Bas' eigen layout `NlsYkVmV` | Niet aangeraakt in deze ronde. |
| Database/website | Niet gewijzigd. |

## A. Feitentabel

| # | Controle | Gepland | Aanwezig | Bewijs | Oordeel | Risico / vervolg |
|---|---|---|---|---|---|---|
| 1 | Fase 1 uitgevoerd? | Compact/Uitgebreid/Minimal, rustige kaart, 1 event, ≤3 refs | Ja, lokaal | template r.~600–760 | correct, **niet gecommit** | besluit nodig: committen of terugzetten |
| 2 | Gewijzigde bestanden | alleen template | template + `deliver.mjs` + `bfx-tv.mjs` | `git diff --stat` | **twijfelachtig**: deliver/bfx-tv zijn automatisering, geen presentatie (autoscale-herstel, `chartReset`, scrollmethode, logveld `autoschaal`) | apart beoordelen; scrollwijziging veroorzaakte exit 5 |
| 3 | Alleen presentatie in template? | ja | ja, plus feitelijke OHLC-referenties | r.294–378 | correct (refs zijn nieuwe berekening van prijsdata, geen model) | expliciet zo benoemen |
| 4 | Datablok gelijk? | identiek | identiek | structurele vergelijking voor/na: 214 regels, hash `ea3d1cd9ec0b` | correct | — |
| 5 | Overleeft regeneratie? | ja | ja | `generate.mjs:301` leest template; `:357` vervangt alleen `{{VERSION}}`/`{{DATA}}`; run 21:29 leverde template-ontwerp af | correct | — |
| 6 | Onbedoeld entry/score-gedrag? | nee | nee | statussen alleen uit bestaande velden (r.~620) | correct | status "MACRORICHTING ACTIEF" kan als entry gelezen worden → tooltip zegt "geen entry" |
| 7 | Auction refs feitelijk? | ja | ja: PDH/PDL/PWH/PWL/D-W-open/Asia/LDN IB/NY OR | r.296–360 | correct | provider-afhankelijk (providerdag) |
| 8 | Volume/POC/orderflow-claims? | geen | geen | grep: alleen "geen volume" in koppen | correct | — |
| 9 | NY-benaming | geen "IB" voor 08–17 | nu "NY opening range 08:00–09:00" | r.41, 325 | correct | — |
| 10 | Arbitraire heuristieken als waarheid? | geen | "0,25 ATR nabij" is verwijderd; wél: clustering 6 candles (r.476), eventhorizon 72u (r.32), risicovensters 30/60 en 60/120, lijnlengte 48/120 candles (r.396) | zie regels | **twijfelachtig**: presentatieparameters, niet als feit gepresenteerd, maar wel arbitrair | documenteren als instelbare weergave-keuze |
| 11 | Standaard te druk? | rustig | Compact: 7 regels + voetregel, 1 event, ≤3 lijnen | matrix-screenshots `out/redesign/` | grotendeels correct | paneel ±27% breed op 1440; legenda-overlap deels (spacer) |
| 12 | Modi verschillen? | ja | Minimal 4, Compact 6, Uitgebreid ±25 regels | screenshots `1440-eurusd-4h-{minimal,uitgebreid}.png` | correct | Uitgebreid bedekt ±45% hoogte (toegestaan) |
| 13 | Thema/symbolen/timeframes | licht/donker, meerdere paren, 5m–4h | licht+donker, EURUSD 30m/4h, USDJPY 30m, 1440/1920, watchlist aan/uit | `out/redesign/*.png` (14) | **gedeeltelijk**: 5m/15m/1h niet getest; screenshots tonen sterk ingezoomde layout (zoomprobleem), visuele beoordeling daardoor beperkt | herhalen na zoomherstel |
| 14 | Lijnen op echte periodestart? | ja | **nee**: lijnen beginnen op `bar_index − 48/120`, niet op dag/week-start | r.396 | **ontbrekend/onjuist** | vervangen door start van de periode (`time("D")`/`time("W")`) |
| 15 | HTF non-repainting? | bevestigd | `high[1]`/`low[1]` + `lookahead_on` = correct patroon; `open` + `lookahead_on` voor lopende periode = bekend bij periodestart | r.296–301 | correct | dagindeling = providerdag (FXCM 17:00 NY) — documenteren |

## Overige vaststellingen
- Sessie-H/L (`sessHL`) heeft `vormend`/`afgerond`-status; historische waarden zijn per balk correct, maar sessiegrenzen moeten op candlegrenzen vallen (30m/1h ok; 4h niet zinvol → sessies alleen intraday ≤60m, zo gebouwd).
- De muiswiel-scroll in de oude aflevering kon de chart zoomen; de nieuwe JS-wheel faalt (exit 5). **Geen van beide is nu goed**; zie implementatieplan stap 0.
- Chart-zoom en een tijdelijk ongeldig symbool (`FXCM:EURUSD`) zijn door testscripts in de BFX-layout gezet; daarna is EURUSD 4h hersteld. Zoom niet.
