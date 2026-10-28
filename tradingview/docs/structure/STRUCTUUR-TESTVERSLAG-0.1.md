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

- OB-R
- slimme referentielijnen (PDH/PDL vanaf de echte wick)
- CBO-integratie
- Bias 5.0- en eventkoppeling
- execution gates en de statussen WATCH/ARMED/CONFIRMED
- de modi Minimal/Compact/Expanded volgens het nieuwe kaartontwerp
- JSON-alerts en het bewijslogboek
- bevriezen en de forwardmeting
