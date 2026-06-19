const SECTION_WEIGHTS = {
  chiefComplaint: 1.35,
  story: 1.25,
  exam: 1.15,
  pocus: 1.35,
  assessment: 1.05,
  notes: 0.9,
  events: 0.85
};

const NEGATION_PATTERNS = [
  /\bnega\b/, /\bnegou\b/, /\bsem\b/, /\bausencia de\b/, /\bausente\b/,
  /\bnao apresenta\b/, /\bnao ha\b/, /\bnao evidencia\b/, /\bsem sinais de\b/,
  /\bdescarta\b/, /\bafasta\b/, /\bexclui\b/
];

const UNCERTAINTY_PATTERNS = [
  /\ba esclarecer\b/, /\ba investigar\b/, /\bpossivel\b/, /\bprovavel\b/,
  /\bsuspeita de\b/, /\bhipotese de\b/, /\bconsiderar\b/
];

const CONCEPTS = {
  chestPain: { label: 'Dor/opressão torácica', aliases: ['dor toracica', 'dor no peito', 'opressao toracica', 'precordialgia', 'angina'] },
  ischemicPain: { label: 'Características isquêmicas da dor', aliases: ['dor opressiva', 'dor em aperto', 'irradiacao para braco', 'irradiacao mandibula', 'irradiacao para mandibula', 'sudorese fria', 'diaforese'] },
  ischemicEcg: { label: 'Alteração isquêmica no ECG', aliases: ['supra de st', 'infradesnivelamento de st', 'infra de st', 'wellens', 'de winter', 'aslanger', 'omi', 'stemi'] },
  troponin: { label: 'Troponina alterada', aliases: ['troponina elevada', 'troponina positiva', 'delta de troponina', 'curva de troponina'] },
  dyspnea: { label: 'Dispneia', aliases: ['dispneia', 'falta de ar', 'cansaco para respirar', 'desconforto respiratorio'] },
  pleuriticPain: { label: 'Dor pleurítica', aliases: ['dor pleuritica', 'dor ventilatorio dependente', 'piora ao respirar'] },
  hypoxemia: { label: 'Hipoxemia', aliases: ['hipoxemia', 'dessaturacao', 'saturacao baixa', 'spo2 baixa', 'cianose'] },
  congestion: { label: 'Congestão pulmonar', aliases: ['edema pulmonar', 'estertores', 'crepitacoes', 'linhas b', 'b-lines', 'perfil b bilateral', 'congestao pulmonar'] },
  orthopnea: { label: 'Ortopneia/DPN', aliases: ['ortopneia', 'dispneia paroxistica noturna', 'dpn'] },
  edema: { label: 'Edema periférico', aliases: ['edema de membros inferiores', 'edema periferico', 'anasarca'] },
  tachycardia: { label: 'Taquicardia', aliases: ['taquicardia', 'fc elevada', 'frequencia cardiaca elevada'] },
  hypotension: { label: 'Hipotensão/choque', aliases: ['hipotensao', 'pam baixa', 'choque', 'instabilidade hemodinamica', 'hipoperfusao'] },
  feverInfection: { label: 'Infecção/febre', aliases: ['febre', 'calafrios', 'foco infeccioso', 'infeccao', 'sepse', 'septicemia'] },
  organDysfunction: { label: 'Disfunção orgânica', aliases: ['oliguria', 'anuria', 'rebaixamento', 'confusao', 'disfuncao organica', 'plaquetopenia', 'coagulopatia'] },
  lactateHigh: { label: 'Lactato elevado', aliases: ['lactato elevado', 'hiperlactatemia'] },
  focalDeficit: { label: 'Déficit neurológico focal', aliases: ['deficit focal', 'hemiparesia', 'hemiplegia', 'paresia unilateral', 'fraqueza unilateral', 'assimetria facial'] },
  aphasia: { label: 'Afasia/disfasia', aliases: ['afasia', 'disfasia', 'dificuldade para falar', 'fala enrolada'] },
  gaze: { label: 'Desvio do olhar', aliases: ['desvio do olhar', 'desvio conjugado'] },
  suddenOnset: { label: 'Início súbito', aliases: ['inicio subito', 'subitamente', 'inicio abrupto', 'de repente'] },
  nihss: { label: 'NIHSS alterado', aliases: ['nihss'] },
  thunderclap: { label: 'Cefaleia em trovoada', aliases: ['pior dor da vida', 'cefaleia subita', 'cefaleia em trovoada', 'cefaleia explosiva'] },
  meningism: { label: 'Meningismo', aliases: ['rigidez de nuca', 'meningismo', 'sinais meningeos'] },
  seizure: { label: 'Crise convulsiva', aliases: ['convulsao', 'crise tonico clonica', 'crise epileptica', 'estado de mal'] },
  postictal: { label: 'Estado pós-ictal/Todd', aliases: ['pos ictal', 'pos-ictal', 'paralisia de todd', 'todd'] },
  alteredMental: { label: 'Alteração do estado mental', aliases: ['rebaixamento', 'coma', 'sonolencia', 'confusao', 'desorientado'] },
  exposure: { label: 'Exposição tóxica', aliases: ['intoxicacao', 'ingestao de', 'exposicao a', 'superdose', 'overdose'] },
  miosis: { label: 'Miose', aliases: ['miose', 'pupilas puntiformes'] },
  bradypnea: { label: 'Bradipneia', aliases: ['bradipneia', 'depressao respiratoria', 'apneia'] },
  wheeze: { label: 'Sibilância/broncoespasmo', aliases: ['sibilos', 'sibilancia', 'broncoespasmo', 'expiracao prolongada'] },
  asthma: { label: 'História de asma', aliases: ['asma', 'asmatico'] },
  copd: { label: 'DPOC', aliases: ['dpoc', 'enfisema', 'bronquite cronica'] },
  hypercapnia: { label: 'Hipercapnia', aliases: ['hipercapnia', 'pco2 elevada', 'retencao de co2'] },
  sputum: { label: 'Aumento/purulência do escarro', aliases: ['escarro purulento', 'aumento do escarro', 'expectoração purulenta'] },
  tvp: { label: 'Sinais de TVP', aliases: ['tvp', 'trombose venosa', 'membro inferior inchado', 'edema unilateral de perna', 'dor em panturrilha'] },
  rvStrain: { label: 'Sobrecarga de VD', aliases: ['vd dilatado', 'strain de vd', 'sobrecarga de vd', 'mcconnell'] },
  hemoptysis: { label: 'Hemoptise', aliases: ['hemoptise', 'escarro com sangue'] },
  trauma: { label: 'Trauma relevante', aliases: ['trauma', 'acidente', 'queda de altura', 'atropelamento', 'ferimento penetrante'] },
  bleeding: { label: 'Sangramento ativo', aliases: ['sangramento ativo', 'hemorragia', 'fast positivo', 'liquido livre', 'fratura pelvica', 'instabilidade pelvica'] },
  hematemesis: { label: 'Hematêmese', aliases: ['hematemese', 'vomito com sangue'] },
  melena: { label: 'Melena', aliases: ['melena', 'fezes enegrecidas'] },
  hematochezia: { label: 'Hematoquezia', aliases: ['hematoquezia', 'sangue vivo nas fezes'] },
  abdominalPain: { label: 'Dor abdominal', aliases: ['dor abdominal', 'dor no abdome'] },
  peritonitis: { label: 'Irritação peritoneal', aliases: ['defesa abdominal', 'peritonismo', 'rigidez abdominal', 'irritacao peritoneal', 'descompressao brusca positiva'] },
  vomiting: { label: 'Vômitos', aliases: ['vomitos', 'vomito', 'emese'] },
  diarrhea: { label: 'Diarreia', aliases: ['diarreia'] },
  dysuria: { label: 'Sintomas urinários', aliases: ['disuria', 'polaciuria', 'urgencia urinaria', 'dor lombar', 'pielonefrite'] },
  pericardialEffusion: { label: 'Derrame pericárdico', aliases: ['derrame pericardico'] },
  tamponadeSigns: { label: 'Sinais de tamponamento', aliases: ['tamponamento', 'colapso de vd', 'colapso de ad', 'variacao respiratoria mitral'] },
  plethoricIvc: { label: 'VCI pletórica', aliases: ['vci pletorica', 'veia cava pletorica'] },
  noSliding: { label: 'Ausência de lung sliding', aliases: ['sem lung sliding', 'ausencia de sliding', 'ausencia de deslizamento pleural'] },
  lungPoint: { label: 'Lung point', aliases: ['lung point'] },
  unilateralBreath: { label: 'MV reduzido unilateral', aliases: ['murmulho vesicular abolido unilateral', 'mv abolido unilateral', 'ausencia de murmurio unilateral'] },
  aorticPain: { label: 'Dor abrupta/rasgando', aliases: ['dor rasgando', 'dor toracica subita', 'dor dorsal subita', 'dor migratoria'] },
  pulseDeficit: { label: 'Déficit de pulso/PA assimétrica', aliases: ['assimetria de pulso', 'diferenca de pressao', 'deficit de pulso'] },
  aorticFlap: { label: 'Sinal direto de dissecção', aliases: ['disseccao de aorta', 'sindrome aortica', 'flap aortico'] },
  hyperglycemia: { label: 'Hiperglicemia', aliases: ['hiperglicemia', 'glicemia elevada'] },
  ketones: { label: 'Cetose', aliases: ['cetonemia', 'cetonuria', 'cetose'] },
  agAcidosis: { label: 'Acidose com ânion gap', aliases: ['anion gap elevado', 'acidose metabolica', 'cetoacidose'] },
  kussmaul: { label: 'Respiração de Kussmaul', aliases: ['kussmaul'] },
  oliguria: { label: 'Oligúria/anúria', aliases: ['oliguria', 'anuria'] },
  renalFailure: { label: 'Disfunção renal', aliases: ['creatinina elevada', 'funcao renal alterada', 'lesao renal aguda', 'insuficiencia renal'] },
  hyperkalemia: { label: 'Hipercalemia', aliases: ['hipercalemia', 'potassio elevado', 'onda t apiculada'] },
  palpitations: { label: 'Palpitações', aliases: ['palpitacoes'] },
  arrhythmia: { label: 'Arritmia documentada', aliases: ['fibrilacao atrial', 'flutter', 'taquicardia ventricular', 'taquiarritmia', 'arritmia', 'qrs largo'] },
  anaphylaxis: { label: 'Reação alérgica sistêmica', aliases: ['anafilaxia', 'urticaria', 'angioedema', 'edema de glote', 'broncoespasmo apos exposicao'] },
  rash: { label: 'Achados cutâneos', aliases: ['urticaria', 'rash', 'eritema difuso', 'prurido'] },
  pneumonia: { label: 'Síndrome pneumônica', aliases: ['pneumonia', 'consolidacao pulmonar', 'infiltrado pulmonar', 'tosse produtiva'] }
};

const RULES = [
  {
    id: 'acs', label: 'Síndrome coronariana aguda', level: 'danger', threshold: 4.2,
    concepts: { chestPain: 2.1, ischemicPain: 1.3, ischemicEcg: 3.5, troponin: 3.5 },
    requireAny: ['chestPain', 'ischemicEcg', 'troponin'],
    summary: 'Dor compatível, biomarcador ou alteração isquêmica sustentam a possibilidade de síndrome coronariana aguda.'
  },
  {
    id: 'adhf', label: 'Edema agudo de pulmão / insuficiência cardíaca descompensada', level: 'danger', threshold: 4.5,
    concepts: { dyspnea: 1.5, congestion: 3.2, orthopnea: 2, edema: 1.2, hypoxemia: 1.3 },
    requireAny: ['congestion', 'orthopnea'],
    summary: 'O conjunto sugere congestão cardiopulmonar com possível descompensação de insuficiência cardíaca.'
  },
  {
    id: 'pe', label: 'Tromboembolismo pulmonar', level: 'danger', threshold: 5,
    concepts: { dyspnea: 1.4, pleuriticPain: 2.2, tachycardia: 1.1, tvp: 3.5, rvStrain: 3.5, hemoptysis: 1.6, hypoxemia: 1.2 },
    requireAny: ['tvp', 'rvStrain', 'pleuriticPain'], minConcepts: 2,
    summary: 'Dispneia/dor pleurítica associada a sinais de TVP, sobrecarga de VD ou hipoxemia aumenta a coerência para TEP.'
  },
  {
    id: 'sepsis', label: 'Sepse / choque séptico', level: 'danger', threshold: 5,
    concepts: { feverInfection: 2.4, organDysfunction: 3.2, hypotension: 2.3, lactateHigh: 2.4, alteredMental: 1.3, dysuria: 1.1, pneumonia: 1.1 },
    requireAllGroups: [['feverInfection', 'dysuria', 'pneumonia'], ['organDysfunction', 'hypotension', 'lactateHigh', 'alteredMental']],
    summary: 'Infecção provável associada a disfunção orgânica ou hipoperfusão sustenta a possibilidade de sepse.'
  },
  {
    id: 'stroke', label: 'AVC agudo', level: 'danger', threshold: 3.5,
    concepts: { focalDeficit: 3.5, aphasia: 3.2, gaze: 2.8, suddenOnset: 1.2, nihss: 2.4 },
    requireAny: ['focalDeficit', 'aphasia', 'gaze', 'nihss'],
    summary: 'Déficit focal ou sinal cortical de início agudo é coerente com síndrome cerebrovascular.'
  },
  {
    id: 'sah', label: 'Hemorragia subaracnoide', level: 'danger', threshold: 4.5,
    concepts: { thunderclap: 4.5, meningism: 2.2, vomiting: 0.8, alteredMental: 1.1, seizure: 1.1 },
    requireAny: ['thunderclap'],
    summary: 'Cefaleia súbita intensa associada a meningismo, vômitos ou alteração neurológica é compatível com HSA.'
  },
  {
    id: 'meningitis', label: 'Meningite / encefalite', level: 'danger', threshold: 5,
    concepts: { feverInfection: 2.2, meningism: 3.2, alteredMental: 1.8, seizure: 1.4 },
    requireAllGroups: [['feverInfection'], ['meningism', 'alteredMental', 'seizure']],
    summary: 'Febre associada a meningismo ou alteração neurológica sugere infecção do sistema nervoso central.'
  },
  {
    id: 'seizure', label: 'Crise epiléptica / estado pós-ictal', level: 'warning', threshold: 3.5,
    concepts: { seizure: 4.2, postictal: 3.2, alteredMental: 1.1 },
    requireAny: ['seizure', 'postictal'],
    summary: 'Evento convulsivo ou estado pós-ictal descrito sustenta hipótese de crise epiléptica.'
  },
  {
    id: 'toxic', label: 'Intoxicação / encefalopatia tóxico-metabólica', level: 'warning', threshold: 4.6,
    concepts: { exposure: 4.2, alteredMental: 1.5, miosis: 2, bradypnea: 2.3, seizure: 1.1 },
    requireAny: ['exposure'],
    summary: 'Exposição relatada associada a alteração de consciência ou toxidrome torna intoxicação uma hipótese coerente.'
  },
  {
    id: 'asthma', label: 'Crise asmática / broncoespasmo', level: 'warning', threshold: 4,
    concepts: { wheeze: 3, asthma: 2.2, dyspnea: 1.2, hypoxemia: 1 },
    requireAny: ['wheeze'],
    summary: 'Sibilância/broncoespasmo associado a dispneia ou história de asma é compatível com exacerbação asmática.'
  },
  {
    id: 'copd', label: 'Exacerbação de DPOC / insuficiência ventilatória', level: 'warning', threshold: 5,
    concepts: { copd: 3, dyspnea: 1.1, wheeze: 1.2, hypercapnia: 3, sputum: 1.8, alteredMental: 1 },
    requireAny: ['copd'], minConcepts: 2,
    summary: 'DPOC conhecido associado a piora respiratória, hipercapnia ou mudança do escarro sugere exacerbação.'
  },
  {
    id: 'pneumothorax', label: 'Pneumotórax', level: 'danger', threshold: 4.5,
    concepts: { noSliding: 4.3, lungPoint: 5, unilateralBreath: 2.2, dyspnea: 1.2, hypotension: 1.6 },
    requireAny: ['noSliding', 'lungPoint', 'unilateralBreath'],
    summary: 'Achados clínicos ou ultrassonográficos pleurais sustentam possibilidade de pneumotórax.'
  },
  {
    id: 'tamponade', label: 'Tamponamento cardíaco', level: 'danger', threshold: 5,
    concepts: { pericardialEffusion: 2.8, tamponadeSigns: 5, hypotension: 2, plethoricIvc: 1.8 },
    requireAny: ['tamponadeSigns', 'pericardialEffusion'], minConcepts: 2,
    summary: 'Derrame pericárdico associado a repercussão hemodinâmica ou sinais de colapso sugere tamponamento.'
  },
  {
    id: 'aortic', label: 'Síndrome aórtica aguda', level: 'danger', threshold: 5,
    concepts: { aorticPain: 3.8, pulseDeficit: 3.2, aorticFlap: 5, focalDeficit: 1.2 },
    requireAny: ['aorticPain', 'aorticFlap'],
    summary: 'Dor abrupta característica com déficit de pulso ou sinal direto de aorta torna síndrome aórtica plausível.'
  },
  {
    id: 'giBleed', label: 'Hemorragia digestiva', level: 'danger', threshold: 4,
    concepts: { hematemesis: 5, melena: 4.5, hematochezia: 4.2, hypotension: 1.6, tachycardia: 0.9 },
    requireAny: ['hematemesis', 'melena', 'hematochezia'],
    summary: 'Exteriorização de sangue digestivo, especialmente com repercussão hemodinâmica, sustenta hemorragia digestiva.'
  },
  {
    id: 'traumaBleed', label: 'Choque hemorrágico no trauma', level: 'danger', threshold: 5,
    concepts: { trauma: 2.2, bleeding: 3.5, hypotension: 2.2, lactateHigh: 1.8, tachycardia: 1 },
    requireAllGroups: [['trauma'], ['bleeding', 'hypotension', 'lactateHigh']],
    summary: 'Trauma associado a fonte hemorrágica ou sinais de hipoperfusão é coerente com choque hemorrágico.'
  },
  {
    id: 'acuteAbdomen', label: 'Abdome agudo / isquemia mesentérica', level: 'warning', threshold: 5,
    concepts: { abdominalPain: 2.2, peritonitis: 3.5, lactateHigh: 2, hypotension: 1.6, vomiting: 0.8 },
    requireAny: ['abdominalPain'], minConcepts: 2,
    summary: 'Dor abdominal associada a peritonismo ou hipoperfusão exige consideração de abdome agudo grave.'
  },
  {
    id: 'dka', label: 'Cetoacidose diabética', level: 'danger', threshold: 5.2,
    concepts: { hyperglycemia: 2.2, ketones: 3, agAcidosis: 3.2, kussmaul: 2, vomiting: 0.7 },
    requireAllGroups: [['hyperglycemia'], ['ketones', 'agAcidosis', 'kussmaul']],
    summary: 'Hiperglicemia associada a cetose ou acidose metabólica é compatível com cetoacidose diabética.'
  },
  {
    id: 'renal', label: 'Lesão renal aguda / distúrbio eletrolítico', level: 'warning', threshold: 4,
    concepts: { oliguria: 2.5, renalFailure: 3.2, hyperkalemia: 3.5 },
    requireAny: ['oliguria', 'renalFailure', 'hyperkalemia'],
    summary: 'Oligúria, disfunção renal ou hipercalemia tornam lesão renal aguda/distúrbio eletrolítico uma hipótese relevante.'
  },
  {
    id: 'tachyarrhythmia', label: 'Taquiarritmia', level: 'warning', threshold: 4,
    concepts: { palpitations: 1.8, tachycardia: 1.5, arrhythmia: 4, dyspnea: 0.7, chestPain: 0.7 },
    requireAny: ['arrhythmia', 'palpitations'],
    summary: 'Palpitações ou arritmia documentada associada a taquicardia sustentam taquiarritmia.'
  },
  {
    id: 'anaphylaxis', label: 'Anafilaxia', level: 'danger', threshold: 4.5,
    concepts: { anaphylaxis: 4.5, rash: 1.4, wheeze: 1.6, hypotension: 2, dyspnea: 1.1 },
    requireAny: ['anaphylaxis'],
    summary: 'Reação alérgica sistêmica associada a comprometimento respiratório ou circulatório é compatível com anafilaxia.'
  },
  {
    id: 'pneumonia', label: 'Pneumonia / infecção respiratória baixa', level: 'warning', threshold: 4.2,
    concepts: { pneumonia: 3.5, feverInfection: 1.7, dyspnea: 1, hypoxemia: 1.2, sputum: 1.1 },
    requireAny: ['pneumonia'],
    summary: 'Síndrome respiratória infecciosa com consolidação, febre ou hipoxemia é compatível com pneumonia.'
  }
];

export function normalizeClinicalText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-–—]/g, ' ')
    .replace(/[^a-z0-9%/.,:;\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sectionEntries(patient = {}) {
  return [
    ['chiefComplaint', patient.chiefComplaint],
    ['story', patient.story],
    ['exam', patient.exam],
    ['pocus', patient.pocus],
    ['assessment', patient.assessment],
    ['notes', patient.notes],
    ['events', Array.isArray(patient.events) ? patient.events.map((item) => item?.text || '').join(' ') : '']
  ].map(([key, value]) => ({ key, text: normalizeClinicalText(value), weight: SECTION_WEIGHTS[key] || 1 })).filter((item) => item.text);
}

function termOccurrences(text, alias) {
  const hits = [];
  let cursor = 0;
  while (cursor < text.length) {
    const index = text.indexOf(alias, cursor);
    if (index < 0) break;
    hits.push(index);
    cursor = index + Math.max(1, alias.length);
  }
  return hits;
}

function contextBefore(text, index, size = 54) {
  return text.slice(Math.max(0, index - size), index).trim();
}

function isNegated(text, index) {
  const context = contextBefore(text, index, 78);
  const lastBoundary = Math.max(context.lastIndexOf('.'), context.lastIndexOf(';'), context.lastIndexOf('\n'));
  let local = context.slice(lastBoundary + 1).trim();
  const resetMarkers = [' porem ', ' mas ', ' contudo ', ' entretanto ', ' apresenta ', ' refere ', ' evolui com ', ' passou a apresentar '];
  const padded = ` ${local} `;
  let resetIndex = -1;
  resetMarkers.forEach((marker) => {
    resetIndex = Math.max(resetIndex, padded.lastIndexOf(marker));
  });
  if (resetIndex >= 0) local = padded.slice(resetIndex + 1).trim();
  return NEGATION_PATTERNS.some((pattern) => pattern.test(local));
}

function isUncertain(text, index) {
  const context = contextBefore(text, index, 66);
  return UNCERTAINTY_PATTERNS.some((pattern) => pattern.test(context));
}

function detectNumericConcepts(sections) {
  const all = sections.map((item) => item.text).join(' ');
  const numeric = {};
  const add = (key, label, value, raw) => {
    if (!numeric[key]) numeric[key] = { key, label, value, raw, score: 1.15, negated: false, uncertain: false, section: 'dados objetivos' };
  };
  const firstNumber = (patterns) => {
    for (const pattern of patterns) {
      const match = all.match(pattern);
      if (match) return { value: Number(String(match[1]).replace(',', '.')), raw: match[0] };
    }
    return null;
  };

  const hr = firstNumber([/\bfc\s*[:=]?\s*(\d{2,3})\b/, /\bfrequencia cardiaca\s*[:=]?\s*(\d{2,3})\b/]);
  if (hr?.value > 100) add('tachycardia', `Taquicardia objetiva (FC ${hr.value})`, hr.value, hr.raw);
  const rr = firstNumber([/\bfr\s*[:=]?\s*(\d{1,2})\b/, /\bfrequencia respiratoria\s*[:=]?\s*(\d{1,2})\b/]);
  if (rr?.value > 22) add('dyspnea', `Taquipneia objetiva (FR ${rr.value})`, rr.value, rr.raw);
  const spo2 = firstNumber([/\bspo2\s*[:=]?\s*(\d{2,3})\s*%?/, /\bsaturacao\s*[:=]?\s*(\d{2,3})\s*%?/]);
  if (spo2?.value < 92) add('hypoxemia', `Hipoxemia objetiva (SpO₂ ${spo2.value}%)`, spo2.value, spo2.raw);
  const sbp = firstNumber([/\bpas\s*[:=]?\s*(\d{2,3})\b/, /\bpa\s*[:=]?\s*(\d{2,3})\s*[x/]\s*\d{2,3}/]);
  if (sbp?.value < 90) add('hypotension', `Hipotensão objetiva (PAS ${sbp.value})`, sbp.value, sbp.raw);
  const temp = firstNumber([/\b(?:temp|temperatura)\s*[:=]?\s*(\d{2}(?:[.,]\d)?)\b/]);
  if (temp?.value >= 38) add('feverInfection', `Febre objetiva (${temp.value} °C)`, temp.value, temp.raw);
  const lactate = firstNumber([/\blactato\s*[:=]?\s*(\d+(?:[.,]\d+)?)\b/]);
  if (lactate?.value > 2) add('lactateHigh', `Lactato elevado (${lactate.value} mmol/L)`, lactate.value, lactate.raw);
  const glucose = firstNumber([/\b(?:glicemia|hgt)\s*[:=]?\s*(\d{2,4})\b/]);
  if (glucose?.value >= 250) add('hyperglycemia', `Hiperglicemia objetiva (${glucose.value} mg/dL)`, glucose.value, glucose.raw);
  return numeric;
}

function detectConcepts(patient) {
  const sections = sectionEntries(patient);
  const detected = {};

  Object.entries(CONCEPTS).forEach(([key, concept]) => {
    const positiveHits = [];
    const negativeHits = [];
    sections.forEach((section) => {
      concept.aliases.forEach((rawAlias) => {
        const alias = normalizeClinicalText(rawAlias);
        termOccurrences(section.text, alias).forEach((index) => {
          const hit = {
            key,
            label: concept.label,
            alias: rawAlias,
            section: section.key,
            score: section.weight * (isUncertain(section.text, index) ? 0.62 : 1),
            uncertain: isUncertain(section.text, index),
            negated: isNegated(section.text, index)
          };
          if (hit.negated) negativeHits.push(hit); else positiveHits.push(hit);
        });
      });
    });
    if (positiveHits.length || negativeHits.length) {
      detected[key] = {
        key,
        label: concept.label,
        positiveHits,
        negativeHits,
        strength: positiveHits.reduce((sum, hit) => sum + hit.score, 0),
        negatedOnly: !positiveHits.length && negativeHits.length > 0
      };
    }
  });

  Object.entries(detectNumericConcepts(sections)).forEach(([key, hit]) => {
    const existing = detected[key] || { key, label: hit.label, positiveHits: [], negativeHits: [], strength: 0, negatedOnly: false };
    existing.positiveHits.push(hit);
    existing.strength += hit.score;
    existing.negatedOnly = false;
    if (!existing.label || existing.label === CONCEPTS[key]?.label) existing.label = hit.label;
    detected[key] = existing;
  });

  return detected;
}

function satisfiesRule(rule, present) {
  if (rule.requireAny && !rule.requireAny.some((key) => present.has(key))) return false;
  if (rule.requireAllGroups && !rule.requireAllGroups.every((group) => group.some((key) => present.has(key)))) return false;
  if (rule.minConcepts && present.size < rule.minConcepts) return false;
  return true;
}

function confidenceLabel(ratio, evidenceCount) {
  if (ratio >= 1.7 && evidenceCount >= 3) return 'Coerência alta';
  if (ratio >= 1.18 && evidenceCount >= 2) return 'Coerência moderada';
  return 'Coerência inicial';
}

export function deriveClinicalHypotheses(patient = {}, limit = 6) {
  const detected = detectConcepts(patient);
  const present = new Set(Object.entries(detected).filter(([, value]) => value.positiveHits.length).map(([key]) => key));

  const results = RULES.map((rule) => {
    if (!satisfiesRule(rule, present)) return null;
    let score = 0;
    const evidence = [];
    const contrary = [];

    Object.entries(rule.concepts).forEach(([key, weight]) => {
      const concept = detected[key];
      if (!concept) return;
      if (concept.positiveHits.length) {
        const strengthFactor = Math.min(1.45, 0.78 + concept.strength * 0.22);
        score += weight * strengthFactor;
        const objective = concept.positiveHits.find((hit) => hit.section === 'dados objetivos');
        evidence.push(objective?.label || concept.label);
      }
      if (concept.negativeHits.length && !concept.positiveHits.length) {
        score -= weight * 0.72;
        contrary.push(`Ausência documentada de ${concept.label.toLowerCase()}`);
      }
    });

    if (score < rule.threshold) return null;
    const uniqueEvidence = [...new Set(evidence)].slice(0, 6);
    const uniqueContrary = [...new Set(contrary)].slice(0, 3);
    const ratio = score / rule.threshold;
    return {
      id: rule.id,
      label: rule.label,
      level: rule.level,
      score: Math.round(score * 10) / 10,
      confidence: confidenceLabel(ratio, uniqueEvidence.length),
      why: rule.summary,
      evidence: uniqueEvidence,
      contrary: uniqueContrary,
      evidenceSummary: uniqueEvidence.length ? `Elementos reconhecidos: ${uniqueEvidence.join(', ')}.` : ''
    };
  }).filter(Boolean);

  return results
    .sort((a, b) => b.score - a.score || b.evidence.length - a.evidence.length || a.label.localeCompare(b.label, 'pt-BR'))
    .slice(0, limit);
}

export const CLINICAL_REASONING_TEST_CASES = [
  { name: 'SCA', story: 'Dor torácica opressiva com sudorese fria e supra de ST em parede inferior.', expected: 'Síndrome coronariana aguda' },
  { name: 'Nega SCA', story: 'Nega dor torácica, nega dispneia e nega febre. Refere dor lombar mecânica.', expected: null },
  { name: 'Sepse urinária', story: 'Febre e disúria há 2 dias. PAS 82, lactato 4,1 e oligúria.', expected: 'Sepse / choque séptico' },
  { name: 'TEP', story: 'Dispneia súbita, dor pleurítica, FC 128 e edema unilateral de perna.', expected: 'Tromboembolismo pulmonar' },
  { name: 'AVC', story: 'Início súbito de hemiparesia direita e afasia.', expected: 'AVC agudo' },
  { name: 'HSA', story: 'Cefaleia súbita, pior dor da vida, com vômitos e rigidez de nuca.', expected: 'Hemorragia subaracnoide' },
  { name: 'Asma', story: 'Paciente asmático com dispneia e sibilos difusos.', expected: 'Crise asmática / broncoespasmo' },
  { name: 'HDA', story: 'Hematêmese volumosa, melena e PAS 78.', expected: 'Hemorragia digestiva' },
  { name: 'Convulsão', story: 'Crise tônico-clônica seguida de estado pós-ictal.', expected: 'Crise epiléptica / estado pós-ictal' },
  { name: 'Opioide', story: 'Ingestão de opioide, coma, miose e depressão respiratória.', expected: 'Intoxicação / encefalopatia tóxico-metabólica' },
  { name: 'Negação em lista', story: 'Nega febre, calafrios, dispneia e dor torácica. Queixa-se apenas de dor lombar mecânica.', expected: null },
  { name: 'Negação com contraste', story: 'Nega febre, porém apresenta dispneia e linhas B bilaterais com hipoxemia.', expected: 'Edema agudo de pulmão / insuficiência cardíaca descompensada' },
  { name: 'SCA sem dor', story: 'Nega dor torácica, porém ECG com supra de ST e troponina elevada.', expected: 'Síndrome coronariana aguda' }
];
