# STR_0.2 — inventaris en functiematrix (vóór implementatie)

Uitgangspunt: STR_0.1 (`template/bfx_structure_engine.pine`, sha256 `e1f5d32f…`, **bevroren als STR_0.1-F**, forward vanaf 29-10 00:00 UTC).
STR_0.2 komt in een **nieuw bestand** (`template/bfx_structure_engine_02.pine`), met een nieuwe naam en zonder forwardstart. Herstelpunt: tag `herstel-str02-start-2810`.

**Legenda:**
- Status: ✅ volledig · ◐ gedeeltelijk · ✕ ontbreekt.
- M/C/E = zichtbaar in Minimal / Compact / Expanded.
- Beslismoment: alles op `barstate.isconfirmed` (close), tenzij anders vermeld.
- "regel" = regelnummer in STR_0.1.

## Structuur

| Onderdeel | Status | Codeplaats (0.1) | Huidige definitie | Gewenst (0.2) | Bron | origin_time / confirmed_at | Repaint-risico | TF | M/C/E | Filter | Alert | Test (bewijs) | Wijziging |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Swing high/low | ✅ | `stepLvl` r.259, `Piv` | `ta.pivothigh/low(L=10)`; bruikbaar vanaf `cBar+1` | idem + tonen/uit | prijs chart-TF | `oBar/oTime` = pivotbar; `cBar/cTime` = +L bars | geen (pas ná bevestiging gebruikt); tekening terug naar origin is visueel | chart | –/C/E | via structuurfilter | nieuw (nieuwe swing) | test "structuurlogica alleen op gesloten candles"; herlaad identiek | tonen-schakelaar, alert nieuwe swing |
| Internal high/low | ✅ | idem L=5 | idem | idem | idem | idem | idem | chart | –/C/E | ja | nieuw | idem | schakelaar |
| Fractal high/low | ✅ | idem L=2 | idem | standaard uit | idem | idem | idem | chart | E | nee | nee | idem | schakelaar |
| BoS | ✅ | `stepLvl` (brk ±1) | close voorbij niveau ± 0,05 ATR in trendrichting | idem; tonen / meetellen / alert apart | prijs | origin = pivot; confirmed = breakcandle | geen | chart | C/E | **nieuw: BoS-filter** | nieuw | 28/28 runtime; herlaad | schakelaars + break-ID |
| CHoCH | ◐ | `stepLvl` (brk ±2) | break tegen trend; **zet de richting direct om** (dus impliciet in HTF- en swingrichting) | **standaard uit en telt niet mee**; richting voor filters alleen via bevestigde shift | prijs | idem | geen | chart | E | optioneel | optioneel | — | richting-filter op `confDir` (alleen na bevestigde shift) |
| Candidate / confirmed shift, continuation, weakening | ✅ | `stepLvl` stage 1–4 | stage 1 mogelijke shift (CHoCH), 2 bevestigd (eerste BoS), 3 continuation, 4 verzwakt (sweep aan trendzijde) | idem; plus **tegengestelde shift** als gebeurtenis | prijs | breakcandle | geen | chart + HTF | C/E | HTF-filter op bevestigde richting | shift-alert | — | `confDir`, shift-alert |
| Structuur-ID's | ◐ | `sStrId` (alleen bij setup) | `TICKER-TF-S-tijd` | stabiel ID per break (laag + origin + bevestiging) | — | — | — | — | E | – | in JSON | JSON-test | ID per break in event-JSON |
| Gebroken niveau + bevestigingscandle | ◐ | `bP/bT/bB` in tuple | niveau en origin bewaard, bevestigingscandle impliciet (time) | expliciet in event-record | — | — | — | — | E | – | JSON | — | velden toevoegen |
| HTF-structuur (4H/D) | ✅ | `htfState` r.344 | swinglogica op HTF, `[1]` + lookahead_on | profielafhankelijke context-TF (1H/4H/D/W) | prijs HTF | gesloten HTF-bar | geen ([1]) | 1H/4H/D/W | C/E | ja | nee | HTF-rij = native TF (28/28) | TF-profiel |

## CBO

| Onderdeel | Status | Codeplaats | Huidig | Gewenst (0.2) | Repaint | Filter | Alert | Test | Wijziging |
|---|---|---|---|---|---|---|---|---|---|
| Box-statemachine | ◐ | r.560–735 | 0/1 context · 2 vormt · 3 kandidaat · 4 verzegeld · 5 breakout · 6 acceptatie · 9 mislukt · 10 verlopen · 11 eventblok (= CBO_0.1-regels) | `FORMING`(2/3) · `SEALED`(4) · `BREAKOUT_CANDIDATE`(5) · `BREAKOUT_CONFIRMED`(6) · **`RETEST`(7)** · `FAILED`(9) · `EXPIRED`(10) · `EVENT_BLOCK`(11); ACTIVE = setupstatus | grenzen vast na SEALED | ja | sealed/breakout/retest | 35/35 = CBO_0.1 | retest-toestand, faalreden, eindtijd |
| Box-velden | ◐ | xs* | ID, start, verzegeling, grenzen, bars, breakouttijd, uitkomst | + TF, expiry-tijd, reteststatus, faal-/verloopreden | — | — | — | — | velden |
| Weergave-opties | ✕ | — | één box (actueel of vormend) | forming tonen · alleen sealed · verlopen tonen · retest verplicht · breakout verplicht (altijd) | — | — | — | — | inputs |

## Zones

| Onderdeel | Status | Codeplaats | Huidig | Gewenst | Filter | Alert | Test | Wijziging |
|---|---|---|---|---|---|---|---|---|
| OB-P | ✅ | `obPOff` r.474 | extreme candle sinds origin + tegencandle ≤ 3 bars | idem | als locatie | zone-entry | ja | schakelaars |
| OB-F | ✅ | `obFOff` r.492 | vroegste FVG van de impuls → tegencandle | idem | idem | idem | ja | schakelaars |
| OB-R | ✅ | CBO-blok | tegencandle in box bij acceptatie | idem | idem | idem | ja | schakelaars |
| **FVG** (bull/bear) | ✕ | (alleen hulpje in OB-F) | — | eigen zonetype: bull `low > high[2]` → [high[2], low]; bear spiegel; ≥ `fvgMin` × ATR | idem | idem | — | **bouwen** |
| Lifecycle | ✅ | `updZones` r.529 | NEW/ACTIVE/TESTED/PARTIAL/SPENT/INVALID | idem + eindtijd | — | — | ja | eindtijd |
| Weergave-opties | ◐ | `i_zVar`, `i_zShow` | variant + aantal | per type tonen · alleen untouched · tested · partial · spent vervagen/verwijderen · mitigatie % | — | — | — | inputs |

## Liquidity / AMT

| Onderdeel | Status | Huidig | Gewenst | Wijziging |
|---|---|---|---|---|
| Sweep | ✅ | wick voorbij bevestigd niveau, close terug, wick ≥ 30% (r.`stepLvl`) | idem + tonen/meetellen/alert; record met wickafstand | schakelaars, record |
| Failed breakout | ✕ | — | break (close voorbij + buffer) gevolgd door close terug binnen ≤ `fbBars` (3) bars | bouwen |
| Acceptance | ◐ | alleen CBO-acceptatie | ook aan niveaus: `accK` (2) closes voorbij + afstand ≥ `accDisp` × ATR, zonder close terug | bouwen |
| Rejection | ◐ | = sweep | aan referenties: wick voorbij, close terug → SWEPT/rejection | bouwen (refs) |
| Displacement | ✕ | — | bar-range ≥ 1,5 ATR én body ≥ 70% | bouwen (info + absorptie-proxy) |
| Balance / imbalance | ◐ | CBO-regime | balans = box vormt/verzegeld of regime balans/compressie; imbalans = displacement/expansie | kaartregel |
| Premium / EQ / discount | ✅ | `pdOf` (<45/45–55/>55) | idem; als locatiefilter apart | schakelaar |
| **ABSORPTION-PROXY** | ✕ | — | zie definities | **bouwen** |

## Referenties

| Onderdeel | Status | Huidig | Gewenst |
|---|---|---|---|
| D/W open | ◐ | optioneel, alleen open-tijd | + status, ID, TZ |
| **M/Q/Y open** | ✕ | — | `timeframe.change("M"/"3M"/"12M")` |
| PDH/PDL, PWH/PWL | ✅ | vanaf wick-candle, geraakt verbergen | + statussen UNTOUCHED/TESTED/SWEPT/ACCEPTED/EXPIRED |
| **PMH/PML** | ✕ | — | zelfde methode met "M" |
| **Asia range, London OR, NY OR** | ✕ | — | IANA-tijdzone (DST): Asia 09:00–15:00 Asia/Tokyo; London 08:00–09:00 Europe/London; NY 08:00–09:00 America/New_York |
| Swing/internal levels | ◐ | als pivots | als referentie: dichtstbijzijnde swing high/low |
| Max/nearest/labels/vervagen/projectie/afstand | ◐ | max 3, 1,5 × D-ATR, rail | alle instelbaar |

## Macro, poorten, presentatie, overig

| Onderdeel | Status | Huidig | Gewenst |
|---|---|---|---|
| Bias 5.0 per bar | ✅ | forward-historie, max(06:00, eerst gezien), 96 u | idem; tonen / filter / alleen info |
| Events + blokkade | ✅ | blok-vensters, dekking onbekend = ? | tonen / filter apart |
| Scenario / invalidatie | ◐ | invalidatie in Expanded | idem |
| Poorten + status | ◐ | vaste set verplichte poorten | **gebruikersgekozen filters**; per filter geslaagd/mislukt/ontbreekt/uit/alleen zichtbaar |
| Presets | ✕ | — | CLEAN/INTRADAY/SWING/FULL RESEARCH/CUSTOM |
| TF-profielen | ◐ | ctx 4H (≤30m) / D (1H/4H) | AUTO per TF (5/15→1H, 30/1H→4H, 4H→D, D→W) of CUSTOM |
| Parameterhash | ✕ | — | numerieke vingerafdruk van alle effectieve instellingen |
| Alerts | ◐ | statuswissel + kandidaten | per gebeurtenis aan/uit (16 typen), één JSON per bar |
| Kaart | ✅ | Minimal 3 / Compact 6 / Expanded | + regel "actieve filters", preset, hash |
| Varianten V1–V6 / logboek | ✅ | STR_0.1-F | blijft bij 0.1; 0.2 meldt preset + hash in elk bericht |
