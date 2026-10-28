# Drie afzonderlijke metingen — nooit samentellen

Stand: 28-10-2026. Elke meting heeft een **eigen startmoment, eigen regels en eigen steekproef**. De tellingen worden nergens opgeteld,
vergeleken alsof ze hetzelfde zijn, of met één startdatum getoond.

| | BIAS_5.0-forward | CBO_0.1-F | STR_0.1-F |
|---|---|---|---|
| Wat wordt gemeten | macrorichting per valuta/paar (BFX-backend) | CBO-boxbreakouts V1/V2/V3, **zonder** biasfilter, alleen op prijs | setups van de Structure Engine (Bias 5.0 + structuur + CBO + poorten) |
| Start | **27-10-2026** (eerste forward-rij in `mirror_bias50_historie`) | **28-10-2026 00:00 UTC** | **29-10-2026 00:00 UTC** |
| Waar het leeft | database (`bron = 'forward'`) | Pine-teller in de indicator "BFX CBO Research Engine 0.1" | Pine-teller in "BFX Structure Engine 0.1" + (voorstel) append-only logboek |
| Bevroren | backend-versie BIAS50_1.x (backendbeleid) | sha256 `6d9259d6…` (template) | sha256 in `STR-0.1-FORWARD-BEVRIEZING.md` |
| Eenheid | dagwaarde per valuta | setup per box en per variant | setup per box (CONFIRMED) |
| Overlap | bron voor STR | geen; het gebruikt geen bias | gebruikt BIAS_5.0 en dezelfde CBO-**regels** (eigen telling, geen gedeelde teller) |
| Bewijsstatus | eerste forward-dagen | 0 forward-setups (28-10) | nog niet gestart |

## Regels voor weergave

- Op de kaart van de Structure Engine staat alleen **STR_0.1-F**, onder het kopje Research en alleen in Expanded.
- De CBO-engine toont alleen **CBO_0.1-F**.
- BIAS_5.0-forward staat op de website/backend en niet als teller in TradingView.
- Geen enkel verslag telt de setups van CBO_0.1-F en STR_0.1-F samen. Ook de bias-dagen worden niet als "setups" gerekend.
- Een CBO-breakout in STR is **niet** dezelfde observatie als een CBO_0.1-F-setup. STR heeft andere poorten en andere exits.
