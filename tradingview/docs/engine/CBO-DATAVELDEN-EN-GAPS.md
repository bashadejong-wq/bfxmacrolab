# BFX Context Layer — datavelden en gaps

Alleen velden die **aantoonbaar bestaan** (kolommen gecontroleerd 27-10). Alles anders staat in de gap-lijst.

## Bestaande velden (bron → veld)

| Gewenst | Bestaat als | Bron |
|---|---|---|
| Bias 5.0 per valuta | `index`, `label`, `kernscore_100`, `dekking`, `zekerheid`, `conflict`, `datum`, `versie` | `mirror_bias50` |
| Relatieve bias paar | `paar_index` (= (basis − quote)/2), `paar_label`, `paar_richting_tekst` | `mirror_bias50_paar` |
| Al gelopen | `gelopen_z`, `gelopen_emmer` | `mirror_bias50_paar` |
| Strategiebevestiging | `strategie_bevestiging`, `strategie_status`, `strategie_richting_valuta`, `strategie_peil` | `mirror_bias50_paar` |
| Kantelpunt | `kantelpunt_grens/afstand/richting/label_na/onderdeel/index_zonder/tekst` | `mirror_bias50_samenvatting` |
| Hoofdreden / tegenargument (benadering) | `top3_steun`, `top3_druk` (jsonb), `samenvatting_tekst`, `tradecontext_tekst` | `mirror_bias50_samenvatting` |
| Onderzoeksstatus | `onderzoeksstatus` | `mirror_bias50_samenvatting` |
| Historie (ex-post/forward) | `datum, valuta, index, bron, toonbaar` | `mirror_bias50_historie` |
| Economie / CB / rentemarkt per valuta | `laag_macro`, `laag_cb`, `laag_markt`, tekens, `bias`, `samenhang`, `policy_state`, `kwadrant` | `mirror_term_valuta` |
| Rentepad / vergaderkansen | `kans_op_stap_pct`, `ingeprijsd_bp`, `rente_nu`, `rente_na_vergadering`, `vergadering`, `peildatum`, `dagen_oud` | `mirror_meeting_pricing` |
| Paarthese / invalidatie / horizon | `invalidatie`, `katalysator(_datum)`, `horizon`, `laag`, `periode`, divergenties, `oordeel` | `mirror_outlook_paar` (7 USD-paren + EUR) |
| Tradebaarheid (ander systeem) | `trade_strength`, `status`, `richting_valuta`, `tegenspraak`, `breekpunt` | `mirror_paar_tradebaarheid` (alleen bevestigend/waarschuwend gebruiken) |
| Events | tijd, valuta, `impact`, naam, `consensus_waarde`, `previous_value`, `actual_value`, `upside/downside_scenario_nl`, `market_sensitivity`, `cache_ververst_op` | `mirror_agenda_events_site` |
| In lijn / gemengd scenario | `inline_scenario_nl`, `mixed_scenario_nl` | `mirror_event_paden` (nu 0 rijen komende 14 dagen) |
| Eventreactie achteraf | `pricing_voor/na`, `motor_voor/na`, `causaliteit` | `mirror_event_levenscyclus` |
| Bankenlaag (apart) | mediaan, band, `n_banken`, `herziening(_basis)`, `einddatum` | `mirror_fx_consensus` (n≥3: alleen EURUSD) |
| Positionering | COT `niveau_z_*`, `historical_extremeness`, `versheid` | `mirror_cot_signaal` |
| Risicoklimaat | `risk_signaal`, `d1w_pct`, `is_stale` | `mirror_risk_regime`, `mirror_key_risks` |

## Gaps (gewenst, niet aanwezig)

| Gewenst | Status | Gevolg voor de engine |
|---|---|---|
| **Geldig-tot** van Bias 5.0 | ontbreekt | gebruik "verwachte volgende verversing" (05:30 NL werkdag) als proxy; tonen als proxy |
| **Confidence** als expliciet getal | alleen `zekerheid` (tekst: laag/…) en `dekking` | toon die twee, geen eigen confidence verzinnen |
| **Horizon** per bias | ontbreekt in bias50 (wel `horizon` in outlook_paar: dagen/weken/maanden) | "Macrohorizon: dagen–weken" is een productbeschrijving, geen veld |
| **Hoofdreden in één veld** | alleen jsonb top3 | generator kan top-1 tonen; geen nieuwe interpretatie |
| **BFX-verwachting per event** (vooraf vastgelegd) | ontbreekt | niet tonen |
| **Scenario-effect per valuta** gestructureerd | alleen tekst | als tekst/tooltip |
| **Kalenderdekking-garantie** ("geen event" = zeker) | ontbreekt | engine toont "geen event bekend" i.p.v. "vrij" tot dekking bewezen is |
| **Spread / kosten per paar/sessie** | ontbreekt (CFD-feed geeft geen betrouwbare spread in Pine) | status "kosten: niet gemeten" |
| **Rollover-tijden** | ontbreekt | vaste definitie (17:00 NY) als documentatie, niet als data |
| **Eventtype-indeling** (CB/CPI/NFP…) | geen veld; nu afgeleid uit naam in Pine | voor de engine liever in de generator als vast veld (presentatie-afleiding, geen model) |
| **Yield-differentiaal per paar intraday** | niet in snapshot | buiten scope Pine; eventueel later via request.security op yield-symbolen (bronlabel nodig) |
