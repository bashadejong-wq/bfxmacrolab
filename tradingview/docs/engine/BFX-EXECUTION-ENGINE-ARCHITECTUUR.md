# BFX Macro Execution Engine — architectuur (ontwerp, niet gebouwd)

```
BFX-database ──► generator (data, ongewijzigd) ──► snapshot (Pine-datablok)
                                                     │
TradingView-prijsdata ──► [1] Context Layer ◄────────┘
                          [2] CBO Research Engine (regels, versie CBO_x.y)
                          [3] Execution Presentation Layer (kaart, lijnen)
```

Drie lagen, fysiek gescheiden:
1. **Context Layer** — bestaande BFX-data (zie DATAVELDEN-EN-GAPS) + feitelijke prijsreferenties. Geen beslisregels.
2. **CBO Research Engine** — één Pine-bestand/-library met bevroren regels per versie; levert alleen *toestanden* + meetwaarden.
3. **Presentation Layer** — de huidige template-aanpak; leest toestanden, tekent max. 1 box, 1 invalidatie, 2 doelen, 1 event.

Aanbevolen technische vorm: **twee aparte indicatoren** (Compass = huidig; Engine = nieuw, eerst alleen in een onderzoekslayout) i.p.v. alles in één script — Pine-tokenlimiet (huidig ±95 kB/≈97% van het budget) laat geen ruimte.

## Marktregime (alle drempels = hypothese H-x)

| Regime | Kandidaatregel (alleen bevestigde bars) | Data | CBO-variant | Niet handelen als | Foutrisico |
|---|---|---|---|---|---|
| Trend | contextTF: slope van EMA(n) én ≥k hogere highs/lows; ADX-achtig richtingsmaat ≥ H1 | OHLC contextTF | continuation (V2) | trend tegen Bias 5.0 | laat in trend → late entries |
| Balans/range | prijs ≥ H2 % van tijd binnen vorige verzegelde range; range-breedte ≤ H3 × ATR(context) | OHLC | range-edge (V1/V3) alleen aan de rand | prijs in middelste 50% | brede range als trend gezien |
| Compressie | gerealiseerde vol (std log-returns, n) ≤ percentiel H4 van eigen 100-dagenhistorie | close | primair CBO-terrein | event < H5 uur | lage vol vlak vóór event |
| Expansie | gerealiseerde vol ≥ percentiel H6 én bar-range ≥ H7 × ATR | OHLC | geen nieuwe CBO; wacht op nieuwe box | — | nieuwsbars |
| Post-event discovery | binnen H8 min na high-impact event van base/quote | kalender | **eigen** variant, niet V1–V3 | altijd geblokkeerd in CBO_0.1 | eventtijd-onzekerheid |
| Chaotisch | ≥H9 richtingswissels van closes rond midden in n bars + lage efficiency ratio | close | geen | altijd | — |
| Abnormaal laag/hoog vol | vol-percentiel < H10 of > H11 | close | geen | altijd | feestdagen |

Alle regels gebruiken uitsluitend data t/m de laatst **gesloten** bar (geen `[0]` van een open HTF-bar).

## Multitimeframe-hiërarchie

| Profiel | Context | Trigger | Uitvoering |
|---|---|---|---|
| Intraday | 4H + 1H | 30m (alt. 15m) | 5m/15m (optioneel retest) |
| Swing | D + 4H | 1H (alt. 4H) | 1H |
| Auto | chart ≤15m → Intraday met trigger 15m; 30m–1H → Intraday trigger = chart; ≥4H → Swing | | |
| Handmatig | gebruiker kiest context/trigger/uitvoering; waarschuwing als chart-TF ≠ trigger-TF | | |

Normalisatie: boxduur in **minuten** én bars; breedte in ATR(trigger) en in gerealiseerde vol; afstanden in boxbreedtes en R; nooit vaste pips.

## AMT als context (geen volume)
Toegestaan als meting: tijd-op-prijs binnen de feed, herhaalde terugkeer, acceptatie/terugkeer t.o.v. **verzegelde** balans (pas zichtbaar na een eigen gevalideerde regel). Native TradingView TPO is voldoende als visuele context in een aparte onderzoekslayout; eigen TPO-engine niet bouwen tenzij meting meerwaarde aantoont.

## Prijsreferenties
PDH/PDL, PWH/PWL, D/W open, Asia (09–15 Asia/Tokyo), London IB (08–09 Europe/London), NY OR (08–09 America/New_York), grenzen van eerdere verzegelde boxen, swing-H/L op contextTF (pivot met bevestiging = `ta.pivothigh(l, r)` → pas na r bars geldig), vorige eventrange. Alle labelen als `<provider>-feedreferentie`; dagindeling = providerdag (FXCM 17:00 New York) — te vergelijken met een vaste BFX-dag in onderzoek.

## Event engine
- Tijd tot eerstvolgend base/quote-event (high; medium optioneel), type (CB/inflatie/arbeid/groei/overig — vast veld gewenst), pre-blok H12 min, post-cooldown H13 min, post-event = eigen regime.
- "Geen event bekend" i.p.v. "vrij" zolang kalenderdekking niet bewezen is.
- Vensters per eventtype vooraf vastleggen (CB ruimer); niet achteraf kiezen.

## Kosten en handelbaarheid
Spread niet betrouwbaar in Pine/CFD → **"kosten: niet gemeten"** tenzij een externe spreadtabel per paar/sessie wordt aangeleverd (gap). Wel meetbaar: stopafstand (R), ruimte tot eerstvolgende tegengestelde referentie in R, chasefilter (breakoutbar-range > H14 × boxbreedte), netto R na een *aangenomen* kostenpost (parameter, gelabeld als aanname).

## Mijn aanvullingen (getoetst op meetbaar/non-repainting)
1. **Ruimte als harde voorwaarde vóór de trigger**: CBO zoeken alleen als ruimte tot eerstvolgende tegengestelde referentie ≥ H15 × boxbreedte — vermindert de "correcte breakout zonder ruimte".
2. **Box-ID = hash(symbol, triggerTF, startTime, sealTime)** → reproduceerbaar na reload en bruikbaar als sleutel in een forwardlogboek (alert-payload).
3. **Forward-logging via alerts op bar close naar een webhook** (later, aparte toestemming): iedere state-overgang vastleggen met box-ID — dan is de forwardperiode controleerbaar.
4. **Twee-indicatorenaanpak** (Compass + Engine) i.p.v. één monoliet: tokenlimiet, testbaarheid en de mogelijkheid om de Engine alleen in een onderzoekslayout te draaien.
5. **"Macro-akkoord" niveaus** uit bestaande velden zonder nieuwe score: akkoord (|index| ≥ 15 en richting gelijk), neutraal, conflict (breakout tegen richting), verouderd.
