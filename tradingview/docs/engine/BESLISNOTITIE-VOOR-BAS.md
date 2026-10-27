# Beslisnotitie voor Bas

## Eerst iets dat vannacht speelt
De automatische TradingView-taak staat aan en draait **woensdag 05:45**. Hij gebruikt de huidige werkmap, waarin niet-gecommitte wijzigingen staan (het nieuwe Compass-ontwerp en een aangepaste scrollmethode). De laatste test met die scrollmethode stopte veilig zonder iets te overschrijven. Waarschijnlijk gebeurt morgen hetzelfde, maar zeker is dat niet. Ik heb niets aangepast, omdat je daar geen toestemming voor gaf.

## Wat al betrouwbaar en feitelijk is
- BIAS_5.0-stand per paar en valuta, datum en versie, strategiestatus, kantelpunt (uit de database).
- Feitelijke prijsreferenties uit de FXCM-feed: vorige dag/week high-low, dag/week-open, Asia, London IB, NY opening range.
- Eventtijden en consensus uit de BFX-agenda.

## Wat alleen context is
- Paarinvalidatie (alleen voor 7 paren, daily, zelfde datum).
- Bankconsensus (alleen EUR/USD, extern).
- Afstand van de prijs tot een referentie in ATR. Dat is een feit, maar geen oordeel.

## Wat een hypothese is
Marktregime, boxkwaliteit, breakoutkwaliteit, retest, acceptatie, ruimte in R, en alle drempels (8–16 candles, 1–1,5 ATR, 2–3 closes …).

## Wat nog getest moet worden
CBO_0.1 (3 varianten, 2 profielen) tegen 5 baselines, eerst retrospectief, dan op een onaangeraakte periode, dan forward. BIAS_5.0 heeft pas één echte meetdag. Het effect van "bias + CBO" is daarom pas forward echt te meten.

## Welke data ontbreken
Geldig-tot en confidence als getal voor de bias, een BFX-verwachting per event, spread en kosten per paar, een garantie dat de kalender volledig is, en eventtype als vast veld.

## Kleinste veilige stap
De automatische taak tijdelijk uitzetten, of de werkmap terugzetten naar de laatst goedgekeurde commit `ea1318a`. Daarna de Compass afronden (stap 0–1). Pas dan begin ik aan de engine, in een aparte onderzoekslayout.

## Mijn advies
- **Wel**: Compass rustig afmaken; daarna een aparte CBO-onderzoeksindicator, alleen states en metingen, met vaste regels en forward-logging.
- **Niet**: CBO-signalen of "bevestigd" tonen in de dagelijkse Compass vóór forward-resultaat; eigen TPO-engine; volume- en orderflowclaims; meer dan 3 varianten.

## Van Bias 5.0 naar een handmatige setup (uiteindelijk)
Bias geeft de richting → het regime bepaalt of CBO zinvol is → de box wordt verzegeld → een breakout in de biasrichting op bar close → controle op event en ruimte → jij beoordeelt de price action en voert handmatig uit. De engine verklaart elke stap. Hij opent nooit zelf een trade.

## Benodigde toestemmingen (per stuk)
1. LaunchAgent uitladen of werkmap terugzetten (stap 0a)
2. Afleverscroll en lijnstart corrigeren, BFX-layout-zoom resetten (0b–d)
3. Fase 1 committen en pushen
4. Aparte onderzoeksindicator en onderzoekslayout bouwen (stap 2–5)
5. Forward-logboek in de database (stap 6, databasewijziging)
