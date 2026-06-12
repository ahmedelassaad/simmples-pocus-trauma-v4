import { clean, n } from './format.js';

export function interpretGaso({ ph, pco2, hco3, na, cl, alb }) {
  const pH = clean(ph);
  const co2 = clean(pco2);
  const bic = clean(hco3);
  const sodium = clean(na);
  const chloride = clean(cl);
  const albumin = clean(alb);

  const missingCore = [pH, co2, bic].some((v) => v === null);
  if (missingCore) {
    return {
      status: 'Preencha pH, pCO₂ e HCO₃⁻.',
      primary: '--', compensation: '--', metabolic: '--', report: 'Gasometria incompleta.'
    };
  }

  const acidBase = pH < 7.35 ? 'acidemia' : pH > 7.45 ? 'alcalemia' : 'pH normal/limítrofe';
  let primary = 'Distúrbio misto ou indefinido';
  let compensation = 'Compensação não determinada.';
  let tone = 'neutral';

  if (acidBase === 'acidemia' && bic < 22) {
    const expected = 1.5 * bic + 8;
    primary = 'Acidose metabólica';
    if (co2 > expected + 2) compensation = `pCO₂ acima do esperado pela fórmula de Winter (${n(expected - 2, 0)}–${n(expected + 2, 0)}): acidose respiratória associada.`;
    else if (co2 < expected - 2) compensation = `pCO₂ abaixo do esperado pela fórmula de Winter (${n(expected - 2, 0)}–${n(expected + 2, 0)}): alcalose respiratória associada.`;
    else compensation = `Compensação respiratória apropriada pela fórmula de Winter (${n(expected - 2, 0)}–${n(expected + 2, 0)} mmHg).`;
    tone = 'danger';
  } else if (acidBase === 'alcalemia' && bic > 26) {
    const expected = 0.7 * (bic - 24) + 40;
    primary = 'Alcalose metabólica';
    if (co2 > expected + 5) compensation = `pCO₂ acima do esperado (${n(expected - 5, 0)}–${n(expected + 5, 0)}): acidose respiratória associada.`;
    else if (co2 < expected - 5) compensation = `pCO₂ abaixo do esperado (${n(expected - 5, 0)}–${n(expected + 5, 0)}): alcalose respiratória associada.`;
    else compensation = `Compensação respiratória compatível (${n(expected - 5, 0)}–${n(expected + 5, 0)} mmHg).`;
    tone = 'warning';
  } else if (acidBase === 'acidemia' && co2 > 45) {
    primary = 'Acidose respiratória';
    const acute = 24 + ((co2 - 40) / 10) * 1;
    const chronic = 24 + ((co2 - 40) / 10) * 3.5;
    compensation = `HCO₃⁻ esperado: agudo ~${n(acute, 1)}; crônico ~${n(chronic, 1)} mEq/L.`;
    tone = 'danger';
  } else if (acidBase === 'alcalemia' && co2 < 35) {
    primary = 'Alcalose respiratória';
    const acute = 24 - ((40 - co2) / 10) * 2;
    const chronic = 24 - ((40 - co2) / 10) * 5;
    compensation = `HCO₃⁻ esperado: agudo ~${n(acute, 1)}; crônico ~${n(chronic, 1)} mEq/L.`;
    tone = 'warning';
  } else if (acidBase === 'pH normal/limítrofe' && (co2 < 35 || co2 > 45 || bic < 22 || bic > 26)) {
    primary = 'Provável distúrbio misto com pH normalizado';
    compensation = 'Avaliar direção de pCO₂ e HCO₃⁻, história clínica e eletrólitos.';
  }

  let metabolic = '--';
  let ag = null;
  let agCorr = null;
  if (sodium !== null && chloride !== null && bic !== null) {
    ag = sodium - (chloride + bic);
    agCorr = albumin !== null ? ag + 2.5 * (4 - albumin) : ag;
    metabolic = `AG ${n(ag, 1)}${albumin !== null ? ` | AG corrigido ${n(agCorr, 1)}` : ''}`;
    if (agCorr > 12 && primary.includes('Acidose metabólica')) {
      const deltaRatio = (agCorr - 12) / (24 - bic);
      if (Number.isFinite(deltaRatio)) {
        metabolic += ` | Δ/Δ ${n(deltaRatio, 2)}`;
        if (deltaRatio < 0.8) metabolic += ' → acidose metabólica hiperclorêmica associada.';
        else if (deltaRatio > 2) metabolic += ' → alcalose metabólica associada ou acidose respiratória crônica.';
        else metabolic += ' → padrão de acidose com ânion gap elevado.';
      }
    }
  }

  const report = [
    `Gasometria: pH ${pH}, pCO₂ ${co2} mmHg, HCO₃⁻ ${bic} mEq/L.`,
    `Interpretação: ${primary}.`,
    `Compensação: ${compensation}`,
    metabolic !== '--' ? `Refino metabólico: ${metabolic}.` : null
  ].filter(Boolean).join('\n');

  return { status: acidBase, primary, compensation, metabolic, report, tone };
}
