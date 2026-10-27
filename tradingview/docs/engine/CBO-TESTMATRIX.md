# CBO testmatrix

## Varianten (vooraf vast — niet uitbreiden zonder nieuwe versie)
| ID | Trigger | Bevestiging |
|---|---|---|
| V1 | breakout-close (body buiten box, close-location ≥ H) | direct |
| V2 | V1 + eerste retest binnen r_max bars | close terug in richting |
| V3 | V1 + k closes buiten box | geen close terug in box |

## Parameters (hypothesen; per stuk max. 3 waarden → geen onbeperkte grid)
| H | Betekenis | Waarden |
|---|---|---|
| n_min | min. boxduur (bars) | 8, 12, 16 |
| H_w | max. boxbreedte | 1,0 / 1,25 / 1,5 × ATR(14, trigger) |
| n_seal | bars zonder nieuwe extreem | 2, 3 |
| r_max (V2) | max. bars tot retest | 4, 8 |
| k (V3) | closes buiten box | 2, 3 |
| chase | max. breakoutbar-range | 1,5 / 2,0 × boxbreedte |
| ruimte | min. ruimte tot tegengestelde referentie | 1,0 / 1,5 R |
Totaal ±3·3·2·(2+2)·2·2 = 288 combinaties per profiel — **alle** rapporteren; selecteren op stabiliteit (buurtgemiddelde), niet op top-1.

## Dimensies
Paren (11) × profiel (2) × sessie (Asia/London/NY/overlap) × regime (5 handelbaar) × variant (3) × richting (long/short).

## Functionele tests (Pine, zonder markt)
- State-overgangen op synthetische reeksen (box vormt → seal → breakout → retest/mislukt/verlopen)
- Reload-identiek: zelfde box-ID's en states na herladen (vergelijk alert-log met historische herberekening)
- Geen gebruik van `timenow` in regels; geen niet-bevestigde HTF-waarden
- Synthetische charts → engine uit + waarschuwing
- Event-blok: box vervalt bij start pre-venster

## Visuele tests (presentatie)
5m/15m/30m/1h/4h · EURUSD/USDJPY/GBPJPY · licht/donker · 1440×900/1920×1080 · watchlist aan/uit · Minimal/Compact/Expanded.
