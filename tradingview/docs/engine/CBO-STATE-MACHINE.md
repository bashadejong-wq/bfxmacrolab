# CBO state machine (ontwerp CBO_0.1)

Alle overgangen alleen op **bevestigde bars** van het trigger-timeframe (`barstate.isconfirmed`). Contextdata uitsluitend van gesloten hogere-TF-bars (`request.security(..., expr[1], lookahead_on)`).

```
GEEN CONTEXT ─(bias geldig & |index|≥15 & regime ∈ {compressie, trend-pullback, balans-rand})→ CONTEXT GELDIG
CONTEXT GELDIG ─(n_min opeenvolgende bars binnen hoogte ≤ H_w·ATR)→ CONSOLIDATIE VORMT
CONSOLIDATIE VORMT ─(kwaliteitskandidaat: duur ≥ n_min, tests boven/onder ≥ H_t)→ BOX KANDIDAAT
BOX KANDIDAAT ─(seal-regel: n_seal bars zonder nieuwe high/low buiten de box)→ BOX VERZEGELD
BOX VERZEGELD ─(close buiten box in macrorichting, definitieregels B1–B3)→ BREAKOUT
BREAKOUT ─V1→ SETUP BEVESTIGD
BREAKOUT ─V2: retest binnen r_max bars, close weer in richting→ SETUP BEVESTIGD
BREAKOUT ─V3: k closes buiten box zonder close terug in box→ SETUP BEVESTIGD
SETUP BEVESTIGD → ACTIEF (handmatige uitvoering; engine volgt alleen)
* → MISLUKT     : close terug in box (V1/V3) of retest faalt (V2)
* → VERLOPEN    : geen breakout binnen e_max bars na seal, of setup ouder dan t_max
* → EVENT BLOCK : start pre-eventvenster; na cooldown terug naar GEEN CONTEXT (box vervalt)
* → GEEN CONTEXT: bias verouderd/neutraal, richting wisselt, regime wordt chaotisch/expansie
```

## Grenzen en verzegeling
- **Bewegen mag** alleen in VORMT/KANDIDAAT: boxHigh = max(high), boxLow = min(low) van de bars in de box.
- **Verzegeling**: op de bevestigde bar waarop de seal-regel waar wordt. Vanaf dat moment zijn `sealHigh/sealLow/sealTime` constant (`var`), ook na herladen.
- **Wat bekend was bij seal**: alleen OHLC t/m de seal-bar, bias-snapshot van die dag, kalender van die snapshot.
- **Kandidaat vervalt** als: een bar sluit buiten de voorlopige box vóór seal (dan nieuwe opbouw), breedte > H_w·ATR, of event-venster begint.
- **Geen achteraf verschuiven**: breakout wordt alleen beoordeeld tegen `seal*`; geen herberekening van eerdere boxen bij later binnenkomende data.

## Stabiele ID en reproduceerbaarheid
- `boxId = str(symbol) + ":" + triggerTF + ":" + str(startTime) + ":" + str(sealTime)`.
- Pine herberekent historisch bar-voor-bar met dezelfde regels → zelfde boxen na reload, mits: alleen `isconfirmed`-logica, geen `timenow`/`barstate.isrealtime` in de regels, geen niet-bevestigde HTF-waarden.
- Realtime ≠ historisch alleen bij intrabar-gedrag; daarom besluiten uitsluitend op bar close (alerts: `alert.freq_once_per_bar_close`).

## Max. één actieve setup per paar en richting
Nieuwe box wordt pas gezocht na MISLUKT/VERLOPEN/afgesloten ACTIEF. Tegengestelde richting: niet zoeken zolang bias niet wisselt.
