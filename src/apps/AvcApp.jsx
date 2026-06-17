import { useMemo, useState } from 'react';
import { Brain, ClipboardList, Clock3 } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { clean } from '../lib/format.js';

const tabs = [
  { value: 'nihss', label: 'NIHSS' },
  { value: 'tia', label: 'TIA/LVO' },
  { value: 'fluxo', label: 'Fluxo' }
];

const NIHSS = [
  ['loc','Nível de consciência', [['0','Alerta'],['1','Sonolento'],['2','Obnubilado'],['3','Coma/não responsivo']]],
  ['locq','Perguntas LOC', [['0','2 corretas'],['1','1 correta'],['2','0 corretas']]],
  ['locc','Comandos LOC', [['0','2 comandos'],['1','1 comando'],['2','0 comandos']]],
  ['gaze','Olhar conjugado', [['0','Normal'],['1','Paresia parcial'],['2','Desvio forçado']]],
  ['visual','Campos visuais', [['0','Sem perda'],['1','Hemianopsia parcial'],['2','Completa'],['3','Bilateral']]],
  ['face','Paresia facial', [['0','Normal'],['1','Discreta'],['2','Parcial'],['3','Completa']]],
  ['armL','Braço esquerdo', [['0','Sem queda'],['1','Cai <10s'],['2','Algum esforço'],['3','Sem vencer gravidade'],['4','Sem movimento']]],
  ['armR','Braço direito', [['0','Sem queda'],['1','Cai <10s'],['2','Algum esforço'],['3','Sem vencer gravidade'],['4','Sem movimento']]],
  ['legL','Perna esquerda', [['0','Sem queda'],['1','Cai <5s'],['2','Algum esforço'],['3','Sem vencer gravidade'],['4','Sem movimento']]],
  ['legR','Perna direita', [['0','Sem queda'],['1','Cai <5s'],['2','Algum esforço'],['3','Sem vencer gravidade'],['4','Sem movimento']]],
  ['ataxia','Ataxia', [['0','Ausente'],['1','1 membro'],['2','2 membros']]],
  ['sens','Sensibilidade', [['0','Normal'],['1','Leve/moderada'],['2','Grave']]],
  ['lang','Linguagem', [['0','Normal'],['1','Afasia leve/moderada'],['2','Afasia grave'],['3','Mudo/global']]],
  ['dys','Disartria', [['0','Normal'],['1','Leve/moderada'],['2','Grave/anártrica']]],
  ['neglect','Extinção/negligência', [['0','Ausente'],['1','Parcial'],['2','Grave']]]
];

const abcdOptions = {
  clinical: [{ value: '0', label: 'Outros sintomas' }, { value: '1', label: 'Fala sem fraqueza' }, { value: '2', label: 'Fraqueza unilateral' }],
  duration: [{ value: '0', label: '<10 min' }, { value: '1', label: '10–59 min' }, { value: '2', label: '≥60 min' }]
};

function sumValues(obj) { return Object.values(obj).reduce((acc, value) => acc + Number(value || 0), 0); }
function nihssTier(score) {
  if (score >= 21) return { tone: 'danger', text: 'AVC grave' };
  if (score >= 16) return { tone: 'danger', text: 'Moderado-grave' };
  if (score >= 5) return { tone: 'warning', text: 'Moderado' };
  if (score >= 1) return { tone: 'warning', text: 'Leve' };
  return { tone: 'success', text: 'Sem déficit pontuado' };
}
function abcdTier(score) {
  if (score >= 6) return { tone: 'danger', text: 'Alto risco ABCD²' };
  if (score >= 4) return { tone: 'warning', text: 'Risco moderado ABCD²' };
  return { tone: 'success', text: 'Baixo risco ABCD²' };
}

export function AvcApp() {
  const [tab, setTab] = useState('nihss');
  const [nihss, setNihss] = useState(Object.fromEntries(NIHSS.map(([key]) => [key, '0'])));
  const [meta, setMeta] = useState({ age: '', sbp: '', dbp: '', onset: '', glycemia: '' });
  const [abcd, setAbcd] = useState({ clinical: '0', duration: '0', diabetes: false });
  const [lvo, setLvo] = useState({ gaze: false, aphasia: false, neglect: false, arm: false, leg: false, cortical: false });
  const score = useMemo(() => sumValues(nihss), [nihss]);
  const tier = nihssTier(score);
  const bpHigh = (clean(meta.sbp) || 0) >= 140 || (clean(meta.dbp) || 0) >= 90;
  const age60 = (clean(meta.age) || 0) >= 60;
  const abcdScore = (age60 ? 1 : 0) + (bpHigh ? 1 : 0) + Number(abcd.clinical) + Number(abcd.duration) + (abcd.diabetes ? 1 : 0);
  const abcdRisk = abcdTier(abcdScore);
  const lvoScore = Object.values(lvo).filter(Boolean).length;
  const lvoTone = lvoScore >= 2 ? 'danger' : lvoScore === 1 ? 'warning' : 'success';
  const onset = clean(meta.onset);
  const windowText = onset === null ? 'Janela não informada' : onset <= 4.5 ? '≤4,5h' : onset <= 24 ? '4,5–24h' : '>24h';
  const report = `SIMMples AVC\nNIHSS: ${score} (${tier.text})\nJanela: ${meta.onset || '--'} h (${windowText}) | PA: ${meta.sbp || '--'}/${meta.dbp || '--'} | glicemia: ${meta.glycemia || '--'}\nABCD²: ${abcdScore}/7 (${abcdRisk.text})\nSinais LVO/corticais marcados: ${lvoScore}\nChecklist: última vez visto bem, glicemia, TC sem contraste, angioTC se suspeita LVO, NIHSS seriado e contraindicações conforme protocolo local.`;

  return (
    <div className="compact-module">
      <Segmented value={tab} onChange={setTab} options={tabs} />
      {tab === 'nihss' && <>
        <Card className="compact-card" title="Resumo AVC" kicker="Entrada rápida">
          <div className="grid-3 compact-grid">
            <NumberField label="Idade" value={meta.age} onChange={(v)=>setMeta({...meta, age:v})} unit="anos" />
            <NumberField label="Janela" value={meta.onset} onChange={(v)=>setMeta({...meta, onset:v})} unit="h" />
            <NumberField label="Glicemia" value={meta.glycemia} onChange={(v)=>setMeta({...meta, glycemia:v})} unit="mg/dL" />
          </div>
          <div className="grid-2 top-gap">
            <NumberField label="PAS" value={meta.sbp} onChange={(v)=>setMeta({...meta, sbp:v})} unit="mmHg" />
            <NumberField label="PAD" value={meta.dbp} onChange={(v)=>setMeta({...meta, dbp:v})} unit="mmHg" />
          </div>
          <div className="grid-3 top-gap">
            <Result label="NIHSS" value={score} tone={tier.tone} helper={tier.text} />
            <Result label="Janela" value={windowText} tone={onset !== null && onset <= 24 ? 'warning' : 'neutral'} />
            <Result label="LVO" value={`${lvoScore} sinais`} tone={lvoTone} helper={lvoScore >= 2 ? 'Suspeita elevada' : 'Checar cortical'} />
          </div>
        </Card>
        <Card className="compact-card" title="NIHSS estruturado">
          <div className="nihss-grid">
            {NIHSS.map(([key, label, options]) => <SelectField key={key} label={label} value={nihss[key]} onChange={(v)=>setNihss({...nihss, [key]:v})} options={options.map(([value, text]) => ({ value, label: `${value} — ${text}` }))} />)}
          </div>
        </Card>
      </>}
      {tab === 'tia' && <>
        <Card className="compact-card" title="ABCD² para AIT">
          <div className="grid-2"><Result label="ABCD²" value={`${abcdScore}/7`} tone={abcdRisk.tone} helper={abcdRisk.text}/><Result label="PA inicial" value={bpHigh ? '≥140/90' : '<140/90'} tone={bpHigh ? 'warning' : 'neutral'}/></div>
          <SelectField label="Clínica" value={abcd.clinical} onChange={(v)=>setAbcd({...abcd, clinical:v})} options={abcdOptions.clinical}/>
          <SelectField label="Duração" value={abcd.duration} onChange={(v)=>setAbcd({...abcd, duration:v})} options={abcdOptions.duration}/>
          <ToggleRow label="Diabetes" checked={abcd.diabetes} onChange={(v)=>setAbcd({...abcd, diabetes:v})}/>
        </Card>
        <Card className="compact-card" title="Sinais de LVO / corticalidade">
          <div className="toggle-grid compact-toggle-grid">
            {Object.entries({gaze:'Desvio do olhar',aphasia:'Afasia',neglect:'Negligência',arm:'Déficit motor braço',leg:'Déficit motor perna',cortical:'Sinal cortical claro'}).map(([key,label]) => <ToggleRow key={key} label={label} checked={lvo[key]} onChange={(v)=>setLvo({...lvo,[key]:v})}/>) }
          </div>
        </Card>
      </>}
      {tab === 'fluxo' && <Card className="compact-card" title="Checklist de fluxo AVC">
        <div className="micro-card-grid">
          {['Última vez visto bem / início dos sintomas', 'Glicemia capilar imediata', 'NIHSS e exame seriado', 'TC de crânio sem contraste', 'AngioTC se suspeita LVO', 'Checar anticoagulantes/contraindicações locais', 'Contato neurologia/intervenção conforme fluxo'].map((item) => <article className="mini-card" key={item}><strong><Brain size={15}/>{item}</strong></article>)}
        </div>
        <pre className="report-box top-gap">{report}</pre>
        <CopyButton text={report}><ClipboardList size={18}/> Copiar resumo AVC</CopyButton>
      </Card>}
    </div>
  );
}
