# CBO_0.1 — forward-bevriezing (besluit Bas, 27-10-2026)

> **ONDERZOEKSVERSIE — GEEN BEWEZEN EDGE.** Forward volgen betekent: kijken wat de regels doen op data die bij het vastleggen nog niet bestond. Geen databaselogboek (besluit Bas).

## Wat is bevroren
- **Versie:** CBO_0.1-F
- **Startmoment forward:** 28-10-2026 00:00 UTC (01:00 Amsterdam). Alleen setups waarvan de box ná dit moment verzegeld is én de entry ná dit moment ligt, tellen mee.
- **Parameters:** alle HYPOTHESE-waarden zoals in de standaardinstellingen (box 8–24 bars, ≤ 1,25 ATR, seal na 3 bars, body ≥ 50%, V2 ≤ 8 bars, V3 2 closes, stopbuffer 0,1 ATR, tijdexit 32 bars, eventvensters 60/120 en 30/60 min, post-event 180 min, profiel Auto).
- **Template-hash (sha256):** `6d9259d6f9f5535f65957083240d031bc2ac2200a1b42a26f3e6dc0f644fc1c3`

## Hoe de bevriezing bewaakt wordt
- De engine controleert zelf of alle parameters op de bevroren waarden staan (`fwdFrozen`). Zo niet, dan toont de regel **Forward**: *ONGELDIG — parameters wijken af van CBO_0.1* (screenshot 12).
- Een browservrije test (`npm test`) faalt als iemand een standaardwaarde wijzigt zonder de bevriezing mee te veranderen.
- Elke wijziging van een regel of drempel = **nieuwe versie (CBO_0.2)** met een nieuw startmoment. De CBO_0.1-F-telling begint dan niet opnieuw en wordt niet gemengd.

## Waar je het ziet
- Kaart (Compact en Expanded), regel **Forward**: per variant aantal en gemiddelde R, plus aantal nog open metingen (screenshot 11).
- Datavenster: `Fwd geldig`, `Fwd V1 n`, `Fwd V1 gem R`, … `Fwd V3 gem R`.
- Aflezen kan op elk paar/timeframe; de telling is reproduceerbaar omdat alles op gesloten bars wordt berekend.

## Wanneer kijken we serieus
- Niet eerder dan na **8 weken** signalering, conclusies niet vóór **3 maanden** (meetcontract).
- Ook dan bruto en zonder bias-filter, tenzij er dan apart besloten wordt over kosten en biasvoorwaarde.

## Grenzen
- Geen databaselogboek: de telling leeft in TradingView en wordt bij elk laden opnieuw uitgerekend uit de koershistorie. Dat is reproduceerbaar zolang de feed dezelfde bars levert. Bij een correctie van historische bars door de provider kan een telling verschuiven; dat is dan niet te reconstrueren zonder logboek.
- TradingView laadt ongeveer 20.000 bars: op 15m reikt dat ±7 maanden terug, ruim genoeg voor de meetperiode.
