import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ClipboardList, ShieldAlert, Syringe, TimerReset } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { traumaProfile } from '../lib/trauma.js';
import { n } from '../lib/format.js';
import { pocusAtlasEntries } from '../data/pocusAtlas.js';

const initialVitals = {
  age: '',
  weight: '',
  hoursFromInjury: '',
  sbp: '',
  dbp: '',
  hr: '',
  rr: '',
  spo2: '',
  temp: '',
  gcs: '',
  ph: '',
  lactate: '',
  baseExcess: '',
  hb: '',
  inr: '',
  calcium: '',
  mechanism: 'blunt'
};

const initialToggles = {
  highEnergy: false,
  anticoagulated: false,
  externalBleeding: false,
  pelvicInstability: false,
  longBoneFracture: false,
  alteredMentalStatus: false,
  fastRUQ: false,
  fastLUQ: false,
  fastPelvis: false,
  fastPericardium: false
};

const mechanismOptions = [
  { value: 'blunt', label: 'Contuso' },
  { value: 'penetrating', label: 'Penetrante' },
  { value: 'burn', label: 'Queimadura/explosão' }
];

function ScoreBreakdown({ title, items }) {
  return (
    <div className="mini-card">
      <strong>{title}</strong>
      <div className="score-row">
        {items.map((item) => (
          <span key={item.label} className={item.active ? 'score-chip score-chip-on' : 'score-chip'}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function AtlasCard({ item }) {
  return (
    <article className="atlas-card compact">
      <div className="atlas-thumb-wrap">
        <img className="atlas-thumb" src={item.mediaUrl} alt={item.title} loading="lazy" />
        <span className="atlas-badge">{item.tag}</span>
      </div>
      <div className="atlas-body">
        <strong>{item.title}</strong>
        <p>{item.pearl}</p>
        <div className="atlas-links">
          <a href={item.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte</a>
          <span>{item.sourceName}</span>
        </div>
      </div>
    </article>
  );
}

export function TraumaApp() {
  const [v, setV] = useState(initialVitals);
  const [t, setT] = useState(initialToggles);
  const set = (key) => (value) => setV((old) => ({ ...old, [key]: value }));
  const toggle = (key) => (value) => setT((old) => ({ ...old, [key]: value }));
  const result = useMemo(() => traumaProfile({ ...v, ...t }), [v, t]);

  const txaHint = result.hoursFromInjury !== null && result.hoursFromInjury <= 3
    ? 'Dentro da janela clássica para lembrar TXA quando houver sangramento significativo e protocolo local indicar.'
    : result.hoursFromInjury !== null
      ? 'Fora da janela inicial de 3h: individualizar TXA conforme protocolo e contexto.'
      : 'Preencha o tempo desde o trauma para orientar a lembrança sobre TXA.';

  const mtpChecklist = [
    'Controle imediato de hemorragia externa e exposição completa.',
    'Acessos calibrosos / acesso alternativo e amostras laboratoriais iniciais.',
    'Aquecimento ativo e prevenção da tríade letal.',
    'Revisar necessidade de binder pélvico, toracostomia, FAST seriado e controle de fonte.',
    'Pensar cálcio, fibrinogênio/hemocomponentes e reavaliação clínica-laboratorial dinâmica.'
  ];

  const traumaAtlas = pocusAtlasEntries.filter((item) => item.modes.includes('trauma'));

  return (
    <>
      <Card title="Entrada rápida" kicker="Trauma adulto">
        <div className="grid-3">
          <NumberField label="Idade" value={v.age} onChange={set('age')} unit="anos" min="0" />
          <NumberField label="Peso" value={v.weight} onChange={set('weight')} unit="kg" min="0" />
          <NumberField label="Tempo" value={v.hoursFromInjury} onChange={set('hoursFromInjury')} unit="h" min="0" />
        </div>
        <div className="grid-2 top-gap">
          <SelectField label="Mecanismo" value={v.mechanism} onChange={set('mechanism')} options={mechanismOptions} />
          <ToggleRow label="Alta energia" helper="queda importante, ejeção, atropelamento, colisão grave" checked={t.highEnergy} onChange={toggle('highEnergy')} />
        </div>
        <div className="toggle-grid top-gap">
          <ToggleRow label="Anticoagulante/antiagregante relevante" checked={t.anticoagulated} onChange={toggle('anticoagulated')} />
          <ToggleRow label="Alteração neurológica atribuível ao trauma" checked={t.alteredMentalStatus} onChange={toggle('alteredMentalStatus')} />
        </div>
      </Card>

      <Card title="ABCDE — fisiologia">
        <div className="grid-3">
          <NumberField label="PAS" value={v.sbp} onChange={set('sbp')} unit="mmHg" />
          <NumberField label="PAD" value={v.dbp} onChange={set('dbp')} unit="mmHg" />
          <NumberField label="FC" value={v.hr} onChange={set('hr')} unit="bpm" />
        </div>
        <div className="grid-3">
          <NumberField label="FR" value={v.rr} onChange={set('rr')} unit="irpm" />
          <NumberField label="SpO₂" value={v.spo2} onChange={set('spo2')} unit="%" />
          <NumberField label="Temp" value={v.temp} onChange={set('temp')} unit="°C" />
        </div>
        <div className="grid-2">
          <NumberField label="GCS" value={v.gcs} onChange={set('gcs')} unit="/15" min="3" max="15" />
          <Result label="PAM estimada" value={result.map ? `${n(result.map, 0)} mmHg` : '--'} tone={result.map && result.map < 65 ? 'danger' : 'neutral'} />
        </div>
      </Card>

      <Card title="Hemorragia / eFAST">
        <div className="toggle-grid">
          <ToggleRow label="Sangramento externo ativo" checked={t.externalBleeding} onChange={toggle('externalBleeding')} />
          <ToggleRow label="Instabilidade/fratura pélvica suspeita" checked={t.pelvicInstability} onChange={toggle('pelvicInstability')} />
          <ToggleRow label="Fratura de osso longo" checked={t.longBoneFracture} onChange={toggle('longBoneFracture')} />
        </div>
        <div className="split-title">FAST positivo por janela</div>
        <div className="toggle-grid compact-grid">
          <ToggleRow label="RUQ / Morrison" checked={t.fastRUQ} onChange={toggle('fastRUQ')} />
          <ToggleRow label="LUQ / Esplenorrenal" checked={t.fastLUQ} onChange={toggle('fastLUQ')} />
          <ToggleRow label="Pelve" checked={t.fastPelvis} onChange={toggle('fastPelvis')} />
          <ToggleRow label="Pericárdio" checked={t.fastPericardium} onChange={toggle('fastPericardium')} />
        </div>
      </Card>

      <Card title="Perfusão e coagulopatia">
        <div className="grid-3">
          <NumberField label="pH" value={v.ph} onChange={set('ph')} placeholder="7.32" />
          <NumberField label="Lactato" value={v.lactate} onChange={set('lactate')} unit="mmol/L" />
          <NumberField label="Base excess" value={v.baseExcess} onChange={set('baseExcess')} unit="mEq/L" placeholder="-4" />
        </div>
        <div className="grid-3">
          <NumberField label="Hb" value={v.hb} onChange={set('hb')} unit="g/dL" />
          <NumberField label="INR" value={v.inr} onChange={set('inr')} />
          <NumberField label="Cálcio iônico" value={v.calcium} onChange={set('calcium')} unit="mmol/L" />
        </div>
      </Card>

      <Card title="Resultado integrado">
        <div className={`risk-banner risk-${result.tierTone}`}>
          <ShieldAlert size={22} />
          <div>
            <strong>{result.tier}</strong>
            <span>{result.mtp}</span>
          </div>
        </div>
        <div className="grid-3">
          <Result label="Shock Index" value={result.shockIndex ? n(result.shockIndex, 2) : '--'} tone={result.siClass.tone} helper={result.siClass.helper} />
          <Result label="Modified SI" value={result.modifiedShock ? n(result.modifiedShock, 2) : '--'} tone={result.msiClass.tone} helper={result.msiClass.helper} />
          <Result label="Age SI" value={result.ageShockIndex ? n(result.ageShockIndex, 0) : '--'} tone={result.ageShockIndex >= 50 ? 'warning' : 'neutral'} helper="Útil para contextualizar idoso; não é gatilho isolado." />
        </div>
        <div className="grid-3">
          <Result label="ABC Score" value={`${result.abc}/4`} tone={result.abc >= 2 ? 'danger' : result.abc === 1 ? 'warning' : 'neutral'} helper="≥2 aumenta suspeita de transfusão maciça." />
          <Result label="RABT simplificado" value={`${result.rabt}/4`} tone={result.rabt >= 2 ? 'danger' : result.rabt === 1 ? 'warning' : 'neutral'} helper="Mecanismo, FAST, SI>1, pelve." />
          <Result label="Hipoperfusão oculta" value={result.occultHypoperfusion ? 'Sim' : 'Não'} tone={result.occultHypoperfusion ? 'danger' : 'neutral'} helper="PA>90 e FC<120 com lactato>2 ou BE<-3." />
        </div>
        <Result label="Metabólico" value={result.metabolic.label} tone={result.metabolic.tone} helper={result.metabolic.helper} />
      </Card>

      <Card title="Condutas de autoridade SIMM" kicker="Primeiros minutos">
        <div className="alert-stack">
          <div className="mini-card">
            <strong><TimerReset size={16} /> Janela temporal</strong>
            <p>{txaHint}</p>
            <small>{result.disposition}</small>
          </div>
          <div className="mini-card">
            <strong><Syringe size={16} /> Checklist MTP / ressuscitação</strong>
            <ul className="check-list">
              {mtpChecklist.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Pontuação aberta">
        <ScoreBreakdown
          title="ABC Score"
          items={[
            { label: 'penetrante', active: result.abcItems.penetrating },
            { label: 'PAS≤90', active: result.abcItems.hypotension },
            { label: 'FC≥120', active: result.abcItems.tachycardia },
            { label: 'FAST+', active: result.abcItems.fastPositive }
          ]}
        />
        <ScoreBreakdown
          title="RABT simplificado"
          items={[
            { label: 'penetrante', active: result.rabtItems.penetrating },
            { label: 'SI>1', active: result.rabtItems.shockIndexPositive },
            { label: 'pelve', active: result.rabtItems.pelvicFracture },
            { label: 'FAST+', active: result.rabtItems.fastPositive }
          ]}
        />
      </Card>

      <Card title="Alertas e prioridades">
        <div className="alert-stack">
          <div className="mini-card">
            <strong><AlertTriangle size={16} /> Alertas</strong>
            <ul className="check-list">
              {(result.flags.length ? result.flags : ['Nenhum alerta automático com os campos preenchidos.']).map((flag) => <li key={flag}>{flag}</li>)}
            </ul>
          </div>
          <div className="mini-card">
            <strong><ClipboardList size={16} /> Próximas ações</strong>
            <ul className="check-list">
              {result.priorities.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Banco eFAST / trauma" kicker="Imagens abertas para ensino">
        <div className="notice-box">
          Biblioteca visual integrada para reforçar reconhecimento de hemoperitônio, hemotórax, pneumotórax e janelas do eFAST.
        </div>
        <div className="atlas-grid top-gap">
          {traumaAtlas.map((item) => <AtlasCard key={item.id} item={item} />)}
        </div>
      </Card>

      <Card title="Evolução copiável" kicker="Pronto para prontuário">
        <p className="clinical-text report-box">{result.report}</p>
      </Card>

      <CopyButton text={result.report}><Activity size={18} /> Copiar evolução Trauma</CopyButton>
    </>
  );
}
