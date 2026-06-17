import { useMemo, useState } from 'react';
import { Brain, ClipboardList, ScanSearch, Image as ImageIcon } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { clean } from '../lib/format.js';

const tabs = [
  { value: 'nihss', label: 'NIHSS' },
  { value: 'tia', label: 'TIA/LVO' },
  { value: 'imagem', label: 'TC/ASPECTS' },
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

const ASPECTS_ZONES = {
  C: 'Núcleo caudado',
  L: 'Núcleo lentiforme',
  IC: 'Cápsula interna',
  I: 'Insula',
  M1: 'Córtex MCA anterior',
  M2: 'Córtex MCA lateral',
  M3: 'Córtex MCA posterior',
  M4: 'MCA anterior superior',
  M5: 'MCA lateral superior',
  M6: 'MCA posterior superior'
};

const AVC_IMAGES = [
  {
    title: 'Isquemia precoce em território de ACM',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/1-s2.0-S0967586810002766-gr2.jpg',
    note: 'Hipodensidade e apagamento de sulcos podem ser sutis nas primeiras horas.'
  },
  {
    title: 'Hemorragia intracerebral',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/TAC%20craneo%20ECV.jpg',
    note: 'Hiperdensidade intra-axial, efeito de massa e, às vezes, extensão ventricular.'
  },
  {
    title: 'Hemorragia subaracnoide',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/CT%20of%20subarachnoid%20hemorrhage.png',
    note: 'Sangue nas cisternas basais e sulcos. Pensar em HSA aneurismática no contexto adequado.'
  },
  {
    title: 'Hematoma epidural',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Epidural%20hematoma.png',
    note: 'Coleção biconvexa hiperdensa, geralmente traumática, com efeito de massa.'
  },
  {
    title: 'Mapa dos territórios do ASPECTS',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cerebral%20regions%20by%20ASPECTS.png',
    note: 'ASPECTS parte de 10 e subtrai 1 ponto para cada região de ACM com alteração isquêmica precoce.'
  }
];

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
  const [aspects, setAspects] = useState(Object.fromEntries(Object.keys(ASPECTS_ZONES).map((key) => [key, false])));

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
  const aspectsHits = Object.values(aspects).filter(Boolean).length;
  const aspectsScore = 10 - aspectsHits;
  const aspectsTone = aspectsScore <= 5 ? 'danger' : aspectsScore <= 7 ? 'warning' : 'success';

  const report = `SIMMples AVC\nNIHSS: ${score} (${tier.text})\nJanela: ${meta.onset || '--'} h (${windowText}) | PA: ${meta.sbp || '--'}/${meta.dbp || '--'} | glicemia: ${meta.glycemia || '--'}\nABCD²: ${abcdScore}/7 (${abcdRisk.text})\nSinais LVO/corticais marcados: ${lvoScore}\nASPECTS: ${aspectsScore}/10\nChecklist: última vez visto bem, glicemia, TC sem contraste, angioTC se suspeita LVO, NIHSS seriado e contraindicações conforme protocolo local.`;

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
      {tab === 'imagem' && <>
        <Card className="compact-card" title="ASPECTS interativo" kicker="TC sem contraste">
          <div className="grid-2 compact-grid">
            <Result label="ASPECTS" value={`${aspectsScore}/10`} tone={aspectsTone} helper={aspectsScore >= 8 ? 'Pouca área comprometida' : aspectsScore >= 6 ? 'Alterações moderadas' : 'Core extenso / atenção'} />
            <Result label="Regiões marcadas" value={aspectsHits} tone={aspectsTone} helper="Cada área marcada subtrai 1 ponto" />
          </div>
          <div className="aspects-zone-grid top-gap">
            {Object.entries(ASPECTS_ZONES).map(([key, label]) => (
              <label key={key} className={aspects[key] ? 'aspects-pill aspects-pill-active' : 'aspects-pill'}>
                <input type="checkbox" checked={aspects[key]} onChange={(e)=>setAspects({ ...aspects, [key]: e.target.checked })} />
                <strong>{key}</strong>
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="clinical-text top-gap">Lembrete prático: ASPECTS começa em 10. Subtraia 1 ponto para cada região do território da ACM com hipodensidade/apagamento precoce. Integre com clínica, NIHSS e angiografia quando disponível.</p>
        </Card>
        <Card className="compact-card" title="Galeria de TC — imagens reais abertas">
          <div className="avc-image-grid">
            {AVC_IMAGES.map((image) => (
              <article className="avc-image-card" key={image.title}>
                <div className="avc-image-wrap">
                  <img src={image.src} alt={image.title} loading="lazy" />
                </div>
                <strong><ImageIcon size={14} />{image.title}</strong>
                <p>{image.note}</p>
              </article>
            ))}
          </div>
        </Card>
      </>}
      {tab === 'fluxo' && <Card className="compact-card" title="Checklist de fluxo AVC">
        <div className="micro-card-grid">
          {['Última vez visto bem / início dos sintomas', 'Glicemia capilar imediata', 'NIHSS e exame seriado', 'TC de crânio sem contraste', 'AngioTC se suspeita LVO', 'Checar anticoagulantes/contraindicações locais', 'Contato neurologia/intervenção conforme fluxo'].map((item) => <article className="mini-card" key={item}><strong><Brain size={15}/>{item}</strong></article>)}
          {['Hemorragia: distinguir intra-axial, HSA, epidural/subdural e efeito de massa', 'Isquemia precoce: buscar apagamento de sulcos, perda da diferenciação córtico-subcortical e hiperdensidade arterial', 'ASPECTS: documentar explicitamente quando oclusão de ACM for hipótese'].map((item) => <article className="mini-card" key={item}><strong><ScanSearch size={15}/>{item}</strong></article>)}
        </div>
        <pre className="report-box top-gap">{report}</pre>
        <CopyButton text={report}><ClipboardList size={18}/> Copiar resumo AVC</CopyButton>
      </Card>}
    </div>
  );
}
