const STATIC_HELPERS = {
  vcv: 'Fluxo quadrado, volume sobe linearmente, pressão depende da mecânica.',
  pcv: 'Pressão controlada em platô; fluxo desacelera conforme o gradiente cai.',
  psv: 'Disparo pelo paciente; pressão de suporte e ciclagem por queda do fluxo.',
  autopeep: 'A curva de fluxo expiratório não retorna ao zero antes do próximo ciclo.',
  ineffective: 'Pequena deflexão durante a expiração sem ciclo entregue pelo ventilador.',
  doubleTrigger: 'Dois ciclos consecutivos, geralmente por tempo inspiratório neural maior que o programado.',
  premature: 'A expiração começa antes do fim do esforço neural; pico expiratório abrupto.',
  delayed: 'O ventilador mantém inspiração quando o paciente já quer expirar; “chifre” no fim da inspiração.',
  flowStarvation: 'Pressão-tempo côncava/escavada no VCV por demanda de fluxo maior que a oferta.'
};

const TITLE = {
  vcv: 'VCV normal',
  pcv: 'PCV normal',
  psv: 'PSV normal',
  autopeep: 'Auto-PEEP / aprisionamento',
  ineffective: 'Esforço ineficaz',
  doubleTrigger: 'Duplo disparo',
  premature: 'Ciclagem prematura',
  delayed: 'Ciclagem tardia',
  flowStarvation: 'Fome de fluxo'
};

function toNumber(value, fallback) {
  const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function line(points) {
  if (!points.length) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ');
}

function curve(points) {
  if (!points.length) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'C'} ${point.map((n) => n.toFixed(1)).join(' ')}`).join(' ');
}

function profile(params = {}) {
  const rr = toNumber(params.rr, 18);
  const pplat = toNumber(params.pplat, 24);
  const peep = toNumber(params.peep, 8);
  const vt = toNumber(params.vt, 420);
  const pco2 = toNumber(params.pco2, 40);
  const fio2 = toNumber(params.fio2, 40);
  const cycles = rr >= 30 ? 3 : 2;
  const cycleW = 284 / cycles;
  const ti = clamp(0.42 - (rr - 18) * 0.004, 0.26, 0.46);
  const pressureBaseline = clamp(96 - peep * 0.75, 78, 98);
  const pressureTop = clamp(pressureBaseline - (pplat - peep) * 1.7 - peep * 0.25, 18, pressureBaseline - 10);
  const pressureMid = clamp(pressureBaseline - (pplat - peep) * 1.25, 24, pressureBaseline - 8);
  const flowBase = 66;
  const flowPeak = clamp(34 - (pco2 - 40) * 0.25, 18, 45);
  const flowExp = clamp(98 + (rr - 18) * 0.25, 88, 108);
  const volumeBase = 106;
  const volumeTop = clamp(106 - vt / 8.5, 22, 88);
  const oxygenStress = clamp((fio2 - 40) / 60, 0, 1);
  return { rr, cycles, cycleW, ti, pressureBaseline, pressureTop, pressureMid, flowBase, flowPeak, flowExp, volumeBase, volumeTop, oxygenStress };
}

function normalWave(mode, params) {
  const p = profile(params);
  const pressure = [];
  const flow = [];
  const volume = [];

  for (let i = 0; i < p.cycles; i += 1) {
    const x0 = 8 + i * p.cycleW;
    const x1 = x0 + p.cycleW * p.ti;
    const x2 = x0 + p.cycleW;
    const xp = x0 + p.cycleW * 0.12;
    const xv = x0 + p.cycleW * 0.30;

    if (mode === 'pcv') {
      pressure.push([x0, p.pressureBaseline], [xp, p.pressureTop], [x1, p.pressureTop + 4], [x1 + 4, p.pressureBaseline], [x2, p.pressureBaseline]);
      flow.push([x0, p.flowBase], [xp, p.flowPeak], [x1, p.flowBase], [x1 + 18, p.flowExp], [x2, p.flowBase]);
      volume.push([x0, p.volumeBase], [xv, p.volumeTop + 16], [x1, p.volumeTop], [x2, p.volumeBase]);
    } else if (mode === 'psv') {
      pressure.push([x0, p.pressureBaseline], [x0 + 10, p.pressureBaseline - 9], [xp, p.pressureTop + 8], [x1, p.pressureTop + 10 + p.oxygenStress * 6], [x2, p.pressureBaseline]);
      flow.push([x0, p.flowBase], [x0 + 8, p.flowPeak], [x1, p.flowBase - 2], [x1 + 16, p.flowExp], [x2, p.flowBase]);
      volume.push([x0, p.volumeBase], [xv, p.volumeTop + 12], [x1, p.volumeTop + 2], [x2, p.volumeBase]);
    } else {
      pressure.push([x0, p.pressureBaseline], [xp, p.pressureMid], [x1, p.pressureTop], [x1 + 4, p.pressureBaseline], [x2, p.pressureBaseline]);
      flow.push([x0, p.flowBase], [x0 + 4, p.flowPeak], [x1, p.flowPeak], [x1 + 4, p.flowBase], [x1 + 20, p.flowExp], [x2, p.flowBase]);
      volume.push([x0, p.volumeBase], [x1, p.volumeTop], [x1 + 16, p.volumeTop], [x2, p.volumeBase]);
    }
  }

  return [
    { label: 'Pressão', path: line(pressure) },
    { label: 'Fluxo', path: line(flow) },
    { label: 'Volume', path: line(volume) }
  ];
}

function autoPeepWave(params) {
  const p = profile(params);
  const waves = normalWave('vcv', params);
  const flowPoints = [];
  const volumePoints = [];
  for (let i = 0; i < p.cycles; i += 1) {
    const x0 = 8 + i * p.cycleW;
    const x1 = x0 + p.cycleW * p.ti;
    const x2 = x0 + p.cycleW;
    flowPoints.push([x0, p.flowBase], [x0 + 4, p.flowPeak], [x1, p.flowPeak], [x1 + 8, p.flowBase], [x1 + 28, p.flowExp], [x2 - 12, p.flowBase + 10], [x2, p.flowBase + 8]);
    volumePoints.push([x0, p.volumeBase - 8], [x1, p.volumeTop], [x2 - 10, p.volumeBase - 24], [x2, p.volumeBase - 20]);
  }
  return [waves[0], { label: 'Fluxo', path: line(flowPoints) }, { label: 'Volume', path: line(volumePoints) }];
}

function asynchronyWave(variant, params) {
  const p = profile(params);
  const base = normalWave('vcv', params);
  if (variant === 'autopeep') return autoPeepWave(params);

  const pressure = [];
  const flow = [];
  const volume = [];
  for (let i = 0; i < p.cycles; i += 1) {
    const x0 = 8 + i * p.cycleW;
    const x1 = x0 + p.cycleW * p.ti;
    const x2 = x0 + p.cycleW;
    const mid = x1 + (x2 - x1) * 0.35;

    if (variant === 'ineffective') {
      pressure.push([x0, p.pressureBaseline], [x0 + 12, p.pressureTop], [x1, p.pressureTop], [x1 + 12, p.pressureBaseline], [mid, p.pressureBaseline - 13], [mid + 8, p.pressureBaseline], [x2, p.pressureBaseline]);
      flow.push([x0, p.flowBase], [x0 + 6, p.flowPeak], [x1, p.flowPeak], [x1 + 12, p.flowExp], [mid, p.flowBase - 12], [mid + 8, p.flowBase], [x2, p.flowBase]);
    } else if (variant === 'doubleTrigger') {
      pressure.push([x0, p.pressureBaseline], [x0 + 10, p.pressureTop], [x1 * 0.82 + x0 * 0.18, p.pressureTop], [x1, p.pressureBaseline], [x1 + 6, p.pressureTop], [x1 + 34, p.pressureTop + 2], [x1 + 50, p.pressureBaseline], [x2, p.pressureBaseline]);
      volume.push([x0, p.volumeBase], [x1 * 0.82 + x0 * 0.18, p.volumeTop + 12], [x1, p.volumeTop + 22], [x1 + 34, p.volumeTop - 10], [x2, p.volumeBase]);
    } else if (variant === 'premature') {
      pressure.push([x0, p.pressureBaseline], [x0 + 12, p.pressureTop], [x1 - 10, p.pressureTop + 6], [x1, p.pressureBaseline - 8], [x1 + 12, p.pressureBaseline], [x2, p.pressureBaseline]);
      flow.push([x0, p.flowBase], [x0 + 10, p.flowPeak], [x1 - 8, p.flowBase - 6], [x1 + 2, p.flowExp + 8], [x1 + 30, p.flowBase], [x2, p.flowBase]);
    } else if (variant === 'delayed') {
      pressure.push([x0, p.pressureBaseline], [x0 + 12, p.pressureTop], [x1 + 12, p.pressureTop + 4], [x1 + 22, p.pressureTop - 14], [x1 + 36, p.pressureBaseline], [x2, p.pressureBaseline]);
      flow.push([x0, p.flowBase], [x0 + 8, p.flowPeak], [x1, p.flowBase - 3], [x1 + 20, p.flowBase + 8], [x1 + 34, p.flowExp], [x2, p.flowBase]);
    } else if (variant === 'flowStarvation') {
      pressure.push([x0, p.pressureBaseline], [x0 + 10, p.pressureTop + 20], [x0 + 34, p.pressureTop + 34], [x1 - 8, p.pressureTop + 18], [x1, p.pressureBaseline], [x2, p.pressureBaseline]);
      flow.push([x0, p.flowBase], [x0 + 4, p.flowPeak + 12], [x1, p.flowPeak + 12], [x1 + 4, p.flowBase], [x1 + 20, p.flowExp], [x2, p.flowBase]);
    }
  }

  if (variant === 'doubleTrigger') return [{ label: 'Pressão', path: line(pressure) }, { label: 'Volume', path: line(volume) }];
  if (pressure.length && flow.length) return [{ label: 'Pressão', path: line(pressure) }, { label: 'Fluxo', path: line(flow) }];
  return base;
}

function wavesForVariant(variant, params) {
  if (variant === 'pcv') return normalWave('pcv', params);
  if (variant === 'psv') return normalWave('psv', params);
  if (variant === 'vcv') return normalWave('vcv', params);
  return asynchronyWave(variant, params);
}

export function VentWaveform({ variant = 'vcv', title, helper, params }) {
  const waves = wavesForVariant(variant, params);
  const label = title || TITLE[variant] || TITLE.vcv;
  return (
    <div className="waveform-card">
      <div className="waveform-head">
        <strong>{label}</strong>
        <small>{helper || STATIC_HELPERS[variant] || STATIC_HELPERS.vcv}</small>
      </div>
      <div className="waveform-svg-wrap">
        <svg viewBox="0 0 300 120" className="waveform-svg" role="img" aria-label={label}>
          <line x1="8" y1="66" x2="292" y2="66" className="wave-zero" />
          <line x1="8" y1="10" x2="8" y2="110" className="wave-axis" />
          {waves.map((wave, index) => (
            <g key={wave.label} className={`wave-layer wave-layer-${index + 1}`}>
              <path d={wave.path} />
              <text x="282" y={18 + index * 15}>{wave.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function variantForMode(mode) {
  return {
    VCV: 'vcv',
    PCV: 'pcv',
    PSV: 'psv'
  }[mode] || 'vcv';
}
