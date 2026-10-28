# Vooraf vastgelegd: varianten, metrics en minima (STR_0.1-F)

Vastgelegd op **28-10-2026**, vóór de forwardstart (29-10-2026 00:00 UTC).
Wat hier staat, wordt **niet** achteraf aangepast om een uitslag mooier te maken. Elke wijziging wordt een nieuwe versie met een nieuwe start.

## Varianten (één indicator, dezelfde markt, dezelfde exit)

| # | Variant | Kandidaat ontstaat bij | Richting |
|---|---|---|---|
| V1 | CBO only | elke CBO-acceptatie (box verzegeld én gebroken én geaccepteerd) | breakoutrichting |
| V2 | Bias only | eerste bar waarop een nieuwe forward-biasdag geldig wordt, \|index\| ≥ 15 | biasrichting |
| V3 | Structure only | elke swingbreak (BoS, CHoCH of eerste break) op de chart-TF | breakrichting |
| V4 | Bias + CBO | V1, alleen als de breakoutrichting = biasrichting | idem |
| V5 | Bias + Structure + CBO | V4, plus context-TF-swing niet tegen (✓ of ~) en chart-swing = bias | idem |
| V6 | Volledig | STR-status CONFIRMED (locatie, event, ruimte, verplichte poorten) | biasrichting |

**Gestandaardiseerde exit voor alle zes** (eerlijke vergelijking):
- instap = close van de kandidaatbar;
- stop = 1 × ATR(14) van de chart-TF;
- doel = 1,5 R;
- verval na 32 bars (R op de close);
- stop eerst bij een gelijktijdige raak.

V6 heeft daarnaast zijn **eigen** exit (stop aan de overkant van de box, doel bij de eerste referentie). Die wordt apart gerapporteerd, nooit gemengd.

Een kandidaat telt alleen mee bij bevroren parameters en een bar na de start. Bij V1, V4, V5 en V6 moet ook de box ná de start verzegeld zijn.

## Metrics (per cel = paar × timeframe; nooit opgeteld)

- N, aantal onafhankelijke handelsdagen en aantal regimes;
- hitrate;
- gemiddelde en mediaan R, **bruto en netto**;
- gemiddelde MFE en MAE;
- maximale drawdown in R, in volgorde van tijd;
- false-breakrate (FAILED met MFE < 0,5 R);
- expiry: aantal en gemiddelde R;
- uitsplitsing per sessie (UTC: Azië, Londen 07–12, New York 12–21, laat) en per regime.

**Netto** = bruto − (spread + 2 × slippage) / risico. De spreads zijn **aannames** (geen brokerdata):

| Paar | EURUSD | GBPUSD | USDJPY | AUDUSD | NZDUSD | USDCAD | USDCHF |
|---|---|---|---|---|---|---|---|
| Spread (pips) | 0,6 | 0,9 | 0,7 | 0,8 | 1,2 | 1,2 | 1,1 |

Slippage is 0,2 pip per kant.

## Minima vóór enige beoordeling (per cel)

- **N ≥ 30**;
- **≥ 20 onafhankelijke handelsdagen**;
- **≥ 2 regimes**;
- **≥ 12 weken looptijd**.

Haalt een cel dat niet, dan is het oordeel "onvoldoende data — geen conclusie".
"Na 8 weken" en "na 3 maanden" zijn **controlemomenten**, geen beslismomenten.
Cellen worden **niet** samengevoegd tot vergelijkbaarheid is aangetoond: zelfde exit, vergelijkbare volatiliteit en vergelijkbare sessies, en dat besluit neemt Bas.

## Meetmatrix

De matrix bestaat uit 7 paren (EURUSD, GBPUSD, USDJPY, AUDUSD, NZDUSD, USDCAD, USDCHF) × 4 timeframes (15m, 30m, 1H, 4H) = **28 onafhankelijke cellen**.
Elke cel heeft een eigen telling in de indicator op die chart en in het logboek. `node src/forward-log.mjs report` drukt ze altijd alle 28 af, ook de lege.

**Let op:** de Pine-teller telt alleen op de chart waar de indicator geladen is. Voor 28 cellen zijn dus 28 charts met alerts nodig, of een logboek dat via alerts gevuld wordt.
Hoe dat praktisch moet, is een besluit van Bas (aantal alerts en het abonnement).
