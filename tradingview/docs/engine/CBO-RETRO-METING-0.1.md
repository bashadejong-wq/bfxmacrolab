# CBO 0.1 — retrospectieve meting (27-10-2026, avond)

> **ONDERZOEKSVERSIE — GEEN BEWEZEN EDGE.** Deze cijfers zijn retrospectief, prijs-only, bruto (zonder kosten), zonder biasfilter en met de standaard-hypothesen uit het meetcontract. Ze zijn géén bewijs en géén handelsadvies.

## Hoe gemeten

- Bron: TradingView, FXCM-feed (`FX:`), indicator *BFX CBO Research Engine 0.1* in layout **BFX CBO Onderzoek** (DcotUC2P).
- Waarden uit het TradingView-datavenster (plots `V1 n`, `V1 hit %`, `V1 gem R`, …), afgelezen op de laatste bar.
- 7 majors × 4 timeframes (15m, 30m, 1H, 4H). Per combinatie ±20.000–23.700 geladen bars.
- Instap op de open van de volgende bar; stop eerst bij twijfel; tijdexit na `h_tMax` bars. "Hit" = uitkomst > 0R (dus ook een kleine winst bij tijdexit).
- Drempels zijn **vóór** deze meting vastgelegd en daarna **niet** aangepast (zie CBO-RISICOS-EN-ANTI-OVERFITTING.md). Er is niets op deze data afgesteld.

## Resultaat per paar en timeframe

| Paar | TF | bars | kand. | verz. | V1 n · hit · gem R | V2 n · hit · gem R | V3 n · hit · gem R |
|---|---|---|---|---|---|---|---|
| EURUSD | 15 | 20367 | 43 | 4 | 4 · 75% · 0.02 | 2 · 50% · -0.37 | 2 · 100% · 0.13 |
| GBPUSD | 15 | 20362 | 46 | 2 | 2 · 0% · -1.00 | 1 · 0% · -1.00 | 1 · 0% · -1.00 |
| USDJPY | 15 | 20345 | 40 | 7 | 7 · 57% · -0.02 | 1 · 100% · 0.06 | 6 · 33% · -0.47 |
| AUDUSD | 15 | 20362 | 42 | 2 | 2 · 100% · 0.10 | 2 · 0% · -1.00 | 2 · 100% · 0.24 |
| USDCHF | 15 | 20276 | 44 | 3 | 3 · 67% · 0.09 | 3 · 33% · -0.25 | 3 · 67% · 0.22 |
| USDCAD | 15 | 20330 | 30 | 2 | 2 · 100% · 0.64 | 2 · 50% · -0.47 | 2 · 100% · 0.28 |
| NZDUSD | 15 | 20356 | 25 | 3 | 2 · 50% · -0.15 | 2 · 50% · 0.15 | 2 · 50% · -0.28 |
| EURUSD | 30 | 22552 | 64 | 5 | 5 · 100% · 0.26 | 2 · 50% · -0.01 | 2 · 50% · -0.28 |
| GBPUSD | 30 | 22546 | 41 | 9 | 9 · 89% · -0.01 | 5 · 20% · -0.70 | 8 · 88% · 0.00 |
| USDJPY | 30 | 22533 | 31 | 6 | 6 · 50% · -0.42 | 2 · 0% · -1.00 | 4 · 50% · -0.44 |
| AUDUSD | 30 | 22548 | 30 | 3 | 3 · 100% · 0.16 | 1 · 100% · 0.54 | 2 · 100% · 0.26 |
| USDCHF | 30 | 22489 | 33 | 2 | 2 · 100% · 0.07 | 1 · 100% · 0.08 | 1 · 100% · 0.07 |
| USDCAD | 30 | 22530 | 30 | 5 | 5 · 60% · -0.28 | 1 · 0% · -1.00 | 3 · 100% · 0.25 |
| NZDUSD | 30 | 22540 | 11 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| EURUSD | 60 | 23683 | 59 | 2 | 2 · 50% · -0.37 | 2 · 100% · 0.41 | 2 · 100% · 0.25 |
| GBPUSD | 60 | 23681 | 60 | 2 | 2 · 100% · 0.18 | 2 · 50% · -0.23 | 2 · 100% · 0.16 |
| USDJPY | 60 | 23679 | 22 | 6 | 6 · 83% · -0.07 | 2 · 50% · -0.47 | 4 · 100% · 0.29 |
| AUDUSD | 60 | 23679 | 9 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| USDCHF | 60 | 23663 | 16 | 1 | 1 · 100% · 0.26 | 1 · 0% · -1.00 | 1 · 100% · 0.01 |
| USDCAD | 60 | 23677 | 35 | 1 | 1 · 100% · 1.24 | 1 · 100% · 1.94 | 1 · 100% · 0.40 |
| NZDUSD | 60 | 23675 | 7 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| EURUSD | 240 | 21425 | 7 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| GBPUSD | 240 | 21424 | 3 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| USDJPY | 240 | 21423 | 9 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| AUDUSD | 240 | 21424 | 2 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| USDCHF | 240 | 21424 | 2 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| USDCAD | 240 | 21424 | 3 | 0 | 0 · –% · – | 0 · –% · – | 0 · –% · – |
| NZDUSD | 240 | 21419 | 6 | 1 | 1 · 100% · 0.10 | 1 · 0% · -1.00 | 1 · 100% · 0.07 |

**Totaal (gewogen naar n):** V1: n 65, hit 75%, gem -0.03R · V2: n 34, hit 41%, gem -0.34R · V3: n 49, hit 78%, gem -0.02R

Ruwe afleeswaarden: `cbo-meting-ruw-2026-10-27.txt`.

## Wat dit wel en niet zegt

1. **Te weinig waarnemingen.** In ruim 600.000 bars over 28 combinaties verzegelden maar 65 boxen. Met n = 65 (V1), 34 (V2) en 49 (V3) is een gemiddelde van −0,03R niet te onderscheiden van nul. De meetonzekerheid is groter dan het gemeten effect.
2. **Bruto, vóór kosten.** Met spread en slippage erbij is de verwachting voor alle drie de varianten negatief. Daarom staat er in de engine *KOSTEN ONBEKEND* en *netto kosten onbekend*.
3. **Hoge hitrate zegt weinig.** V1 en V3 halen 75–78% "hit", maar het gemiddelde is rond 0R. De meeste hits zijn kleine tijdexits; de verliezen zijn volle −1R-stops.
4. **V2 (retest) is het zwakst** in deze steekproef (−0,34R gemiddeld, 41% hit). Ook dat is niet significant.
5. **4H levert vrijwel niets op** (1 verzegelde box in 7 paren). De combinatie *minimaal 8 bars · maximaal 24 bars · verzegelen na 3 stille bars* verzegelt zelden. Dat is een ontwerpbevinding, geen reden om nu bij te stellen: bijstellen op deze zelfde data zou overfitting zijn.
6. **Geen biasfilter.** BIAS_5.0 heeft één forwarddag, dus macrorichting kon niet worden meegenomen. De meting meet alleen de prijsstructuur in beide richtingen.

## Belangrijke afwijking van het meetcontract

Het meetcontract splitst de data in **ontwikkeling (t/m 2025-12-31)**, **validatie (2026-01-01 t/m 2026-08-31, onaangeraakt)** en **forward**. Deze meting gebruikte *alle geladen historie zonder datumfilter*. Op 30m is dat ±22.500 bars, ruwweg begin 2025 tot nu, dus **inclusief de validatieperiode**.

Gevolg: de validatieperiode is voor CBO_0.1 met deze standaardhypothesen nu één keer bekeken. Omdat er niets is afgesteld, telt dit als één vooraf vastgelegde toets, niet als overfitting. Maar elke **volgende** aanpassing van drempels kan niet meer eerlijk op 2026-01 t/m 08 worden gevalideerd. Daarvoor blijft alleen forward-data over. Dit staat ook in de beslisnotitie.

## Conclusie

Er is **geen edge aangetoond en ook geen edge uitgesloten**. De engine werkt technisch en meet consistent, maar de huidige hypothesen leveren te weinig verzegelde boxen op voor een oordeel. De volgende stap is beslissen (door Bas) of:

- de detector op **nieuwe, nog niet bekeken data** (forward) wordt gevolgd, met deze drempels bevroren; of
- er vooraf, *zonder naar deze uitkomsten te kijken*, een tweede hypotheseset wordt vastgelegd en beide forward worden gemeten.
