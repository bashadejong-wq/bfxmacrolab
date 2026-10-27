# Wijzigingslog TradingView-indicator, 27-10-2026

Akkoord Bas: B1 t/m B6 en I1 t/m I6 uit de audit van 27-10.

## Herstelpunt
- Git-tag `herstel-tv-2026-10-27-v13` op commit 8725eef.
- Kopie van de Pine-code die in TradingView staat (script versie 13): `herstel/bfx_macro_overlay.v13.pine` (niet in git).
- Kopie van `.env`: `herstel/env.v13` (niet in git).
- Terugzetten: `git checkout herstel-tv-2026-10-27-v13 -- tradingview/` en de v13-code in de Pine Editor plakken.

## Wijzigingen

### B1 — versheid via Europe/Amsterdam
- `src/generate.mjs` `expectedBiasDate` en Pine `expectedBiasDay`: vaste aftrek van 4,5 uur vervangen door de Amsterdamse kloktijd (vóór 05:30 NL = vorige dag, weekend terug naar vrijdag).
- Reden: in de zomer gold om 05:45 NL de data van gisteren als vers.
- Getest: 6 gevallen (zomer/winter, vóór/na 05:30, zaterdag, DST-nacht): alle OK.

### B2 — eerlijke strategiestatus
- Pine `stratStatus`: alleen bevestigd (✓), in opbouw, tegengesteld (✗), geen trade, "nog niet te beoordelen: geen verzegelde strategiestand", data ontbreekt. Nooit ✓ zonder 'bevestigd'.
- Oude checklistregel "✗ strategie bevestigd" vervangen door de regel "Strategie".

### Kaart volgens ontwerp (laag 1–5)
- Laag 1: paar + richting/"geen actieve richting", paarindex + label, versie, datum, actueel/verouderd, één zin uitleg.
- Laag 2: drie controles: Strategie, Eventrisico ≤24u, Beweging (σ + emmer + betekenis).
- De regels per valuta en de eventlijst blijven staan; de eventlijst toont standaard 4 in plaats van 8 rijen (instelbaar tot 20).

### I1 — volgende katalysator
- Eerstvolgend medium/high-event voor basis of quote: tijd (Europe/Amsterdam), valuta, naam, impact, centrale bank ja/nee, consensus/vorige, surprise (alleen met actual), eerste zin van de duiding.
- BFX-verwachting: niet getoond; er is geen bron die aantoonbaar vooraf is vastgelegd.

### I2 — vier scenario's
- Van het eerstvolgende high-event met scenario's: ↑ hoger / ↓ lager (`mirror_agenda_events_site`), = in lijn / ± gemengd (`mirror_event_paden`). Leeg = "ontbreekt" (mirror_event_paden heeft nu 0 rijen voor de komende 14 dagen).
- Alleen voor high-events binnen 10 dagen meegenomen (Pine-tokenlimiet), tekst 150 tekens, volledig in tooltip.

### I3 — invalidatie
- Uit `mirror_outlook_paar`, nieuwste periode per paar (nu 8 paren); anders "ontbreekt voor dit paar". Tooltip met katalysator, horizon en periode.

### I4 — versheid per bron
- Regel "Versheid": BIAS actueel/verouderd, agenda (cache_ververst_op), strategie (geen verzegelde stand / ontbreekt / actueel), consensus (laatste ramingsdatum). Ontbreekt ≠ neutraal.

### I5 — eventrisicozones
- High impact standaard 30 min vóór / 60 min na; centralebankmomenten 60/120 (instelbaar); medium optioneel; zones uit te zetten.
- Tekst: "Eventrisico — geen nieuwe positie zonder herbeoordeling".

### I6 — website en consensus
- Regel "Volledige analyse: <SITE_URL>/divergence/<PAAR>" (SITE_URL in .env, standaard de Hercules-kopie).
- Consensuslabel: "Bankenconsensus — externe context, geen BFX-signaal".

### Tokenruimte
- Historie 130 → 100 datums, eventduiding 350 → 220 tekens.

## Uitvoeringsronde (volledige opdracht Bas)
- Herstelpunt gecontroleerd: tag herstel-tv-2026-10-27-v13 en herstel/ aanwezig.
- Lokale wijzigingen veiliggesteld op lokale branch wip/tv-b-i-2026-10-27.
- LaunchAgent nl.bfx.tradingview-overlay tijdelijk uitgeladen (27-10 20:10); wordt pas na geslaagde e2e-test opnieuw geladen.

## Definitieve stand (uitvoeringsronde)
- Beslisregels in `src/logic.mjs` (testbaar): versheid (Europe/Amsterdam, 05:30-marge), BIAS-validatie (8 valuta's, 28 paren, één datum/versie), strategiestatus, invalidatie, consensus, preflight, opslagcontrole.
- B2: strategietekst komt uit de generator; nu letterlijk "Strategie: nog niet te beoordelen — geen verzegelde strategiestand." (geen ✓).
- B3: preflight vóór iedere editoractie (sessiecookie, geen gast, geen loginpagina, geen Chart Not Found, layout-id in URL, exacte layoutnaam); nooit headless.
- B4: layout `BFX Automatisering` (id in `.env`), geen terugval op `/chart/`; verwijzing naar de handmatige layout uit `.env` gehaald.
- B5: `logs/runs.jsonl`, exitcodes 0–6.
- Aflevering: na opslaan bewijs via snapshot-id in de legenda; bij een losgekoppelde instantie: oude BFX-instanties op de BFX-layout verwijderen en de nieuwe toevoegen; layout expliciet opslaan ("All changes saved").
- I3 aangescherpt: alleen de daily-invalidatie met periode = BIAS-datum; anders de letterlijke ontbreekt-tekst.
- I6: geen URL in de kaart, alleen "Volledige analyse: BFX Macro Lab → EUR/USD"; consensuslabel "Externe bankencontext — geen BFX-signaal.".
- Oude primaire eventlijst: standaard uit (instelbaar), events in tooltip van "Volgende toets"; regels per valuta optioneel.
