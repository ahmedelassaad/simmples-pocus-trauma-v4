import { clean, n } from './format.js';

const has = (value) => value !== null && Number.isFinite(value);
const yesNo = (value) => value ? 'sim' : 'não';
const joinOrNone = (items, none = 'nenhum') => items.filter(Boolean).length ? items.filter(Boolean).join('; ') : none;

export function classifyShockIndex(si) {
  if (!has(si)) return { label: '--', tone: 'neutral', helper: 'Preencha PAS e FC.' };
  if (si >= 1.3) return { label: 'Muito elevado', tone: 'danger', helper: 'SI ≥ 1,3: risco importante em trauma.' };
  if (si >= 1) return { label: 'Elevado', tone: 'danger', helper: 'SI ≥ 1 sugere choque/risco hemorrágico.' };
  if (si >= 0.8) return { label: 'Limítrofe', tone: 'warning', helper: 'SI 0,8–0,99: interpretar com mecanismo e reserva fisiológica.' };
  return { label: 'Baixo', tone: 'success', helper: 'Sem alerta automático pelo SI.' };
}

export function classifyMsi(msi) {
  if (!has(msi)) return { label: '--', tone: 'neutral', helper: 'Preencha PAS, PAD e FC.' };
  if (msi >= 1.6) return { label: 'Muito elevado', tone: 'danger', helper: 'MSI ≥ 1,6: risco elevado.' };
  if (msi >= 1.3) return { label: 'Elevado', tone: 'danger', helper: 'MSI ≥ 1,3: alerta de instabilidade.' };
  if (msi >= 1.1) return { label: 'Limítrofe', tone: 'warning', helper: 'MSI 1,1–1,29: reavaliar tendência.' };
  return { label: 'Baixo', tone: 'success', helper: 'Sem alerta automático pelo MSI.' };
}

export function classifyMetabolic({ lactate, baseExcess, ph }) {
  const alerts = [];
  const details = [];
  let tone = 'neutral';

  if (has(lactate)) {
    if (lactate >= 4) {
      alerts.push('lactato ≥ 4 mmol/L');
      tone = 'danger';
    } else if (lactate > 2) {
      alerts.push('lactato > 2 mmol/L');
      if (tone !== 'danger') tone = 'warning';
    }
    details.push(`lactato ${n(lactate, 1)} mmol/L`);
  }

  if (has(baseExcess)) {
    if (baseExcess <= -6) {
      alerts.push('base excess ≤ -6');
      tone = 'danger';
    } else if (baseExcess < -3) {
      alerts.push('base excess < -3');
      if (tone !== 'danger') tone = 'warning';
    }
    details.push(`BE ${n(baseExcess, 1)}`);
  }

  if (has(ph)) {
    if (ph < 7.2) {
      alerts.push('pH < 7,20');
      tone = 'danger';
    } else if (ph < 7.30) {
      alerts.push('pH < 7,30');
      if (tone !== 'danger') tone = 'warning';
    }
    details.push(`pH ${n(ph, 2)}`);
  }

  return {
    label: details.length ? details.join(' | ') : '--',
    tone,
    alerts,
    helper: alerts.length ? `Alertas: ${alerts.join(', ')}.` : 'Sem alerta metabólico com os campos preenchidos.'
  };
}

export function traumaProfile(input) {
  const age = clean(input.age);
  const weight = clean(input.weight);
  const hoursFromInjury = clean(input.hoursFromInjury);
  const sbp = clean(input.sbp);
  const dbp = clean(input.dbp);
  const hr = clean(input.hr);
  const rr = clean(input.rr);
  const spo2 = clean(input.spo2);
  const temp = clean(input.temp);
  const gcs = clean(input.gcs);
  const lactate = clean(input.lactate);
  const baseExcess = clean(input.baseExcess);
  const ph = clean(input.ph);
  const hb = clean(input.hb);
  const inr = clean(input.inr);
  const calcium = clean(input.calcium);

  const mechanism = input.mechanism || 'blunt';
  const penetrating = mechanism === 'penetrating' || Boolean(input.penetrating);
  const highEnergy = Boolean(input.highEnergy);
  const anticoagulated = Boolean(input.anticoagulated);
  const externalBleeding = Boolean(input.externalBleeding);
  const pelvicInstability = Boolean(input.pelvicInstability);
  const longBoneFracture = Boolean(input.longBoneFracture);
  const alteredMentalStatus = Boolean(input.alteredMentalStatus) || (has(gcs) && gcs < 15);

  const fastSites = [
    input.fastRUQ ? 'Morrison/RUQ' : '',
    input.fastLUQ ? 'esplenorrenal/LUQ' : '',
    input.fastPelvis ? 'pelve' : '',
    input.fastPericardium ? 'pericárdio' : ''
  ].filter(Boolean);
  const fastPositive = Boolean(input.fastPositive) || fastSites.length > 0;

  const map = has(sbp) && has(dbp) ? (sbp + 2 * dbp) / 3 : null;
  const pulsePressure = has(sbp) && has(dbp) ? sbp - dbp : null;
  const shockIndex = has(sbp) && sbp > 0 && has(hr) ? hr / sbp : null;
  const modifiedShock = has(map) && map > 0 && has(hr) ? hr / map : null;
  const ageShockIndex = has(age) && has(shockIndex) ? age * shockIndex : null;

  const abcItems = {
    penetrating,
    hypotension: has(sbp) && sbp <= 90,
    tachycardia: has(hr) && hr >= 120,
    fastPositive
  };
  const abc = Object.values(abcItems).filter(Boolean).length;

  const rabtItems = {
    penetrating,
    shockIndexPositive: has(shockIndex) && shockIndex > 1,
    pelvicFracture: pelvicInstability,
    fastPositive
  };
  const rabt = Object.values(rabtItems).filter(Boolean).length;

  const normotensiveWindow = has(sbp) && has(hr) && sbp > 90 && hr < 120;
  const occultHypoperfusion = normotensiveWindow && ((has(lactate) && lactate > 2) || (has(baseExcess) && baseExcess < -3));
  const metabolic = classifyMetabolic({ lactate, baseExcess, ph });
  const siClass = classifyShockIndex(shockIndex);
  const msiClass = classifyMsi(modifiedShock);

  const physiologicFlags = [];
  if (has(sbp) && sbp <= 90) physiologicFlags.push('PAS ≤ 90 mmHg');
  if (has(map) && map < 65) physiologicFlags.push('PAM < 65 mmHg');
  if (has(hr) && hr >= 120) physiologicFlags.push('FC ≥ 120 bpm');
  if (has(rr) && (rr < 10 || rr > 29)) physiologicFlags.push('FR fora da faixa 10–29 irpm');
  if (has(spo2) && spo2 < 92) physiologicFlags.push('SpO₂ < 92%');
  if (has(temp) && temp < 35.5) physiologicFlags.push('hipotermia');
  if (has(gcs) && gcs <= 13) physiologicFlags.push('GCS ≤ 13');
  if (has(pulsePressure) && pulsePressure < 25) physiologicFlags.push('pressão de pulso estreita');

  const hemorrhageFlags = [];
  if (fastPositive) hemorrhageFlags.push(`FAST positivo${fastSites.length ? ` (${fastSites.join(', ')})` : ''}`);
  if (externalBleeding) hemorrhageFlags.push('sangramento externo ativo');
  if (pelvicInstability) hemorrhageFlags.push('suspeita de instabilidade/fratura pélvica');
  if (longBoneFracture) hemorrhageFlags.push('fratura de osso longo');
  if (penetrating) hemorrhageFlags.push('mecanismo penetrante');
  if (highEnergy) hemorrhageFlags.push('mecanismo de alta energia');
  if (anticoagulated) hemorrhageFlags.push('uso de anticoagulante/antiagregante relevante');

  const labFlags = [...metabolic.alerts];
  if (has(hb) && hb < 10) labFlags.push('Hb < 10 g/dL');
  if (has(inr) && inr > 1.5) labFlags.push('INR > 1,5');
  if (has(calcium) && calcium < 1.1) labFlags.push('cálcio iônico baixo');

  const scoreFlags = [];
  if (has(shockIndex) && shockIndex >= 1) scoreFlags.push('Shock Index ≥ 1');
  if (has(modifiedShock) && modifiedShock >= 1.3) scoreFlags.push('Modified Shock Index ≥ 1,3');
  if (abc >= 2) scoreFlags.push('ABC score ≥ 2');
  if (rabt >= 2) scoreFlags.push('RABT simplificado ≥ 2');
  if (occultHypoperfusion) scoreFlags.push('hipoperfusão oculta: PA/FC preservadas com lactato/BE alterado');

  const majorTriggers = [
    abc >= 2,
    rabt >= 2,
    fastPositive && (abcItems.hypotension || has(shockIndex) && shockIndex >= 1),
    externalBleeding && (abcItems.hypotension || has(shockIndex) && shockIndex >= 1),
    pelvicInstability && (abcItems.hypotension || has(shockIndex) && shockIndex >= 1),
    has(lactate) && lactate >= 4,
    has(baseExcess) && baseExcess <= -6
  ].filter(Boolean).length;

  const moderateTriggers = [
    abc === 1,
    rabt === 1,
    has(shockIndex) && shockIndex >= 0.9,
    occultHypoperfusion,
    highEnergy,
    anticoagulated,
    alteredMentalStatus,
    has(temp) && temp < 35.5
  ].filter(Boolean).length;

  let tier = 'Sem alerta automático relevante';
  let tierTone = 'success';
  let mtp = 'Não sugerido automaticamente';
  let disposition = 'Reavaliação seriada conforme contexto clínico.';

  if (majorTriggers >= 2 || abc >= 2 || rabt >= 2 || (fastPositive && abcItems.hypotension)) {
    tier = 'ALTO RISCO hemorrágico';
    tierTone = 'danger';
    mtp = 'Considerar ativação imediata do protocolo de hemorragia/massiva transfusão';
    disposition = 'Sala de trauma, controle de fonte e reavaliação contínua.';
  } else if (majorTriggers === 1 || moderateTriggers >= 2) {
    tier = 'RISCO INTERMEDIÁRIO / observação agressiva';
    tierTone = 'warning';
    mtp = 'Preparar hemocomponentes e discutir limiar baixo para protocolo de hemorragia';
    disposition = 'Monitorização, repetição laboratorial e busca ativa de fonte hemorrágica.';
  } else if (moderateTriggers === 1) {
    tier = 'BAIXO RISCO, mas com alerta isolado';
    tierTone = 'warning';
    disposition = 'Reavaliar tendência e repetir exame conforme evolução.';
  }

  const priorities = [];
  if (tierTone === 'danger') priorities.push('Acionar equipe de trauma/cirurgia e banco de sangue conforme fluxo institucional.');
  if (fastPositive && tierTone !== 'success') priorities.push('FAST positivo no contexto de instabilidade deve acelerar controle de fonte; se estável, considerar TC conforme protocolo local.');
  if (externalBleeding) priorities.push('Priorizar controle externo de sangramento e exposição completa.');
  if (pelvicInstability) priorities.push('Aplicar/checar binder pélvico na posição adequada e evitar manipulação desnecessária.');
  if (occultHypoperfusion) priorities.push('Não se tranquilizar por PA normal: repetir lactato/BE, reavaliar perfusão e investigar sangramento oculto.');
  if (has(temp) && temp < 35.5) priorities.push('Aquecimento ativo e prevenção da tríade letal.');
  if (has(calcium) && calcium < 1.1) priorities.push('Monitorar/corrigir cálcio conforme protocolo durante ressuscitação hemostática.');
  if (has(hoursFromInjury) && hoursFromInjury <= 3 && (tierTone !== 'success' || externalBleeding || fastPositive)) priorities.push('Se houver suspeita de sangramento significativo e < 3h do trauma, lembrar TXA conforme protocolo local.');
  if (has(hoursFromInjury) && hoursFromInjury > 3 && (tierTone !== 'success' || externalBleeding || fastPositive)) priorities.push('Trauma > 3h: individualizar TXA conforme protocolo, risco/benefício e cenário clínico.');
  if (!priorities.length) priorities.push('Sem prioridade automática além de ABCDE, analgesia, reavaliação seriada e documentação completa.');

  const allFlags = [...physiologicFlags, ...hemorrhageFlags, ...labFlags, ...scoreFlags];

  const reportLines = [
    'SIMMples TRAUMA',
    `Mecanismo: ${mechanism === 'penetrating' ? 'penetrante' : mechanism === 'burn' ? 'queimadura/explosão' : 'contuso'} | alta energia: ${yesNo(highEnergy)} | anticoagulação: ${yesNo(anticoagulated)}`,
    `Tempo desde trauma: ${has(hoursFromInjury) ? `${n(hoursFromInjury, 1)} h` : '--'} | idade: ${has(age) ? `${n(age, 0)} anos` : '--'} | peso: ${has(weight) ? `${n(weight, 0)} kg` : '--'}`,
    `SV: PA ${has(sbp) ? n(sbp, 0) : '--'}/${has(dbp) ? n(dbp, 0) : '--'} mmHg | PAM ${has(map) ? n(map, 0) : '--'} | FC ${has(hr) ? n(hr, 0) : '--'} | FR ${has(rr) ? n(rr, 0) : '--'} | SpO₂ ${has(spo2) ? n(spo2, 0) : '--'}% | T ${has(temp) ? n(temp, 1) : '--'}°C | GCS ${has(gcs) ? n(gcs, 0) : '--'}`,
    `Índices: SI ${has(shockIndex) ? n(shockIndex, 2) : '--'} | MSI ${has(modifiedShock) ? n(modifiedShock, 2) : '--'} | Age SI ${has(ageShockIndex) ? n(ageShockIndex, 0) : '--'} | PP ${has(pulsePressure) ? n(pulsePressure, 0) : '--'} mmHg`,
    `Scores: ABC ${abc}/4 | RABT simplificado ${rabt}/4 | FAST: ${fastPositive ? `positivo${fastSites.length ? ` (${fastSites.join(', ')})` : ''}` : 'não marcado como positivo'}`,
    `Labs: pH ${has(ph) ? n(ph, 2) : '--'} | lactato ${has(lactate) ? n(lactate, 1) : '--'} | BE ${has(baseExcess) ? n(baseExcess, 1) : '--'} | Hb ${has(hb) ? n(hb, 1) : '--'} | INR ${has(inr) ? n(inr, 1) : '--'} | Cai ${has(calcium) ? n(calcium, 2) : '--'}`,
    `Classificação SIMMples: ${tier}. ${mtp}.`,
    `Alertas: ${joinOrNone(allFlags, 'nenhum alerta automático com os campos preenchidos')}.`,
    `Prioridades sugeridas: ${priorities.join(' ')}`
  ];

  return {
    age,
    weight,
    hoursFromInjury,
    sbp,
    dbp,
    hr,
    rr,
    spo2,
    temp,
    gcs,
    lactate,
    baseExcess,
    ph,
    hb,
    inr,
    calcium,
    map,
    pulsePressure,
    shockIndex,
    modifiedShock,
    ageShockIndex,
    abc,
    abcItems,
    rabt,
    rabtItems,
    fastPositive,
    fastSites,
    occultHypoperfusion,
    metabolic,
    siClass,
    msiClass,
    physiologicFlags,
    hemorrhageFlags,
    labFlags,
    scoreFlags,
    flags: allFlags,
    priorities,
    tier,
    tierTone,
    mtp,
    disposition,
    report: reportLines.join('\n')
  };
}
