import { useMemo, useState } from 'react';
import { ClipboardList, Pill, ShieldAlert, TriangleAlert } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { clean } from '../lib/format.js';

const tabs = [
  { value: 'tox', label: 'Toxidromes' },
  { value: 'ecg', label: 'ECG tóxico' },
  { value: 'antidotos', label: 'Antídotos' }
];

const toxidromes = {
  opioid: { label: 'Opioide', clues: ['Miose', 'Bradipneia/apneia', 'Rebaixamento', 'Pele geralmente fria'], risk: 'ventilação e proteção de via aérea' },
  sympatho: { label: 'Simpaticomimético', clues: ['Midríase', 'Taquicardia/hipertensão', 'Diaforese', 'Agitação/hipertermia'], risk: 'hipertermia, arritmia, rabdomiólise' },
  anticholinergic: { label: 'Anticolinérgico', clues: ['Midríase', 'Pele seca', 'Retenção urinária', 'Delirium'], risk: 'hipertermia e íleo' },
  cholinergic: { label: 'Colinérgico', clues: ['Sialorreia/lacrimejamento', 'Broncorreia', 'Diarreia', 'Miose/fasciculações'], risk: 'broncorreia e falência respiratória' },
  sedative: { label: 'Sedativo/hipnótico', clues: ['Sonolência', 'Fala arrastada', 'Hipoventilação', 'Hipotensão variável'], risk: 'proteção de via aérea e coingestão' },
  serotonin: { label: 'Serotoninérgico', clues: ['Clônus', 'Hiperreflexia', 'Hipertermia', 'Agitação/diarreia'], risk: 'temperatura e rigidez' }
};

const antidotes = [
  ['Naloxona', 'Pensar em quadro compatível com opioide e depressão respiratória.'],
  ['N-acetilcisteína', 'Paracetamol / risco hepatotóxico conforme protocolo local.'],
  ['Bicarbonato', 'Alargamento de QRS e padrão compatível com bloqueio de canais de sódio/TCA.'],
  ['Atropina + oxima', 'Síndrome colinérgica / organofosforados conforme protocolo local.'],
  ['Fomepizol', 'Álcoois tóxicos quando disponíveis critérios clínicos/laboratoriais.']
];

export function IntoxApp() {
  const [tab, setTab] = useState('tox');
  const [tox, setTox] = useState('opioid');
  const [ecg, setEcg] = useState({ qrs: '', qtc: '', temp: '', glucose: '' });
  const [flags, setFlags] = useState({ seizure: false, coma: false, hypotension: false, diaphoresis: false, agitation: false });

  const qrs = clean(ecg.qrs);
  const qtc = clean(ecg.qtc);
  const temp = clean(ecg.temp);
  const glucose = clean(ecg.glucose);
  const wideQrs = qrs !== null && qrs >= 100;
  const longQt = qtc !== null && qtc >= 500;
  const hyperthermia = temp !== null && temp >= 38.5;
  const hypoglycemia = glucose !== null && glucose < 70;
  const selected = toxidromes[tox];

  const redFlags = [
    wideQrs && 'QRS alargado: pensar em bloqueio de canal de sódio / TCA / antiarrítmicos.',
    longQt && 'QTc prolongado: risco de torsades e necessidade de monitorização.',
    hyperthermia && 'Hipertermia: alto risco em simpaticomiméticos/serotoninérgicos/anticolinérgicos.',
    hypoglycemia && 'Hipoglicemia: corrigir e reavaliar nível de consciência.',
    flags.seizure && 'Convulsão presente: checar glicemia, temperatura e ECG.',
    flags.coma && 'Rebaixamento importante: via aérea e ventilação primeiro.'
  ].filter(Boolean);

  const report = useMemo(() => `SIMMples INTOX\nToxidrome principal: ${selected.label}\nPistas: ${selected.clues.join(', ')}\nECG tóxico: QRS ${ecg.qrs || '--'} ms${wideQrs ? ' (alargado)' : ''} | QTc ${ecg.qtc || '--'} ms${longQt ? ' (prolongado)' : ''}\nTemperatura ${ecg.temp || '--'} °C${hyperthermia ? ' (hipertermia)' : ''} | Glicemia ${ecg.glucose || '--'} mg/dL${hypoglycemia ? ' (baixa)' : ''}\nAlertas: ${redFlags.length ? redFlags.join(' ') : 'Sem alertas críticos marcados.'}`, [selected, ecg, wideQrs, longQt, hyperthermia, hypoglycemia, redFlags]);

  return (
    <div className="compact-module">
      <Segmented value={tab} onChange={setTab} options={tabs} />

      {tab === 'tox' && (
        <>
          <Card className="compact-card" title="Reconhecimento sindrômico" kicker="Toxidromes">
            <SelectField label="Toxidrome predominante" value={tox} onChange={setTox} options={Object.entries(toxidromes).map(([value, item]) => ({ value, label: item.label }))} />
            <div className="micro-card-grid top-gap">
              {selected.clues.map((item) => <article className="mini-card" key={item}><strong><Pill size={15}/>{item}</strong></article>)}
            </div>
            <div className="top-gap">
              <Result label="Risco-chave" value={selected.risk} tone="warning" helper="Lembrete prático" />
            </div>
          </Card>
          <Card className="compact-card" title="Sinais de gravidade">
            <div className="toggle-grid compact-toggle-grid">
              <ToggleRow label="Convulsão" checked={flags.seizure} onChange={(v)=>setFlags({ ...flags, seizure: v })} />
              <ToggleRow label="Coma / rebaixamento importante" checked={flags.coma} onChange={(v)=>setFlags({ ...flags, coma: v })} />
              <ToggleRow label="Hipotensão" checked={flags.hypotension} onChange={(v)=>setFlags({ ...flags, hypotension: v })} />
              <ToggleRow label="Diaforese" checked={flags.diaphoresis} onChange={(v)=>setFlags({ ...flags, diaphoresis: v })} />
              <ToggleRow label="Agitação importante" checked={flags.agitation} onChange={(v)=>setFlags({ ...flags, agitation: v })} />
            </div>
          </Card>
        </>
      )}

      {tab === 'ecg' && (
        <Card className="compact-card" title="ECG tóxico e laboratoriais mínimos">
          <div className="grid-2 compact-grid">
            <NumberField label="QRS" value={ecg.qrs} onChange={(v)=>setEcg({ ...ecg, qrs: v })} unit="ms" />
            <NumberField label="QTc" value={ecg.qtc} onChange={(v)=>setEcg({ ...ecg, qtc: v })} unit="ms" />
            <NumberField label="Temperatura" value={ecg.temp} onChange={(v)=>setEcg({ ...ecg, temp: v })} unit="°C" />
            <NumberField label="Glicemia" value={ecg.glucose} onChange={(v)=>setEcg({ ...ecg, glucose: v })} unit="mg/dL" />
          </div>
          <div className="grid-2 compact-grid top-gap">
            <Result label="QRS" value={ecg.qrs || '--'} tone={wideQrs ? 'danger' : 'success'} helper={wideQrs ? 'Canal de sódio / TCA' : 'Sem alargamento marcado'} />
            <Result label="QTc" value={ecg.qtc || '--'} tone={longQt ? 'danger' : 'success'} helper={longQt ? 'Risco de torsades' : 'Sem prolongamento marcante'} />
            <Result label="Temperatura" value={ecg.temp || '--'} tone={hyperthermia ? 'danger' : 'neutral'} helper={hyperthermia ? 'Hipertermia' : 'Checar contexto'} />
            <Result label="Glicemia" value={ecg.glucose || '--'} tone={hypoglycemia ? 'danger' : 'neutral'} helper={hypoglycemia ? 'Hipoglicemia' : 'Sem alerta'} />
          </div>
          {redFlags.length > 0 && (
            <div className="top-gap micro-card-grid">
              {redFlags.map((item) => <article className="mini-card" key={item}><strong><TriangleAlert size={15}/>{item}</strong></article>)}
            </div>
          )}
        </Card>
      )}

      {tab === 'antidotos' && (
        <Card className="compact-card" title="Antídotos / gatilhos práticos">
          <div className="micro-card-grid">
            {antidotes.map(([title, text]) => <article className="mini-card" key={title}><strong><ShieldAlert size={15}/>{title}</strong><p>{text}</p></article>)}
          </div>
          <pre className="report-box top-gap">{report}</pre>
          <CopyButton text={report}><ClipboardList size={18}/> Copiar resumo INTOX</CopyButton>
        </Card>
      )}
    </div>
  );
}
