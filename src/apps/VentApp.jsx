import { useMemo, useState } from 'react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented, SelectField } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { ASYNCHRONIES } from '../data/asynchronies.js';
import { co2Adjustment, mechanics, oxygenationSuggestion, pfRox, tidalVolumes } from '../lib/vent.js';
import { n } from '../lib/format.js';

export function VentApp() {
  const [sex, setSex] = useState('male');
  const [height, setHeight] = useState('');
  const [mode, setMode] = useState('VCV');
  const [peepTable, setPeepTable] = useState('low');
  const [gas, setGas] = useState({ pco2: '', rr: '', target: '40', pao2: '', fio2: '', peep: '' });
  const [mech, setMech] = useState({ vt: '', pplat: '', peep: '' });
  const [rox, setRox] = useState({ oxygen: '', fio2: '', rr: '' });
  const setGasValue = (key) => (value) => setGas((old) => ({ ...old, [key]: value }));
  const setMechValue = (key) => (value) => setMech((old) => ({ ...old, [key]: value }));
  const setRoxValue = (key) => (value) => setRox((old) => ({ ...old, [key]: value }));

  const tv = useMemo(() => tidalVolumes(height, sex), [height, sex]);
  const co2 = useMemo(() => co2Adjustment(gas), [gas]);
  const ox = useMemo(() => oxygenationSuggestion({ ...gas, table: peepTable }), [gas, peepTable]);
  const m = useMemo(() => mechanics(mech), [mech]);
  const pr = useMemo(() => pfRox(rox), [rox]);
  const report = `SIMMples VENT\nPBW: ${tv.pbw ? n(tv.pbw,1) : '--'} kg | VT 6 mL/kg: ${tv.vt6 ? n(tv.vt6,0) : '--'} mL | VT 8 mL/kg: ${tv.vt8 ? n(tv.vt8,0) : '--'} mL\nGasometria dinâmica: modo ${mode}; nova FR sugerida: ${co2}; PEEP/FiO₂ sugeridos: ${ox.pair}\nMecânica: ΔP ${m.dp ? n(m.dp,1) : '--'} cmH₂O | Cstat ${m.cstat ? n(m.cstat,1) : '--'} mL/cmH₂O\nP/F: ${pr.pf ? n(pr.pf,0) : '--'} | ROX: ${pr.rox ? n(pr.rox,2) : '--'}`;

  return (
    <>
      <Card title="1. Proteção Pulmonar">
        <Segmented value={sex} onChange={setSex} options={[{ value: 'male', label: 'Masculino' }, { value: 'female', label: 'Feminino' }]} />
        <NumberField label="Altura do Paciente" value={height} onChange={setHeight} unit="cm" placeholder="170" />
        <div className="grid-3">
          <Result label="Peso Predito" value={tv.pbw ? n(tv.pbw, 1) : '0.0'} helper="kg" />
          <Result label="6 mL/kg" value={tv.vt6 ? `${n(tv.vt6,0)} mL` : '0 mL'} helper="Protetor" />
          <Result label="8 mL/kg" value={tv.vt8 ? `${n(tv.vt8,0)} mL` : '0 mL'} helper="Máximo" />
        </div>
      </Card>

      <Card title="2. Gasometria Dinâmica">
        <Segmented value={mode} onChange={setMode} options={[{ value: 'VCV', label: 'VCV' }, { value: 'PCV', label: 'PCV' }, { value: 'PSV', label: 'PSV' }]} />
        <Segmented value={peepTable} onChange={setPeepTable} options={[{ value: 'low', label: 'Baixa PEEP' }, { value: 'high', label: 'Alta PEEP' }]} />
        <div className="split-title">Ventilação (CO₂)</div>
        <div className="grid-3">
          <NumberField label="pCO₂" value={gas.pco2} onChange={setGasValue('pco2')} />
          <NumberField label="FR" value={gas.rr} onChange={setGasValue('rr')} />
          <NumberField label="Alvo" value={gas.target} onChange={setGasValue('target')} />
        </div>
        <div className="split-title">Oxigenação (O₂)</div>
        <div className="grid-3">
          <NumberField label="pO₂" value={gas.pao2} onChange={setGasValue('pao2')} />
          <NumberField label="FiO₂" value={gas.fio2} onChange={setGasValue('fio2')} unit="%" />
          <NumberField label="PEEP" value={gas.peep} onChange={setGasValue('peep')} />
        </div>
        <Result label="Ajuste Sugerido" value={ox.text} />
        <div className="grid-2">
          <Result label="Nova FR" value={co2} />
          <Result label="Nova PEEP / FiO₂" value={ox.pair} />
        </div>
        <CopyButton text={report}>Copiar Conduta Inicial</CopyButton>
      </Card>

      <Card title="Mecânica Ventilatória">
        <div className="grid-3">
          <NumberField label="Vol. Cor." value={mech.vt} onChange={setMechValue('vt')} unit="mL" />
          <NumberField label="P. Platô" value={mech.pplat} onChange={setMechValue('pplat')} unit="cm" />
          <NumberField label="PEEP" value={mech.peep} onChange={setMechValue('peep')} unit="cm" />
        </div>
        <div className="grid-2">
          <Result label="Driving Press. (ΔP)" value={m.dp ? n(m.dp, 1) : '--'} tone={m.dp > 15 ? 'danger' : 'neutral'} />
          <Result label="Complacência Estática" value={m.cstat ? n(m.cstat, 1) : '--'} />
        </div>
        <p className="clinical-text">{m.risk}</p>
      </Card>

      <Card title="Relação P/F & Índice ROX">
        <div className="grid-3">
          <NumberField label="PaO₂ / SpO₂" value={rox.oxygen} onChange={setRoxValue('oxygen')} />
          <NumberField label="FiO₂" value={rox.fio2} onChange={setRoxValue('fio2')} unit="%" />
          <NumberField label="FR" value={rox.rr} onChange={setRoxValue('rr')} unit="irpm" />
        </div>
        <div className="grid-2">
          <Result label="Relação P/F" value={pr.pf ? n(pr.pf, 0) : '--'} />
          <Result label="Índice ROX" value={pr.rox ? n(pr.rox, 2) : '--'} />
        </div>
      </Card>

      <Card title="Paciente em Crise (DOPES)" kicker="Emergência">
        <p className="clinical-text">Desconecte o ventilador e inicie ventilação manual com Ambu a 100% O₂. Busque causas: Deslocamento, Obstrução, Pneumotórax, Equipamento e Stacked breaths/auto-PEEP.</p>
      </Card>

      <Card title="Assincronias">
        <SelectField label="Selecione" value="" onChange={() => {}} options={[{ value: '', label: 'Tabela rápida abaixo' }]} />
        <div className="asynchrony-list">
          {ASYNCHRONIES.map((item) => (
            <article key={item.name} className="mini-card">
              <strong>{item.name}</strong>
              <span>{item.type} • {item.curve}</span>
              <p>{item.finding}</p>
              <small>{item.action}</small>
            </article>
          ))}
        </div>
        <CopyButton text={report}>Copiar Evolução/Mecânica</CopyButton>
      </Card>
    </>
  );
}
