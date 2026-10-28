# STR_0.2 meetmatrix — EURUSD (FX = FXCM), 28-10-2026 12:26–12:31

Elke cel: preset gezet, timeframe gewisseld, 11 s gewacht, datavenster uitgelezen. Geen runtimefout in enige cel (`fout = false`).
**Let op:** deze meting is vóór de fix van de referenties en de ABSORPTION-PROXY-invalidatie (commit dd2ef8f). PDH = ∅ en ABS-verlopen = 0 hieronder zijn die fouten; de hermeting na de fix (CLEAN 15/30/240) gaf PDH 1,11768 en 234/273/215 verlopen/ongeldig.

| Preset | TF | fout | status | hash | richting d | context | CBO kand/verz/brk/acc | S BoS+CHoCH | FB | ACC | ABS-proxy | zones | bars |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CLEAN | 15 | false | WATCH | 504,597,872 | −1 | −1 | 43/4/4/2 | 538 | 513 | 949 | 62 | 24 | 20,466 |
| CLEAN | 30 | false | WATCH | 299,613,615 | −1 | −1 | 64/5/5/2 | 608 | 599 | 1,073 | 61 | 24 | 22,624 |
| CLEAN | 60 | false | WATCH | 299,613,615 | −1 | −1 | 59/2/2/2 | 629 | 596 | 1,104 | 65 | 24 | 23,742 |
| CLEAN | 240 | false | WATCH | 1,036,346,238 | −1 | −1 | 7/0/0/0 | 596 | 480 | 1,130 | 42 | 24 | 21,474 |
| CLEAN | 1D | false | N.V.T. | 828,939,660 | −1 | −1 | 0/0/0/0 | 358 | 280 | 746 | 21 | 24 | 14,348 |
| INTRADAY | 15 | false | WATCH | 1,499,141,629 | −1 | −1 | 43/4/4/2 | 538 | 513 | 949 | 62 | 24 | 20,466 |
| INTRADAY | 30 | false | WATCH | 1,410,676,362 | −1 | −1 | 64/5/5/2 | 608 | 599 | 1,073 | 61 | 24 | 22,624 |
| INTRADAY | 60 | false | WATCH | 1,410,676,362 | −1 | −1 | 59/2/2/2 | 629 | 596 | 1,104 | 65 | 24 | 23,742 |
| INTRADAY | 240 | false | WATCH | 2,147,408,985 | −1 | −1 | 7/0/0/0 | 596 | 480 | 1,130 | 42 | 24 | 21,474 |
| INTRADAY | 1D | false | N.V.T. | 1,940,002,407 | −1 | −1 | 0/0/0/0 | 358 | 280 | 746 | 21 | 24 | 14,348 |
| SWING | 15 | false | WATCH | 728,209,035 | −1 | −1 | 43/4/4/2 | 538 | 513 | 949 | 62 | 24 | 20,466 |
| SWING | 30 | false | WATCH | 523,224,778 | −1 | −1 | 64/5/5/2 | 608 | 599 | 1,073 | 61 | 24 | 22,624 |
| SWING | 60 | false | WATCH | 523,224,778 | −1 | −1 | 59/2/2/2 | 629 | 596 | 1,104 | 65 | 24 | 23,742 |
| SWING | 240 | false | WATCH | 1,259,957,401 | −1 | −1 | 7/0/0/0 | 596 | 480 | 1,130 | 42 | 24 | 21,474 |
| SWING | 1D | false | N.V.T. | 1,052,550,823 | −1 | −1 | 0/0/0/0 | 358 | 280 | 746 | 21 | 24 | 14,348 |
| FULL RESEARCH | 15 | false | WATCH | 1,720,129,571 | −1 | −1 | 43/4/4/2 | 538 | 513 | 949 | 62 | 24 | 20,466 |
| FULL RESEARCH | 30 | false | WATCH | 1,631,664,304 | −1 | −1 | 64/5/5/2 | 608 | 599 | 1,073 | 61 | 24 | 22,624 |
| FULL RESEARCH | 60 | false | WATCH | 1,631,664,304 | −1 | −1 | 59/2/2/2 | 629 | 596 | 1,104 | 65 | 24 | 23,742 |
| FULL RESEARCH | 240 | false | WATCH | 220,913,280 | −1 | −1 | 7/0/0/0 | 596 | 480 | 1,130 | 42 | 24 | 21,474 |
| FULL RESEARCH | 1D | false | N.V.T. | 13,506,702 | −1 | −1 | 0/0/0/0 | 358 | 280 | 746 | 21 | 24 | 14,348 |
| CUSTOM | 15 | false | WATCH | 1,929,060,255 | −1 | −1 | 43/4/4/2 | 538 | 513 | 949 | 62 | 24 | 20,466 |
| CUSTOM | 30 | false | WATCH | 1,840,594,988 | −1 | −1 | 64/5/5/2 | 608 | 599 | 1,073 | 61 | 24 | 22,624 |
| CUSTOM | 60 | false | WATCH | 1,840,594,988 | −1 | −1 | 59/2/2/2 | 629 | 596 | 1,104 | 65 | 24 | 23,742 |
| CUSTOM | 240 | false | WATCH | 429,843,964 | −1 | −1 | 7/0/0/0 | 596 | 480 | 1,130 | 42 | 24 | 21,474 |
| CUSTOM | 1D | false | N.V.T. | 222,437,386 | −1 | −1 | 0/0/0/0 | 358 | 280 | 746 | 21 | 24 | 14,348 |

**Pariteit met STR_0.1 (meetmatrix-2810):** CBO 43/4/4 · 64/5/5 · 59/2/2 · 7/0/0 en swingbreaks 538 · 608 · 629 · 596 zijn **identiek** op 15/30/60/240. De nieuwe modules veranderen de bestaande detectie niet.

**Hash:** verschilt per preset en per profiel; 30m en 1H delen profiel 2 en dus dezelfde hash. Timeframe, paar en feed zitten bewust niet in de hash: die zijn aparte sleutels in elke meting.
