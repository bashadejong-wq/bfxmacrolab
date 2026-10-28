# Waarom de macrowaarde op de chart verschilde (−12,96 · −13,0 · −16,1)

Onderzocht op 28-10-2026, ±11:30. **Er is geen formule gewijzigd.** Alle drie de getallen gebruiken dezelfde regel:
paarindex = (index basisvaluta − index quotevaluta) / 2, en een richting pas bij ≥ +15 (long) of ≤ −15 (short).

| Waar op de chart | Getal | Bron | Snapshot | available_at (geschreven) | Geldig voor | Betekenis |
|---|---|---|---|---|---|---|
| Paneel "BFX Macro" (productiescript BFX Macro Overlay, plot *Paarindex (echte meting)*) | **−12,96** | `mirror_bias50_historie`, 27-10, EUR −9,495 / USD 16,427 | 27-10 21:35 UTC (SNAPSHOT_ID 202610272135) | 27-10 12:09 UTC (`bias50_snapshot.vastgelegd_op`) | 27-10 | neutraal (\|x\| < 15) |
| Kaart "BFX CBO 0.1" (onderzoek) | **−13,0** "GEEN RICHTING" | `mirror_bias50_paar` 27-10 (−12,9611, afgerond) | 27-10 22:31 UTC | 27-10 12:09 UTC | 27-10, op 28-10 **verouderd** | neutraal én verouderd → geen richting |
| Kaart "BFX Structure Engine 0.1" (onderzoek) | **−16,1** SHORT | `mirror_bias50_historie`, 28-10, EUR −13,023 / USD 19,243 | 28-10 10:13 UTC | 28-10 04:13 UTC | vanaf 28-10 06:00 UTC | short (≤ −15) |

**Oorzaak van het zichtbare verschil**: de CBO-engine en het macropaneel draaien in de onderzoekslayout met een datablok van **27-10**,
want de verversing (LaunchAgent) staat uit. De Structure Engine is op 28-10 ververst.
Tussen de twee dagen ging EURUSD van −12,96 (neutraal) naar −16,13 (short), dus over de drempel.

**Oplossing in de onderzoekslayout** (geen formulewijziging, geen productie):
1. De Structure-kaart toont bij BIAS de datum en het moment waarop de bias geldig werd ("geldig sinds …").
   Dat is het oordeel voor de huidige candle.
2. In de onderzoekslayout worden het paneel "BFX Macro" en de kaart van "BFX CBO 0.1" **verborgen**: oogje uit, niet verwijderd, terug te zetten.
   Hun oordeel staat al in de Structure-kaart, en met hun verouderde datablok spreken ze die tegen.
   De CBO_0.1-F-teller rekent zichzelf bij tonen weer opnieuw uit uit de koershistorie; er gaat niets verloren.
3. In de productielayout ("BFX Automatisering") verandert niets.
