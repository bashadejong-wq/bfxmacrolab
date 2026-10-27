# Risico's en anti-overfitting

| Risico | Maatregel |
|---|---|
| Te veel varianten → toevalstreffer | max. 3 varianten, ≤3 waarden per parameter, alles rapporteren; Deflated Sharpe/PBO-achtige correctie (Bailey et al.) als rapportregel |
| Selectie op winrate | primair expectancy na kosten + stabiliteit; winrate alleen beschrijvend |
| Validatieperiode "per ongeluk" bekeken | validatie pas draaien na bevriezen; resultaat in één run; daarna niet meer tunen (anders nieuwe versie + nieuwe periode) |
| Ex-post bias als forwardbewijs | BIAS_5.0 heeft 1 forwarddag (27-10-2026); retrospectieve bias-toets apart labelen; echte bias-voorwaarde pas forward meetbaar |
| Repainting | alleen `isconfirmed`, HTF `[1]`+lookahead_on, alerts once-per-bar-close, geen `timenow` in regels |
| Intrabar fill-illusie | Bar Magnifier; stop-eerst bij gelijktijdige stop/target |
| Kosten onderschat | aannames expliciet; rapport met en zonder kosten; JPY-pipwaarde |
| Provider-afhankelijke levels | één provider in CBO_0.1; providervergelijking (FXCM/OANDA) apart |
| Regime-classificatie lekt toekomst | regimes uitsluitend uit gesloten contextbars |
| Event-onzekerheid | "onbekend" ≠ "vrij"; vensters vooraf |
| Overlappende setups | max. 1 per paar/richting |
| Dataverschuiving na herladen | box-ID + vergelijking alert-log vs. historische herberekening |
| Productiedruk | geen statuslabel "bevestigd" in productie-Compass vóór forward-resultaat en expliciet besluit |
| Pine-limieten (tokens, objecten, requests) | Engine als aparte indicator; max. ±10 security-calls |
