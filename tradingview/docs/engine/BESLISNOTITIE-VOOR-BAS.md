# Beslisnotitie voor Bas

## Stand na de nachtronde (27/28-10-2026)
- De automatische TradingView-taak (LaunchAgent, werkdagen 05:45) is **uitgeladen** en blijft uit. Woensdag 05:45 draait er dus **niets**. Alleen jij beslist over weer aanzetten.
- De productiewerkmap staat schoon op de goedgekeurde commit `ea1318a`. Het Compass-ontwerp (Fase 1) staat veilig op de lokale branch `wip/compass-fase1-2026-10-27`.
- De CBO Research Engine 0.1 draait als **apart script** in de **aparte layout** *BFX CBO Onderzoek*. De productielayout *BFX Automatisering* en de productie-indicator zijn niet aangeraakt.
- De eerste retrospectieve meting laat **geen edge zien en sluit er ook geen uit**: te weinig verzegelde boxen (65 in 28 combinaties). Zie CBO-RETRO-METING-0.1.md.
- Let op: die meting gebruikte ook de validatieperiode uit het meetcontract (2026-01 t/m 08). Bijstellen en daarna op die periode valideren kan dus niet meer eerlijk; daarvoor blijft alleen forward-data over.

Eerder stond hier dat de taak aan stond en woensdag 05:45 met niet-gecommitte wijzigingen zou draaien. Dat is vannacht opgelost door het uitladen hierboven.

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

## Benodigde toestemmingen (per stuk, stand 28-10)
1. ~~LaunchAgent uitladen~~ — gedaan in de nachtronde. **Open: wel of niet weer laden, en met welke code** (`ea1318a` is de laatst bewezen versie).
2. Afleverscroll en lijnstart corrigeren, BFX-layout-zoom resetten (0b–d) — nog niet gedaan.
3. Fase 1 (Compass-redesign, branch `wip/compass-fase1-2026-10-27`) committen/pushen en testen — nog niet gedaan.
4. ~~Aparte onderzoeksindicator en onderzoekslayout bouwen~~ — gedaan als onderzoeksversie. **Open: PR `research/cbo-engine-0.1` beoordelen; niet mergen zonder jouw besluit.**
5. Keuze vervolgmeting: forward volgen met deze drempels bevroren, of vooraf een tweede hypotheseset vastleggen (zonder naar de uitkomsten te kijken).
6. Forward-logboek in de database (stap 6, databasewijziging) — nog niet gedaan, aparte toestemming.
