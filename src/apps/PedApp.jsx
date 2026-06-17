import { useMemo, useState } from 'react';
import { Baby, ClipboardList, HeartPulse, Thermometer, Droplets } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { clean } from '../lib/format.js';

const tabs = [
  { value: 'triagem', label: 'Triagem' },
  { value: 'pews', label: 'PEWS' },
  { value: 'hidrata', label: 'Hidratação' }
];

const ageBands = {
  neonate: { label: 'Neonato', hr: [100, 180], rr: [30, 60], sbpLow: 60 },
  infant: { label: 'Lactente', hr: [100, 170], rr: [30, 50], sbpLow: 70 },
  toddler: { label: '1–3 anos', hr: [90, 150], rr: [24, 40], sbpLow: 70 + 2 * 2 },
  child: { label: '4–10 anos', hr: [70, 130], rr: [18, 30], sbpLow: 70 + 2 * 6 },
  adolescent: { label: '≥11 anos', hr: [60, 110], rr: [12, 22], sbpLow: 90 }
};

const pewsOptions = {
  resp: [
    { value: '0', label: '0 — Sem esforço / O2 não necessário' },
    { value: '1', label: '1 — Taquipneia leve ou O2 baixo fluxo' },
    { value: '2', label: '2 — Esforço moderado / O2 significativo' },
    { value: '3', label: '3 — Esforço grave / apneia / VNI' }
  ],
  cardio: [
    { value: '0', label: '0 — FC e perfusão adequadas' },
    { value: '1', label: '1 — FC discretamente alterada' },
    { value: '2', label: '2 — Taquicardia importante / TEC lento' },
    { value: '3', label: '3 — Bradicardia, hipotensão ou choque' }
  ],
  neuro: [
    { value: '0', label: '0 — Ativo / interage' },
    { value: '1', label: '1 — Irritável ou sonolento' },
    { value: '2', label: '2 — Letárgico / responde pouco' },
    { value: '3', label: '3 — Rebaixado / convulsão / não interage' }
  ]
};

function classifyRange(value, range) {
  const number = clean(value);
  if (number === null) return { text: '--', tone: 'neutral' };
  if (number < range[0]) return { text: 'Abaixo do esperado', tone: 'warning' };
  if (number > range[1]) return { text: 'Acima do esperado', tone: 'warning' };
  return { text: 'Faixa esperada', tone: 'success' };
}

function pewsTier(score) {
  if (score >= 7) return { tone: 'danger', text: 'Muito alto — reavaliação imediata' };
  if (score >= 4) return { tone: 'warning', text: 'Intermediário — checagem frequente' };
  if (score >= 1) return { tone: 'warning', text: 'Baixo, porém pontuado' };
  return { tone: 'success', text: 'Sem pontuação PEWS' };
}

export function PedApp() {
  const [tab, setTab] = useState('triagem');
  const [ageBand, setAgeBand] = useState('child');
  const [vitals, setVitals] = useState({ hr: '', rr: '', sbp: '', spo2: '', temp: '' });
  const [pews, setPews] = useState({ resp: '0', cardio: '0', neuro: '0' });
  const [hydration, setHydration] = useState({ tears: false, dryMucosa: false, sunkenEyes: false, poorIntake: false, capRefill: false, lethargy: false });

  const currentBand = ageBands[ageBand];
  const hrStatus = classifyRange(vitals.hr, currentBand.hr);
  const rrStatus = classifyRange(vitals.rr, currentBand.rr);
  const sbp = clean(vitals.sbp);
  const hypotension = sbp !== null && sbp < currentBand.sbpLow;
  const hypoxemia = (clean(vitals.spo2) || 100) < 92;
  const fever = (clean(vitals.temp) || 0) >= 38;
  const pewsScore = Number(pews.resp) + Number(pews.cardio) + Number(pews.neuro);
  const pewsResult = pewsTier(pewsScore);
  const dehydrationScore = Object.values(hydration).filter(Boolean).length;
  const dehydrationText = dehydrationScore >= 5 ? 'Desidratação importante' : dehydrationScore >= 3 ? 'Desidratação moderada' : dehydrationScore >= 1 ? 'Leve' : 'Sem sinais importantes';
  const dehydrationTone = dehydrationScore >= 5 ? 'danger' : dehydrationScore >= 3 ? 'warning' : dehydrationScore >= 1 ? 'warning' : 'success';

  const report = useMemo(() => {
    return `SIMMples PED\nFaixa etária: ${currentBand.label}\nFC ${vitals.hr || '--'} (${hrStatus.text}) | FR ${vitals.rr || '--'} (${rrStatus.text}) | PAS ${vitals.sbp || '--'}${hypotension ? ' (hipotensão para idade)' : ''}\nSpO2 ${vitals.spo2 || '--'}${hypoxemia ? ' (baixa)' : ''} | T ${vitals.temp || '--'}${fever ? ' (febre)' : ''}\nPEWS ${pewsScore} (${pewsResult.text})\nHidratação: ${dehydrationText}.`;
  }, [currentBand.label, vitals, hrStatus.text, rrStatus.text, hypotension, hypoxemia, fever, pewsScore, pewsResult.text, dehydrationText]);

  return (
    <div className="compact-module">
      <Segmented value={tab} onChange={setTab} options={tabs} />

      {tab === 'triagem' && (
        <>
          <Card className="compact-card" title="Triagem pediátrica" kicker="Sinais vitais por idade">
            <SelectField label="Faixa etária" value={ageBand} onChange={setAgeBand} options={Object.entries(ageBands).map(([value, item]) => ({ value, label: item.label }))} />
            <div className="grid-2 compact-grid top-gap">
              <NumberField label="FC" value={vitals.hr} onChange={(v)=>setVitals({ ...vitals, hr: v })} unit="bpm" />
              <NumberField label="FR" value={vitals.rr} onChange={(v)=>setVitals({ ...vitals, rr: v })} unit="irpm" />
              <NumberField label="PAS" value={vitals.sbp} onChange={(v)=>setVitals({ ...vitals, sbp: v })} unit="mmHg" />
              <NumberField label="SpO2" value={vitals.spo2} onChange={(v)=>setVitals({ ...vitals, spo2: v })} unit="%" />
              <NumberField label="Temperatura" value={vitals.temp} onChange={(v)=>setVitals({ ...vitals, temp: v })} unit="°C" />
            </div>
            <div className="grid-3 compact-grid top-gap">
              <Result label="FC" value={`${currentBand.hr[0]}–${currentBand.hr[1]}`} tone={hrStatus.tone} helper={hrStatus.text} />
              <Result label="FR" value={`${currentBand.rr[0]}–${currentBand.rr[1]}`} tone={rrStatus.tone} helper={rrStatus.text} />
              <Result label="PAS mínima" value={currentBand.sbpLow} tone={hypotension ? 'danger' : 'success'} helper={hypotension ? 'Abaixo do esperado' : 'Meta mínima'} />
            </div>
          </Card>

          <Card className="compact-card" title="Lembretes úteis">
            <div className="micro-card-grid">
              {[
                'Hipotensão em criança é sinal tardio: valorize perfusão, estado mental e lactato/contexto.',
                'Hipoxemia, apneia e esforço respiratório podem descompensar rapidamente.',
                'Taquicardia isolada é inespecífica: dor, febre, desidratação e choque são causas frequentes.'
              ].map((item) => (
                <article className="mini-card" key={item}><strong><HeartPulse size={15} />{item}</strong></article>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'pews' && (
        <Card className="compact-card" title="PEWS simplificado">
          <div className="grid-2 compact-grid">
            <Result label="PEWS" value={pewsScore} tone={pewsResult.tone} helper={pewsResult.text} />
            <Result label="Risco" value={pewsResult.text} tone={pewsResult.tone} helper="Ferramenta de triagem" />
          </div>
          <div className="top-gap">
            <SelectField label="Respiratório" value={pews.resp} onChange={(v)=>setPews({ ...pews, resp: v })} options={pewsOptions.resp} />
            <SelectField label="Cardiovascular" value={pews.cardio} onChange={(v)=>setPews({ ...pews, cardio: v })} options={pewsOptions.cardio} />
            <SelectField label="Neurológico" value={pews.neuro} onChange={(v)=>setPews({ ...pews, neuro: v })} options={pewsOptions.neuro} />
          </div>
        </Card>
      )}

      {tab === 'hidrata' && (
        <>
          <Card className="compact-card" title="Hidratação">
            <div className="grid-2 compact-grid">
              <Result label="Classificação" value={dehydrationText} tone={dehydrationTone} helper="Baseado nos achados marcados" />
              <Result label="Sinais" value={dehydrationScore} tone={dehydrationTone} helper="Contagem de achados" />
            </div>
            <div className="toggle-grid compact-toggle-grid top-gap">
              <ToggleRow label="Sem lágrimas / choro seco" checked={hydration.tears} onChange={(v)=>setHydration({ ...hydration, tears: v })} />
              <ToggleRow label="Mucosas secas" checked={hydration.dryMucosa} onChange={(v)=>setHydration({ ...hydration, dryMucosa: v })} />
              <ToggleRow label="Olhos fundos" checked={hydration.sunkenEyes} onChange={(v)=>setHydration({ ...hydration, sunkenEyes: v })} />
              <ToggleRow label="Baixa aceitação oral" checked={hydration.poorIntake} onChange={(v)=>setHydration({ ...hydration, poorIntake: v })} />
              <ToggleRow label="TEC prolongado / extremidades frias" checked={hydration.capRefill} onChange={(v)=>setHydration({ ...hydration, capRefill: v })} />
              <ToggleRow label="Letargia / hipoatividade" checked={hydration.lethargy} onChange={(v)=>setHydration({ ...hydration, lethargy: v })} />
            </div>
          </Card>
          <Card className="compact-card" title="Resumo copiável">
            <pre className="report-box">{report}</pre>
            <CopyButton text={report}><ClipboardList size={18}/> Copiar resumo PED</CopyButton>
          </Card>
        </>
      )}
    </div>
  );
}
