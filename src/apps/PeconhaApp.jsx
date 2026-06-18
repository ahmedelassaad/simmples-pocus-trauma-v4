import { useMemo, useState } from 'react';
import {
  AlertTriangle, Bug, ClipboardList, Clock3, Droplets, FlaskConical,
  HeartPulse, Microscope, ShieldAlert, Stethoscope, Thermometer, Waves
} from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';

const tabs = [
  { value: 'animal', label: 'Animal' },
  { value: 'gravidade', label: 'Gravidade' },
  { value: 'exames', label: 'Exames' },
  { value: 'soro', label: 'Soroterapia' },
  { value: 'resumo', label: 'Resumo' }
];

const animals = {
  bothrops: {
    label: 'Bothrops — jararaca', group: 'Serpente', syndrome: 'Inflamatória, coagulante e hemorrágica',
    local: 'Dor, edema, equimose, bolhas e possível necrose.', systemic: 'Sangramento, coagulopatia, hipotensão e injúria renal.',
    antivenom: 'Soroterapia específica para acidente botrópico, conforme protocolo vigente.',
    serum: { leve: 'Avaliar indicação conforme protocolo', moderado: 'Soroterapia indicada — confirmar protocolo', grave: 'Soroterapia urgente — confirmar protocolo' },
    labs: ['Tempo de coagulação / TP / TTPa / fibrinogênio', 'Hemograma e plaquetas', 'Creatinina, ureia e eletrólitos', 'Urina e diurese', 'CK se síndrome muscular/dúvida diagnóstica'],
    severe: ['shock','majorBleeding','aki'], color: 'warning'
  },
  crotalus: {
    label: 'Crotalus — cascavel', group: 'Serpente', syndrome: 'Neuroparalítica e miotóxica',
    local: 'Achados locais podem ser discretos.', systemic: 'Ptose, fácies miastênica, mialgia, mioglobinúria e injúria renal.',
    antivenom: 'Soroterapia específica para acidente crotálico, conforme protocolo vigente.',
    serum: { leve: 'Soroterapia indicada — confirmar protocolo', moderado: 'Soroterapia indicada — confirmar protocolo', grave: 'Soroterapia urgente — confirmar protocolo' },
    labs: ['CK seriada', 'Creatinina, ureia e eletrólitos', 'Urina/mioglobinúria e diurese', 'Gasometria se falência respiratória', 'Coagulação conforme contexto'],
    severe: ['resp','oliguria','darkUrine','neuro'], color: 'purple'
  },
  lachesis: {
    label: 'Lachesis — surucucu', group: 'Serpente', syndrome: 'Botrópica-like com manifestações vagais',
    local: 'Dor e edema importantes.', systemic: 'Sangramento, coagulopatia, hipotensão, bradicardia, diarreia e vômitos.',
    antivenom: 'Soroterapia específica para acidente laquético, conforme protocolo vigente.',
    serum: { leve: 'Não se aplica', moderado: 'Soroterapia indicada — confirmar protocolo', grave: 'Soroterapia urgente — confirmar protocolo' },
    labs: ['Coagulograma e fibrinogênio', 'Hemograma/plaquetas', 'Função renal e eletrólitos', 'ECG e monitorização hemodinâmica', 'Diurese'],
    severe: ['shock','majorBleeding','vagal'], color: 'danger'
  },
  micrurus: {
    label: 'Micrurus — coral verdadeira', group: 'Serpente', syndrome: 'Neuroparalítica',
    local: 'Parestesia e dor podem ocorrer.', systemic: 'Ptose, fraqueza, disfagia, sialorreia e paralisia respiratória.',
    antivenom: 'Soroterapia específica para acidente elapídico, conforme protocolo vigente.',
    serum: { leve: 'Observação rigorosa', moderado: 'Soroterapia indicada — confirmar protocolo', grave: 'Soroterapia urgente — confirmar protocolo' },
    labs: ['Oximetria e capnografia', 'Gasometria', 'Avaliação seriada de força', 'ECG', 'Função renal/eletrólitos conforme quadro'],
    severe: ['resp','neuro','dysphagia'], color: 'danger'
  },
  scorpion: {
    label: 'Tityus — escorpião', group: 'Escorpião', syndrome: 'Autonômica e cardiopulmonar',
    local: 'Dor intensa e parestesia.', systemic: 'Vômitos, sudorese, taquicardia/bradicardia, hipertensão/choque e edema pulmonar.',
    antivenom: 'Soroterapia específica para escorpionismo, conforme protocolo vigente.',
    serum: { leve: 'Sem soroterapia de rotina', moderado: 'Soroterapia indicada — confirmar protocolo', grave: 'Soroterapia urgente — confirmar protocolo' },
    labs: ['ECG', 'Glicemia e eletrólitos', 'Troponina conforme quadro', 'Radiografia/POCUS pulmonar', 'Ecocardiografia se disfunção/choque'],
    severe: ['resp','shock','pulmonaryEdema','neuro'], color: 'danger'
  },
  phoneutria: {
    label: 'Phoneutria — armadeira', group: 'Aranha', syndrome: 'Dolorosa e autonômica',
    local: 'Dor imediata intensa, edema discreto e parestesia.', systemic: 'Sudorese, taquicardia, vômitos, hipertensão e priapismo.',
    antivenom: 'Soroterapia específica em casos selecionados, conforme protocolo vigente.',
    serum: { leve: 'Geralmente sem soro', moderado: 'Conferir protocolo', grave: 'Conferir protocolo' },
    labs: ['ECG e sinais vitais', 'Glicemia e eletrólitos', 'Gasometria/lactato se grave', 'Função renal conforme evolução'],
    severe: ['shock','resp','autonomic'], color: 'warning'
  },
  loxosceles: {
    label: 'Loxosceles — aranha-marrom', group: 'Aranha', syndrome: 'Dermonecrótica e hemolítica',
    local: 'Dor tardia, placa marmórea, bolha e necrose.', systemic: 'Hemólise, anemia, icterícia, hemoglobinúria e injúria renal.',
    antivenom: 'Soroterapia específica em casos selecionados, conforme protocolo vigente.',
    serum: { leve: 'Avaliação clínica', moderado: 'Conferir protocolo', grave: 'Conferir protocolo' },
    labs: ['Hemograma seriado', 'Bilirrubinas, LDH, haptoglobina', 'Função renal e eletrólitos', 'Urina/hemoglobinúria', 'Coagulação se grave'],
    severe: ['hemolysis','aki','darkUrine'], color: 'warning'
  },
  lonomia: {
    label: 'Lonomia — lagarta', group: 'Lagarta', syndrome: 'Hemorrágica e fibrinolítica',
    local: 'Dor/ardor local após contato com cerdas.', systemic: 'Equimoses, sangramentos, coagulopatia e injúria renal.',
    antivenom: 'Soroterapia específica quando houver síndrome hemorrágica, conforme protocolo vigente.',
    serum: { leve: 'Sem síndrome hemorrágica', moderado: 'Conferir protocolo', grave: 'Conferir protocolo' },
    labs: ['Tempo de coagulação, TP/TTPa e fibrinogênio', 'Hemograma e plaquetas', 'Função renal', 'Urina e diurese', 'Repetição seriada da coagulação'],
    severe: ['majorBleeding','aki','shock'], color: 'danger'
  },
  hymenoptera: {
    label: 'Abelhas / vespas', group: 'Himenópteros', syndrome: 'Anafilática ou tóxica por múltiplas ferroadas',
    local: 'Dor, edema e ferrão quando presente.', systemic: 'Anafilaxia, broncoespasmo, choque, rabdomiólise, hemólise e injúria renal em múltiplas ferroadas.',
    antivenom: 'Não há antiveneno de rotina; tratar anafilaxia e complicações sistêmicas.',
    serum: { leve: 'Não se aplica', moderado: 'Não se aplica', grave: 'Não se aplica' },
    labs: ['ECG/monitorização se anafilaxia', 'CK, função renal e eletrólitos em múltiplas ferroadas', 'Hemograma e hemólise conforme quadro', 'Gasometria/lactato se choque'],
    severe: ['anaphylaxis','shock','resp','darkUrine'], color: 'danger'
  }
};

const severityLabels = {
  pain: 'Dor local importante', edema: 'Edema local', progressiveEdema: 'Edema progressivo',
  bleeding: 'Sangramento discreto', majorBleeding: 'Hemorragia importante', coagulation: 'Coagulopatia',
  neuro: 'Ptose/fraqueza neuroparalítica', dysphagia: 'Disfagia/sialorreia', darkUrine: 'Urina escura',
  oliguria: 'Oligúria', aki: 'Injúria renal', shock: 'Hipotensão/choque', resp: 'Falência respiratória',
  autonomic: 'Manifestações autonômicas', vagal: 'Síndrome vagal', hemolysis: 'Hemólise',
  pulmonaryEdema: 'Edema pulmonar', anaphylaxis: 'Anafilaxia'
};

function FieldSelect({ label, value, onChange, children }) {
  return <label className="field"><span>{label}</span><div className="field-box"><select value={value} onChange={(e)=>onChange(e.target.value)}>{children}</select></div></label>;
}

export function PeconhaApp() {
  const [tab, setTab] = useState('animal');
  const [animal, setAnimal] = useState('bothrops');
  const [meta, setMeta] = useState({ age: '', weight: '', time: '', site: '', segments: '1' });
  const [flags, setFlags] = useState(Object.fromEntries(Object.keys(severityLabels).map((key)=>[key,false])));
  const [observations, setObservations] = useState('');
  const info = animals[animal];

  const selectedSevere = info.severe.some((key)=>flags[key]);
  const moderateSignals = flags.progressiveEdema || flags.coagulation || flags.autonomic || flags.bleeding || Number(meta.segments) >= 2;
  let severity = selectedSevere ? 'grave' : moderateSignals ? 'moderado' : 'leve';
  if (animal === 'lachesis' && severity === 'leve') severity = 'moderado';
  if (animal === 'micrurus' && flags.neuro && !flags.resp) severity = 'moderado';
  if (animal === 'scorpion' && (flags.autonomic || flags.pulmonaryEdema) && !selectedSevere) severity = 'moderado';
  const tone = severity === 'grave' ? 'danger' : severity === 'moderado' ? 'warning' : 'success';
  const serumSuggestion = info.serum[severity] || 'Conferir protocolo';
  const findings = Object.entries(flags).filter(([,value])=>value).map(([key])=>severityLabels[key]);
  const childRisk = meta.age !== '' && Number(String(meta.age).replace(',','.')) <= 10 && animal === 'scorpion';

  const report = useMemo(() => `SIMMples PEÇONHA\nAnimal provável: ${info.label} (${info.group})\nTempo: ${meta.time || '--'} h | Local: ${meta.site || '--'} | Segmentos com edema: ${meta.segments}\nSíndrome: ${info.syndrome}\nGravidade sugerida: ${severity.toUpperCase()}\nAchados: ${findings.length ? findings.join('; ') : 'Sem manifestações marcadas'}\nSoroterapia — referência clínica: ${info.antivenom}\nIndicação orientativa: ${serumSuggestion}\nExames: ${info.labs.join('; ')}\nObservações: ${observations || '--'}\nConfirmar classificação, disponibilidade de soro e protocolo local/CIATox.`, [info, meta, severity, findings, serumSuggestion, observations]);

  return (
    <div className="compact-module peconha-module">
      <Segmented value={tab} onChange={setTab} options={tabs} />

      {tab === 'animal' && <>
        <Card className="clinical-hero-card" title="Acidente por animal peçonhento" kicker="Reconhecimento sindrômico" tone={info.color}>
          <div className="grid-3 compact-grid"><NumberField label="Idade" value={meta.age} onChange={(v)=>setMeta({...meta,age:v})} unit="anos"/><NumberField label="Peso" value={meta.weight} onChange={(v)=>setMeta({...meta,weight:v})} unit="kg"/><NumberField label="Tempo" value={meta.time} onChange={(v)=>setMeta({...meta,time:v})} unit="h"/></div>
          <div className="grid-2 compact-grid top-gap"><FieldSelect label="Animal provável" value={animal} onChange={setAnimal}>{Object.entries(animals).map(([key,item])=><option value={key} key={key}>{item.label}</option>)}</FieldSelect><label className="field"><span>Local da picada/contato</span><div className="field-box"><input value={meta.site} onChange={(e)=>setMeta({...meta,site:e.target.value})} placeholder="Ex.: pé direito"/></div></label></div>
          <div className="grid-3 compact-grid top-gap"><Result label="Grupo" value={info.group} tone="neutral"/><Result label="Síndrome" value={info.syndrome} tone={info.color}/><Result label="Gravidade" value={severity.toUpperCase()} tone={tone} helper={childRisk?'Criança: maior risco no escorpionismo':'Classificação dinâmica'}/></div>
        </Card>
        <Card title="Perfil clínico" kicker={info.label}>
          <div className="agent-brief-grid"><article><Bug size={18}/><span>Local</span><strong>{info.local}</strong></article><article><HeartPulse size={18}/><span>Sistêmico</span><strong>{info.systemic}</strong></article><article><FlaskConical size={18}/><span>Antiveneno</span><strong>{info.antivenom}</strong></article></div>
        </Card>
        <Card title="O que não fazer" kicker="Segurança">
          <div className="tag-list">{['Não fazer torniquete.', 'Não cortar, perfurar ou sugar o local.', 'Não aplicar substâncias caseiras.', 'Evitar via intramuscular se houver coagulopatia.', 'Não atrasar transferência quando houver gravidade.'].map((item)=><span className="tag tag-warning" key={item}>{item}</span>)}</div>
        </Card>
      </>}

      {tab === 'gravidade' && <>
        <Card title="Classificação dinâmica" kicker="Marque os achados" tone={tone}>
          <div className="grid-2 compact-grid"><Result label="Gravidade sugerida" value={severity.toUpperCase()} tone={tone} helper="Reclassifique se houver progressão"/><Result label="Referência de soroterapia" value={serumSuggestion} tone={tone} helper={info.antivenom}/></div>
          {animal==='bothrops'&&<div className="top-gap"><FieldSelect label="Extensão do edema" value={meta.segments} onChange={(segments)=>setMeta({...meta,segments})}><option value="1">Até 1 segmento</option><option value="2">2 segmentos</option><option value="3">3 ou mais segmentos</option></FieldSelect></div>}
          <div className="toggle-grid compact-toggle-grid top-gap">{Object.entries(severityLabels).map(([key,label])=><ToggleRow key={key} label={label} checked={flags[key]} onChange={(v)=>setFlags({...flags,[key]:v})}/>)}</div>
        </Card>
        {childRisk&&<div className="clinical-alert"><AlertTriangle size={18}/><span>Crianças com escorpionismo podem evoluir rapidamente; valorize vômitos, sudorese, agitação, alterações cardiovasculares e respiratórias.</span></div>}
      </>}

      {tab === 'exames' && <>
        <Card title="Exames dirigidos" kicker={info.syndrome}>
          <div className="lab-check-grid">{info.labs.map((item)=><article key={item}><Microscope size={17}/><span>{item}</span></article>)}</div>
        </Card>
        <Card title="Monitorização por síndrome" kicker="Medicina de Emergência">
          <div className="clinical-flow-grid">
            {[['C','Circulação','PA, perfusão, ECG e choque.'],['R','Respiratório','SpO₂, FR, capnografia e sinais de fadiga.'],['N','Neurológico','Ptose, força, deglutição e progressão.'],['R','Renal','Diurese, creatinina, urina escura e CK.'],['H','Hemostasia','Sangramento, coagulação e fibrinogênio.']].map(([letter,title,text],index)=><article className="clinical-flow-card" key={`${letter}-${index}`}><span>{letter}</span><div><strong>{title}</strong><p>{text}</p></div></article>)}
          </div>
        </Card>
      </>}

      {tab === 'soro' && <>
        <Card title="Soroterapia — referência clínica" kicker="Conferir protocolo local / CIATox" tone={tone}>
          <div className="serum-hero"><div><span>{info.antivenom}</span><strong>{serumSuggestion}</strong><small>A indicação depende do tipo de acidente, gravidade e protocolo vigente.</small></div><FlaskConical size={34}/></div>
          <div className="severity-table"><div><span>Leve</span><strong>{info.serum.leve}</strong></div><div><span>Moderado</span><strong>{info.serum.moderado}</strong></div><div><span>Grave</span><strong>{info.serum.grave}</strong></div></div>
          <div className="notice-box top-gap"><ShieldAlert size={15}/> A classificação pode mudar durante a observação. Monitorize reações precoces e não interrompa definitivamente a neutralização sem reavaliar o quadro.</div>
        </Card>
        <Card title="Logística e observação" kicker="Antes e depois do soro"><div className="micro-card-grid">{['Garantir acesso venoso fora do membro afetado.', 'Registrar hora de início, lote e quantidade administrada.', 'Monitorizar reação de hipersensibilidade durante a infusão.', 'Reavaliar edema, força, sangramento, diurese e exames.', 'Após soroterapia, manter observação conforme protocolo — em geral pelo menos 24 h.'].map((item)=><article className="mini-card" key={item}><strong><Clock3 size={15}/>{item}</strong></article>)}</div></Card>
      </>}

      {tab === 'resumo' && <>
        <Card title="Resumo clínico" kicker="Pronto para prontuário"><label className="field"><span>Observações livres</span><div className="field-box text-box"><textarea value={observations} onChange={(e)=>setObservations(e.target.value)} rows={4} placeholder="Evolução do edema, dor, hora do soro, reações, diurese..."/></div></label><pre className="report-box top-gap">{report}</pre><CopyButton text={report}><ClipboardList size={18}/> Copiar resumo PEÇONHA</CopyButton></Card>
        <Card title="Notificação e continuidade" kicker="Fechamento do atendimento"><div className="micro-card-grid">{['Notificar o acidente mesmo sem soroterapia quando aplicável.', 'Orientar sinais de alarme e retorno.', 'Documentar progressão do edema e complicações.', 'Atualizar profilaxia antitetânica conforme ferimento/situação vacinal.', 'Acionar referência/CIATox quando houver dúvida diagnóstica ou falta de soro.'].map((item)=><article className="mini-card" key={item}><strong><ShieldAlert size={15}/>{item}</strong></article>)}</div></Card>
      </>}
    </div>
  );
}
