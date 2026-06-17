import { useMemo, useState } from 'react';
import { AlertTriangle, ClipboardList, HeartPulse } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { clean } from '../lib/format.js';

const tabs = [
  { value: 'risco', label: 'Risco' },
  { value: 'ecg', label: 'ECG/OMI' },
  { value: 'relatorio', label: 'Relatório' }
];

const heartOptions = {
  history: [{ value: '0', label: 'Pouco suspeita' }, { value: '1', label: 'Moderada' }, { value: '2', label: 'Altamente suspeita' }],
  ecg: [{ value: '0', label: 'Normal' }, { value: '1', label: 'Inespecífico' }, { value: '2', label: 'Alteração ST significativa' }],
  age: [{ value: '0', label: '<45' }, { value: '1', label: '45–64' }, { value: '2', label: '≥65' }],
  risk: [{ value: '0', label: '0 fatores' }, { value: '1', label: '1–2 fatores' }, { value: '2', label: '≥3 ou DAC conhecida' }],
  trop: [{ value: '0', label: 'Normal' }, { value: '1', label: '1–3x limite' }, { value: '2', label: '>3x limite' }]
};

const timiItems = [
  ['age65', 'Idade ≥65 anos'], ['risk3', '≥3 fatores de risco DAC'], ['cad', 'DAC conhecida ≥50%'],
  ['asa', 'AAS nos últimos 7 dias'], ['angina', '≥2 episódios de angina em 24h'], ['st', 'Desvio ST ≥0,5 mm'], ['marker', 'Marcador cardíaco positivo']
];

const omiPatterns = [
  { name: 'Supra clássico', text: 'Supra em derivações contíguas compatíveis com território + contexto clínico.' },
  { name: 'Posterior', text: 'Infra V1–V3 com R alto e T positiva; considerar V7–V9.' },
  { name: 'De Winter', text: 'Infra ascendente precordial com T altas e simétricas; padrão de DA proximal/OMI.' },
  { name: 'Wellens A/B', text: 'T bifásica ou profundamente invertida em V2–V3/V4 após dor; risco de DA crítica.' },
  { name: 'Aslanger', text: 'Supra isolado em III + infra em I/aVL/V5–V6 e V1 maior que V2.' },
  { name: 'África do Sul', text: 'Supra em I, aVL e V2 com recíproca inferior; pensar diagonal/lateral alto.' },
  { name: 'aVR + infra difuso', text: 'Isquemia subendocárdica difusa: tronco, DA proximal, multiarterial ou demanda.' },
  { name: 'Sgarbossa modificado', text: 'Em BRE/ritmo estimulado, buscar concordância ou discordância excessiva proporcional.' }
];

function sumObject(obj) { return Object.values(obj).reduce((acc, value) => acc + Number(value || 0), 0); }
function riskLabel(score) {
  if (score <= 3) return { text: 'Baixo risco HEART', tone: 'success' };
  if (score <= 6) return { text: 'Risco intermediário HEART', tone: 'warning' };
  return { text: 'Alto risco HEART', tone: 'danger' };
}
function timiLabel(score) {
  if (score <= 2) return { text: 'TIMI baixo/intermediário', tone: 'success' };
  if (score <= 4) return { text: 'TIMI intermediário/alto', tone: 'warning' };
  return { text: 'TIMI alto', tone: 'danger' };
}

export function IamApp() {
  const [tab, setTab] = useState('risco');
  const [heart, setHeart] = useState({ history: '1', ecg: '0', age: '0', risk: '0', trop: '0' });
  const [timi, setTimi] = useState(Object.fromEntries(timiItems.map(([key]) => [key, false])));
  const [input, setInput] = useState({ age: '', painHours: '', troponin: '', delta: '' });
  const heartScore = useMemo(() => sumObject(heart), [heart]);
  const timiScore = useMemo(() => Object.values(timi).filter(Boolean).length, [timi]);
  const hRisk = riskLabel(heartScore);
  const tRisk = timiLabel(timiScore);
  const painHours = clean(input.painHours);
  const timeText = painHours === null ? 'Tempo não informado' : painHours <= 12 ? 'Dor ≤12h' : 'Dor >12h';
  const report = `SIMMples IAM\nTempo de dor: ${input.painHours || '--'} h | Idade: ${input.age || '--'} anos\nHEART: ${heartScore}/10 (${hRisk.text})\nTIMI UA/NSTEMI: ${timiScore}/7 (${tRisk.text})\nTroponina: ${input.troponin || '--'} | Delta: ${input.delta || '--'}\nPadrões OMI revisados: supra clássico, posterior, de Winter, Wellens, Aslanger, África do Sul, aVR/infra difuso e Sgarbossa modificado.`;

  return (
    <div className="compact-module">
      <Segmented value={tab} onChange={setTab} options={tabs} />
      {tab === 'risco' && <>
        <Card className="compact-card" title="Entrada rápida" kicker="Dor torácica / SCA">
          <div className="grid-2">
            <NumberField label="Idade" value={input.age} onChange={(v)=>setInput({...input, age:v})} unit="anos" />
            <NumberField label="Tempo de dor" value={input.painHours} onChange={(v)=>setInput({...input, painHours:v})} unit="h" />
          </div>
          <div className="grid-2">
            <NumberField label="Troponina" value={input.troponin} onChange={(v)=>setInput({...input, troponin:v})} />
            <NumberField label="Delta troponina" value={input.delta} onChange={(v)=>setInput({...input, delta:v})} />
          </div>
          <div className="grid-3 top-gap">
            <Result label="HEART" value={`${heartScore}/10`} tone={hRisk.tone} helper={hRisk.text} />
            <Result label="TIMI" value={`${timiScore}/7`} tone={tRisk.tone} helper={tRisk.text} />
            <Result label="Tempo" value={timeText} tone={painHours !== null && painHours <= 12 ? 'warning' : 'neutral'} />
          </div>
        </Card>
        <Card className="compact-card" title="HEART Score">
          <div className="dense-form">
            {Object.entries(heartOptions).map(([key, options]) => (
              <SelectField key={key} label={{history:'História',ecg:'ECG',age:'Idade',risk:'Risco',trop:'Troponina'}[key]} value={heart[key]} onChange={(v)=>setHeart({...heart,[key]:v})} options={options}/>
            ))}
          </div>
        </Card>
        <Card className="compact-card" title="TIMI UA/NSTEMI">
          <div className="toggle-grid compact-toggle-grid">
            {timiItems.map(([key, label]) => <ToggleRow key={key} label={label} checked={timi[key]} onChange={(v)=>setTimi({...timi,[key]:v})} />)}
          </div>
        </Card>
      </>}
      {tab === 'ecg' && <Card className="compact-card" title="Padrões de IAM / OMI" kicker="Checklist visual">
        <div className="micro-card-grid">
          {omiPatterns.map((item) => <article className="mini-card" key={item.name}><strong><HeartPulse size={15}/>{item.name}</strong><small>{item.text}</small></article>)}
        </div>
        <div className="ecg-pearls-grid top-gap">
          <div className="ecg-pearl"><span>Olhe primeiro</span><strong>Derivações contíguas, recíprocas e padrão global do ST-T antes de focar só no supra clássico.</strong></div>
          <div className="ecg-pearl"><span>Armadilha</span><strong>ECG “sem supra clássico” não exclui oclusão. Posterior, De Winter, Wellens e Aslanger podem ser perdidos.</strong></div>
          <div className="ecg-pearl"><span>Pérola prática</span><strong>Se o padrão sugerir OMI, integre com dor, troponina seriada, eco/POCUS e ECGs seriados.</strong></div>
        </div>
        <div className="notice-box top-gap"><AlertTriangle size={15}/> Use junto ao SIMMples ECG para ver curvas dinâmicas dos padrões.</div>
      </Card>}
      {tab === 'relatorio' && <Card className="compact-card" title="Resumo copiável">
        <pre className="report-box">{report}</pre>
        <CopyButton text={report}><ClipboardList size={18}/> Copiar resumo IAM</CopyButton>
      </Card>}
    </div>
  );
}
