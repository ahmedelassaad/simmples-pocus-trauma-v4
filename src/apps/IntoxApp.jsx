import { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Beaker, ClipboardList, Clock3, FlaskConical,
  HeartPulse, Microscope, Pill, Search, ShieldAlert, Stethoscope, Thermometer
} from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { clean, n } from '../lib/format.js';

const tabs = [
  { value: 'triagem', label: 'Triagem' },
  { value: 'tox', label: 'Toxidromes' },
  { value: 'ecg', label: 'ECG/Labs' },
  { value: 'agentes', label: 'Agentes' },
  { value: 'antidotos', label: 'Antídotos' },
  { value: 'resumo', label: 'Resumo' }
];

const toxidromes = {
  opioid: {
    label: 'Opioide', color: 'purple', icon: '●',
    clues: ['Miose', 'Bradipneia/apneia', 'Rebaixamento', 'Hipotermia variável'],
    risk: 'Falência ventilatória e aspiração', monitor: 'FR, capnografia, SpO₂, consciência e recorrência clínica.'
  },
  sympatho: {
    label: 'Simpaticomimético', color: 'danger', icon: '▲',
    clues: ['Midríase', 'Taquicardia/hipertensão', 'Diaforese', 'Agitação/hipertermia'],
    risk: 'Hipertermia, arritmia, convulsão e rabdomiólise', monitor: 'Temperatura central, ECG, CK, função renal e eletrólitos.'
  },
  anticholinergic: {
    label: 'Anticolinérgico', color: 'warning', icon: '◉',
    clues: ['Midríase', 'Pele seca', 'Retenção urinária', 'Delirium/íleo'],
    risk: 'Hipertermia, agitação e retenção', monitor: 'Temperatura, bexiga, ECG/QRS/QTc e estado mental.'
  },
  cholinergic: {
    label: 'Colinérgico', color: 'success', icon: '≈',
    clues: ['Sialorreia/lacrimejamento', 'Broncorreia', 'Diarreia', 'Miose/fasciculações'],
    risk: 'Broncorreia, bradicardia e falência respiratória', monitor: 'Secreções, ausculta, força muscular, ECG e oxigenação.'
  },
  sedative: {
    label: 'Sedativo/hipnótico', color: 'neutral', icon: '—',
    clues: ['Sonolência', 'Fala arrastada', 'Ataxia', 'Hipoventilação'],
    risk: 'Depressão respiratória e coingestões', monitor: 'Ventilação, glicemia, trauma oculto e tempo de observação.'
  },
  serotonin: {
    label: 'Serotoninérgico', color: 'danger', icon: '✦',
    clues: ['Clônus', 'Hiperreflexia', 'Hipertermia', 'Agitação/diarreia'],
    risk: 'Hipertermia, rigidez e deterioração rápida', monitor: 'Clônus, temperatura, CK, função renal e eletrólitos.'
  },
  sodium: {
    label: 'Bloqueio de canal de sódio', color: 'danger', icon: '⌁',
    clues: ['QRS largo', 'R terminal em aVR', 'Hipotensão', 'Convulsão'],
    risk: 'Arritmia ventricular e choque', monitor: 'ECG seriado, QRS, aVR, pH, eletrólitos e perfusão.'
  },
  withdrawal: {
    label: 'Abstinência hiperadrenérgica', color: 'warning', icon: '↟',
    clues: ['Tremor', 'Agitação', 'Taquicardia', 'Diaforese/hipertensão'],
    risk: 'Convulsão, delirium e hipertermia', monitor: 'Estado mental, sinais autonômicos, glicemia e eletrólitos.'
  }
};

const agents = [
  {
    id: 'tca', name: 'Tricíclicos / bloqueadores de canal de sódio',
    clues: 'Anticolinérgico, convulsão, hipotensão, QRS largo e R terminal em aVR.',
    tests: 'ECG seriado, gasometria, eletrólitos, glicemia e lactato.',
    action: 'Priorizar via aérea/ventilação, perfusão e reconhecer cardiotoxicidade precocemente.'
  },
  {
    id: 'paracetamol', name: 'Paracetamol',
    clues: 'Pode haver poucos sintomas inicialmente; tempo e dose estimada são fundamentais.',
    tests: 'Dosagem sérica no tempo apropriado, transaminases, INR, função renal e gasometria se grave.',
    action: 'Não aguardar lesão hepática evidente quando o risco for relevante; discutir com CIATox.'
  },
  {
    id: 'salicylate', name: 'Salicilato',
    clues: 'Taquipneia, zumbido, vômitos, alteração de consciência e distúrbio misto.',
    tests: 'Gasometria seriada, salicilato sérico, eletrólitos, glicemia e função renal.',
    action: 'Evitar atrasos na avaliação seriada; piora neurológica ou acidemia mudam gravidade.'
  },
  {
    id: 'bbccb', name: 'Betabloqueador / bloqueador de canal de cálcio',
    clues: 'Bradicardia, hipotensão, bloqueios, hipoglicemia ou hiperglicemia conforme agente.',
    tests: 'ECG, glicemia seriada, eletrólitos, gasometria/lactato e eco/POCUS.',
    action: 'Avaliar choque cardiogênico/distributivo e necessidade de suporte avançado.'
  },
  {
    id: 'toxic-alcohol', name: 'Álcoois tóxicos',
    clues: 'Alteração visual, acidose com ânion gap, alteração neurológica ou insuficiência renal.',
    tests: 'Gasometria, ânion gap, osmolaridade medida, função renal, cálcio e agente específico quando disponível.',
    action: 'Osmolar gap normal não exclui exposição tardia; discutir cedo com CIATox/nefrologia.'
  },
  {
    id: 'co', name: 'Monóxido de carbono',
    clues: 'Cefaleia, náusea, confusão, síncope, dor torácica; SpO₂ pode ser enganosa.',
    tests: 'Co-oximetria, ECG/troponina conforme gravidade, gasometria e lactato.',
    action: 'Remover exposição, ofertar oxigênio e avaliar critérios de terapia hiperbárica local.'
  },
  {
    id: 'digoxin', name: 'Digoxina',
    clues: 'Náuseas, alterações visuais, bradi/taquiarritmias e hipercalemia em quadros graves.',
    tests: 'ECG contínuo, potássio, magnésio, função renal e nível sérico interpretado no tempo correto.',
    action: 'Valorizar instabilidade, arritmia e hipercalemia; discutir antídoto específico.'
  },
  {
    id: 'lithium', name: 'Lítio',
    clues: 'Tremor, ataxia, disartria, confusão, vômitos e possível convulsão.',
    tests: 'Litemia seriada, função renal, sódio, ECG e estado volêmico.',
    action: 'A gravidade clínica e a evolução seriada são tão importantes quanto um valor isolado.'
  },
  {
    id: 'last', name: 'Toxicidade sistêmica por anestésico local',
    clues: 'Sintomas neurológicos precoces, convulsão, hipotensão e arritmia após exposição.',
    tests: 'ECG contínuo, gasometria, eletrólitos e perfusão.',
    action: 'Reconhecimento imediato, suporte de via aérea/circulação e protocolo institucional específico.'
  },
  {
    id: 'methemoglobin', name: 'Metemoglobinemia',
    clues: 'Cianose com baixa resposta ao oxigênio e discrepância entre SpO₂ e PaO₂.',
    tests: 'Co-oximetria, gasometria, lactato e investigação do agente.',
    action: 'Correlacionar nível, sintomas, comorbidades e contraindicações ao tratamento específico.'
  }
];

const antidotes = [
  ['Reversão de depressão por opioides', 'Existe terapia específica em quadros compatíveis; priorize ventilação e confirme o protocolo com CIATox.'],
  ['Proteção hepática em exposição a paracetamol', 'A decisão depende de tempo, exposição e exames; não aguarde lesão hepática evidente para discutir o caso.'],
  ['Cardiotoxicidade por bloqueio de canal de sódio', 'QRS alargado, instabilidade ou convulsão exigem protocolo específico e monitorização contínua.'],
  ['Síndrome colinérgica', 'Broncorreia, secreções e fraqueza respiratória exigem suporte e terapia específica conforme protocolo.'],
  ['Álcoois tóxicos', 'Acidose, alteração visual, hiato osmolar ou exposição confirmada exigem contato precoce com CIATox/nefrologia.'],
  ['Intoxicação digitálica', 'Arritmias, instabilidade e alterações eletrolíticas podem indicar terapia específica.'],
  ['Cianeto em contexto compatível', 'Incêndio em ambiente fechado, colapso cardiovascular ou lactato muito elevado exigem protocolo institucional.'],
  ['Toxicidade sistêmica por anestésico local', 'Reconhecimento imediato, suporte avançado e protocolo institucional específico.'],
  ['Metemoglobinemia', 'A decisão terapêutica depende de sintomas, co-oximetria, comorbidades e contraindicações.'],
  ['Anticoagulação com sangramento', 'Reversão depende do agente, gravidade e protocolo institucional.']
];

function FieldSelect({ label, value, onChange, children }) {
  return <label className="field"><span>{label}</span><div className="field-box"><select value={value} onChange={(e)=>onChange(e.target.value)}>{children}</select></div></label>;
}

export function IntoxApp() {
  const [tab, setTab] = useState('triagem');
  const [tox, setTox] = useState('opioid');
  const [agent, setAgent] = useState('tca');
  const [meta, setMeta] = useState({ age: '', weight: '', time: '', route: 'oral', substance: '', amount: '' });
  const [ecg, setEcg] = useState({ qrs: '', qtc: '', temp: '', glucose: '', ph: '', lactate: '', na: '', cl: '', hco3: '', bun: '', osm: '' });
  const [flags, setFlags] = useState({ seizure: false, coma: false, hypotension: false, dysrhythmia: false, hypoventilation: false, hyperthermia: false, aspiration: false, shock: false });

  const qrs = clean(ecg.qrs);
  const qtc = clean(ecg.qtc);
  const temp = clean(ecg.temp);
  const glucose = clean(ecg.glucose);
  const ph = clean(ecg.ph);
  const lactate = clean(ecg.lactate);
  const na = clean(ecg.na);
  const cl = clean(ecg.cl);
  const hco3 = clean(ecg.hco3);
  const bun = clean(ecg.bun);
  const measuredOsm = clean(ecg.osm);
  const wideQrs = qrs !== null && qrs >= 100;
  const longQt = qtc !== null && qtc >= 500;
  const hyperthermia = temp !== null && temp >= 38.5;
  const hypoglycemia = glucose !== null && glucose < 70;
  const acidemia = ph !== null && ph < 7.30;
  const highLactate = lactate !== null && lactate >= 4;
  const anionGap = [na, cl, hco3].every((value)=>value !== null) ? na - cl - hco3 : null;
  const calculatedOsm = [na, glucose, bun].every((value)=>value !== null) ? 2 * na + glucose / 18 + bun / 2.8 : null;
  const osmGap = measuredOsm !== null && calculatedOsm !== null ? measuredOsm - calculatedOsm : null;
  const selected = toxidromes[tox];
  const selectedAgent = agents.find((item)=>item.id === agent) || agents[0];

  const redFlags = [
    wideQrs && 'QRS ≥100 ms: cardiotoxicidade por bloqueio de canal de sódio deve ser considerada.',
    longQt && 'QTc ≥500 ms: risco aumentado de arritmia ventricular.',
    hyperthermia && 'Hipertermia: emergência tempo-dependente.',
    hypoglycemia && 'Hipoglicemia: corrigir e reavaliar consciência.',
    acidemia && 'Acidemia relevante pode agravar cardiotoxicidade.',
    highLactate && 'Lactato elevado: hipoperfusão, convulsão ou toxicidade sistêmica.',
    flags.seizure && 'Convulsão presente.',
    flags.coma && 'Rebaixamento importante / risco de via aérea.',
    flags.hypoventilation && 'Hipoventilação / depressão respiratória.',
    flags.shock && 'Choque ou deterioração hemodinâmica.'
  ].filter(Boolean);
  const riskTone = redFlags.length >= 3 ? 'danger' : redFlags.length ? 'warning' : 'success';

  const report = useMemo(() => `SIMMples INTOX\nSubstância: ${meta.substance || '--'} | Via: ${meta.route} | Tempo: ${meta.time || '--'} h\nToxidrome principal: ${selected.label}\nPistas: ${selected.clues.join(', ')}\nAgente/padrão revisado: ${selectedAgent.name}\nECG: QRS ${ecg.qrs || '--'} ms | QTc ${ecg.qtc || '--'} ms\nLaboratório: pH ${ecg.ph || '--'} | lactato ${ecg.lactate || '--'} | AG ${anionGap !== null ? n(anionGap,1) : '--'} | gap osmolar ${osmGap !== null ? n(osmGap,1) : '--'}\nAlertas: ${redFlags.length ? redFlags.join(' ') : 'Sem alertas críticos marcados.'}\nConduta geral: ABCDE, glicemia, ECG seriado, temperatura, investigação dirigida e contato com CIATox/protocolo local.`, [meta, selected, selectedAgent, ecg, anionGap, osmGap, redFlags]);

  return (
    <div className="compact-module intox-module">
      <Segmented value={tab} onChange={setTab} options={tabs} />

      {tab === 'triagem' && <>
        <Card className="compact-card clinical-hero-card" title="Paciente intoxicado" kicker="Entrada rápida e segura" tone={riskTone}>
          <div className="grid-3 compact-grid">
            <NumberField label="Idade" value={meta.age} onChange={(v)=>setMeta({...meta,age:v})} unit="anos" />
            <NumberField label="Peso" value={meta.weight} onChange={(v)=>setMeta({...meta,weight:v})} unit="kg" />
            <NumberField label="Tempo" value={meta.time} onChange={(v)=>setMeta({...meta,time:v})} unit="h" />
          </div>
          <div className="grid-2 compact-grid top-gap">
            <label className="field"><span>Substância / produto</span><div className="field-box"><input value={meta.substance} onChange={(e)=>setMeta({...meta,substance:e.target.value})} placeholder="Nome, classe ou desconhecido" /></div></label>
            <FieldSelect label="Via provável" value={meta.route} onChange={(route)=>setMeta({...meta,route})}><option value="oral">Oral</option><option value="inalatoria">Inalatória</option><option value="cutanea">Cutânea</option><option value="parenteral">Parenteral</option><option value="desconhecida">Desconhecida</option></FieldSelect>
          </div>
          <label className="field top-gap"><span>Quantidade / contexto clínico</span><div className="field-box"><input value={meta.amount} onChange={(e)=>setMeta({...meta,amount:e.target.value})} placeholder="Estimativa, formulação, coexposições e horário" /></div></label>
          <div className="grid-3 compact-grid top-gap">
            <Result label="Gravidade" value={redFlags.length ? `${redFlags.length} alertas` : 'Sem alerta marcado'} tone={riskTone} helper="Reavaliação contínua" />
            <Result label="QRS" value={ecg.qrs || '--'} tone={wideQrs ? 'danger' : 'neutral'} helper="ms" />
            <Result label="Temperatura" value={ecg.temp || '--'} tone={hyperthermia ? 'danger' : 'neutral'} helper="°C" />
          </div>
        </Card>
        <Card title="ABCDE toxicológico" kicker="O que muda desfecho">
          <div className="clinical-flow-grid">
            {[['A','Via aérea','Rebaixamento, vômitos, secreções e trauma associado.'],['B','Ventilação','FR, capnografia, SpO₂ e broncorreia/broncoespasmo.'],['C','Circulação','ECG, QRS/QTc, perfusão, PA e acesso venoso.'],['D','Neurológico','Glicemia, pupilas, clônus, rigidez e convulsão.'],['E','Exposição','Temperatura, adesivos, odores, pele e frascos trazidos.']].map(([letter,title,text])=><article className="clinical-flow-card" key={letter}><span>{letter}</span><div><strong>{title}</strong><p>{text}</p></div></article>)}
          </div>
        </Card>
        <Card title="Sinais de gravidade" kicker="Marque rapidamente">
          <div className="toggle-grid compact-toggle-grid">
            <ToggleRow label="Convulsão" checked={flags.seizure} onChange={(v)=>setFlags({...flags,seizure:v})} />
            <ToggleRow label="Coma / rebaixamento importante" checked={flags.coma} onChange={(v)=>setFlags({...flags,coma:v})} />
            <ToggleRow label="Hipoventilação" checked={flags.hypoventilation} onChange={(v)=>setFlags({...flags,hypoventilation:v})} />
            <ToggleRow label="Hipotensão" checked={flags.hypotension} onChange={(v)=>setFlags({...flags,hypotension:v})} />
            <ToggleRow label="Arritmia" checked={flags.dysrhythmia} onChange={(v)=>setFlags({...flags,dysrhythmia:v})} />
            <ToggleRow label="Hipertermia" checked={flags.hyperthermia} onChange={(v)=>setFlags({...flags,hyperthermia:v})} />
            <ToggleRow label="Aspiração" checked={flags.aspiration} onChange={(v)=>setFlags({...flags,aspiration:v})} />
            <ToggleRow label="Choque" checked={flags.shock} onChange={(v)=>setFlags({...flags,shock:v})} />
          </div>
        </Card>
      </>}

      {tab === 'tox' && <>
        <Card className="compact-card" title="Reconhecimento sindrômico" kicker="Toxidromes interativos">
          <div className="toxidrome-grid">
            {Object.entries(toxidromes).map(([key,item])=><button type="button" key={key} className={tox===key?`toxidrome-card active tone-${item.color}`:`toxidrome-card tone-${item.color}`} onClick={()=>setTox(key)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.clues.slice(0,2).join(' • ')}</small></button>)}
          </div>
        </Card>
        <Card title={selected.label} kicker="Padrão selecionado" tone={selected.color}>
          <div className="micro-card-grid">{selected.clues.map((item)=><article className="mini-card" key={item}><strong><Pill size={15}/>{item}</strong></article>)}</div>
          <div className="grid-2 compact-grid top-gap"><Result label="Risco-chave" value={selected.risk} tone={selected.color}/><Result label="Monitorização" value="Direcionada" tone="neutral" helper={selected.monitor}/></div>
        </Card>
      </>}

      {tab === 'ecg' && <>
        <Card className="compact-card" title="ECG tóxico" kicker="Cardiotoxicidade">
          <div className="grid-2 compact-grid"><NumberField label="QRS" value={ecg.qrs} onChange={(v)=>setEcg({...ecg,qrs:v})} unit="ms"/><NumberField label="QTc" value={ecg.qtc} onChange={(v)=>setEcg({...ecg,qtc:v})} unit="ms"/><NumberField label="Temperatura" value={ecg.temp} onChange={(v)=>setEcg({...ecg,temp:v})} unit="°C"/><NumberField label="Glicemia" value={ecg.glucose} onChange={(v)=>setEcg({...ecg,glucose:v})} unit="mg/dL"/></div>
          <div className="grid-2 compact-grid top-gap"><Result label="QRS" value={ecg.qrs || '--'} tone={wideQrs?'danger':'success'} helper={wideQrs?'Canal de sódio / cardiotoxicidade':'Sem alargamento marcado'}/><Result label="QTc" value={ecg.qtc || '--'} tone={longQt?'danger':'success'} helper={longQt?'Risco de torsades':'Sem prolongamento marcante'}/><Result label="Temperatura" value={ecg.temp || '--'} tone={hyperthermia?'danger':'neutral'} helper={hyperthermia?'Hipertermia':'Checar contexto'}/><Result label="Glicemia" value={ecg.glucose || '--'} tone={hypoglycemia?'danger':'neutral'} helper={hypoglycemia?'Hipoglicemia':'Sem alerta'}/></div>
        </Card>
        <Card title="Ácido-base e gaps" kicker="Toxicologia laboratorial">
          <div className="grid-3 compact-grid"><NumberField label="pH" value={ecg.ph} onChange={(v)=>setEcg({...ecg,ph:v})}/><NumberField label="Lactato" value={ecg.lactate} onChange={(v)=>setEcg({...ecg,lactate:v})} unit="mmol/L"/><NumberField label="Na" value={ecg.na} onChange={(v)=>setEcg({...ecg,na:v})} unit="mEq/L"/><NumberField label="Cl" value={ecg.cl} onChange={(v)=>setEcg({...ecg,cl:v})} unit="mEq/L"/><NumberField label="HCO₃" value={ecg.hco3} onChange={(v)=>setEcg({...ecg,hco3:v})} unit="mEq/L"/><NumberField label="BUN" value={ecg.bun} onChange={(v)=>setEcg({...ecg,bun:v})} unit="mg/dL"/><NumberField label="Osm medida" value={ecg.osm} onChange={(v)=>setEcg({...ecg,osm:v})} unit="mOsm/kg"/></div>
          <div className="grid-3 compact-grid top-gap"><Result label="Ânion gap" value={anionGap!==null?n(anionGap,1):'--'} tone={anionGap!==null&&anionGap>12?'warning':'neutral'} helper="Na − Cl − HCO₃"/><Result label="Osm calculada" value={calculatedOsm!==null?n(calculatedOsm,1):'--'} tone="neutral"/><Result label="Gap osmolar" value={osmGap!==null?n(osmGap,1):'--'} tone={osmGap!==null&&osmGap>10?'warning':'neutral'} helper="Interpretar com tempo e contexto"/></div>
          {redFlags.length>0&&<div className="alert-stack top-gap">{redFlags.map((item)=><div className="clinical-alert" key={item}><AlertTriangle size={17}/><span>{item}</span></div>)}</div>}
        </Card>
      </>}

      {tab === 'agentes' && <>
        <Card title="Biblioteca de agentes" kicker="Busca rápida">
          <div className="search-box"><Search size={15}/><select value={agent} onChange={(e)=>setAgent(e.target.value)}>{agents.map((item)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
        </Card>
        <Card title={selectedAgent.name} kicker="Padrão de emergência">
          <div className="agent-brief-grid"><article><Stethoscope size={18}/><span>Pistas clínicas</span><strong>{selectedAgent.clues}</strong></article><article><Microscope size={18}/><span>Exames úteis</span><strong>{selectedAgent.tests}</strong></article><article><ShieldAlert size={18}/><span>Prioridade</span><strong>{selectedAgent.action}</strong></article></div>
        </Card>
      </>}

      {tab === 'antidotos' && <Card className="compact-card" title="Terapias específicas e gatilhos" kicker="Confirmar CIATox / protocolo local">
        <div className="antidote-list">{antidotes.map(([title,text])=><article className="antidote-card" key={title}><span><FlaskConical size={18}/></span><div><strong>{title}</strong><p>{text}</p></div></article>)}</div>
        <div className="notice-box top-gap"><ShieldAlert size={15}/> Antídotos não substituem suporte ABCDE. Evite uso automático sem agente, contexto, contraindicações e monitorização adequados.</div>
      </Card>}

      {tab === 'resumo' && <>
        <Card title="Resumo clínico" kicker="Pronto para prontuário"><pre className="report-box">{report}</pre><CopyButton text={report}><ClipboardList size={18}/> Copiar resumo INTOX</CopyButton></Card>
        <Card title="Checklist de disposição" kicker="Antes de liberar ou transferir"><div className="micro-card-grid">{['Reavaliar consciência, ventilação, temperatura e sinais vitais.', 'ECG seriado quando houver cardiotoxicidade potencial.', 'Definir tempo de observação pelo agente/formulação e evolução.', 'Confirmar suporte social, segurança e seguimento conforme o contexto clínico.', 'Discutir casos graves, agentes desconhecidos ou dúvidas com CIATox.'].map((item)=><article className="mini-card" key={item}><strong><Clock3 size={15}/>{item}</strong></article>)}</div></Card>
      </>}
    </div>
  );
}
