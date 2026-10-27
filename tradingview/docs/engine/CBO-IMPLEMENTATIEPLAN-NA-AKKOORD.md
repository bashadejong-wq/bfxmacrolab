# Implementatieplan (pas na akkoord, per stap)

| Stap | Wat | Raakt | Toestemming nodig |
|---|---|---|---|
| 0 | **Lopende toestand opruimen**: (a) LaunchAgent tijdelijk uitladen óf werkmap terug naar `ea1318a`; (b) muiswiel-/scrollprobleem in aflevering correct oplossen (scroll binnen editor-scroller testen); (c) lijnen laten starten op echte dag/week-start; (d) BFX-layout zoom resetten | tradingview/, LaunchAgent, BFX-layout | ja (a–d) |
| 1 | Fase 1 (Compass-redesign) afronden: visuele matrix incl. 5m/15m/1h, commit + push featurebranch | template, BFX-layout | ja |
| 2 | Engine-skelet als **aparte** indicator in een **onderzoekslayout** (niet de BFX-automatisering): states + box-ID, zonder kaartclaims | nieuw Pine-bestand | ja |
| 3 | Functionele tests (synthetische reeksen, reload-identiek) | test/ | ja |
| 4 | Retrospectieve meting CBO_0.1 op ontwikkelperiode (strategy-script met Bar Magnifier, kosten) — rapport met alle varianten + baselines | onderzoekslayout | ja |
| 5 | Bevriezen → één validatierun op onaangeraakte periode | — | ja |
| 6 | Forward-logging (alerts on bar close → webhook → aparte tabel) | database (nieuwe tabel) | **ja, apart** (databasewijziging) |
| 7 | Na ≥ 8 weken: besluit of CBO-status zichtbaar wordt in de productie-Compass, met versie/horizon/sample/onderzoeksstatus | template | ja, expliciet besluit |

Kleinste veilige volgende stap: **stap 0a** (LaunchAgent uitladen of werkmap terugzetten) — voorkomt dat morgen 05:45 niet-goedgekeurde code draait.
