import { useMemo, useState } from 'react';
import { AlertTriangle, Calculator, ClipboardList, Syringe } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, SelectField } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { clean, n } from '../lib/format.js';

const DRUGS = [
  {
    id: 'noradrenalina',
    name: 'Noradrenalina',
    presentation: '4 mg/mL — ampola 4 mL',
    dilution: 'Diluir 16 mg (4 ampolas) em SG 5% 234 mL',
    concentrationLabel: '60 mcg/mL',
    concentration: 60,
    concentrationUnit: 'mcg/mL',
    doseKind: 'mcgKgMin',
    doseMin: 0.02,
    doseMax: 2,
    doseUnit: 'mcg/kg/min',
    note: 'Nesta diluição, cada 1 mL/h corresponde a 1 mcg/min. Dose em mcg/kg/min = vazão ÷ peso.',
    vis: 'norepi'
  },
  {
    id: 'dobutamina',
    name: 'Dobutamina',
    presentation: '12,5 mg/mL — ampola 20 mL',
    dilution: 'Diluir 1000 mg (4 ampolas) em SF 0,9% 170 mL',
    concentrationLabel: '4 mg/mL',
    concentration: 4000,
    concentrationUnit: 'mcg/mL',
    doseKind: 'mcgKgMin',
    doseMin: 2,
    doseMax: 20,
    doseUnit: 'mcg/kg/min',
    note: 'Dose usual informada: 2 a 20 mcg/kg/min.',
    vis: 'dobuta'
  },
  {
    id: 'adrenalina',
    name: 'Adrenalina',
    presentation: '1 mg/mL — ampola 1 mL',
    dilution: 'Diluir 6 mg (6 ampolas) em SF 0,9% 94 mL',
    concentrationLabel: '60 mcg/mL',
    concentration: 60,
    concentrationUnit: 'mcg/mL',
    doseKind: 'mcgMin',
    doseMin: 1,
    doseMax: 20,
    doseUnit: 'mcg/min',
    note: 'Nesta diluição, cada 1 mL/h corresponde a 1 mcg/min.',
    vis: 'epi'
  },
  {
    id: 'vasopressina',
    name: 'Vasopressina',
    presentation: '20 UI/mL — ampola 1 mL',
    dilution: 'Diluir 20 UI (1 ampola) em SF 0,9% 100 mL',
    concentrationLabel: '0,2 UI/mL',
    concentration: 0.2,
    concentrationUnit: 'UI/mL',
    doseKind: 'uiMin',
    doseMin: 0.01,
    doseMax: 0.04,
    doseUnit: 'UI/min',
    note: 'Dose usual informada: 0,01 a 0,04 UI/min, equivalente a aproximadamente 3 a 12 mL/h nesta diluição.',
    vis: 'vaso'
  },
  {
    id: 'nitroprussiato',
    name: 'Nitroprussiato de sódio',
    presentation: '25 mg/mL — ampola 2 mL',
    dilution: 'Diluir 50 mg (1 ampola) em SG 5% 248 mL',
    concentrationLabel: '200 mcg/mL',
    concentration: 200,
    concentrationUnit: 'mcg/mL',
    doseKind: 'mcgKgMin',
    doseMin: 0.5,
    doseMax: 10,
    doseUnit: 'mcg/kg/min',
    note: 'Dose usual informada: 0,5 a 10 mcg/kg/min.',
    vis: null
  },
  {
    id: 'nitroglicerina',
    name: 'Nitroglicerina',
    presentation: '5 mg/mL — ampola 5/10 mL',
    dilution: 'Diluir 50 mg em SG 5% 250 mL',
    concentrationLabel: '200 mcg/mL',
    concentration: 200,
    concentrationUnit: 'mcg/mL',
    doseKind: 'mcgKgMin',
    doseMin: 0.5,
    doseMax: 10,
    doseUnit: 'mcg/kg/min',
    note: 'Dose usual informada: 0,5 a 10 mcg/kg/min.',
    vis: null
  },
  {
    id: 'milrinone',
    name: 'Milrinone',
    presentation: '1 mg/mL — ampola 20 mL',
    dilution: 'Diluir 20 mg (1 ampola) em SF 0,9% 80 mL',
    concentrationLabel: '200 mcg/mL',
    concentration: 200,
    concentrationUnit: 'mcg/mL',
    doseKind: 'mcgKgMin',
    doseMin: 0.375,
    doseMax: 0.75,
    doseUnit: 'mcg/kg/min',
    note: 'Dose usual informada: 0,375 a 0,75 mcg/kg/min.',
    vis: 'milrinone'
  },
  {
    id: 'dopamina',
    name: 'Dopamina',
    presentation: '5 mg/mL — ampola 10 mL',
    dilution: 'Diluir 250 mg (50 mL) em SF 0,9% 200 mL',
    concentrationLabel: '1 mg/mL',
    concentration: 1000,
    concentrationUnit: 'mcg/mL',
    doseKind: 'mcgKgMin',
    doseMin: 5,
    doseMax: 20,
    doseUnit: 'mcg/kg/min',
    note: 'Dose usual informada: 5 a 20 mcg/kg/min.',
    vis: 'dopa'
  },
  {
    id: 'azul-metileno',
    name: 'Azul de Metileno',
    presentation: '10 mg/mL — ampola 10 mL',
    dilution: 'Diluir 1000 mg (10 ampolas) em SF 0,9% 100 mL',
    concentrationLabel: '5 mg/mL',
    concentration: 5,
    concentrationUnit: 'mg/mL',
    doseKind: 'mgKgH',
    doseMin: 0.5,
    doseMax: 4,
    doseUnit: 'mg/kg/h',
    bolus: { min: 1.5, max: 2, unit: 'mg/kg', minutes: 10 },
    note: 'Dose usual informada: bolus 1,5 a 2 mg/kg em 10 min; contínuo 0,5 a 4 mg/kg/h.',
    vis: null
  }
];

const accessOptions = [
  { value: 'central', label: 'Acesso Central' },
  { value: 'peripheral', label: 'Acesso Periférico' }
];

const tabOptions = [
  { value: 'calc', label: 'DVA' },
  { value: 'vis', label: 'VIS' },
  { value: 'protocol', label: 'Protocolo' }
];

const drugOptions = DRUGS.map((drug) => ({ value: drug.id, label: drug.name }));

function toNumber(value) {
  const number = clean(String(value).replace(',', '.'));
  return number && number > 0 ? number : null;
}

function needsWeight(drug) {
  return ['mcgKgMin', 'mgKgH'].includes(drug.doseKind) || Boolean(drug.bolus);
}

function doseDigits(drug) {
  if (drug.doseKind === 'uiMin') return 3;
  if (drug.doseKind === 'mcgKgMin' && drug.doseMax <= 2) return 3;
  if (drug.doseKind === 'mgKgH') return 2;
  return 1;
}

function flowDigits(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 1;
  if (value < 1) return 2;
  if (value < 10) return 1;
  return 0;
}

function fmt(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '--';
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function calcFlowFromDose(drug, dose, weight) {
  if (!drug || dose === null) return null;
  if (drug.doseKind === 'mcgKgMin') {
    if (!weight) return null;
    return (dose * weight * 60) / drug.concentration;
  }
  if (drug.doseKind === 'mcgMin') {
    return (dose * 60) / drug.concentration;
  }
  if (drug.doseKind === 'uiMin') {
    return (dose * 60) / drug.concentration;
  }
  if (drug.doseKind === 'mgKgH') {
    if (!weight) return null;
    return (dose * weight) / drug.concentration;
  }
  return null;
}

function calcDoseFromFlow(drug, flow, weight) {
  if (!drug || !flow) return null;
  if (drug.doseKind === 'mcgKgMin') {
    if (!weight) return null;
    return (flow * drug.concentration) / 60 / weight;
  }
  if (drug.doseKind === 'mcgMin') {
    return (flow * drug.concentration) / 60;
  }
  if (drug.doseKind === 'uiMin') {
    return (flow * drug.concentration) / 60;
  }
  if (drug.doseKind === 'mgKgH') {
    if (!weight) return null;
    return (flow * drug.concentration) / weight;
  }
  return null;
}

function bolusRange(drug, weight) {
  if (!drug?.bolus || !weight) return null;
  const minMg = drug.bolus.min * weight;
  const maxMg = drug.bolus.max * weight;
  const minMl = minMg / drug.concentration;
  const maxMl = maxMg / drug.concentration;
  return {
    minMg,
    maxMg,
    minMl,
    maxMl,
    minFlowEq: minMl * (60 / drug.bolus.minutes),
    maxFlowEq: maxMl * (60 / drug.bolus.minutes)
  };
}

function rangeTone(dose, drug) {
  if (dose === null || dose === undefined) return 'neutral';
  if (dose < drug.doseMin) return 'warning';
  if (dose > drug.doseMax) return 'danger';
  return 'success';
}

function rangeText(drug, weight) {
  const minFlow = calcFlowFromDose(drug, drug.doseMin, weight);
  const maxFlow = calcFlowFromDose(drug, drug.doseMax, weight);
  if (minFlow === null || maxFlow === null) return 'Informe o peso';
  return `${fmt(minFlow, flowDigits(minFlow))}–${fmt(maxFlow, flowDigits(maxFlow))} mL/h`;
}

function oneMlHText(drug, weight) {
  const dose = calcDoseFromFlow(drug, 1, weight);
  if (dose === null) {
    const dosePerMinute = drug.concentration / 60;
    if (drug.doseKind === 'mcgKgMin') return `1 mL/h = ${fmt(dosePerMinute, 2)} mcg/min; informe peso para mcg/kg/min.`;
    return 'Informe o peso para equivalência por kg.';
  }
  return `1 mL/h = ${fmt(dose, doseDigits(drug))} ${drug.doseUnit}`;
}

function titrationRows(drug, weight) {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  return steps.map((factor) => {
    const dose = drug.doseMin + (drug.doseMax - drug.doseMin) * factor;
    const flow = calcFlowFromDose(drug, dose, weight);
    return { dose, flow };
  });
}

function visFromCurrent(drug, currentDose, weight) {
  if (!drug?.vis || currentDose === null) return null;
  if (drug.vis === 'dopa' || drug.vis === 'dobuta') return currentDose;
  if (drug.vis === 'milrinone') return currentDose * 10;
  if (drug.vis === 'norepi') return currentDose * 100;
  if (drug.vis === 'epi') {
    if (!weight) return null;
    return (currentDose / weight) * 100;
  }
  if (drug.vis === 'vaso') {
    if (!weight) return null;
    return (currentDose / weight) * 10000;
  }
  return null;
}

function visTotal(values) {
  const dopa = toNumber(values.dopamina) || 0;
  const dobuta = toNumber(values.dobutamina) || 0;
  const epi = toNumber(values.adrenalina) || 0;
  const norepi = toNumber(values.noradrenalina) || 0;
  const milrinone = toNumber(values.milrinone) || 0;
  const vaso = toNumber(values.vasopressina) || 0;
  return dopa + dobuta + (100 * epi) + (100 * norepi) + (10 * milrinone) + (10000 * vaso);
}

export function CalcApp() {
  const [activeTab, setActiveTab] = useState('calc');
  const [access, setAccess] = useState('central');
  const [drugId, setDrugId] = useState('noradrenalina');
  const [weight, setWeight] = useState('70');
  const [flow, setFlow] = useState('');
  const [targetDose, setTargetDose] = useState('');
  const [visValues, setVisValues] = useState({
    dopamina: '',
    dobutamina: '',
    adrenalina: '',
    noradrenalina: '',
    milrinone: '',
    vasopressina: ''
  });

  const drug = useMemo(() => DRUGS.find((item) => item.id === drugId) || DRUGS[0], [drugId]);
  const weightNumber = toNumber(weight);
  const flowNumber = toNumber(flow);
  const targetDoseNumber = toNumber(targetDose);

  const currentDose = useMemo(() => calcDoseFromFlow(drug, flowNumber, weightNumber), [drug, flowNumber, weightNumber]);
  const minFlow = useMemo(() => calcFlowFromDose(drug, drug.doseMin, weightNumber), [drug, weightNumber]);
  const maxFlow = useMemo(() => calcFlowFromDose(drug, drug.doseMax, weightNumber), [drug, weightNumber]);
  const targetFlow = useMemo(() => calcFlowFromDose(drug, targetDoseNumber, weightNumber), [drug, targetDoseNumber, weightNumber]);
  const bolus = useMemo(() => bolusRange(drug, weightNumber), [drug, weightNumber]);
  const individualVis = useMemo(() => visFromCurrent(drug, currentDose, weightNumber), [drug, currentDose, weightNumber]);
  const totalVis = useMemo(() => visTotal(visValues), [visValues]);

  const currentTone = rangeTone(currentDose, drug);
  const doseValue = currentDose === null ? '--' : `${fmt(currentDose, doseDigits(drug))} ${drug.doseUnit}`;
  const targetFlowValue = targetFlow === null ? '--' : `${fmt(targetFlow, flowDigits(targetFlow))} mL/h`;
  const flowRange = minFlow === null || maxFlow === null ? 'Informe o peso' : `${fmt(minFlow, flowDigits(minFlow))}–${fmt(maxFlow, flowDigits(maxFlow))} mL/h`;

  const report = `SIMMples Calc — DVA\nDroga: ${drug.name}\nAcesso selecionado: ${access === 'central' ? 'central' : 'periférico'}\nApresentação: ${drug.presentation}\nDiluição padrão: ${drug.dilution}\nConcentração: ${drug.concentrationLabel}\nFaixa usual: ${fmt(drug.doseMin, doseDigits(drug))} a ${fmt(drug.doseMax, doseDigits(drug))} ${drug.doseUnit}\nPeso: ${weight || '--'} kg\nFaixa de vazão calculada: ${flowRange}\nVazão atual: ${flow || '--'} mL/h\nDose estimada pela vazão: ${doseValue}\nDose alvo: ${targetDose || '--'} ${drug.doseUnit}\nVazão para dose alvo: ${targetFlowValue}\n${drug.bolus && bolus ? `Bolus: ${fmt(bolus.minMg,1)}–${fmt(bolus.maxMg,1)} mg = ${fmt(bolus.minMl,1)}–${fmt(bolus.maxMl,1)} mL em ${drug.bolus.minutes} min` : ''}\nObservação: ferramenta consultiva. Conferir protocolo local, diluição, bomba de infusão e dupla checagem.`;

  return (
    <>
      <Segmented value={activeTab} onChange={setActiveTab} options={tabOptions} />

      {activeTab === 'calc' && (
        <>
          <Card title="Drogas Vasoativas" kicker="Dose ↔ vazão pela diluição padrão">
            <SelectField label="Droga" value={drugId} onChange={(value) => { setDrugId(value); setFlow(''); setTargetDose(''); }} options={drugOptions} />
            <Segmented value={access} onChange={setAccess} options={accessOptions} />
            <div className="drug-summary top-gap">
              <strong><Syringe size={16} /> {drug.name}</strong>
              <span>{drug.presentation}</span>
              <p>{drug.dilution}</p>
              <div className="tag-list">
                <span className="tag tag-success">{drug.concentrationLabel}</span>
                <span className="tag">{fmt(drug.doseMin, doseDigits(drug))}–{fmt(drug.doseMax, doseDigits(drug))} {drug.doseUnit}</span>
              </div>
            </div>
          </Card>

          <Card title="Cálculo automático">
            <div className="grid-2">
              <NumberField label="Peso" value={weight} onChange={setWeight} unit="kg" placeholder="70" />
              <NumberField label="Vazão atual" value={flow} onChange={setFlow} unit="mL/h" placeholder="ex: 12" />
            </div>
            <div className="grid-2 top-gap">
              <NumberField label={`Dose alvo (${drug.doseUnit})`} value={targetDose} onChange={setTargetDose} unit={drug.doseUnit} placeholder={`${drug.doseMin}`} />
              <Result label="Vazão para dose alvo" value={targetFlowValue} />
            </div>
            {needsWeight(drug) && !weightNumber && <div className="notice-box top-gap">Informe o peso para calcular dose por kg e faixa de vazão.</div>}
            <div className="grid-3 top-gap">
              <Result label="Faixa de vazão" value={flowRange} helper="Pela faixa usual informada" />
              <Result label="Dose pela vazão" value={doseValue} tone={currentTone} helper={flow ? 'Comparada à faixa usual' : 'Preencha a vazão atual'} />
              <Result label="Equivalência" value={oneMlHText(drug, weightNumber)} />
            </div>
            {individualVis !== null && (
              <Result label="VIS estimado desta droga" value={fmt(individualVis, 1)} helper="Estimativa pelo valor calculado acima" />
            )}
            {drug.bolus && (
              <div className="notice-box top-gap">
                <strong>Bolus informado no protocolo:</strong>{' '}
                {bolus ? `${fmt(bolus.minMg,1)}–${fmt(bolus.maxMg,1)} mg = ${fmt(bolus.minMl,1)}–${fmt(bolus.maxMl,1)} mL em ${drug.bolus.minutes} min. Equivalente: ${fmt(bolus.minFlowEq,0)}–${fmt(bolus.maxFlowEq,0)} mL/h durante ${drug.bolus.minutes} min.` : 'informe peso para calcular volume.'}
              </div>
            )}
            <div className="notice-box top-gap"><AlertTriangle size={16} /> Ferramenta consultiva baseada nos parâmetros fornecidos. Conferir diluição preparada, bomba, concentração final, acesso e dupla checagem.</div>
          </Card>

          <Card title="Tabela de Titulação">
            <div className="calc-table-wrap">
              <table className="calc-table">
                <thead>
                  <tr>
                    <th>Dose</th>
                    <th>Vazão</th>
                  </tr>
                </thead>
                <tbody>
                  {titrationRows(drug, weightNumber).map((row) => (
                    <tr key={`${drug.id}-${row.dose}`}>
                      <td>{fmt(row.dose, doseDigits(drug))} {drug.doseUnit}</td>
                      <td>{row.flow === null ? 'Informe o peso' : `${fmt(row.flow, flowDigits(row.flow))} mL/h`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="clinical-text top-gap">{drug.note}</p>
            <CopyButton text={report}>Copiar cálculo / prescrição</CopyButton>
          </Card>
        </>
      )}

      {activeTab === 'vis' && (
        <Card title="VIS" kicker="Vasoactive-Inotropic Score">
          <div className="notice-box">Preencha as doses atuais. Para adrenalina, noradrenalina, dopamina, dobutamina e milrinone use mcg/kg/min. Para vasopressina use UI/kg/min.</div>
          <div className="grid-2 top-gap">
            <NumberField label="Dopamina" value={visValues.dopamina} onChange={(value) => setVisValues((old) => ({ ...old, dopamina: value }))} unit="mcg/kg/min" />
            <NumberField label="Dobutamina" value={visValues.dobutamina} onChange={(value) => setVisValues((old) => ({ ...old, dobutamina: value }))} unit="mcg/kg/min" />
            <NumberField label="Adrenalina" value={visValues.adrenalina} onChange={(value) => setVisValues((old) => ({ ...old, adrenalina: value }))} unit="mcg/kg/min" />
            <NumberField label="Noradrenalina" value={visValues.noradrenalina} onChange={(value) => setVisValues((old) => ({ ...old, noradrenalina: value }))} unit="mcg/kg/min" />
            <NumberField label="Milrinone" value={visValues.milrinone} onChange={(value) => setVisValues((old) => ({ ...old, milrinone: value }))} unit="mcg/kg/min" />
            <NumberField label="Vasopressina" value={visValues.vasopressina} onChange={(value) => setVisValues((old) => ({ ...old, vasopressina: value }))} unit="UI/kg/min" />
          </div>
          <Result label="VIS total" value={fmt(totalVis, 1)} helper="Dopa + dobuta + 100×adrenalina + 100×noradrenalina + 10×milrinone + 10000×vasopressina" />
          <CopyButton text={`SIMMples Calc — VIS\nDopamina: ${visValues.dopamina || 0}\nDobutamina: ${visValues.dobutamina || 0}\nAdrenalina: ${visValues.adrenalina || 0}\nNoradrenalina: ${visValues.noradrenalina || 0}\nMilrinone: ${visValues.milrinone || 0}\nVasopressina: ${visValues.vasopressina || 0}\nVIS total: ${fmt(totalVis, 1)}`}>Copiar VIS</CopyButton>
        </Card>
      )}

      {activeTab === 'protocol' && (
        <Card title="Protocolo carregado" kicker="Parâmetros fornecidos">
          <div className="protocol-list">
            {DRUGS.map((item) => (
              <article key={item.id} className="mini-card">
                <strong><ClipboardList size={16} /> {item.name}</strong>
                <span>{item.presentation}</span>
                <p>{item.dilution}</p>
                <small>Concentração: {item.concentrationLabel} • Faixa: {fmt(item.doseMin, doseDigits(item))} a {fmt(item.doseMax, doseDigits(item))} {item.doseUnit}</small>
                {item.bolus && <small>Bolus: {item.bolus.min} a {item.bolus.max} {item.bolus.unit} em {item.bolus.minutes} min</small>}
              </article>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
