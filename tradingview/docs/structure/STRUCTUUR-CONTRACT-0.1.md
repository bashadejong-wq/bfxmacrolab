# BFX Structure Engine 0.1 — structuurcontract

Status: **ONDERZOEK, geen bewezen edge**. Branch `research/structure-engine-0.1` (vanaf `8b1e0ca`).
Script: `template/bfx_structure_engine.pine` (marker `// BFX-STRUCTURE-ENGINE`).
Fase 1 van de bouwvolgorde: alleen prijsstructuur. Geen macro, geen CBO, geen poorten, geen alerts, geen volume.

Functionele inspiratie: publiek zichtbaar gedrag van TracerSMC (structuurlagen, shift/continuation, sweeps,
zones die na mitigatie verdwijnen, MTF-rijen). Alle regels en code zijn eigen werk; niets gekopieerd.

## 1. Pivots

| Laag | Pivotlengte (L links én rechts) | Input |
|---|---|---|
| Swing (S) | 10 | `h_lenS` |
| Internal (I) | 5 | `h_lenI` |
| Fractal (F) | 2 | `h_lenF` |

- Een pivot high op bar `o` bestaat pas als de L bars erna gesloten zijn. Hij wordt **bevestigd op bar `o+L`**.
- Elk pivot bewaart: `price`, `oBar`/`oTime` (oorsprong), `cBar`/`cTime` (bevestiging), `broken`, `swept`.
- Een pivot dat op bar `c` bevestigt, is pas **vanaf bar `c+1`** bruikbaar voor breaks en sweeps.
- Per laag telt alleen het laatst bevestigde pivot high en pivot low. Een nieuw pivot vervangt het vorige.
- De lijn mag terug naar de oorsprong getekend worden. Het bevestigingsmoment blijft apart zichtbaar via `i_conf` en de datavelden.

## 2. Break (BoS / CHoCH)

Alleen op een gesloten candle (`barstate.isconfirmed`). De buffer is `b = h_buf × ATR(h_atrLen)`.

- **Break omhoog**: `close > pivotHigh + b`. Als `h_body` aan staat, geldt `min(open, close)` in plaats van `close`.
- **Break omlaag**: `close < pivotLow − b`, en als `h_body` aan staat `max(open, close)`.
- Een wick voorbij het niveau is **geen** break.
- Een gebroken pivot wordt `broken` en telt daarna niet meer mee.
- Classificatie ten opzichte van de huidige laagrichting `dir`:
  - `dir == richting` → **BoS** (voortzetting);
  - `dir == −richting` → **CHoCH** (eerste break tegen de richting in);
  - `dir == 0` → **Break** (eerste break van de laag).

## 3. Toestandsmachine (per laag)

| Stage | Naam | Komt van |
|---|---|---|
| 0 | NEUTRAAL | start |
| 1 | MOGELIJKE SHIFT | CHoCH of eerste Break (richting wisselt) |
| 2 | SHIFT BEVESTIGD | eerste BoS na stage 1 |
| 3 | CONTINUATION | volgende BoS (vanuit 2, 3 of 4) |
| 4 | VERZWAKT | sweep aan de trendzijde in stage ≥ 2: mislukte voortzetting |

- *Tegengestelde shift* is de gebeurtenis waarbij een CHoCH vanuit stage 2, 3 of 4 komt. De laag gaat dan naar stage 1 in de nieuwe richting.
- Overgangen gebeuren alleen op gesloten candles.

## 4. Sweep (absorptie)

- **Bearish sweep**: `high > pivotHigh` én `close < pivotHigh`, en het niveau is niet gebroken en nog niet gesweept.
  Daarnaast moet de bovenwick ten minste `h_swWick` (0,3) van de candle-range zijn.
- **Bullish sweep**: spiegelbeeld op het pivot low. Daar geldt de onderwick.
- Het niveau moest vóór de sweep-candle al bevestigd zijn (zie §1).
- Een niveau kan maar één keer gesweept worden. Daarna kan het nog wel gebroken worden.
- De tooltip toont het niveau en de afstand van de wick voorbij het niveau, uitgedrukt in ATR.
- Een sweep is **context, geen entry**.

## 5. Zones (lifecycle)

Een zone ontstaat bij elke break van de **swing- of internal**-laag, in de richting van die break.
De bovengrens van een bullish zone is `max(open, close)` van de oorsprongscandle en de ondergrens is de `low`.
Een bearish zone is het spiegelbeeld.
Een zone die hoger is dan `h_zMaxH × ATR` wordt niet gemaakt; die wordt meegeteld als "overgeslagen".

| Variant | Oorsprongscandle |
|---|---|
| **OB-P** (pivot-origin) | Neem het laagste low (bij bullish) tussen de oorsprong van het gebroken pivot en de break. Daarvan of uiterlijk 3 bars ervoor: de eerste bearish candle. Is die er niet, dan die bar zelf. |
| **OB-F** (FVG-origin) | Neem de vroegste bullish FVG (`low[k] > high[k+2]`) in de laatste `h_fvgLook` bars van de impuls, niet ouder dan het laagste low. De laatste bearish candle op of vóór bar `k+2`, binnen 5 bars. Zonder FVG of zonder tegencandle is er geen OB-F. |
| OB-R (range-expansie) | Komt in fase 2, samen met de CBO-integratie. |

Resultaten van OB-P en OB-F worden **nooit** samengevoegd.

**Zone-ID**: `TICKER-TF-VARIANT-yyyyMMdd-HHmm(oorsprong, UTC)-L|S`. Een dubbele ID wordt niet opnieuw gemaakt.

**Lifecycle** (vanaf de bar na ontstaan; penetratie `pen` = maximaal bereikte diepte in de zone, 0–100%):

| st | Naam | Regel |
|---|---|---|
| 0 | NIEUW | bar van ontstaan |
| 1 | ACTIEF | nog niet geraakt |
| 2 | GETEST | `pen > 0` |
| 3 | GEDEELTELIJK | `pen ≥ h_mit / 2` |
| 4 | GEBRUIKT | `pen ≥ h_mit` (standaard 50%); de zone stopt met verlengen |
| 5 | ONGELDIG | close aan de verkeerde kant van de zone, óf ouder dan `h_zAge` bars; de box wordt verwijderd |

`tests` telt elke nieuwe aanraking. Het geheugen houdt maximaal 16 zones vast; afgeronde zones worden het eerst verwijderd.
Op de chart staan per richting maximaal `i_zShow` (2) actieve zones: de zones die het dichtst bij de koers liggen.
Gebruikte zones zijn alleen zichtbaar in Expanded, en dan vervaagd.

## 6. Premium / discount

- De dealing range is het laatst bevestigde **swing**-pivot high tot het laatst bevestigde swing-pivot low.
- Elke grens loopt mee met het extreme dat ná het bevestigen van het pivot is bereikt. Bij een nieuw pivot begint de grens opnieuw.
- `PD% = (close − onder) / (boven − onder) × 100`.
  - Onder 45: discount.
  - 45–55: equilibrium.
  - Boven 55: premium.
- De EQ-lijn ligt op 50%.

## 7. Hogere timeframes (kaart)

- De 4H- en D-rij rekenen dezelfde swinglogica (§1–4 en §6) op die timeframe uit.
- Waarden komen via `request.security(..., expr[1], lookahead_on)`. Dat is de laatste **gesloten** HTF-candle, zonder blik in de toekomst.
- Een rij wordt alleen opgevraagd als hij aan staat én de chart-TF lager is dan die rij (lazy loading).
- Dit is een **technische structuuroriëntatie**, geen macrobias. Bias 5.0 blijft het hoofdoordeel en komt er in fase 2 apart bij.

## 8. Non-repaint-eisen (te testen)

1. Breaks, sweeps, zones en toestanden veranderen alleen op gesloten candles.
2. Pivots worden gebruikt vanaf `cBar + 1`.
3. HTF-waarden komen alleen van gesloten candles.
4. Na herladen zijn tellingen, zone-ID's en toestanden gelijk.
5. Geen strategy-, order- of volumecode, en geen koop/verkoopsignalen.

## 9. Alle HYPOTHESE-parameters (bevriezing komt pas bij de forwardstart)

`h_lenS 10 · h_lenI 5 · h_lenF 2 · h_atrLen 14 · h_buf 0.05 · h_body false · h_swWick 0.3 · h_mit 50 · h_zAge 300 · h_zMaxH 1.5 · h_fvgLook 20`
