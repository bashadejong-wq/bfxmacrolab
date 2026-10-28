// Evaluatie STR_0.1-F uit het append-only logboek. Vooraf vastgelegd (28-10-2026, vóór de forwardstart):
// - per cel = paar × timeframe, NOOIT opgeteld over cellen (vergelijkbaarheid is niet aangetoond);
// - minimum per cel vóór enige beoordeling: N ≥ 30, ≥ 20 onafhankelijke handelsdagen, ≥ 2 regimes, ≥ 12 weken looptijd;
// - netto = bruto − (spread + 2 × slippage) / risico; spreads zijn AANNAMES (geen brokerdata);
// - false break = FAILED met MFE < 0,5 R; sessies op UTC-uur van bevestiging.
// Uitkomsten zonder de minima heten "onvoldoende data — geen conclusie". Er bestaat geen uitkomst "edge bewezen".
export const PAREN = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "NZDUSD", "USDCAD", "USDCHF"];
export const TFS = ["15", "30", "60", "240"];
export const MINIMA = Object.freeze({ n: 30, dagen: 20, regimes: 2, weken: 12 });
export const SPREAD_PIPS = Object.freeze({ EURUSD: 0.6, GBPUSD: 0.9, USDJPY: 0.7, AUDUSD: 0.8, NZDUSD: 1.2, USDCAD: 1.2, USDCHF: 1.1 });
export const SLIP_PIPS = 0.2;
export const VARIANTEN = ["V1 CBO", "V2 Bias", "V3 Structure", "V4 Bias+CBO", "V5 Bias+Structure+CBO", "V6 Volledig"];
const pip = (sym) => (sym.includes("JPY") ? 0.01 : 0.0001);
const pair = (tickerid) => String(tickerid).split(":").at(-1);

export function session(iso) {
  const h = new Date(iso).getUTCHours();
  return h >= 7 && h < 12 ? "Londen" : h >= 12 && h < 21 ? "New York" : h >= 21 && h < 23 ? "laat" : "Azië";
}

export function metrics(trades, { start, now = Date.now() } = {}) {
  const t = [...trades].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  const n = t.length;
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const median = (xs) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  let eq = 0;
  let pk = 0;
  let dd = 0;
  for (const x of t) {
    eq += x.netto ?? x.r;
    pk = Math.max(pk, eq);
    dd = Math.max(dd, pk - eq);
  }
  const dagen = new Set(t.map((x) => x.t.slice(0, 10))).size;
  const regimes = new Set(t.map((x) => x.regime).filter(Boolean)).size;
  const weken = start ? (now - Date.parse(start)) / (7 * 86400000) : 0;
  const exp = t.filter((x) => x.uitkomst === "EXPIRED");
  const fail = t.filter((x) => x.uitkomst === "FAILED");
  const ok = n >= MINIMA.n && dagen >= MINIMA.dagen && regimes >= MINIMA.regimes && weken >= MINIMA.weken;
  return {
    n,
    dagen,
    regimes,
    weken: Math.round(weken * 10) / 10,
    hit: n ? t.filter((x) => x.r > 0).length / n : null,
    r_bruto_gem: mean(t.map((x) => x.r)),
    r_bruto_med: median(t.map((x) => x.r)),
    r_netto_gem: t.every((x) => x.netto != null) ? mean(t.map((x) => x.netto)) : null,
    r_netto_med: t.every((x) => x.netto != null) ? median(t.map((x) => x.netto)) : null,
    mfe_gem: mean(t.map((x) => x.mfe).filter((v) => v != null)),
    mae_gem: mean(t.map((x) => x.mae).filter((v) => v != null)),
    max_drawdown_r: n ? dd : null,
    false_break: fail.length ? fail.filter((x) => (x.mfe ?? 0) < 0.5).length / fail.length : null,
    expiry_n: exp.length,
    expiry_r_gem: mean(exp.map((x) => x.r)),
    oordeel: ok ? "minima gehaald — beoordeling mogelijk, geen edgeclaim zonder besluit van Bas" : "onvoldoende data — geen conclusie",
  };
}

const netto = (sym, r, risk) => (risk > 0 ? r - ((SPREAD_PIPS[sym] ?? NaN) + 2 * SLIP_PIPS) * pip(sym) / risk : null);

/** setups: Map uit forward-log.state(); rows: alle logregels (voor kandidaat-uitkomsten van de varianten). */
export function evaluate(setups, rows, { start = "2026-10-29T00:00:00Z", now = Date.now() } = {}) {
  const cel = (sym, tf) => `${sym}|${tf}`;
  const str = new Map();
  for (const s of setups.values()) {
    const o = s.ontstaan;
    const u = s.correcties.at(-1)?.nieuw ?? (s.uitkomst ? { uitkomst: s.uitkomst.setup.uitkomst, r_bruto: s.uitkomst.setup.r_bruto } : null);
    if (!o.setup.telt_mee || !u || u.uitkomst === "open") continue;
    const sym = pair(o.symbol);
    const risk = Math.abs(o.setup.entry - o.setup.stop);
    const fin = s.uitkomst?.setup ?? {};
    const k = cel(sym, o.timeframe);
    if (!str.has(k)) str.set(k, []);
    str.get(k).push({ t: o.setup.bevestigd_op, r: u.r_bruto, netto: netto(sym, u.r_bruto, risk), mfe: fin.mfe_r, mae: fin.mae_r, uitkomst: u.uitkomst, regime: o.setup.regime, sessie: session(o.setup.bevestigd_op) });
  }
  const varianten = new Map();
  for (const r of rows.filter((x) => x.type === "kandidaat" && x.data.telt_mee !== false)) {
    const sym = pair(r.data.symbol);
    for (const a of r.data.afgerond ?? []) {
      for (const [v, naam] of VARIANTEN.entries()) {
        if (Math.floor(a.varianten / 2 ** v) % 2 !== 1) continue;
        const k = `${cel(sym, r.data.timeframe)}|${naam}`;
        if (!varianten.has(k)) varianten.set(k, []);
        const uitkomst = a.r <= -1 ? "FAILED" : a.r >= 1.5 ? "DOEL" : "EXPIRED";
        varianten.get(k).push({ t: a.start, r: a.r, netto: netto(sym, a.r, a.risk), mfe: a.mfe_r, mae: a.mae_r, uitkomst, regime: r.data.regime, sessie: session(a.start) });
      }
    }
  }
  const matrix = [];
  for (const sym of PAREN)
    for (const tf of TFS) {
      const trades = str.get(cel(sym, tf)) ?? [];
      const perSessie = Object.fromEntries(["Azië", "Londen", "New York", "laat"].map((s) => [s, metrics(trades.filter((x) => x.sessie === s), { start, now }).n]));
      const regimes = [...new Set(trades.map((x) => x.regime))];
      const perRegime = Object.fromEntries(regimes.map((g) => [g, metrics(trades.filter((x) => x.regime === g), { start, now }).n]));
      const vars = Object.fromEntries(VARIANTEN.map((v) => [v, metrics(varianten.get(`${cel(sym, tf)}|${v}`) ?? [], { start, now })]));
      matrix.push({ paar: sym, tf, str: metrics(trades, { start, now }), per_sessie_n: perSessie, per_regime_n: perRegime, varianten: vars });
    }
  return { start, minima: MINIMA, aannames: { spread_pips: SPREAD_PIPS, slip_pips_per_kant: SLIP_PIPS }, matrix, totaal: "niet berekend — cellen zijn niet aangetoond vergelijkbaar" };
}

const f = (v, d = 2) => (v == null ? "–" : typeof v === "number" ? v.toFixed(d) : v);
export function formatReport(ev) {
  const out = [`STR_0.1-F · start ${ev.start} · minima per cel: N ≥ ${ev.minima.n}, ≥ ${ev.minima.dagen} dagen, ≥ ${ev.minima.regimes} regimes, ≥ ${ev.minima.weken} weken`, "paar   tf   N  dagen hit   Rbruto(gem/med)  Rnetto(gem)  MFE  MAE  maxDD  oordeel"];
  for (const c of ev.matrix) {
    const m = c.str;
    out.push(`${c.paar} ${c.tf.padStart(3)} ${String(m.n).padStart(3)} ${String(m.dagen).padStart(5)} ${f(m.hit)} ${f(m.r_bruto_gem)}/${f(m.r_bruto_med)}  ${f(m.r_netto_gem)}  ${f(m.mfe_gem)} ${f(m.mae_gem)} ${f(m.max_drawdown_r)}  ${m.oordeel}`);
  }
  out.push(`Totaal: ${ev.totaal}.`);
  return out.join("\n");
}
