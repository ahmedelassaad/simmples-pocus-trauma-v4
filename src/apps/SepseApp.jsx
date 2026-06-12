import { useMemo, useState } from 'react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { sepsisProfile } from '../lib/sepse.js';
import { n } from '../lib/format.js';

export function SepseApp() {
  const [v, setV] = useState({ sbp: '', dbp: '', rr: '', temp: '', hr: '', lactate: '', weight: '' });
  const [mental, setMental] = useState(false);
  const set = (key) => (value) => setV((old) => ({ ...old, [key]: value }));
  const result = useMemo(() => sepsisProfile({ ...v, mental }), [v, mental]);

  return (
    <>
      <Card title="Triagem de Gravidade">
        <div className="grid-3">
          <NumberField label="PAS" value={v.sbp} onChange={set('sbp')} unit="mmHg" />
          <NumberField label="PAD" value={v.dbp} onChange={set('dbp')} unit="mmHg" />
          <NumberField label="FR" value={v.rr} onChange={set('rr')} unit="irpm" />
          <NumberField label="Temp." value={v.temp} onChange={set('temp')} unit="°C" />
          <NumberField label="FC" value={v.hr} onChange={set('hr')} unit="bpm" />
          <NumberField label="Lactato" value={v.lactate} onChange={set('lactate')} unit="mmol/L" />
        </div>
        <div className="grid-2">
          <NumberField label="Peso" value={v.weight} onChange={set('weight')} unit="kg" />
          <ToggleRow label="Alteração do estado mental" checked={mental} onChange={setMental} />
        </div>
      </Card>

      <Card title="Resultado">
        <div className="grid-2">
          <Result label="PAM" value={result.map ? `${n(result.map,0)} mmHg` : '--'} tone={result.map && result.map < 65 ? 'danger' : 'neutral'} />
          <Result label="qSOFA" value={result.qsofa} tone={result.qsofa >= 2 ? 'danger' : 'neutral'} />
          <Result label="SIRS clínico" value={result.sirs} tone={result.sirs >= 2 ? 'warning' : 'neutral'} />
          <Result label="30 mL/kg" value={result.volume ? `${n(result.volume,0)} mL` : '--'} helper="campo de referência" />
        </div>
        <Result label="Classificação" value={result.tier} tone={result.alerts.length >= 2 ? 'danger' : result.alerts.length === 1 ? 'warning' : 'neutral'} />
      </Card>

      <Card title="Checklist da Primeira Hora">
        <ul className="check-list">
          <li>Reconhecer gravidade e documentar foco suspeito.</li>
          <li>Coletar exames conforme protocolo local, incluindo lactato quando indicado.</li>
          <li>Reavaliar perfusão, PAM, diurese, consciência e resposta inicial.</li>
          <li>Escalonar cuidado se houver choque, hipoperfusão ou deterioração.</li>
        </ul>
      </Card>

      <CopyButton text={result.report}>Copiar Evolução Sepse</CopyButton>
    </>
  );
}
