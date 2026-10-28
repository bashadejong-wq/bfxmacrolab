# Voorstel: dagelijkse verversing Structure Engine (STR_0.1-F)

**Status: VOORSTEL — niets geactiveerd.** De LaunchAgent `nl.bfx.tradingview-structure` is niet geïnstalleerd. Alleen Bas beslist.

## Waarom

De forwardmeting STR_0.1-F heeft elke werkdag de nieuwe Bias 5.0 nodig. Zonder verversing wordt de bias na 96 uur UNKNOWN, en dan ontstaan er geen setups meer.
Met de hand vergeet je het snel. Dan ontstaat er een gat in de meting, of nog erger: er wordt vergeten **de layout op te slaan**,
en dan laadt TradingView de oude scriptversie.

## Wat de taak doet (`node src/structure-deliver.mjs`)

1. **Data:** de BFX-snapshot ophalen (alleen lezen) en het datablok bouwen.
   Controle: marker aanwezig, geen lege placeholders, ≥ 28 paren, ≥ 8 forward-biasrijen en **de bias van vandaag**.
   Ontbreekt die bias, dan wacht de taak 3× 20 minuten. Daarna stopt hij **zonder TradingView aan te raken** (exit 2).
2. **Eerst gezien:** per biasdag noteert de taak wanneer hij de dag voor het eerst zag (`out/bias-eerst-gezien.json`).
   Een dag geldt pas vanaf het latere van **06:00 UTC** en **eerst gezien**, dus nooit voordat de bias bestond.
   (27-10 is om 12:09 UTC geschreven, ná 06:00. Met alleen de klokregel had de engine die dag te vroeg gebruikt.)
3. **TradingView**, met hetzelfde ingelogde profiel als de productietaak, **altijd zichtbaar en nooit headless**:
   - alleen layout **"BFX CBO Onderzoek"** (DcotUC2P), anders stoppen (exit 4);
   - alleen plakken als de Pine Editor **"BFX Structure Engine 0.1"** toont én breed open staat, anders stoppen (exit 5);
   - opslaan en controleren op "saved" zonder fout (exit 6);
   - staat er "Add to chart", dan de nieuwe versie toevoegen en de oude instantie verwijderen; er moet precies één instantie zijn;
   - **de layout expliciet opslaan**;
   - **herladen** en in de Data Window controleren dat "Datablok-id" de nieuwe versie is (exit 7 als niet).
4. Een logregel in `logs/structure-runs.jsonl`, een screenshot in `logs/` en een melding (Telegram als dat is ingesteld).

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
