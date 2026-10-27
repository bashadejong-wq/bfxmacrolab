# BFX Macro Overlay voor TradingView

Zet de BIAS 5.0-stand en de macro-events uit het BFX-systeem automatisch als indicator op je TradingView-charts, dagelijks of wekelijks.

```
BIAS 5.0 (mirror_bias50_paar / mirror_bias50 / _samenvatting)  ── ververst werkdagen 05:13 NL
Events   (macro_events_calendar)
   │  node bfx-tv.mjs run   (werkdagen 06:00 via planner)
   ▼
Pine-code met data van -7 t/m +21 dagen
   ▼
Browser op jouw computer → Pine Editor → code vervangen → opslaan
   ▼
Telegram: ✅ bijgewerkt (screenshot)  of  ⚠️ mislukt (+ bestand om zelf te plakken)
```

## Wat je op de chart ziet

- **Verticale stippellijnen** op elk event voor de valuta's van de chart (EURUSD → EUR + USD), gekleurd naar impact.
- **Labels** met de eventnaam. Als je erop hovert zie je consensus, vorige waarde, de actual (als die er is) en het scenario.
- **Tabel** rechtsboven:
  - **BIAS 5.0 voor het paar van de chart**: paarindex (−100..+100, positief = basisvaluta sterker), label, en hoe ver de koers al gelopen is (`gelopen_emmer` + z). Staat een paar andersom in de data (bijv. CHFJPY vs JPYCHF), dan keert de indicator index en label om.
  - **Geen richting binnen ±15**: dan toont de indicator grijs "geen kant kiezen", ook als het label iets anders zou zeggen.
  - **Per valuta**: index, label, zekerheid, en **⚠ KCFI max 25%** bij `conflict = true`. Hover voor samenvatting, kantelpunt en strategiebevestiging.
  - **Komende events** met consensus en vorige waarde.
- **⚠ Verouderd / ⚠ BIAS oud** als de indicator of de BIAS-datum ouder is dan ingesteld (standaard 3 dagen).
- Komt er een kolom `strategie_bevestiging` bij in `mirror_bias50_paar`, dan verschijnt die automatisch per paar.

Events op hetzelfde moment worden samengevoegd tot één label (bijv. *US Core PCE m/m +4*).

## Eenmalige installatie (±10 minuten)

Nodig: **Node.js 18 of hoger** ([nodejs.org](https://nodejs.org)).

```bash
cd bfxmacrolab/tradingview
npm install
npx playwright install chromium
cp .env.example .env        # Windows: copy .env.example .env
```

Vul in `.env` in:
- `BIAS_SUPABASE_KEY`: de anon-sleutel van het BIAS 5.0-project (`BIAS_SUPABASE_URL` staat al goed).
- `SUPABASE_URL` en `SUPABASE_KEY` (voor de events): dezelfde waarden als `VITE_SUPABASE_URL` en `VITE_SUPABASE_PUBLISHABLE_KEY` van de app. Leeg laten = alleen BIAS 5.0.
- Optioneel `TELEGRAM_BOT_TOKEN` en `TELEGRAM_CHAT_ID` voor meldingen (bot aanmaken via @BotFather).

### Eerste keer in TradingView

1. Maak de code: `node bfx-tv.mjs generate`, dit schrijft `out/bfx_macro_overlay.pine`.
2. Start de login-browser: `node bfx-tv.mjs login`, log in bij TradingView.
3. Open in **dat venster** een chart → **Pine Editor** → *nieuw script* → plak de inhoud van `out/bfx_macro_overlay.pine` → **opslaan als "BFX Macro Overlay"** → **Add to chart**.
4. Laat dit script **open staan in de Pine Editor** en sluit het venster. TradingView onthoudt welk script open stond. Het afleverscript overschrijft alleen een script dat de regel `// BFX-MACRO-OVERLAY` bevat, nooit iets anders.
5. Test: `node bfx-tv.mjs run`. Er opent kort een browser, de code wordt vervangen en je krijgt een melding.

> Tip: zet de indicator op je chart-layout(s) en sla de layout op. Gebruik je een vaste layout, zet die URL dan in `TV_CHART_URL`.

## Automatisch laten draaien

De computer moet aanstaan en je moet ingelogd zijn in je besturingssysteem (er opent kort een browservenster).

### Windows (Taakplanner)

Dagelijks om 06:00 op werkdagen (na de BIAS-verversing van 05:13):
```bat
schtasks /Create /TN "BFX TradingView" /SC WEEKLY /D MA,DI,WO,DO,VR /ST 06:00 /TR "cmd /c cd /d C:\pad\naar\bfxmacrolab\tradingview && node bfx-tv.mjs run >> run.log 2>&1"
```
Wekelijks op zondag 18:15:
```bat
schtasks /Create /TN "BFX TradingView" /SC WEEKLY /D ZO /ST 18:15 /TR "cmd /c cd /d C:\pad\naar\bfxmacrolab\tradingview && node bfx-tv.mjs run >> run.log 2>&1"
```
(Op een Engelstalige Windows: `MON,TUE,WED,THU,FRI` en `SUN`.) Vink in Taakplanner bij de taak aan: *Taak zo snel mogelijk uitvoeren na een gemiste geplande start*.

### Mac: één commando (aanbevolen)

```bash
cd ~/pad/naar/bfxmacrolab/tradingview
./setup/mac-install.sh            # werkdagen 06:00
./setup/mac-install.sh --weekly   # of: zondag 18:15
```
Dit installeert alles en plant de taak in via launchd. Sliep de Mac om 06:00, dan draait de taak zodra hij wakker wordt. Uitzetten met `./setup/mac-uninstall.sh`. Logboek: `logs/run.log`.

### Mac (handmatig met cron)

`crontab -e` en voeg toe (pas pad en node-locatie aan; `which node` geeft het pad):
```cron
# dagelijks 06:00 op werkdagen (na de BIAS-verversing van 05:13)
0 6 * * 1-5  cd ~/bfxmacrolab/tradingview && /usr/local/bin/node bfx-tv.mjs run >> run.log 2>&1
# of wekelijks zondag 18:15
15 18 * * 0  cd ~/bfxmacrolab/tradingview && /usr/local/bin/node bfx-tv.mjs run >> run.log 2>&1
```

## Liever zelf plakken?

Zet `DELIVERY=manual` in `.env`. Dan maakt het script alleen de code en stuurt het bestand via Telegram; jij plakt het in de Pine Editor (±30 sec).

## Als het misgaat

| Melding | Oplossing |
|---|---|
| Niet ingelogd | `node bfx-tv.mjs login` en opnieuw inloggen |
| Script 'BFX Macro Overlay' niet open | Open het script één keer in de Pine Editor in het login-venster |
| Knop Pine Editor niet gevonden | TradingView heeft de interface veranderd; plak de bijlage handmatig en meld het, dan passen we `src/deliver.mjs` aan |
| Compilefout | Er is niet opgeslagen; de oude versie blijft staan. Stuur het Pine-bestand door ter controle |

## Aandachtspunten

- **Tijden:** `EVENT_TIMES_ARE_UTC=true` gaat ervan uit dat `event_datetime` in UTC staat. Controleer bij de eerste run of bijvoorbeeld het FOMC-besluit op het juiste tijdstip staat.
- **Gebruiksvoorwaarden:** TradingView staat geautomatiseerde toegang formeel niet toe. Eén update per dag of week op je eigen account is beperkt, maar het risico is niet nul. Met `DELIVERY=manual` vermijd je dit volledig.
- **BIAS-datum:** de run meldt het als BIAS 5.0 niet van de laatste werkdag is; de indicator toont dan de oude stand met waarschuwing.
- **Testdata:** `examples/week44-eurusd.json` (+ `.pine`) bevat de events van week 44 (FMP-kalender) en de echte BIAS 5.0-stand van 27-10-2026. Probeer met `npm run example`.
