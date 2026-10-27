# CBO presentatie-spec

## Chart (Compact)
- Max. 1 actieve box (dunne grenslijnen, vulling ≥ 95% transparant), label rechts: `CBO · verzegeld 14:30`.
- Na breakout: entryzone (alleen V2: retestzone tussen grens en grens ± 0,25×box, gelabeld *hypothese*), 1 invalidatielijn (rood, stippel), max. 2 doelen (T1 referentie, T2 2R; grijs).
- 1 eventchip + 1 dunne lijn + 1 band (bestaand Compass-gedrag).
- Geen historische boxen (instelling "historie: uit/laatste 5").

## Setupkaart (Compact; ≤ 10 regels)
```
EUR/USD · BEARISH · −22          (BIAS50_1.1 · 27/10)
Macro     akkoord / neutraal / conflict / verouderd
Regime    compressie (H) · context 4H/1H
CBO       zoeken / vormt / verzegeld / breakout / retest / bevestigd / mislukt / verlopen
Locatie   0,4 ATR onder PDH (FX-feedreferentie)
Event     vrij* / blokkade tot 14:30 / onbekend      (*alleen als dekking bewezen)
Ruimte    1,9R tot PDL  |  onbekend
Kosten    niet gemeten  |  aanname x pip
Actie     wachten / onderzoeken / geblokkeerd
Onderzoeksstatus CBO_0.1 — geen bewezen edge
```
Kleur nooit als enige drager (tekst + kleur). Geen totaalscore; geen BUY/SELL/TRADE READY.

## Minimal (4 regels)
Paar+richting · CBO-status · event · actie.

## Expanded
+ boxkwaliteit (duur min/bars, breedte ATR, tests, close-skew), breakoutkwaliteit (body%, wick, close-location, chase), regime-maten, contexttimeframes, kostenaannames, box-ID, CBO-versie/hash.

## Thema/scherm
Automatisch via `chart.bg_color`; spacer voor legenda; kaartbreedte ≤ 25% op 1440; op < 1200 px breed automatisch Minimal (instelbaar).
