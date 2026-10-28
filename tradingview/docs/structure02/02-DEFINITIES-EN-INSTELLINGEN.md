# STR_0.2 — exacte definities, instellingenarchitectuur, presets en timeframeprofielen

Alle detectie gebeurt op een **gesloten candle** (`barstate.isconfirmed`). ATR = ATR(14) van de chart-TF. Alle drempels zijn **HYPOTHESE**.
Bestaande definities uit STR_0.1 (pivots, BoS, stages, sweep, OB-P/F/R, lifecycle, PD, CBO-regels, bias per bar, events) blijven gelijk, **behalve** waar hieronder "nieuw in 0.2" staat.

## A. Definities (nieuw of gewijzigd in 0.2)

### A1. Bevestigde structuurrichting `confDir` (nieuw in 0.2)
- `confDir` = de richting van de laatst **bevestigde** shift: stage ≥ 2.
- Een CHoCH alleen (stage 1, "mogelijke shift") verandert `confDir` **niet**.
- Alle structuurfilters (eigen swing, HTF) gebruiken `confDir`. Zo kan CHoCH nooit ongemerkt een filter beïnvloeden.
- **CHoCH** staat standaard uit (niet tonen, niet meetellen, geen alert). Als filter betekent CHoCH: "een CHoCH in richting d binnen `chochAge` (24) bars".

### A2. Break-record
Elke BoS, CHoCH of eerste break bewaart:
- laag (S/I/F) en richting;
- het gebroken niveau, met origin_bar en origin_time;
- de bevestigingscandle (confirmed_at_bar en confirmed_at_time);
- een ID: `TICKER-TF-{laag}{BOS|CHOCH|BRK}-yyyyMMdd-HHmm(bevestiging)-{L|S}`.

### A3. Failed breakout (nieuw)
- Een swing- of internal-niveau wordt gebroken (close voorbij niveau ± buffer).
- Daarna sluit binnen `fbBars` (3) bars een close **terug aan de oorspronkelijke kant**.
- Bevestigd op die close. Het telt één keer per break.

### A4. Acceptance (nieuw, aan structuurniveaus)
- Na een break volgen `accK` (2) opeenvolgende closes voorbij het niveau (inclusief de breakcandle), zonder een close terug.
- De verste close ligt ≥ `accDisp` (0,5) × ATR voorbij het niveau.
- Bevestigd op de `accK`-de close.
- Er worden geen toekomstige candles gebruikt.

### A5. Rejection
- **Aan structuurniveaus** is dit de sweep (A6).
- **Aan referenties**: een wick voorbij het niveau en een close terug → status SWEPT.

### A6. Liquidity sweep (zoals 0.1, nu met record)
- Het niveau is bevestigd vóór de sweepbar.
- `high > niveau` (of `low < niveau`), maar de close sluit terug aan de oorspronkelijke kant.
- De wick is ≥ 30% van de candle.
- Record: niveau, wickafstand (in ATR), close, TF, bevestigingsmoment.

### A7. Displacement (nieuw)
Bar-range ≥ `dispATR` (1,5) × ATR **én** body / range ≥ 0,7. Dit is informatief en wordt gebruikt in A8.

### A8. ABSORPTION-PROXY (nieuw)
Dit is een prijsproxy, **geen** orderflow en **geen** institutionele absorptie.

| Element | Regel |
|---|---|
| Niveau | het actuele bevestigde swing- of internal-high/low (niet gebroken) |
| Test (bij een high) | `high ≥ niveau − tol` (tol = `absTol` 0,1 × ATR) **én** `close ≤ niveau` (bij een low: spiegelbeeld) |
| Venster | vanaf de eerste test maximaal `absWin` (20) bars |
| Minimum | ≥ `absMin` (3) tests |
| Netto voortgang | \|close laatste test − close eerste test\| ≤ `absNet` (0,5) × ATR |
| Bevestiging | binnen `absExp` (10) bars na de laatste test een close ≥ `absDisp` (1,0) × ATR **weg** van het niveau (bij een high: close ≤ niveau − 1,0 × ATR) |
| Richting | bij een high → bearish proxy; bij een low → bullish proxy |
| Invalidatie | een close voorbij het niveau + buffer (een break) vóór de bevestiging |
| Expiry | geen bevestiging binnen `absExp` bars na de laatste test, of het venster is verstreken |
| Label | altijd `ABSORPTION-PROXY` |

### A9. FVG-zone (nieuw zonetype, apart van OB-F)
- **Bullish**: `low > high[2]`, zone [high[2], low], hoogte ≥ `fvgMin` (0,2) × ATR.
- **Bearish**: spiegelbeeld.
- Ontstaat op de derde candle. Zelfde lifecycle als de andere zones; INVALID bij een close door de zone.

### A10. Referenties (uitgebreid)

| Referentie | Definitie | Oorsprong | Expiry |
|---|---|---|---|
| D/W/M/Q/Y open | open van de eerste bar van een nieuwe periode (`timeframe.change` "D"/"W"/"M"/"3M"/"12M") | die bar | volgende periode |
| PDH/PDL, PWH/PWL, PMH/PML | extreme van de vorige periode | de wick-candle | volgende periode |
| Asia range | high/low van 09:00–15:00 Asia/Tokyo | eerste bar van de sessie | einde van de volgende sessie |
| London OR | high/low van 08:00–09:00 Europe/London | idem | einde van de dag |
| New York OR | high/low van 08:00–09:00 America/New_York | idem | einde van de dag |
| Swing/internal levels | actuele bevestigde pivot high/low | pivotbar (bevestigd + L) | bij een break |

- Tijdzones zijn IANA-zones, dus zomer- en wintertijd gaan automatisch goed.
- Statussen (op close):
  - `UNTOUCHED`;
  - `TESTED`: binnen `refTol` (0,1 × ATR) zonder er doorheen;
  - `SWEPT`: wick voorbij, close terug;
  - `ACCEPTED`: `accK` closes voorbij;
  - `EXPIRED`: periode voorbij;
  - `INVALID`: wordt niet gebruikt bij referenties.

### A11. CBO in 0.2

| Toestand | Wanneer |
|---|---|
| `FORMING` | vormt of kandidaat (2/3) |
| `SEALED` | verzegeld (4) |
| `BREAKOUT_CANDIDATE` | breakout (5) |
| `BREAKOUT_CONFIRMED` | acceptatie (6) |
| `RETEST` (nieuw) | na de acceptatie binnen `retMax` (8) bars terug tot ≤ `retTol` (0,25) × ATR van de gebroken grens, en een close weer aan de breakoutkant |
| `FAILED` | close terug in de box |
| `EXPIRED` | geen breakout binnen 2 × de boxduur, of geen retest binnen `retMax` (alleen als retest verplicht is) |
| `EVENT_BLOCK` | eventvenster |

- ACTIVE is een setupstatus, geen boxstatus.
- De boxregels zijn **gelijk aan CBO_0.1**. Retest is een extra toestand. De CBO_0.1-F-indicator zelf verandert niet.

## B. Instellingenmodel

Per module zijn er drie schakelaars: **Tonen · Meetellen · Alert**. Pine kent geen vierstandenkeuze met een duidelijke UI.

- Effectief = preset-waarde, of bij **CUSTOM** de eigen schakelaars.
- Regels:
  1. Meetellen staat los van Tonen. Een verborgen filter staat **altijd** op de kaart in "actieve filters".
  2. Een filter stuurt niet vanzelf een alert.
  3. Onbekend (`?`) telt nooit als geslaagd.
  4. CONFIRMED kan alleen als **alle** meetellende filters ✓ zijn **én** er een meetellende trigger (CBO, BoS, sweep, acceptance of absorptie-proxy) in richting d afgaat op die bar.
  5. Zonder meetellende trigger komt de status niet verder dan ARMED ("geen trigger gekozen").
- Per filter toont de kaart: ✓ geslaagd · ✕ mislukt · ? ontbreekt · – uit · ○ alleen zichtbaar.

## C. Presetmatrix (T = tonen, M = meetellen, A = alert)

| Module | CLEAN | INTRADAY | SWING | FULL RESEARCH |
|---|---|---|---|---|
| Bias 5.0 (richting) | T M | T M | T M | T M |
| Events (blokkade) | T M | T M | T M | T M |
| Scenario/invalidatie | Expanded | Expanded | Expanded | Expanded |
| Swing | T | T | T | T |
| Internal | – | T | – | T |
| Fractal | – | – | – | T |
| BoS | T | T A | T | T A |
| CHoCH | – | – | – | T |
| Shift (confDir) | T | T | T | T A |
| HTF-structuur | M | M | M | M |
| CBO forming | – | T | – | T |
| CBO sealed / breakout | T M A | T M A | T M A | T M A |
| CBO retest verplicht | – | – | – | – |
| OB-P | T | – | T | T |
| OB-F | T | T | – | T |
| OB-R | T | T | T | T |
| FVG | – | T | – | T |
| Zone als locatie | – | – | – | – |
| Sweep | – | T A | – | T A |
| Failed breakout | – | T | – | T A |
| Acceptance/rejection | – | – | – | T A |
| ABSORPTION-PROXY | – | – | – | T A |
| Premium/discount | T M | T M | T M | T M |
| Referenties | profiel | profiel + sessies | profiel | alle van het profiel |
| Status-alerts (ARMED, CONFIRMED, invalidatie) | A | A | A | A |
| Kaartlimieten | 1 box · 2 zones · 3 refs | idem | idem | 1 box · 4 zones · 6 refs |

- In alle presets behalve CUSTOM tellen alleen Bias, events, HTF, PD en CBO mee. Dat is de kern die in STR_0.1 getest is, nu met `confDir`.
- FULL RESEARCH is **geen handelsweergave**.

## D. Timeframeprofielen (AUTO, of CUSTOM = de eigen refschakelaars)

| Chart-TF | Context-TF | Referenties |
|---|---|---|
| 5m, 15m | 1H | Asia/London/NY, D open, PDH/PDL |
| 30m, 1H | 4H | D/W open, PDH/PDL, PWH/PWL |
| 4H | D | W/M open, PWH/PWL, PMH/PML |
| D | W | M/Q/Y open, PMH/PML |

## E. Parameterhash
- Een numerieke vingerafdruk (mod 2³¹−1, polynoom 31) over:
  - preset en profiel;
  - **alle** effectieve T/M/A-waarden;
  - alle `h_`, `c_`, `e_`, `g_` en `n_`-parameters.
- Hij staat in Expanded, in de Data Window en in elk alertbericht.
- Twee metingen met een andere hash zijn **andere varianten** en worden nooit samengevoegd.

## F. Forward
- STR_0.2 heeft **geen** forwardstart. De kaart toont "STR_0.2 · niet bevroren — geen meting".
- Een forwardmeting per preset en hash vraagt een besluit van Bas, met een vooraf vastgelegde versie, preset, filters, parameters, hash, start, paar en TF.
