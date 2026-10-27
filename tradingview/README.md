# BFX Macro Overlay voor TradingView

Zet de macro-events, verwachtingen, scenario's en bias uit het BFX-systeem automatisch als indicator op je TradingView-charts, dagelijks of wekelijks.

```
Supabase (macro_events_calendar + entity_bias)
   │  node bfx-tv.mjs run   (dagelijks of wekelijks via planner)
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
- **Tabel** rechtsboven met de bias per valuta en de eerstvolgende events.
- **⚠ Data verouderd** in de tabel als de laatste update langer geleden is dan ingesteld (standaard 3 dagen).

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
- `SUPABASE_URL` en `SUPABASE_KEY`: dezelfde waarden als `VITE_SUPABASE_URL` en `VITE_SUPABASE_PUBLISHABLE_KEY` van de app.
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

Dagelijks om 07:00 op werkdagen:
```bat
schtasks /Create /TN "BFX TradingView" /SC WEEKLY /D MA,DI,WO,DO,VR /ST 07:00 /TR "cmd /c cd /d C:\pad\naar\bfxmacrolab\tradingview && node bfx-tv.mjs run >> run.log 2>&1"
```
Wekelijks op zondag 18:15:
```bat
schtasks /Create /TN "BFX TradingView" /SC WEEKLY /D ZO /ST 18:15 /TR "cmd /c cd /d C:\pad\naar\bfxmacrolab\tradingview && node bfx-tv.mjs run >> run.log 2>&1"
```
(Op een Engelstalige Windows: `MON,TUE,WED,THU,FRI` en `SUN`.) Vink in Taakplanner bij de taak aan: *Taak zo snel mogelijk uitvoeren na een gemiste geplande start*.

### Mac (cron)

`crontab -e` en voeg toe (pas pad en node-locatie aan; `which node` geeft het pad):
```cron
# dagelijks 07:00 op werkdagen
0 7 * * 1-5  cd ~/bfxmacrolab/tradingview && /usr/local/bin/node bfx-tv.mjs run >> run.log 2>&1
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
- **Testdata:** `examples/week44-eurusd.json` (+ `.pine`) is gebouwd uit de FMP-kalender voor week 44 en bevat geen bias-data. Probeer met `npm run example`.
