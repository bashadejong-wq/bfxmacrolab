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

---

# Fase 2 (28-10-2026): CBO-koppeling, OB-R en slimme referentielijnen

## 10. CBO-module (regels van CBO_0.1, zonder meting)

- De box-statemachine en het regime zijn **dezelfde regels en standaardwaarden** als in `bfx_cbo_engine.pine` (CBO_0.1).
  In deze engine staan ze als `c_*`-parameters.
- De CBO Research Engine en zijn forwardmeting CBO_0.1-F blijven **ongewijzigd en apart**.
- De module is actief op 15m, 30m, 1H en 4H, net als de trigger-TF's van CBO in Auto.
  De context-TF is 4H bij 15m/30m en D bij 1H/4H, en komt via `[1]` + `lookahead_on`.
- Verschillen met CBO_0.1, bewust en tijdelijk:
  1. **Geen eventblokkade en geen post-event-regime.** De eventdata komt in fase 3.
  2. **Geen varianten V1/V2/V3 en geen meetslots.** Na ACCEPTATIE, MISLUKT of VERLOPEN mag direct een nieuwe box gezocht worden.
     Daardoor kunnen de tellingen licht afwijken van de CBO-engine.

| st | Naam | Regel |
|---|---|---|
| 0 / 1 | GEEN CONTEXT / CONTEXT GELDIG | regime niet / wel geschikt (compressie, balans, trend, lage volatiliteit) |
| 2 | VORMT | `c_nMin` bars binnen `c_wMax × ATR` |
| 3 | KANDIDAAT | ≥ `c_tMin` tests van boven- én ondergrens (tolerantie `c_tol`) |
| 4 | VERZEGELD | `c_nSeal` bars zonder nieuw extreem; de grenzen liggen vanaf hier vast. Box-ID = `TICKER:TF:start:verzegeling` |
| 5 | BREAKOUT | close buiten de box én ≥ `c_body` van de body buiten de box (een wick telt niet) |
| 6 | ACCEPTATIE | `c_accK` closes buiten de box zonder terugkeer |
| 9 | MISLUKT | close terug in de box na een breakout |
| 10 | VERLOPEN | geen breakout binnen `c_expiry × boxduur` |

## 11. OB-R (range-expansie)

- OB-R ontstaat **alleen bij ACCEPTATIE**.
- De oorsprongscandle is de laatste tegencandle binnen de box, vóór de breakout-candle.
- De grenzen, de ID, de lifecycle en de maximale hoogte zijn gelijk aan §5.
- Resultaten worden nooit samengevoegd met OB-P of OB-F.

## 12. Samenhang (geen signaal)

Bij een verzegelde box toont de kaart de swingzijde. Bij een breakout of acceptatie toont hij de breakoutrichting `d`. Per richting staan vier controles:

1. swingrichting = `d`;
2. internal richting = `d`;
3. locatie: bij long niet in premium (PD < 55), bij short niet in discount (PD > 45);
4. er ligt een actieve zone in richting `d` die de box ± 1 ATR overlapt.

Bij een breakout toont de kaart ook de eerste referentie in die richting, met de afstand in boxbreedtes.
Dit is beschrijvend. De poorten (WATCH/ARMED/CONFIRMED) komen in fase 3.

## 13. Referentielijnen vanaf de echte wick

- **PDH/PDL** gelden op TF's onder D. **PWH/PWL** gelden op TF's onder W.
  Optioneel komen er **D/W Open** bij (`i_refOpen`, standaard uit).
- Elke lijn begint op de candle die het extreem van de vorige dag of week maakte. Die candle wordt bijgehouden op de chart-TF.
  Een nieuwe dag of week wordt herkend met `timeframe.change`.
- **Geraakt**: op een gesloten candle `high > PDH` (of `low < PDL`). De lijn eindigt dan op die candle en wordt verborgen.
  Met `i_refTaken` blijft hij vervaagd zichtbaar.
- **Smart hide**: er worden maximaal `r_max` (3) niet-geraakte niveaus getoond. Het zijn de niveaus die het dichtst bij de koers liggen,
  en alleen binnen `r_dist` (1.5) × de ATR(14) van de laatste gesloten dagcandle.
- De labels staan in een vaste kolom rechts van de laatste candle.

## 14. Parameters fase 2 (HYPOTHESE)

`c_volLen 20 · c_volPct 250 · c_lowVol 15 · c_highVol 85 · c_compVol 40 · c_erLen 20 · c_erTrend 0.35 · c_erChaos 0.12 · c_expMult 2.0 · c_nMin 8 · c_nMax 24 · c_wMax 1.25 · c_tol 0.15 · c_tMin 2 · c_nSeal 3 · c_expiry 2.0 · c_body 0.5 · c_accK 2 · r_max 3 · r_dist 1.5`

---

# Fase 3 (28-10-2026): Bias 5.0, events, eventblokkade en poorten

## 15. Data (alleen lezen, verzegelde snapshot)

- `src/structure-generate.mjs` vult `{{DATA}}` met hetzelfde blok als de CBO-engine: dezelfde `buildEngine`, alleen een ander template.
  Het blok bevat de BIAS_5.0-paren, de valuta's, de daily-invalidaties en de high-impact events (vanaf 2 dagen terug).
  `CAL_COVERAGE_PROVEN = false`.
- Er wordt niets naar de database geschreven.
- De macrorichting volgt dezelfde regel als CBO_0.1: `pIdx ≥ 15` long, `≤ −15` short, anders geen richting.
  Daarvoor moet de bias actueel zijn (`biasFresh`).

## 16. Eventblokkade in de CBO-module (zoals CBO_0.1)

- **Blok**: centrale bank 60 min vóór tot 120 min na; overig high impact 30 min vóór tot 60 min na.
  Alleen events van de basis- of de quotevaluta tellen.
- **Post-event-regime**: tot 180 min na een event, alleen op TF ≤ 1H. Het regime is dan niet geschikt.
- Tijdens een blok gaat een vormende of verzegelde box naar **EVENT BLOCK** (st 11) en start er geen nieuwe box.

## 17. Poorten (richting `d` = macrorichting)

| Poort | ✓ | ✕ | ? |
|---|---|---|---|
| Data | bias van het paar aanwezig en actueel, snapshot < 36 u oud | — | bias ontbreekt of is verouderd, snapshot ouder dan 36 u, of bar vóór de biasdatum |
| Macro | `d ≠ 0` | geen richting (neutraal) | (zie Data) |
| HTF-structuur | swing van de context-TF = `d` | context-swing = `−d` én stage 2/3 (bevestigd of continuation) | context-swing neutraal, mogelijke shift of verzwakt (laat door, met opmerking) |
| Locatie | long: swing-PD ≤ 50% of koers in een actieve long-zone · short: PD ≥ 50% of in een short-zone | anders | geen swingrange |
| Sweep (info, verplicht met `g_needSweep`) | sweep in richting `d` (swing of internal) in de laatste `g_swAge` bars | — | — |
| CBO-trigger | **ACCEPTATIE** in `d`, maximaal `g_trigAge` bars geleden | breakout tegen `d`, of geen verzegelde box | — |
| Event | geen blok, agenda geladen | blok actief | geen toekomstig event in de agenda (dekking onbekend) |
| Ruimte | eerste niet-geraakte referentie in `d` ≥ `g_minRoom` R (stop = overkant box ± `g_stopBuf` ATR) | < `g_minRoom` R | geen box of geen referentie |
| Kosten (info) | bekend en < 10% van de R | ≥ 10% van de R | onbekend (blokkeert niet) |

Context-TF: 4H voor 15m/30m en D voor 1H/4H. Op andere TF's zijn de poorten **n.v.t.**

## 18. Status (op gesloten candles)

| Status | Regel |
|---|---|
| UNKNOWN | Data is ? |
| BLOCKED | macro ✕, event-blok, of HTF ✕ |
| WATCH | richting en HTF in orde, maar locatie ✕ of geen box/trigger |
| ARMED | locatie ✓ én (box verzegeld, breakout in `d`, of acceptatie in `d`) |
| CONFIRMED | trigger ✓ + locatie ✓ + event ✓ + ruimte ✓ (+ sweep ✓ als verplicht) |
| ACTIVE | na CONFIRMED: instap = close, stop = overkant box ± buffer, doel = eerste referentie |
| FAILED / DOEL / EXPIRED | stop geraakt (stop eerst bij gelijktijdig) / doel geraakt / na `g_tMax` bars; daarna nog 10 bars zichtbaar |

Elke poort toont zijn reden. Er is **geen totaalscore**. Dit is decision support en geen order.
Retrospectieve tellingen zijn **geen bewijs**: de bias bestaat alleen vanaf de biasdatum, en die geldt als grens (zie Data).

## 19. Parameters fase 3 (HYPOTHESE)

`e_preCB 60 · e_postCB 120 · e_pre 30 · e_post 60 · e_disc 180 · g_trigAge 3 · g_minRoom 1.0 · g_stopBuf 0.1 · g_swAge 24 · g_needSweep false · g_tMax 32 · k_known false · k_spread 0.0 · k_slip 0.0`
