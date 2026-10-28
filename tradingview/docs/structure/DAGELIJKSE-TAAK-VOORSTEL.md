# Voorstel: dagelijkse verversing Structure Engine (STR_0.1-F)

**Status: VOORSTEL — niets geactiveerd.** De LaunchAgent `nl.bfx.tradingview-structure` is niet geïnstalleerd. Alleen Bas beslist.

## Waarom

De forwardmeting STR_0.1-F heeft elke werkdag de nieuwe Bias 5.0 nodig. Zonder verversing wordt de bias na 96 uur UNKNOWN, en dan ontstaan er geen setups meer.
Met de hand vergeet je het snel. Dan ontstaat er een gat in de meting, of nog erger: er wordt vergeten **de layout op te slaan**,
en dan laadt TradingView de oude scriptversie.

## Wat de taak doet (`node src/structure-deliver.mjs`) — volledig ontwerp

| Stap | Wat | Stopt veilig als (exitcode) |
|---|---|---|
| 1. Wachten tot Bias 5.0 **aantoonbaar gereed** is | drie signalen uit de publieke views (alleen lezen): (a) alle 28 paren in `mirror_bias50_paar` hebben de datum van vandaag en één versie; (b) `mirror_bias50_historie` heeft 8 forward-rijen voor vandaag; (c) elke paarindex = (basis − quote) / 2 uit die rijen (± 0,01) | na 4 pogingen met 20 min ertussen nog niet gereed, of een tegenspraak tussen de bronnen (2). TradingView wordt niet aangeraakt |
| 2. Generator draaien | datablok bouwen; "eerst gezien" van vandaag vastleggen (= available_at); geldig vanaf max(06:00 UTC, eerst gezien) | marker ontbreekt, placeholder leeg, < 28 paren of < 8 biasrijen (2) |
| 3. Sessieconflict voorkomen | vóór de browser: is het profiel al open (Chromium-`SingletonLock`), draait `bfx-tv.mjs` (de productietaak), of draait de TradingView-desktopapp (Bas)? Zo ja: wachten | na 3× 15 min nog bezet (8). TradingView wordt niet aangeraakt |
| 4. Script afleveren | alleen layout "BFX CBO Onderzoek"; alleen plakken bij editortitel "BFX Structure Engine 0.1" en een editor van ≥ 300 px breed | niet ingelogd (3), verkeerde layout (4), editor niet bruikbaar (5) |
| 5. Compilatie bevestigen | console moet `"BFX Structure Engine 0.1" saved.` tonen, zonder fout | niet opgeslagen of een fout (6) |
| 6. Indicatorinstantie controleren | staat er "Add to chart", dan de nieuwe toevoegen en de oude verwijderen; daarna precies één instantie | ≠ 1 instantie (7) |
| 7. Layout opslaan | via het layoutmenu, niet via autosave | — |
| 8. Verse herlaadcontrole | de pagina opnieuw laden; in de Data Window moet "Datablok-id" gelijk zijn aan het nieuwe datablok | ander datablok na herladen (7) |
| 9. Snapshot en hash vastleggen | `logs/structure-runs.jsonl`: bias_datum, bias_versie, bias_eerst_gezien, bewijs van gereedheid, template_sha256, code_sha256, datablok_id, sessiecontrole, console, screenshot | — |
| 10. Melden | Telegram (als ingesteld), anders alleen het log | — |

De droogtest van 28-10 (`--dry`) gaf exitcode 0: gereed (28 paren 28-10, één versie, 8 historierijen, 0 inconsistent), eerst gezien 04:13 UTC.
De sessiebewaking meldde op 28-10 om ±11:40 terecht "TradingView-desktopapp is open (Bas)".

## Tijdstip

**Werkdagen 06:05 Amsterdam.**
- De bias van vandaag staat er rond 05:13 (28-10: 04:13 UTC).
- De productietaak (05:45) is dan klaar.
- Het is vóór de opening van Londen, dus de kans is klein dat je zelf in TradingView zit.

Het weekend is gedekt: de bias van vrijdag blijft 96 uur geldig, tot dinsdag 07:00.

## Risico's

| Risico | Maatregel |
|---|---|
| Eén TradingView-sessie per account: zit je om 06:05 zelf in TradingView, dan kan die sessie kort verbreken | de taak klikt bij "Session disconnected" zelf op Connect (zoals de productietaak); zo vroeg zit je er meestal niet |
| Productie- en onderzoekstaak tegelijk op hetzelfde profiel | 20 minuten na productie; de productietaak duurt ±5 minuten |
| TradingView verandert de interface | elke stap controleert zichzelf en stopt met een exitcode en een melding; er wordt niets half gedaan |
| Supabase-storing (503) | de taak stopt vóór TradingView; de vorige versie blijft draaien (≤ 96 u geldig) |
| Productie of de layout van Bas | het script kent alleen DcotUC2P; een test controleert dat 6b31RP4L en NlsYkVmV nergens voorkomen |

## Getest (28-10)

- `--dry`: exit 0 · bias 28-10 · 28 paren · 36 events · 16 biasrijen · geldig-vanaf 27-10 12:09 UTC en 28-10 06:00 UTC.
- `npm test`: 46/46, onder meer de datacontrole, wachten op een late bias en de "eerst gezien"-regel.
- **Nog niet live gedraaid** in TradingView; dat is het volgende besluit.
  Dezelfde stappen heb ik vandaag wel met de hand uitgevoerd en gecontroleerd.

## Aanzetten (alleen na akkoord van Bas)

```bash
cp /Users/bashajong/Claude/bfx-cbo-research/tradingview/docs/structure/voorstel-nl.bfx.tradingview-structure.plist ~/Library/LaunchAgents/nl.bfx.tradingview-structure.plist
```

```bash
launchctl load ~/Library/LaunchAgents/nl.bfx.tradingview-structure.plist
```

Uitzetten: `launchctl unload ~/Library/LaunchAgents/nl.bfx.tradingview-structure.plist`.
