import { clean, n } from './format.js';

export function predictedBodyWeight(height, sex) {
  const h = clean(height);
  if (h === null || h <= 0) return null;
  const base = sex === 'female' ? 45.5 : 50;
  return Math.max(0, base + 0.91 * (h - 152.4));
}

export function tidalVolumes(height, sex) {
  const pbw = predictedBodyWeight(height, sex);
  if (!pbw) return { pbw: null, vt6: null, vt8: null, vt4: null };
  return { pbw, vt4: pbw * 4, vt6: pbw * 6, vt8: pbw * 8 };
}

export function co2Adjustment({ pco2, rr, target }) {
  const co2 = clean(pco2), f = clean(rr), tgt = clean(target);
  if ([co2, f, tgt].some((v) => v === null || v <= 0)) return '--';
  const newRr = f * co2 / tgt;
  return `${n(newRr, 0)} irpm`;
}

const lowPeep = [
  [0.3, 5], [0.4, 5], [0.4, 8], [0.5, 8], [0.5, 10], [0.6, 10], [0.7, 10], [0.7, 12], [0.8, 14], [0.9, 14], [1.0, 18]
];
const highPeep = [
  [0.3, 5], [0.3, 8], [0.4, 10], [0.4, 12], [0.5, 14], [0.5, 16], [0.6, 18], [0.7, 20], [0.8, 22], [0.9, 24], [1.0, 24]
];

export function oxygenationSuggestion({ pao2, spo2, fio2, peep, table = 'low' }) {
  const o2 = clean(pao2 ?? spo2), fi = clean(fio2), p = clean(peep);
  if ([o2, fi, p].some((v) => v === null || v <= 0)) return { text: '--', pair: '-- / --' };
  const fio2Fraction = fi > 1 ? fi / 100 : fi;
  const pf = o2 / fio2Fraction;
  const ladder = table === 'high' ? highPeep : lowPeep;
  let pair = ladder.find(([f, pp]) => f >= fio2Fraction && pp >= p) || ladder[ladder.length - 1];
  let text = pf < 150 ? 'Hipoxemia importante: conferir recrutabilidade, posição, PEEP/FiO₂ e causas reversíveis.' : pf < 300 ? 'Hipoxemia moderada: otimizar FiO₂/PEEP e reavaliar mecânica.' : 'Oxigenação preservada ou leve alteração.';
  return { text, pair: `${pair[1]} / ${Math.round(pair[0] * 100)}%`, pf };
}

export function mechanics({ vt, pplat, peep }) {
  const v = clean(vt), pp = clean(pplat), p = clean(peep);
  if ([v, pp, p].some((x) => x === null)) return { dp: null, cstat: null, risk: '--' };
  const dp = pp - p;
  const cstat = dp > 0 ? v / dp : null;
  const risk = dp > 15 ? 'Risco de VILI: ΔP > 15 cmH₂O. Reduza VT se possível ou otimize PEEP.' : 'ΔP em faixa mais protetora.';
  return { dp, cstat, risk };
}

export function pfRox({ oxygen, fio2, rr }) {
  const o = clean(oxygen), fi = clean(fio2), f = clean(rr);
  if ([o, fi].some((x) => x === null || x <= 0)) return { pf: null, rox: null };
  const fio2Fraction = fi > 1 ? fi / 100 : fi;
  const pf = o / fio2Fraction;
  const rox = f && f > 0 ? (o / fio2Fraction) / f : null;
  return { pf, rox };
}
