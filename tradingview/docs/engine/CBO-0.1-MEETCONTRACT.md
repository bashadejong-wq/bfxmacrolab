# CBO_0.1 — meetcontract (te bevriezen vóór de eerste test)

| Onderdeel | Vastlegging (voorstel) |
|---|---|
| Versie | `CBO_0.1`; wijziging van een regel of drempel = nieuwe versie |
| Hash | sha256 van Pine-engine + parameterbestand, vastgelegd in testrapport |
| Data | Één provider: FXCM (`FX:`) via TradingView; standaard candles; geen HA/Renko/Kagi/P&F/LB/Range |
| Paren | 7 USD-majors + EURJPY, GBPJPY, AUDJPY, EURGBP (11); later uitbreiden |
| Tijdzones | Asia 09–15 Asia/Tokyo; LDN IB 08–09 Europe/London; NY OR 08–09 America/New_York; dag = providerdag (17:00 NY); week = provider-week |
| Profielen | Intraday (context 4H/1H, trigger 30m) en Swing (context D/4H, trigger 1H) — twee profielen, niet meer |
| Periode | ontwikkeling: data t/m 2025-12-31; **validatie (onaangeraakt)**: 2026-01-01 t/m 2026-08-31; **forward**: vanaf activatie, ≥ 8 weken signalering, ≥ 3 maanden voor conclusies |
| Bias | Alleen dagen met **forward** BIAS_5.0 (vanaf 27-10-2026) tellen voor de bias-voorwaarde. Ex-post teruggerekende bias mag alleen in een *apart gelabelde* retrospectieve toets (geen forwardbewijs). |
| States | zie CBO-STATE-MACHINE.md |
| Entry | V1: open volgende bar na breakout-close; V2: open volgende bar na retest-close; V3: open volgende bar na k-de close buiten box |
| Invalidatie | V1/V3: tegenoverliggende boxgrens + 0,1×ATR (H); V2: retest-extreem + 0,1×ATR (H) |
| Target | T1 = eerstvolgende feitelijke referentie in richting; T2 = 2R; (beide gemeten, geen optimalisatie) |
| Kosten | aangenomen spread per paar (parameter, gelabeld "aanname") + 0,2 pip slippage per kant (aanname); rapport ook *zonder* kosten |
| Fills | Bar Magnifier aan; stop én target in één bar → **stop eerst** (conservatief) |
| Gaps | weekendgap door stop → fill op open (slechter) |
| Events | geen nieuwe setup in [−60, +120] min rond CB, [−30, +60] rond overige high (vooraf vast) |
| Ontbrekende data | bias ontbreekt/verouderd → geen setup; kalender ontbreekt → geen setup ("onbekend") |
| Expiry | geen breakout binnen 2× boxduur na seal → VERLOPEN; open setup na 32 bars → sluiten op close (tijdexit, gemeten) |
| Overlap | max. 1 actieve setup per paar/richting |

## Metingen (per paar × profiel × sessie × regime × variant)
kandidaten, verzegeld, breakouts, bevestigd, dekking (% dagen met setup), winrate, gem./mediaan R, expectancy, profit factor, max drawdown (R), MAE/MFE, false-break-rate, holding time, na kosten, eventblootstelling, long/short, per jaar/kwartaal, bootstrap-95%-banden, parameterstabiliteit (±1 stap rond elke H).

## Baselines (verplicht in hetzelfde rapport)
1. Bias 5.0 alleen (entry op dagopen in biasrichting, zelfde stop/target-regels)
2. CBO zonder bias (beide richtingen)
3. Willekeurige entry op dezelfde tijdstippen
4. Eenvoudig momentum (close > close[n])
5. Altijd neutraal (dekkingsreferentie)
