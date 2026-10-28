# BFX Structure Engine 0.1 — testverslag fase 1 (28-10-2026)

Onderzoekslayout "BFX CBO Onderzoek" (DcotUC2P), TradingView-feed FXCM.
Alleen het nieuwe script "BFX Structure Engine 0.1" is toegevoegd. CBO 0.1, Volume en BFX Macro Overlay zijn ongewijzigd.
De productielayout is niet geopend, het productie-worktree staat op `ea1318a` en is schoon, en de LaunchAgent is uitgeladen.

## Resultaat

| Test | Uitkomst |
|---|---|
| Compileren (Pine v6) | geslaagd, geen fouten |
| Toevoegen aan chart | geslaagd, één instantie |
| Runtime: 7 majors × 30m/1H/4H/D | 28/28 zonder fout |
| HTF-consistentie | De 4H- en D-rij op 30m geven per paar dezelfde richting als de engine op de 4H- en D-chart zelf |
| Herladen (EURUSD 30m) | Alle tellingen identiek vóór en na het herladen van de pagina |
| Open candle | Tussen 08:24 en 08:31, binnen dezelfde open 30m-candle, veranderde geen enkele telling |
| CBO 0.1 onaangetast | EURUSD 30m: kandidaten 64, verzegeld 5, V1 n 5 (gelijk aan de nachtmeting) |
| `npm test` | 35/35 |

## Gevonden en gefixt tijdens het testen

1. Als swing en internal hetzelfde niveau braken of sweepten, kwamen er dubbele labels over elkaar ("iBoSS").
   Nu tekent alleen de hoogste laag, en per bar komt er één sweeplabel.
2. De plotshapes van de pivotbevestiging toonden "0.00000" in de legenda. Ze staan nu op `display.pane`.
3. De kaart viel over de CBO-kaart. De standaardpositie is nu linksonder.

## Eerste observaties (geen conclusies, geen edgeclaim)

- Op swingniveau komt **CHoCH ongeveer even vaak voor als BoS**. Op EURUSD 30m is dat 300 tegen 308 en op GBPUSD 30m 307 tegen 270.
  Een swingtrend wordt dus ongeveer even vaak omgekeerd als voortgezet. Dat moet de meetfase uitwijzen.
- ±25–30% van de zones wordt niet gemaakt omdat ze hoger zijn dan 1,5 ATR (`h_zMaxH`).
  Dit is een hypothese die in de meetfase bekeken moet worden; in fase 1 is er niets aan veranderd.
- Er ontstaan veel zones: ±1000 OB-P per paar per timeframe over ±22.000 bars. Er worden er per richting maar 2 getoond.

## Matrix (tellingen over de geladen historie)

| Paar | TF | fout | bars | S dir/stage | S BoS/CHoCH/sweep | I BoS/CHoCH/sweep | OB-P | OB-F | te hoog | PD% | 4H | D |
| EURUSD | 30 | false | 22616 | -1/3 | 308/300/302 | 517/561/579 | 1056 | 807 | 311 | 3 | -1 | -1 |
| GBPUSD | 30 | false | 22610 | -1/3 | 270/307/276 | 488/541/573 | 1029 | 787 | 291 | 2 | 1 | -1 |
| USDJPY | 30 | false | 22599 | 1/3 | 320/267/269 | 538/500/562 | 1019 | 784 | 341 | 74 | -1 | -1 |
| AUDUSD | 30 | false | 22612 | 1/2 | 304/306/294 | 559/535/593 | 1064 | 815 | 316 | 29 | 1 | -1 |
| USDCHF | 30 | false | 22553 | 1/3 | 286/315/294 | 515/545/583 | 1000 | 801 | 392 | 100 | -1 | 1 |
| USDCAD | 30 | false | 22594 | 1/3 | 305/285/277 | 536/527/564 | 1024 | 817 | 322 | 71 | -1 | 1 |
| NZDUSD | 30 | false | 22604 | -1/1 | 288/293/274 | 535/530/561 | 1062 | 822 | 320 | 27 | -1 | -1 |
| EURUSD | 60 | false | 23738 | -1/2 | 329/300/316 | 552/554/601 | 1061 | 791 | 395 | 3 | -1 | -1 |
| GBPUSD | 60 | false | 23736 | -1/3 | 344/308/317 | 545/558/599 | 1078 | 796 | 360 | 1 | 1 | -1 |
| USDJPY | 60 | false | 23736 | 1/1 | 328/282/282 | 567/533/536 | 1010 | 788 | 450 | 92 | -1 | -1 |
| AUDUSD | 60 | false | 23734 | 1/3 | 302/326/300 | 536/564/635 | 1070 | 824 | 376 | 49 | 1 | -1 |
| USDCHF | 60 | false | 23718 | 1/2 | 308/298/333 | 524/554/641 | 1018 | 783 | 414 | 99 | -1 | 1 |
| USDCAD | 60 | false | 23732 | 1/3 | 342/291/324 | 570/554/630 | 1083 | 808 | 369 | 86 | -1 | 1 |
| NZDUSD | 60 | false | 23730 | -1/1 | 315/302/310 | 539/555/615 | 1068 | 841 | 335 | 28 | -1 | -1 |
| EURUSD | 240 | false | 21473 | -1/1 | 315/281/258 | 535/501/516 | 993 | 776 | 346 | 0 | – | -1 |
| GBPUSD | 240 | false | 21472 | 1/2 | 305/279/253 | 540/506/520 | 963 | 785 | 394 | 51 | – | -1 |
| USDJPY | 240 | false | 21473 | -1/1 | 287/253/225 | 510/493/472 | 967 | 787 | 311 | 72 | – | -1 |
| AUDUSD | 240 | false | 21472 | 1/2 | 296/287/271 | 515/520/499 | 1034 | 816 | 293 | 64 | – | -1 |
| USDCHF | 240 | false | 21472 | -1/2 | 295/278/279 | 526/461/525 | 977 | 720 | 301 | 58 | – | 1 |
| USDCAD | 240 | false | 21472 | -1/1 | 286/286/259 | 550/507/549 | 1021 | 740 | 337 | 27 | – | 1 |
| NZDUSD | 240 | false | 21467 | -1/1 | 290/296/265 | 542/508/494 | 1049 | 844 | 272 | 27 | – | -1 |
| EURUSD | 1D | false | 14348 | -1/1 | 208/150/101 | 348/322/194 | 657 | 392 | 173 | 1 | – | – |
| GBPUSD | 1D | false | 14343 | -1/1 | 193/177/110 | 371/327/225 | 523 | 413 | 389 | 27 | – | – |
| USDJPY | 1D | false | 14338 | -1/2 | 186/150/75 | 342/304/180 | 473 | 355 | 397 | 82 | – | – |
| AUDUSD | 1D | false | 14338 | -1/1 | 173/178/98 | 338/339/182 | 461 | 366 | 430 | 40 | – | – |
| USDCHF | 1D | false | 14345 | 1/3 | 190/173/104 | 344/342/228 | 495 | 393 | 406 | 81 | – | – |
| USDCAD | 1D | false | 14347 | 1/3 | 175/175/119 | 332/337/245 | 496 | 401 | 381 | 56 | – | – |
| NZDUSD | 1D | false | 14287 | -1/2 | 195/185/111 | 310/375/216 | 466 | 364 | 471 | 12 | – | – |

"S dir/stage": richting (1 bullish, −1 bearish) en stage (1 mogelijke shift, 2 shift bevestigd, 3 continuation, 4 verzwakt).
"–" betekent dat de rij niet wordt opgevraagd omdat de chart-TF niet lager is.

## Screenshots

- `screenshots/01-eurusd-30m.png`
- `screenshots/02-gbpusd-4h.png`

## Niet in fase 1 (volgende fases)

- ~~OB-R~~ (fase 2 gedaan)
- ~~slimme referentielijnen~~ (fase 2 gedaan)
- ~~CBO-integratie~~ (fase 2 gedaan, zonder eventblokkade)
- ~~Bias 5.0- en eventkoppeling~~ (fase 3 gedaan)
- ~~execution gates en de statussen WATCH/ARMED/CONFIRMED~~ (fase 3 gedaan)
- ~~de modi Minimal/Compact/Expanded~~ (fase 4 gedaan)
- ~~JSON-alerts~~ (fase 4 gedaan) en het bewijslogboek
- bevriezen en de forwardmeting

---

# Fase 2 (28-10-2026, 08:45–09:00): CBO-koppeling, OB-R, referentielijnen

| Test | Uitkomst |
|---|---|
| Compileren | geslaagd, geen fouten |
| Runtime: 7 majors × 15m/30m/1H/4H/D | 35/35 zonder fout |
| CBO-module tegen CBO_0.1 (kandidaten/verzegeld/breakouts) | **35/35 exact gelijk** |
| OB-R tegen acceptaties | in elke combinatie gelijk aan het aantal acceptaties (er is geen OB-R overgeslagen) |
| Fase-1-tellingen | ongewijzigd (EURUSD 30m: S 308/300/302, zones 1056/807/311) |
| PDH/PDL | gelijk op 15m, 30m, 1H en 4H. Dit bevestigt dat de wick-candle juist wordt gevolgd |
| Herladen (EURUSD 30m, alle tellingen inclusief CBO) | identiek |
| `npm test` | 37/37 |

**Kanttekening**: op de D-chart komt de waarde van de dagcandle van de feed en kan PDL 0,5 pip afwijken.
Voorbeeld: EURUSD 1.11220 tegen 1.11225 intraday. Op D en hoger worden de dagniveaus niet getekend.

Het verschil met CBO_0.1 is bewust. De module heeft geen eventblokkade en geen meetslots.
In deze matrix gaf dat geen enkel telverschil, omdat er in de geladen historie geen verzegelde box binnen een eventvenster viel.

## Matrix fase 2

| Paar | TF | fout | CBO kand/verz/brk (STR) | CBO kand/verz/brk (CBO 0.1) | gelijk | acc/misl/verl | OB-R | PDH | PDL | S BoS/CHoCH |
|---|---|---|---|---|---|---|---|---|---|---|
| EURUSD | 15 | false | 43/4/4 | 43/4/4 | ja | 2/2/0 | 2 | 1.11768 | 1.11225 | 272/266 |
| GBPUSD | 15 | false | 47/2/2 | 47/2/2 | ja | 1/1/0 | 1 | 1.33490 | 1.33033 | 258/270 |
| USDJPY | 15 | false | 40/7/7 | 40/7/7 | ja | 6/1/0 | 6 | 157.976 | 157.422 | 280/246 |
| AUDUSD | 15 | false | 42/2/2 | 42/2/2 | ja | 2/0/0 | 2 | 0.70404 | 0.70093 | 294/276 |
| USDCHF | 15 | false | 44/3/3 | 44/3/3 | ja | 3/0/0 | 3 | 0.82946 | 0.82591 | 260/287 |
| USDCAD | 15 | false | 30/2/2 | 30/2/2 | ja | 2/0/0 | 2 | 1.40543 | 1.40086 | 280/274 |
| NZDUSD | 15 | false | 25/3/2 | 25/3/2 | ja | 2/0/1 | 2 | 0.57076 | 0.56712 | 279/277 |
| EURUSD | 30 | false | 64/5/5 | 64/5/5 | ja | 2/3/0 | 2 | 1.11768 | 1.11225 | 308/300 |
| GBPUSD | 30 | false | 41/9/9 | 41/9/9 | ja | 8/1/0 | 8 | 1.33490 | 1.33033 | 270/307 |
| USDJPY | 30 | false | 31/6/6 | 31/6/6 | ja | 4/2/0 | 4 | 157.976 | 157.422 | 320/267 |
| AUDUSD | 30 | false | 30/3/3 | 30/3/3 | ja | 2/1/0 | 2 | 0.70404 | 0.70093 | 304/306 |
| USDCHF | 30 | false | 33/2/2 | 33/2/2 | ja | 1/1/0 | 1 | 0.82946 | 0.82591 | 286/315 |
| USDCAD | 30 | false | 30/5/5 | 30/5/5 | ja | 3/2/0 | 3 | 1.40543 | 1.40086 | 305/285 |
| NZDUSD | 30 | false | 11/0/0 | 11/0/0 | ja | 0/0/0 | 0 | 0.57076 | 0.56712 | 288/293 |
| EURUSD | 60 | false | 59/2/2 | 59/2/2 | ja | 2/0/0 | 2 | 1.11768 | 1.11225 | 329/300 |
| GBPUSD | 60 | false | 60/2/2 | 60/2/2 | ja | 2/0/0 | 2 | 1.33490 | 1.33033 | 344/308 |
| USDJPY | 60 | false | 22/6/6 | 22/6/6 | ja | 4/2/0 | 4 | 157.976 | 157.422 | 328/282 |
| AUDUSD | 60 | false | 9/0/0 | 9/0/0 | ja | 0/0/0 | 0 | 0.70404 | 0.70093 | 302/326 |
| USDCHF | 60 | false | 16/1/1 | 16/1/1 | ja | 1/0/0 | 1 | 0.82946 | 0.82591 | 308/298 |
| USDCAD | 60 | false | 35/1/1 | 35/1/1 | ja | 1/0/0 | 1 | 1.40543 | 1.40086 | 342/291 |
| NZDUSD | 60 | false | 7/0/0 | 7/0/0 | ja | 0/0/0 | 0 | 0.57076 | 0.56712 | 315/302 |
| EURUSD | 240 | false | 7/0/0 | 7/0/0 | ja | 0/0/0 | 0 | 1.11768 | 1.11225 | 315/281 |
| GBPUSD | 240 | false | 3/0/0 | 3/0/0 | ja | 0/0/0 | 0 | 1.33490 | 1.33033 | 305/279 |
| USDJPY | 240 | false | 9/0/0 | 9/0/0 | ja | 0/0/0 | 0 | 157.976 | 157.422 | 287/253 |
| AUDUSD | 240 | false | 2/0/0 | 2/0/0 | ja | 0/0/0 | 0 | 0.70404 | 0.70093 | 296/287 |
| USDCHF | 240 | false | 2/0/0 | 2/0/0 | ja | 0/0/0 | 0 | 0.82946 | 0.82591 | 295/278 |
| USDCAD | 240 | false | 3/0/0 | 3/0/0 | ja | 0/0/0 | 0 | 1.40543 | 1.40086 | 286/286 |
| NZDUSD | 240 | false | 6/1/1 | 6/1/1 | ja | 1/0/0 | 1 | 0.57076 | 0.56712 | 290/296 |
| EURUSD | 1D | false | 0/0/0 | 0/0/0 | ja | 0/0/0 | 0 | 1.11768 | 1.11220 | 208/150 |
| GBPUSD | 1D | false | 0/0/0 | 0/0/0 | ja | 0/0/0 | 0 | 1.33490 | 1.33029 | 193/177 |
| USDJPY | 1D | false | 0/0/0 | 0/0/0 | ja | 0/0/0 | 0 | 157.976 | 157.422 | 186/150 |
| AUDUSD | 1D | false | 0/0/0 | 0/0/0 | ja | 0/0/0 | 0 | 0.70404 | 0.70092 | 173/178 |
| USDCHF | 1D | false | 0/0/0 | 0/0/0 | ja | 0/0/0 | 0 | 0.82947 | 0.82591 | 190/173 |
| USDCAD | 1D | false | 0/0/0 | 0/0/0 | ja | 0/0/0 | 0 | 1.40546 | 1.40086 | 175/175 |
| NZDUSD | 1D | false | 0/0/0 | 0/0/0 | ja | 0/0/0 | 0 | 0.57076 | 0.56705 | 195/185 |

Screenshots: `screenshots/03-usdjpy-15m-cbo.png` (box geaccepteerd ↑, referenties PDL/PWH) en `screenshots/04-gbpusd-30m-cbo.png`.

---

# Fase 3 (28-10-2026, 09:05–09:20): Bias 5.0, events, eventblokkade, poorten

Snapshot: `node src/structure-generate.mjs` (alleen lezen): 28 paren, 36 high-impact events, BIAS50_1.2 van 28-10.
`buildEngine` kreeg alleen een optionele templateparameter. De CBO-uitvoer is aantoonbaar gelijk: hash vóór en na `bc9a6613…`.

| Test | Uitkomst |
|---|---|
| Compileren | geslaagd, geen fouten |
| Runtime: 7 majors × 15m/30m/1H/4H | 28/28 zonder fout |
| CBO-module tegen CBO_0.1, nu mét eventblokkade en post-event-regime | **28/28 exact gelijk** |
| Herladen (EURUSD 30m) | alle tellingen en de status identiek; alleen de live "Swing PD %" verschilt door de koers van de lopende candle |
| `npm test` | 39/39 (onder meer: onbekend telt nooit als ok, CONFIRMED-regel, generator) |
| EURUSD 30m nu | **WATCH · SHORT-zijde**. Bias −16,1 (short) ✓, 4H ✓, maar locatie ✕ (discount 10%) en geen verzegelde box |
| GBPUSD 30m nu | **BLOCKED**: macro ✕, index +1,9 (drempel ±15) |
| Status over 28 combinaties | 22 BLOCKED, 6 WATCH, 0 ARMED/CONFIRMED |

**Waarom 0 CONFIRMED**: de macropoort geldt pas vanaf de biasdatum (28-10 00:00 UTC).
De historie daarvoor is bewust UNKNOWN, zodat er geen schijnresultaten met de bias van vandaag ontstaan.
CONFIRMED kan dus pas vanaf vandaag forward ontstaan.

**Bekende punten**

1. In Expanded is de kaart nu erg lang: hij valt op een 1000 px hoog scherm over de legenda. Compact is wel goed.
   Herontwerp van de modi = latere fase.
2. De CBO-engine in dezelfde layout toont nog de snapshot van 27/10 23:31 (bias "verouderd").
   Dat komt doordat de LaunchAgent uit staat; het is geen fout van deze engine.
3. Kosten: de pip-omrekening gebruikt `mintick ≤ 0.001 → ×10`. Daardoor rekenen JPY-paren goed.
   In CBO_0.1 staat `< 0.001`; dat is een kleine fout bij JPY, maar CBO is bevroren en blijft ongewijzigd.

## Matrix fase 3

| Paar | TF | fout | CBO STR | CBO 0.1 | gelijk | eventblok | setup-status nu | CONFIRMED | FAILED/DOEL/EXPIRED |
|---|---|---|---|---|---|---|---|---|---|
| EURUSD | 15 | false | 43/4/4 | 43/4/4 | ja | 0 | WATCH | 0 | 0/0/0 |
| GBPUSD | 15 | false | 47/2/2 | 47/2/2 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDJPY | 15 | false | 40/7/7 | 40/7/7 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| AUDUSD | 15 | false | 42/2/2 | 42/2/2 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDCHF | 15 | false | 44/3/3 | 44/3/3 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDCAD | 15 | false | 30/2/2 | 30/2/2 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| NZDUSD | 15 | false | 25/3/2 | 25/3/2 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| EURUSD | 30 | false | 64/5/5 | 64/5/5 | ja | 0 | WATCH | 0 | 0/0/0 |
| GBPUSD | 30 | false | 41/9/9 | 41/9/9 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDJPY | 30 | false | 31/6/6 | 31/6/6 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| AUDUSD | 30 | false | 30/3/3 | 30/3/3 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDCHF | 30 | false | 33/2/2 | 33/2/2 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDCAD | 30 | false | 30/5/5 | 30/5/5 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| NZDUSD | 30 | false | 11/0/0 | 11/0/0 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| EURUSD | 60 | false | 59/2/2 | 59/2/2 | ja | 0 | WATCH | 0 | 0/0/0 |
| GBPUSD | 60 | false | 60/2/2 | 60/2/2 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDJPY | 60 | false | 22/6/6 | 22/6/6 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| AUDUSD | 60 | false | 9/0/0 | 9/0/0 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDCHF | 60 | false | 16/1/1 | 16/1/1 | ja | 0 | WATCH | 0 | 0/0/0 |
| USDCAD | 60 | false | 35/1/1 | 35/1/1 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| NZDUSD | 60 | false | 7/0/0 | 7/0/0 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| EURUSD | 240 | false | 7/0/0 | 7/0/0 | ja | 0 | WATCH | 0 | 0/0/0 |
| GBPUSD | 240 | false | 3/0/0 | 3/0/0 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDJPY | 240 | false | 9/0/0 | 9/0/0 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| AUDUSD | 240 | false | 2/0/0 | 2/0/0 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| USDCHF | 240 | false | 2/0/0 | 2/0/0 | ja | 0 | WATCH | 0 | 0/0/0 |
| USDCAD | 240 | false | 3/0/0 | 3/0/0 | ja | 0 | BLOCKED | 0 | 0/0/0 |
| NZDUSD | 240 | false | 6/1/1 | 6/1/1 | ja | 0 | BLOCKED | 0 | 0/0/0 |

Screenshots: `screenshots/05-eurusd-30m-watch.png` (Compact, WATCH) en `screenshots/06-gbpusd-30m-expanded-blocked.png` (Expanded, BLOCKED met reden per poort).

---

# Fase 4 (28-10-2026, 09:25–09:50): kaartmodi en JSON-alerts

| Test | Uitkomst |
|---|---|
| Compileren | geslaagd, geen fouten |
| Runtime: 7 majors × 15m/30m/1H/4H | 28/28 zonder fout |
| CBO-module tegen CBO_0.1 | 28/28 gelijk |
| Herladen (EURUSD 30m, alle tellingen + status) | identiek |
| `npm test` | 43/43, met een test die het alertbericht echt opbouwt en met `JSON.parse` controleert (aanhalingstekens in teksten, `null` voor onbekend) |
| Minimal | 4 regels: "EURUSD · 30 \| SHORT · 4H bearish" → "WATCH \| geen box" → "wacht op een verzegelde CBO-box" |
| Compact | 9 regels: BIAS · STRUCTUUR · LOCATIE · TRIGGER · EVENT · SETUP · POORTEN |
| Expanded | Compact + 8 regels; past nu op een scherm van 1000 px (vóór fase 4 ±35 regels) |

**Tijdens het testen gerepareerd**

1. "Plan" en "Ruimte" gebruikten de laatst verzegelde box, ook als die oud was. Op EURUSD was dat de box van 1 september.
   Stop en ruimte gelden nu alleen bij een verzegelde box, een breakout of een recente acceptatie. Daar is een test voor toegevoegd.
2. Na de eerste save stond er "Add to chart" in plaats van een automatische update van de chart.
   Ik heb de nieuwe versie toegevoegd en de oude instantie (alleen deze eigen onderzoeksindicator) verwijderd. Bij de volgende save werkte de update weer vanzelf.
3. Supabase gaf één keer kort HTTP 503 ("schema cache"). Het compileerscript stopte netjes vóór het plakken; een herhaling slaagde.

**Alerts gebruiken**: in TradingView een alert maken op "BFX Structure Engine 0.1" met "Any alert() function call". Ik heb zelf geen alert aangemaakt.
Standaard komt er alleen een bericht bij een wissel van of naar ARMED en hoger. Dat is instelbaar via "Alerts bij statuswissel".

## Matrix fase 4

| Paar | TF | fout | CBO STR | CBO 0.1 | gelijk | status |
|---|---|---|---|---|---|---|
| EURUSD | 15 | false | 43/4/4 | 43/4/4 | ja | WATCH |
| GBPUSD | 15 | false | 47/2/2 | 47/2/2 | ja | BLOCKED |
| USDJPY | 15 | false | 40/7/7 | 40/7/7 | ja | BLOCKED |
| AUDUSD | 15 | false | 42/2/2 | 42/2/2 | ja | BLOCKED |
| USDCHF | 15 | false | 44/3/3 | 44/3/3 | ja | BLOCKED |
| USDCAD | 15 | false | 30/2/2 | 30/2/2 | ja | BLOCKED |
| NZDUSD | 15 | false | 25/3/2 | 25/3/2 | ja | BLOCKED |
| EURUSD | 30 | false | 64/5/5 | 64/5/5 | ja | WATCH |
| GBPUSD | 30 | false | 41/9/9 | 41/9/9 | ja | BLOCKED |
| USDJPY | 30 | false | 31/6/6 | 31/6/6 | ja | BLOCKED |
| AUDUSD | 30 | false | 30/3/3 | 30/3/3 | ja | BLOCKED |
| USDCHF | 30 | false | 33/2/2 | 33/2/2 | ja | BLOCKED |
| USDCAD | 30 | false | 30/5/5 | 30/5/5 | ja | BLOCKED |
| NZDUSD | 30 | false | 11/0/0 | 11/0/0 | ja | BLOCKED |
| EURUSD | 60 | false | 59/2/2 | 59/2/2 | ja | WATCH |
| GBPUSD | 60 | false | 60/2/2 | 60/2/2 | ja | BLOCKED |
| USDJPY | 60 | false | 22/6/6 | 22/6/6 | ja | BLOCKED |
| AUDUSD | 60 | false | 9/0/0 | 9/0/0 | ja | BLOCKED |
| USDCHF | 60 | false | 16/1/1 | 16/1/1 | ja | WATCH |
| USDCAD | 60 | false | 35/1/1 | 35/1/1 | ja | BLOCKED |
| NZDUSD | 60 | false | 7/0/0 | 7/0/0 | ja | BLOCKED |
| EURUSD | 240 | false | 7/0/0 | 7/0/0 | ja | WATCH |
| GBPUSD | 240 | false | 3/0/0 | 3/0/0 | ja | BLOCKED |
| USDJPY | 240 | false | 9/0/0 | 9/0/0 | ja | BLOCKED |
| AUDUSD | 240 | false | 2/0/0 | 2/0/0 | ja | BLOCKED |
| USDCHF | 240 | false | 2/0/0 | 2/0/0 | ja | WATCH |
| USDCAD | 240 | false | 3/0/0 | 3/0/0 | ja | BLOCKED |
| NZDUSD | 240 | false | 6/1/1 | 6/1/1 | ja | BLOCKED |
Screenshots: `screenshots/07-modus-Minimal.png`, `07-modus-Compact.png`, `07-modus-Expanded.png`.

---

# Fase 5 (28-10-2026, 10:50–11:10): bias per dag + bevriezing STR_0.1-F

| Test | Uitkomst |
|---|---|
| Paarindex uit historie | (basis − quote) / 2 = `paar_index` (EURUSD 28-10: −16,13) |
| Datablok | 16 forward-biasrijen (27 en 28-10 × 8 valuta's); teruggerekende rijen niet opgenomen |
| Compileren | geslaagd |
| Kaart | FORWARD: "STR_0.1-F · start 29-10 01:00 · nog geen metingen"; Data-poort ✓ op forward-bias van 28/10 |
| Bewaking | swingpivot 11 → "ONGELDIG — parameters wijken af van STR_0.1"; terug op 10 → bevroren |
| CBO tegen CBO_0.1 | 64/5/5 = 64/5/5 |
| Herladen | identiek (alleen de live "Swing PD %" beweegt mee met de lopende candle) |
| `npm test` | 45/45 (onder meer: bevriezing gelijk aan de standaardwaarden, alleen forward-historie, 06:00 UTC en 96 uur, alert-JSON met forwardvelden) |

**Gevonden**: na een herlaadtest draaide de chart weer de vorige scriptversie, omdat de layout na het compileren nog niet was opgeslagen.
Opgelost met opnieuw toevoegen, de oude instantie verwijderen en de layout opslaan. Dit staat als vaste stap in het bevriezingsdocument.

Screenshots: `screenshots/08-forward-bevroren.png`, `screenshots/09-forward-ongeldig.png`.
