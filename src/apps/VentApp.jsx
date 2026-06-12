import { useMemo, useState } from 'react';
import { Activity, ClipboardList, Wind } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { ASYNCHRONIES } from '../data/asynchronies.js';
import { VentWaveform, variantForMode } from '../components/VentWaveforms.jsx';
import { co2Adjustment, mechanics, oxygenationSuggestion, pfRox, tidalVolumes } from '../lib/vent.js';
import { clean, n } from '../lib/format.js';

const profileOptions = [
  { value: 'normal', label: 'Normal/Neuro' },
  { value: 'ards', label: 'SDRA' },
  { value: 'obstructive', label: 'Obstrutivo' }
];

const sexOptions = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' }
];

const modeOptions = [
  { value: 'VCV', label: 'VCV' },
  { value: 'PCV', label: 'PCV' },
  { value: 'PSV', label: 'PSV' }
];

const peepTableOptions = [
  { value: 'low', label: 'Baixa PEEP' },
  { value: 'high', label: 'Alta PEEP' }
];

const tabOptions = [
  { value: 'setup', label: 'Setup' },
  { value: 'mechanics', label: 'Mecânica' },
  { value: 'asynchronies', label: 'Assincronias' }
];

function num(value) {
  return clean(value);
}

function mechanicalPower({ vt, rr, ppeak, pplat, peep }) {
  const v = num(vt), f = num(rr), peak = num(ppeak), plat = num(pplat), p = num(peep);
  if ([v, f, peak, plat, p].some((x) => x === null) || v <= 0 || f <= 0) return null;
  const dp = plat - p;
  if (dp <= 0) return null;
  return 0.098 * f * (v / 1000) * (peak - dp / 2);
}

function resultTone(value, dangerAt, warningAt) {
  if (value === null || value === undefined) return 'neutral';
  if (value >= dangerAt) return 'danger';
  if (value >= warningAt) return 'warning';
  return 'success';
}

export function VentApp() {
  const [activeTab, setActiveTab] = useState('setup');
  const [profile, setProfile] = useState('normal');
  const [sex, setSex] = useState('male');
  const [height, setHeight] = useState('');
  const [mode, setMode] = useState('VCV');
  const [peepTable, setPeepTable] = useState('low');
  const [gas, setGas] = useState({ pco2: '', rr: '', target: '40', pao2: '', fio2: '', peep: '' });
  const [mech, setMech] = useState({ vt: '', peep: '', ppeak: '', pplat: '' });
  const [tre, setTre] = useState({ vt: '', rr: '' });
  const [rox, setRox] = useState({ oxygen: '', fio2: '', rr: '' });

  const setGasValue = (key) => (value) => setGas((old) => ({ ...old, [key]: value }));
  const setMechValue = (key) => (value) => setMech((old) => ({ ...old, [key]: value }));
  const setTreValue = (key) => (value) => setTre((old) => ({ ...old, [key]: value }));
  const setRoxValue = (key) => (value) => setRox((old) => ({ ...old, [key]: value }));

  const tv = useMemo(() => tidalVolumes(height, sex), [height, sex]);
  const co2 = useMemo(() => co2Adjustment(gas), [gas]);
  const ox = useMemo(() => oxygenationSuggestion({ ...gas, table: peepTable }), [gas, peepTable]);
  const m = useMemo(() => mechanics({ vt: mech.vt, pplat: mech.pplat, peep: mech.peep }), [mech]);
  const pr = useMemo(() => pfRox(rox), [rox]);

  const resistance = useMemo(() => {
    const peak = num(mech.ppeak), plat = num(mech.pplat);
    if (peak === null || plat === null) return null;
    return peak - plat;
  }, [mech.ppeak, mech.pplat]);

  const mp = useMemo(() => mechanicalPower({ ...mech, rr: gas.rr }), [mech, gas.rr]);

  const tobinStatic = useMemo(() => {
    const vt = num(mech.vt), rr = num(gas.rr);
    if (!vt || !rr) return null;
    return rr / (vt / 1000);
  }, [mech.vt, gas.rr]);

  const tobinTre = useMemo(() => {
    const vt = num(tre.vt), rr = num(tre.rr);
    if (!vt || !rr) return null;
    return rr / (vt / 1000);
  }, [tre.vt, tre.rr]);

  const waveformParams = useMemo(() => ({
    rr: gas.rr || rox.rr || tre.rr,
    peep: gas.peep || mech.peep,
    pplat: mech.pplat || (profile === 'ards' ? 28 : profile === 'obstructive' ? 24 : 22),
    vt: mech.vt || tv.vt6,
    pco2: gas.pco2,
    fio2: gas.fio2 || rox.fio2,
    profile
  }), [gas, rox.rr, rox.fio2, tre.rr, mech, tv.vt6, profile]);

  const modeAttention = {
    normal: 'Atenção ao Modo: manter proteção pulmonar e ajustar ao objetivo clínico.',
    ards: 'Atenção ao Modo: priorizar ventilação protetora, driving pressure e estratégia PEEP/FiO₂.',
    obstructive: 'Atenção ao Modo: vigiar auto-PEEP, tempo expiratório e fome de fluxo.'
  }[profile];

  const setupReport = `SIMMples VENT — Setup\nPerfil: ${profile === 'ards' ? 'SDRA' : profile === 'obstructive' ? 'Obstrutivo' : 'Normal/Neuro'} | Sexo: ${sex === 'female' ? 'Feminino' : 'Masculino'} | Altura: ${height || '--'} cm\nPeso predito: ${tv.pbw ? n(tv.pbw,1) : '--'} kg | VT 6 mL/kg: ${tv.vt6 ? n(tv.vt6,0) : '--'} mL | VT 8 mL/kg: ${tv.vt8 ? n(tv.vt8,0) : '--'} mL\nModo: ${mode} | Tabela PEEP/FiO₂: ${peepTable === 'high' ? 'alta PEEP' : 'baixa PEEP'}\npCO₂ atual: ${gas.pco2 || '--'} | FR atual: ${gas.rr || '--'} | Alvo pCO₂: ${gas.target || '--'} | Nova FR: ${co2}\npO₂ atual: ${gas.pao2 || '--'} | FiO₂: ${gas.fio2 || '--'}% | PEEP: ${gas.peep || '--'} | Nova PEEP/FiO₂: ${ox.pair}\n${modeAttention}`;

  const mechanicsReport = `SIMMples VENT — Mecânica\nVT: ${mech.vt || '--'} mL | PEEP: ${mech.peep || '--'} | Pico: ${mech.ppeak || '--'} | Platô: ${mech.pplat || '--'}\nDriving pressure: ${m.dp ? n(m.dp,1) : '--'} | Mechanical power: ${mp ? n(mp,1) : '--'} J/min | Resistência: ${resistance !== null ? n(resistance,1) : '--'} | Cstat: ${m.cstat ? n(m.cstat,1) : '--'}\nP/F: ${pr.pf ? n(pr.pf,0) : '--'} | ROX: ${pr.rox ? n(pr.rox,2) : '--'} | Tobin estático: ${tobinStatic ? n(tobinStatic,0) : '--'} | Tobin TRE: ${tobinTre ? n(tobinTre,0) : '--'}`;

  const fullReport = `${setupReport}\n\n${mechanicsReport}`;

  return (
    <>
      <Segmented value={activeTab} onChange={setActiveTab} options={tabOptions} />

      {activeTab === 'setup' && (
        <>
          <Card title="1. Perfil Clínico & Proteção">
            <Segmented value={profile} onChange={setProfile} options={profileOptions} />
            <Segmented value={sex} onChange={setSex} options={sexOptions} />
            <NumberField label="Altura do Paciente" value={height} onChange={setHeight} unit="cm" placeholder="170" />
            <div className="grid-3">
              <Result label="Peso Predito (kg)" value={tv.pbw ? n(tv.pbw, 1) : '0.0'} />
              <Result label="6 mL/kg" value={tv.vt6 ? `${n(tv.vt6,0)} mL` : '0 mL'} />
              <Result label="8 mL/kg" value={tv.vt8 ? `${n(tv.vt8,0)} mL` : '0 mL'} />
            </div>
          </Card>

          <Card title="2. Ajuste Fino Dinâmico">
            <Segmented value={mode} onChange={setMode} options={modeOptions} />
            <Segmented value={peepTable} onChange={setPeepTable} options={peepTableOptions} />
            <div className="grid-3">
              <NumberField label="pCO₂ Atual" value={gas.pco2} onChange={setGasValue('pco2')} />
              <NumberField label="FR Atual" value={gas.rr} onChange={setGasValue('rr')} />
              <NumberField label="Alvo pCO₂" value={gas.target} onChange={setGasValue('target')} />
            </div>
            <div className="grid-3">
              <NumberField label="pO₂ Atual" value={gas.pao2} onChange={setGasValue('pao2')} />
              <NumberField label="FiO₂(%)" value={gas.fio2} onChange={setGasValue('fio2')} />
              <NumberField label="PEEP" value={gas.peep} onChange={setGasValue('peep')} />
            </div>
            <Result label="Nova FR" value={co2} />
            <Result label="Nova PEEP / FiO₂" value={ox.pair} helper={ox.text} />
            <div className="notice-box top-gap">{modeAttention}</div>
            <VentWaveform variant={variantForMode(mode)} title={`Curva dinâmica — ${mode}`} params={waveformParams} />
            {profile === 'obstructive' && <VentWaveform variant="autopeep" title="Curva dinâmica — risco de auto-PEEP" params={waveformParams} />}
            <CopyButton text={setupReport}>Copiar Relatório de Setup</CopyButton>
          </Card>
        </>
      )}

      {activeTab === 'mechanics' && (
        <>
          <Card title="1. Pressões e Energia Lesiva (VILI)">
            <div className="grid-2">
              <NumberField label="Vol. Cor. Atual (mL)" value={mech.vt} onChange={setMechValue('vt')} />
              <NumberField label="PEEP" value={mech.peep} onChange={setMechValue('peep')} />
            </div>
            <div className="grid-2">
              <NumberField label="P. Pico" value={mech.ppeak} onChange={setMechValue('ppeak')} />
              <NumberField label="P. Platô" value={mech.pplat} onChange={setMechValue('pplat')} />
            </div>
            <div className="grid-2">
              <Result label="Driving Pressure" value={m.dp ? n(m.dp, 1) : '--'} tone={m.dp > 15 ? 'danger' : 'neutral'} />
              <Result label="Mech. Power (J/min)" value={mp ? n(mp, 1) : '--'} tone={resultTone(mp, 17, 12)} />
            </div>
            <div className="grid-2">
              <Result label="Resistência (Pico-Platô)" value={resistance !== null ? n(resistance, 1) : '--'} tone={resistance > 10 ? 'warning' : 'neutral'} />
              <Result label="Comp. Estática" value={m.cstat ? n(m.cstat, 1) : '--'} />
            </div>
            <p className="clinical-text">{m.risk}</p>
          </Card>

          <Card title="2. Índices de Oxigenação e Desmame">
            <div className="split-title">Tobin Estático</div>
            <div className="grid-2">
              <Result label="Índice Tobin" value={tobinStatic ? n(tobinStatic, 0) : '--'} tone={tobinStatic > 105 ? 'warning' : 'neutral'} />
              <Result label="Interpretação" value={tobinStatic ? (tobinStatic > 105 ? 'Desfavorável' : 'Favorável') : '--'} />
            </div>
            <div className="split-title">TRE Dinâmico (Variação)</div>
            <div className="grid-2">
              <NumberField label="VT Início TRE (mL)" value={tre.vt} onChange={setTreValue('vt')} />
              <NumberField label="FR Início TRE" value={tre.rr} onChange={setTreValue('rr')} />
            </div>
            <div className="grid-3">
              <NumberField label="PaO₂ / SpO₂" value={rox.oxygen} onChange={setRoxValue('oxygen')} />
              <NumberField label="FiO₂ (%)" value={rox.fio2} onChange={setRoxValue('fio2')} />
              <NumberField label="FR Atual" value={rox.rr} onChange={setRoxValue('rr')} />
            </div>
            <div className="grid-3">
              <Result label="Relação P/F" value={pr.pf ? n(pr.pf, 0) : '--'} />
              <Result label="Índice ROX" value={pr.rox ? n(pr.rox, 2) : '--'} />
              <Result label="Índice Tobin" value={tobinTre ? n(tobinTre, 0) : '--'} />
            </div>
            <VentWaveform variant={variantForMode(mode)} title="Curva dinâmica com parâmetros atuais" params={waveformParams} />
            <CopyButton text={mechanicsReport}>Copiar Relatório de Mecânica</CopyButton>
          </Card>
        </>
      )}

      {activeTab === 'asynchronies' && (
        <Card title="Assincronias" kicker="Curvas dinâmicas">
          <div className="notice-box">As curvas abaixo são geradas pelo próprio app e mudam com os parâmetros preenchidos em Setup/Mecânica. Use como reconhecimento visual rápido, não como simulador fisiológico definitivo.</div>
          <div className="asynchrony-list top-gap">
            {ASYNCHRONIES.map((item) => (
              <article key={item.name} className="mini-card">
                <strong><Wind size={16} /> {item.name}</strong>
                <span>{item.type} • {item.curve}</span>
                <VentWaveform variant={item.variant} title={item.name} helper={item.finding} params={waveformParams} />
                <small>{item.action}</small>
              </article>
            ))}
          </div>
          <CopyButton text={fullReport}><ClipboardList size={18} /> Copiar Evolução/Mecânica</CopyButton>
        </Card>
      )}
    </>
  );
}
