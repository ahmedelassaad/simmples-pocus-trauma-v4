const labelMap = {
  contractility: {
    unknown: 'não avaliada',
    hyperdynamic: 'hiperdinâmica',
    normal: 'preservada',
    reduced: 'reduzida',
    severelyReduced: 'muito reduzida'
  },
  rv: {
    unknown: 'não avaliado',
    normal: 'normal',
    dilated: 'dilatado',
    severe: 'muito dilatado'
  },
  effusion: {
    unknown: 'não avaliado',
    none: 'ausente',
    small: 'pequeno',
    moderate: 'moderado',
    large: 'importante'
  },
  ivc: {
    unknown: 'não avaliada',
    collapsed: 'colabada/hiperdinâmica',
    variable: 'variação intermediária',
    plethoric: 'pletórica/pouco colapsável'
  },
  lungProfile: {
    unknown: 'não avaliado',
    A: 'perfil A predominante',
    Bdiffuse: 'perfil B bilateral/difuso',
    Bfocal: 'B-lines focais',
    mixed: 'perfil misto'
  },
  pleuralEffusion: {
    none: 'sem derrame pleural marcado',
    right: 'derrame pleural direito',
    left: 'derrame pleural esquerdo',
    bilateral: 'derrame pleural bilateral'
  },
  aorta: {
    notAssessed: 'não avaliada',
    normal: 'sem dilatação marcada',
    aneurysm: 'aneurisma/dilatação',
    dissectionConcern: 'sinal indireto/preocupação para síndrome aórtica'
  }
};

const bool = (value) => Boolean(value);
const addUnique = (array, item) => { if (item && !array.includes(item)) array.push(item); };

export const defaultPocusState = {
  mode: 'shock',
  contractility: 'unknown',
  rv: 'unknown',
  rvStrain: false,
  pericardialEffusion: 'unknown',
  tamponade: false,
  ivc: 'unknown',
  lungProfile: 'unknown',
  lungSlidingAbsent: false,
  lungPoint: false,
  pleuralEffusion: 'none',
  consolidation: false,
  diaphragm: false,
  fastRUQ: false,
  fastLUQ: false,
  fastPelvis: false,
  fastPericardial: false,
  aorta: 'notAssessed',
  dvtRightFemoral: false,
  dvtLeftFemoral: false,
  dvtRightPopliteal: false,
  dvtLeftPopliteal: false,
  bladderDistended: false,
  hydronephrosis: false,
  gallbladder: false
};

export function pocusModeLabel(mode) {
  return {
    shock: 'RUSH / choque indiferenciado',
    trauma: 'eFAST / trauma',
    dyspnea: 'dispneia aguda',
    vascular: 'DVT / aorta / vascular'
  }[mode] || 'POCUS';
}

export function analyzePocus(state) {
  const findings = [];
  const critical = [];
  const phenotypes = [];
  const nextSteps = [];

  const fastSites = [
    state.fastRUQ ? 'RUQ/Morrison' : '',
    state.fastLUQ ? 'LUQ/esplenorrenal' : '',
    state.fastPelvis ? 'pelve' : '',
    state.fastPericardial ? 'pericárdio' : ''
  ].filter(Boolean);
  const dvtSites = [
    state.dvtRightFemoral ? 'femoral D' : '',
    state.dvtLeftFemoral ? 'femoral E' : '',
    state.dvtRightPopliteal ? 'poplítea D' : '',
    state.dvtLeftPopliteal ? 'poplítea E' : ''
  ].filter(Boolean);

  if (state.contractility !== 'unknown') findings.push(`VE com contratilidade ${labelMap.contractility[state.contractility]}`);
  if (state.rv !== 'unknown') findings.push(`VD ${labelMap.rv[state.rv]}`);
  if (state.rvStrain) findings.push('sinais indiretos de strain de VD');
  if (state.pericardialEffusion !== 'unknown') findings.push(`derrame pericárdico ${labelMap.effusion[state.pericardialEffusion]}`);
  if (state.tamponade) findings.push('sinais ecográficos de tamponamento');
  if (state.ivc !== 'unknown') findings.push(`VCI ${labelMap.ivc[state.ivc]}`);
  if (state.lungProfile !== 'unknown') findings.push(labelMap.lungProfile[state.lungProfile]);
  if (state.lungSlidingAbsent) findings.push('ausência de lung sliding em algum hemitórax');
  if (state.lungPoint) findings.push('lung point presente');
  if (state.pleuralEffusion !== 'none') findings.push(labelMap.pleuralEffusion[state.pleuralEffusion]);
  if (state.consolidation) findings.push('consolidação pulmonar/subpleural');
  if (state.diaphragm) findings.push('alteração de excursão diafragmática');
  if (fastSites.length) findings.push(`FAST/eFAST positivo: ${fastSites.join(', ')}`);
  if (state.aorta !== 'notAssessed') findings.push(`aorta abdominal: ${labelMap.aorta[state.aorta]}`);
  if (dvtSites.length) findings.push(`DVT: incompressibilidade em ${dvtSites.join(', ')}`);
  if (state.bladderDistended) findings.push('bexiga distendida');
  if (state.hydronephrosis) findings.push('hidronefrose marcada');
  if (state.gallbladder) findings.push('vesícula/biliar com achado relevante');

  const hasPoorLv = state.contractility === 'reduced' || state.contractility === 'severelyReduced';
  const hasHyperdynamic = state.contractility === 'hyperdynamic';
  const hasRvProblem = state.rv === 'dilated' || state.rv === 'severe' || state.rvStrain;
  const hasDvt = dvtSites.length > 0;
  const hasPneumo = state.lungPoint || state.lungSlidingAbsent;
  const hasDiffuseB = state.lungProfile === 'Bdiffuse';
  const hasFocalLung = state.lungProfile === 'Bfocal' || state.consolidation;
  const hasTamponade = state.tamponade || (state.pericardialEffusion === 'large');
  const hasFast = fastSites.length > 0;

  if (hasTamponade) {
    addUnique(critical, 'Possível tamponamento cardíaco');
    phenotypes.push({ label: 'Choque obstrutivo — tamponamento provável', tone: 'danger', helper: 'Derrame importante/sinais de tamponamento no POCUS.' });
    nextSteps.push('Acionar suporte/cirurgia/cardiologia conforme cenário; correlacionar com pulso paradoxal, instabilidade e janela para drenagem.');
  }

  if (hasPneumo) {
    addUnique(critical, state.lungPoint ? 'Pneumotórax provável pelo lung point' : 'Pneumotórax possível por ausência de sliding');
    phenotypes.push({ label: 'Choque obstrutivo — pneumotórax a excluir/tratar se instável', tone: 'danger', helper: 'Ausência de sliding/ lung point deve ser correlacionada com M-mode, pulso pulmonar e clínica.' });
    nextSteps.push('Se instabilidade compatível com pneumotórax hipertensivo, priorizar tratamento emergencial conforme protocolo.');
  }

  if (hasRvProblem || hasDvt) {
    const helper = hasDvt ? 'DVT marcada aumenta probabilidade pré-teste para TEP no contexto adequado.' : 'VD dilatado/strain é compatível, mas não específico.';
    phenotypes.push({ label: 'Choque obstrutivo — TEP com repercussão a considerar', tone: hasRvProblem && hasDvt ? 'danger' : 'warning', helper });
    nextSteps.push('Correlacionar com ECG, biomarcadores, risco hemorrágico e possibilidade de angioTC/ecocardiograma formal.');
  }

  if (hasPoorLv && (hasDiffuseB || state.ivc === 'plethoric')) {
    phenotypes.push({ label: 'Choque cardiogênico/congestivo provável', tone: 'danger', helper: 'VE reduzido associado a congestão pulmonar e/ou VCI pletórica.' });
    nextSteps.push('Evitar excesso de volume; considerar suporte vasoativo/inotrópico e estratégia de descongestão conforme pressão/perfusão.');
  } else if (hasPoorLv) {
    phenotypes.push({ label: 'Disfunção sistólica de VE', tone: 'warning', helper: 'Interpretar com congestão, perfusão, ECG e história.' });
  }

  if (hasFast) {
    addUnique(critical, `FAST/eFAST positivo: ${fastSites.join(', ')}`);
    phenotypes.push({ label: 'Hemorragia/lesão cavitária até prova em contrário no trauma', tone: 'danger', helper: `Janelas positivas: ${fastSites.join(', ')}.` });
    nextSteps.push('No trauma instável, FAST positivo deve encurtar tempo até controle de fonte; se estável, TC conforme protocolo local.');
  }

  if (hasHyperdynamic && state.ivc === 'collapsed') {
    phenotypes.push({ label: 'Hipovolemia provável / responsividade a volume possível', tone: 'warning', helper: 'VE hiperdinâmico + VCI colabada sugerem baixo preload, mas não substituem avaliação dinâmica.' });
    nextSteps.push('Reavaliar após intervenção e procurar fonte: sangramento, perda hídrica, distributivo inicial.');
  }

  if (state.contractility === 'normal' && state.ivc === 'collapsed' && !hasDiffuseB) {
    phenotypes.push({ label: 'Perfil compatível com baixo volume efetivo', tone: 'warning', helper: 'Contratilidade preservada + VCI colabada + ausência de congestão marcada.' });
  }

  if (hasDiffuseB && !hasPoorLv) {
    phenotypes.push({ label: 'Síndrome intersticial/alveolar difusa', tone: 'warning', helper: 'Perfil B difuso pode ocorrer em edema cardiogênico, SDRA, pneumonia viral/intersticial e outras causas.' });
    nextSteps.push('Correlacionar perfil B com função cardíaca, VCI, febre, radiologia e resposta terapêutica.');
  }

  if (hasFocalLung) {
    phenotypes.push({ label: 'Processo pulmonar focal possível', tone: 'warning', helper: 'B-lines focais/consolidação sugerem pneumonia, atelectasia, contusão ou edema focal conforme contexto.' });
  }

  if (state.aorta === 'aneurysm' || state.aorta === 'dissectionConcern') {
    addUnique(critical, 'Achado relevante em aorta abdominal');
    phenotypes.push({ label: 'Aorta com achado crítico possível', tone: 'danger', helper: 'POCUS não exclui síndrome aórtica; achado positivo deve acelerar imagem definitiva se compatível.' });
    nextSteps.push('Correlacionar com dor, pulso, choque e solicitar imagem definitiva/vascular conforme protocolo.');
  }

  if (state.bladderDistended) {
    phenotypes.push({ label: 'Retenção urinária/obstrução baixa possível', tone: 'warning', helper: 'Bexiga distendida no contexto de oligúria muda o raciocínio de choque/IRA.' });
  }

  if (state.hydronephrosis) {
    phenotypes.push({ label: 'Obstrução urinária alta possível', tone: 'warning', helper: 'Hidronefrose deve ser correlacionada com dor, sepse, rim único e função renal.' });
  }

  if (!phenotypes.length) {
    phenotypes.push({ label: 'Sem fenótipo automático pelos achados marcados', tone: 'neutral', helper: 'Preencha as janelas avaliadas para gerar hipótese integrada.' });
  }

  const missing = [];
  if (state.contractility === 'unknown' || state.rv === 'unknown' || state.pericardialEffusion === 'unknown') missing.push('cardíaco');
  if (state.ivc === 'unknown') missing.push('VCI');
  if (state.lungProfile === 'unknown' && !state.lungSlidingAbsent && !state.lungPoint) missing.push('pulmão');
  if (state.mode === 'trauma' && !hasFast) missing.push('janelas FAST negativas não documentadas/ausentes');
  if (state.mode === 'vascular' && !hasDvt && state.aorta === 'notAssessed') missing.push('DVT/aorta');

  const reportLines = [
    'SIMMples POCUS',
    `Modo: ${pocusModeLabel(state.mode)}.`,
    `Cardíaco/Pump: VE ${labelMap.contractility[state.contractility]}; VD ${labelMap.rv[state.rv]}; strain VD: ${bool(state.rvStrain) ? 'sim' : 'não'}; derrame pericárdico ${labelMap.effusion[state.pericardialEffusion]}; tamponamento: ${bool(state.tamponade) ? 'sim' : 'não'}.`,
    `Tank/Pulmão/VCI: VCI ${labelMap.ivc[state.ivc]}; pulmão ${labelMap.lungProfile[state.lungProfile]}; sliding ausente: ${bool(state.lungSlidingAbsent) ? 'sim' : 'não'}; lung point: ${bool(state.lungPoint) ? 'sim' : 'não'}; pleura: ${labelMap.pleuralEffusion[state.pleuralEffusion]}; consolidação: ${bool(state.consolidation) ? 'sim' : 'não'}.`,
    `eFAST/abdome: ${fastSites.length ? `positivo em ${fastSites.join(', ')}` : 'sem positividade marcada'}; aorta ${labelMap.aorta[state.aorta]}; bexiga distendida: ${bool(state.bladderDistended) ? 'sim' : 'não'}; hidronefrose: ${bool(state.hydronephrosis) ? 'sim' : 'não'}.`,
    `Pipes/DVT: ${dvtSites.length ? `incompressibilidade em ${dvtSites.join(', ')}` : 'sem DVT marcada'}.`,
    `Achados integrados: ${findings.length ? findings.join('; ') : 'nenhum achado marcado'}.`,
    `Fenótipo(s) sugerido(s): ${phenotypes.map((p) => p.label).join('; ')}.`,
    `Alertas críticos: ${critical.length ? critical.join('; ') : 'nenhum alerta crítico automático'}.`,
    `Próximos passos sugeridos: ${nextSteps.length ? nextSteps.join(' ') : 'correlacionar com exame físico, contexto clínico e reavaliação seriada.'}`
  ];

  return {
    findings,
    fastSites,
    dvtSites,
    critical,
    phenotypes,
    nextSteps,
    missing,
    report: reportLines.join('\n')
  };
}
