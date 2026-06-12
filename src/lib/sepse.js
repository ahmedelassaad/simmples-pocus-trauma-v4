import { clean, n } from './format.js';

export function sepsisProfile({ sbp, dbp, rr, mental, temp, hr, lactate, weight }) {
  const s = clean(sbp), d = clean(dbp), r = clean(rr), t = clean(temp), h = clean(hr), lac = clean(lactate), w = clean(weight);
  const map = s !== null && d !== null ? (s + 2 * d) / 3 : null;
  const qsofa = (s !== null && s <= 100 ? 1 : 0) + (r !== null && r >= 22 ? 1 : 0) + (mental ? 1 : 0);
  const sirs = (t !== null && (t > 38 || t < 36) ? 1 : 0) + (h !== null && h > 90 ? 1 : 0) + (r !== null && r > 20 ? 1 : 0);
  const volume = w ? w * 30 : null;
  const alerts = [];
  if (qsofa >= 2) alerts.push('qSOFA elevado');
  if (map !== null && map < 65) alerts.push('PAM baixa');
  if (lac !== null && lac >= 2) alerts.push('lactato elevado');
  if (sirs >= 2) alerts.push('SIRS ≥ 2');
  return { map, qsofa, sirs, volume, alerts, tier: alerts.length >= 2 ? 'Alto risco infeccioso/hemodinâmico' : alerts.length === 1 ? 'Reavaliar precocemente' : 'Sem alerta automático pelos campos preenchidos', report: `SIMMples SEPSE\nPAM: ${map ? n(map,0) : '--'} mmHg | qSOFA: ${qsofa} | SIRS clínico: ${sirs}\nLactato: ${lac ?? '--'} mmol/L | Volume 30 mL/kg: ${volume ? n(volume,0) + ' mL' : '--'}\nAlertas: ${alerts.length ? alerts.join('; ') : 'nenhum alerta automático.'}` };
}
