import { useMemo, useState } from 'react';
import { Baby, Calculator, ClipboardList, Droplets, HeartPulse, ShieldAlert, Thermometer, Zap } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { clean, n } from '../lib/format.js';

const tabs = [
  { value: 'triagem', label: 'Rápido' },
  { value: 'pews', label: 'PEWS' },
  { value: 'calc', label: 'Cálculos' },
  { value: 'hidrata', label: 'Hidratação' }
];

const ageUnitOptions = [
  { value: 'months', label: 'Meses' },
  { value: 'years', label: 'Anos' }
];

const ageBands = {
  neonate: { label: 'Neonato', hr: [100, 180], rr: [30, 60], sbpLow: 60, months: [0, 1] },
  infant: { label: 'Lactente', hr: [100, 170], rr: [30, 50], sbpLow: 70, months: [1, 12] },
  toddler: { label: '1–3 anos', hr: [90, 150], rr: [24, 40], sbpLow: 74, months: [12, 48] },
  child: { label: '4–10 anos', hr: [70, 130], rr: [18, 30], sbpLow: 82, months: [48, 132] },
  adolescent: { label: '≥11 anos', hr: [60, 110], rr: [12, 22], sbpLow: 90, months: [132, Infinity] }
};

const pewsOptions = {
  resp: [
    { value: '0', label: '0 — Sem esforço / sem O₂' },
    { value: '1', label: '1 — Taquipneia leve / O₂ baixo fluxo' },
    { value: '2', label: '2 — Esforço moderado / O₂ significativo' },
    { value: '3', label: '3 — Esforço grave, apneia ou VNI' }
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
    { value: '3', label: '3 — Rebaixado, convulsão ou não interage' }
  ]
};

function ageInMonths(age, unit) {
  const value = clean(age);
  if (value === null) return null;
  return unit === 'years' ? value * 12 : value;
}

function bandFromAge(months) {
  if (months === null) return ageBands.child;
  return Object.values(ageBands).find((band) => months >= band.months[0] && months < band.months[1]) || ageBands.adolescent;
}

function classifyRange(value, range) {
  const number = clean(value);
  if (number === null) return { text: 'Não informado', tone: 'neutral' };
  if (number < range[0]) return { text: 'Abaixo do esperado', tone: 'warning' };
  if (number > range[1]) return { text: 'Acima do esperado', tone: 'warning' };
  return { text: 'Faixa esperada', tone: 'success' };
}

function pewsTier(score) {
  if (score >= 7) return { tone: 'danger', text: 'Muito alto — reavaliação imediata' };
  if (score >= 4) return { tone: 'warning', text: 'Intermediário — reavaliar frequentemente' };
  if (score >= 1) return { tone: 'warning', text: 'Baixo, porém pontuado' };
  return { tone: 'success', text: 'Sem pontuação PEWS' };
}

function maintenance421(weight) {
  if (!weight) return null;
  if (weight <= 10) return weight * 4;
  if (weight <= 20) return 40 + (weight - 10) * 2;
  return 60 + (weight - 20);
}

export function PedApp() {
  const [tab, setTab] = useState('triagem');
  const [patient, setPatient] = useState({ age: '', ageUnit: 'years', weight: '' });
  const [vitals, setVitals] = useState({ hr: '', rr: '', sbp: '', spo2: '', temp: '', glucose: '' });
  const [pews, setPews] = useState({ resp: '0', cardio: '0', neuro: '0' });
  const [hydration, setHydration] = useState({ tears: false, dryMucosa: false, sunkenEyes: false, poorIntake: false, capRefill: false, lethargy: false });

  const months = ageInMonths(patient.age, patient.ageUnit);
  const currentBand = bandFromAge(months);
  const weight = clean(patient.weight);
  const ageYears = months === null ? null : months / 12;

  const hrStatus = classifyRange(vitals.hr, currentBand.hr);
  const rrStatus = classifyRange(vitals.rr, currentBand.rr);
  const sbp = clean(vitals.sbp);
  const spo2 = clean(vitals.spo2);
  const temp = clean(vitals.temp);
  const glucose = clean(vitals.glucose);
  const hypotension = sbp !== null && sbp < currentBand.sbpLow;
  const hypoxemia = spo2 !== null && spo2 < 92;
  const fever = temp !== null && temp >= 38;
  const youngInfantFever = fever && months !== null && months < 3;
  const hypoglycemia = glucose !== null && glucose < 60;

  const pewsScore = Number(pews.resp) + Number(pews.cardio) + Number(pews.neuro);
  const pewsResult = pewsTier(pewsScore);
  const dehydrationScore = Object.values(hydration).filter(Boolean).length;
  const dehydrationText = dehydrationScore >= 5 ? 'Importante' : dehydrationScore >= 3 ? 'Moderada' : dehydrationScore >= 1 ? 'Leve' : 'Sem sinais importantes';
  const dehydrationTone = dehydrationScore >= 5 ? 'danger' : dehydrationScore >= 3 ? 'warning' : dehydrationScore >= 1 ? 'warning' : 'success';

  const quickAlerts = [
    hypotension && 'Hipotensão para a faixa etária',
    hypoxemia && 'SpO₂ < 92%',
    youngInfantFever && 'Febre em menor de 3 meses',
    hypoglycemia && 'Glicemia baixa',
    pewsScore >= 4 && `PEWS ${pewsScore}`
  ].filter(Boolean);

  const maintenance = weight ? maintenance421(weight) : null;
  const bolus10 = weight ? weight * 10 : null;
  const bolus20 = weight ? weight * 20 : null;
  const defib2 = weight ? weight * 2 : null;
  const defib4 = weight ? weight * 4 : null;
  const cv05 = weight ? weight * 0.5 : null;
  const cv1 = weight ? weight : null;
  const cv2 = weight ? weight * 2 : null;
  const cuffedTube = ageYears !== null && ageYears >= 1 ? ageYears / 4 + 3.5 : null;
  const uncuffedTube = ageYears !== null && ageYears >= 1 ? ageYears / 4 + 4 : null;
  const tubeDepth = cuffedTube ? cuffedTube * 3 : null;

  const report = useMemo(() => {
    return `SIMMples PED\nFaixa etária: ${currentBand.label} | Idade: ${patient.age || '--'} ${patient.ageUnit === 'years' ? 'anos' : 'meses'} | Peso: ${patient.weight || '--'} kg\nFC ${vitals.hr || '--'} (${hrStatus.text}) | FR ${vitals.rr || '--'} (${rrStatus.text}) | PAS ${vitals.sbp || '--'}${hypotension ? ' (hipotensão)' : ''}\nSpO₂ ${vitals.spo2 || '--'}${hypoxemia ? ' (baixa)' : ''} | T ${vitals.temp || '--'}${fever ? ' (febre)' : ''} | Glicemia ${vitals.glucose || '--'}${hypoglycemia ? ' (baixa)' : ''}\nPEWS ${pewsScore} (${pewsResult.text})\nHidratação: ${dehydrationText}.`;
  }, [currentBand.label, patient, vitals, hrStatus.text, rrStatus.text, hypotension, hypoxemia, fever, hypoglycemia, pewsScore, pewsResult.text, dehydrationText]);

  return (
    <div className="compact-module ped-module">
      <Card className="compact-card ped-patient-card" title="Paciente pediátrico" kicker="Preencha uma vez">
        <div className="grid-3 compact-grid">
          <NumberField label="Idade" value={patient.age} onChange={(v)=>setPatient({ ...patient, age: v })} />
          <SelectField label="Unidade" value={patient.ageUnit} onChange={(v)=>setPatient({ ...patient, ageUnit: v })} options={ageUnitOptions} />
          <NumberField label="Peso" value={patient.weight} onChange={(v)=>setPatient({ ...patient, weight: v })} unit="kg" />
        </div>
        <div className="ped-summary-strip top-gap">
          <span><Baby size={15} />{currentBand.label}</span>
          <span>FC {currentBand.hr[0]}–{currentBand.hr[1]}</span>
          <span>FR {currentBand.rr[0]}–{currentBand.rr[1]}</span>
          <span>PAS mín. {currentBand.sbpLow}</span>
        </div>
      </Card>

      <Segmented value={tab} onChange={setTab} options={tabs} />

      {tab === 'triagem' && (
        <>
          <Card className="compact-card" title="Triagem rápida" kicker="Sinais vitais e alertas">
            <div className="grid-3 compact-grid">
              <NumberField label="FC" value={vitals.hr} onChange={(v)=>setVitals({ ...vitals, hr: v })} unit="bpm" />
              <NumberField label="FR" value={vitals.rr} onChange={(v)=>setVitals({ ...vitals, rr: v })} unit="irpm" />
              <NumberField label="PAS" value={vitals.sbp} onChange={(v)=>setVitals({ ...vitals, sbp: v })} unit="mmHg" />
              <NumberField label="SpO₂" value={vitals.spo2} onChange={(v)=>setVitals({ ...vitals, spo2: v })} unit="%" />
              <NumberField label="Temperatura" value={vitals.temp} onChange={(v)=>setVitals({ ...vitals, temp: v })} unit="°C" />
              <NumberField label="Glicemia" value={vitals.glucose} onChange={(v)=>setVitals({ ...vitals, glucose: v })} unit="mg/dL" />
            </div>
            <div className="grid-3 compact-grid top-gap">
              <Result label="FC" value={vitals.hr || '--'} tone={hrStatus.tone} helper={hrStatus.text} />
              <Result label="FR" value={vitals.rr || '--'} tone={rrStatus.tone} helper={rrStatus.text} />
              <Result label="PAS" value={vitals.sbp || '--'} tone={hypotension ? 'danger' : 'success'} helper={hypotension ? 'Hipotensão para idade' : `Mínima ${currentBand.sbpLow}`} />
            </div>
            {quickAlerts.length > 0 ? (
              <div className="ped-alert-banner top-gap"><ShieldAlert size={18} /><div><strong>Alertas imediatos</strong><span>{quickAlerts.join(' • ')}</span></div></div>
            ) : (
              <div className="ped-ok-banner top-gap"><HeartPulse size={18} /><span>Sem alerta crítico automático com os dados preenchidos.</span></div>
            )}
          </Card>

          <Card className="compact-card" title="Raciocínio rápido">
            <div className="micro-card-grid">
              {[
                'Hipotensão é tardia: valorize perfusão, TEC, pulsos, estado mental e diurese.',
                'Bradicardia em criança doente pode preceder parada e merece resposta imediata.',
                'Taquicardia pode refletir dor, febre, desidratação, hipóxia ou choque.',
                'Febre em menor de 3 meses exige avaliação específica e baixo limiar para investigação.'
              ].map((item) => <article className="mini-card" key={item}><strong><HeartPulse size={15} />{item}</strong></article>)}
            </div>
          </Card>
        </>
      )}

      {tab === 'pews' && (
        <Card className="compact-card" title="PEWS simplificado" kicker="Três domínios">
          <div className="ped-pews-hero">
            <Result label="PEWS" value={pewsScore} tone={pewsResult.tone} helper={pewsResult.text} />
          </div>
          <div className="top-gap ped-score-stack">
            <SelectField label="Respiratório" value={pews.resp} onChange={(v)=>setPews({ ...pews, resp: v })} options={pewsOptions.resp} />
            <SelectField label="Cardiovascular" value={pews.cardio} onChange={(v)=>setPews({ ...pews, cardio: v })} options={pewsOptions.cardio} />
            <SelectField label="Neurológico" value={pews.neuro} onChange={(v)=>setPews({ ...pews, neuro: v })} options={pewsOptions.neuro} />
          </div>
          <div className="notice-box top-gap">O PEWS deve apoiar reavaliação e escalonamento; não substitui julgamento clínico nem protocolo institucional.</div>
        </Card>
      )}

      {tab === 'calc' && (
        <>
          <Card className="compact-card" title="Cálculos rápidos por peso" kicker="Emergência pediátrica">
            {!weight && <div className="notice-box">Preencha o peso no cartão do paciente para liberar os cálculos.</div>}
            <div className="ped-calc-grid top-gap">
              <Result label="Bolus 10 mL/kg" value={bolus10 ? `${n(bolus10, 0)} mL` : '--'} helper="Estratégia conservadora / reavaliar" />
              <Result label="Bolus 20 mL/kg" value={bolus20 ? `${n(bolus20, 0)} mL` : '--'} helper="Referência clássica / reavaliar" />
              <Result label="Manutenção 4-2-1" value={maintenance ? `${n(maintenance, 0)} mL/h` : '--'} helper="Estimativa horária" />
              <Result label="Desfibrilação inicial" value={defib2 ? `${n(defib2, 0)} J` : '--'} tone="warning" helper="2 J/kg" />
              <Result label="Desfibrilação subsequente" value={defib4 ? `${n(defib4, 0)} J` : '--'} tone="warning" helper="4 J/kg" />
              <Result label="Cardioversão" value={cv05 ? `${n(cv05, 0)}–${n(cv1, 0)} J` : '--'} helper="0,5–1 J/kg" />
              <Result label="Cardioversão seguinte" value={cv2 ? `${n(cv2, 0)} J` : '--'} helper="2 J/kg" />
              <Result label="Tubo com cuff" value={cuffedTube ? `${n(cuffedTube, 1)} mm` : '--'} helper="Idade/4 + 3,5" />
              <Result label="Tubo sem cuff" value={uncuffedTube ? `${n(uncuffedTube, 1)} mm` : '--'} helper="Idade/4 + 4" />
              <Result label="Profundidade estimada" value={tubeDepth ? `${n(tubeDepth, 1)} cm` : '--'} helper="≈ 3 × diâmetro do tubo" />
            </div>
          </Card>

          <Card className="compact-card" title="Emergências — atalhos mentais">
            <div className="micro-card-grid">
              {[
                ['Anafilaxia', 'Priorize via aérea, ventilação, perfusão e adrenalina IM conforme protocolo.'],
                ['Crise convulsiva', 'Tempo de crise, glicemia, oxigenação e causa reversível vêm primeiro.'],
                ['Broncoespasmo grave', 'Valorize exaustão, silêncio auscultatório, hipercapnia e alteração do nível de consciência.'],
                ['Choque', 'Perfusão, ultrassom à beira-leito, volume cuidadosamente titulado e vasopressor precoce conforme fenótipo.']
              ].map(([title, text]) => <article className="mini-card" key={title}><strong><Zap size={15} />{title}</strong><p>{text}</p></article>)}
            </div>
          </Card>
        </>
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
