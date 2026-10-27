# Spec: `fx_forecasts` + consensusview voor TradingView

Doel: koersramingen van banken (Danske, ING, KBC, MUFG, Nordea, …) per paar en horizon vastleggen. Op de TradingView-chart verschijnt dan per horizon een consensus-target, met de afzonderlijke banken, de spreiding en de herziening.

Uitgangspunt (check 27-10-2026): 22 van de 758 rapporten in de laatste 60 dagen noemen een raming met horizon. Dat is n = 3–5 banken per paar en horizon. Het ontwerp moet dus werken met **kleine n** en **transparant** zijn over wie wat zegt.

## 1. Tabel `fx_forecasts` (point-in-time, alleen toevoegen)

| Kolom | Type | Toelichting |
|---|---|---|
| `id` | bigserial | |
| `bron` | text | bank, genormaliseerd (`ING`, `Danske Bank`, …) |
| `rapport_id` | ref | rapport waaruit geëxtraheerd |
| `rapport_datum` | date | publicatiedatum = moment waarop de raming bekend werd (point-in-time) |
| `paar` | text | 6 letters in **dezelfde notatie als `mirror_bias50_paar.paar`** (bijv. `USDJPY`). Noteert de bank het andersom, dan omrekenen (1/x) en `omgerekend = true` zetten |
| `basis`, `quote` | text | zoals in `mirror_bias50_paar` |
| `horizon_label` | text | zoals de bank het noemt: `Q4-26`, `eind 2026`, `3m`, `12m` |
| `horizon_datum` | date | genormaliseerd: kwartaal → laatste dag van het kwartaal; `eind 2026` → 2026-12-31; `3m`/`12m` → `rapport_datum` + periode, afgerond naar het dichtstbijzijnde kwartaaleinde |
| `target` | numeric | puntraming |
| `target_laag`, `target_hoog` | numeric null | als de bank een range geeft |
| `spot_bij_raming` | numeric null | spot op `rapport_datum` (toont hoeveel de bank verwacht vanaf dat moment) |
| `citaat` | text | letterlijke zin uit het rapport, max. 300 tekens (controle) |
| `omgerekend` | bool | true als het paar is omgekeerd |
| `extractie_zekerheid` | text | `hoog` (getal + horizon expliciet) / `middel` / `laag` |
| `created_at` | timestamptz | |

Uniek: (`bron`, `paar`, `horizon_datum`, `rapport_datum`). Nooit overschrijven: een herziening is een nieuwe rij.

**Regels voor de extractie**
- Alleen getallen die de bank zelf als raming of target noemt, dus geen koersniveaus uit een marktbeschrijving.
- Geen horizon in de tekst betekent niet opnemen.
- `extractie_zekerheid = laag` niet meenemen in de consensus, wel bewaren.

## 2. View `v_fx_forecast_consensus`

Per `paar` × `horizon_datum`, alleen horizons die nog in de toekomst liggen:
- **Basis:** per bank de **laatste** raming met `rapport_datum` binnen **90 dagen**. Dat is ruimer dan 60, omdat banken maar eens per maand of kwartaal herzien.
- `n_banken`, `mediaan`, `min`, `max`, `banken` (json: bron, target, rapport_datum)
- `mediaan_4w`: dezelfde berekening **as-of vandaag − 28 dagen**, dus point-in-time en zonder kennis van later
- `herziening` = `mediaan − mediaan_4w`; `n_herzien_op` / `n_herzien_neer` (banken die in de laatste 4 weken herzien)
- `richting_vs_spot` = teken van (`mediaan` − actuele spot), alleen gevuld bij |verschil| > 0,5%
- `datum` (berekendag) en `versie`

Dezelfde ververstijd als BIAS 5.0 (werkdagen 05:13) is handig, dan kan de TradingView-run om 06:00 alles in één keer ophalen.

## 3. Wat de indicator ermee doet

- Per horizon met **n ≥ 2** een lijn van vandaag tot `horizon_datum` op de mediaan, met het label `Cons. eind-26 1.130 · n=4 · ↓0.012 (4w)`.
- **Een stip per bank** op de horizondatum. Als je erover hovert zie je bank, target, datum en citaat. Bij kleine n zegt dat meer dan een band.
- **Een band** (min–max) alleen bij n ≥ 4.
- **In de tabel een regel "Banken vs BIAS 5.0":**
  - consensusrichting ten opzichte van spot, naast de BIAS-paarrichting
  - **⚠ tegengesteld** als de consensus de ene kant op wijst en BIAS buiten ±15 de andere kant op
  - binnen ±15 (BIAS neutraal) alleen ter info
- **De herziening telt zwaarder dan het target.** Een pijl en het aantal banken dat herzag staan altijd in beeld.

## 4. Bewust niet

- Geen gemiddelde (gevoelig voor uitschieters bij n = 3–5); altijd de mediaan, met de afzonderlijke banken zichtbaar.
- Geen target zonder bron en datum.
- Het target is geen entry- of exit-signaal: bankramingen voorspellen zwak en lopen vaak achter de koers aan.
