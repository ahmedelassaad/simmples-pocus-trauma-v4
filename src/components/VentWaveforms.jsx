import { useEffect, useMemo, useState } from 'react';

const HELPERS = {
  vcv: 'VCV: fluxo inspiratório constante, pressão sobe conforme resistência/complacência e volume sobe linearmente.',
  pcv: 'PCV: pressão sobe rápido e sustenta platô; fluxo inspiratório desacelera conforme o gradiente cai.',
  psv: 'PSV: disparo pelo paciente, pressão de suporte e fluxo desacelerado com ciclagem por queda de fluxo.',
  autopeep: 'Auto-PEEP: fluxo expiratório não volta ao zero antes do próximo ciclo; volume também não retorna totalmente ao basal.',
  ineffective: 'Esforço ineficaz: deflexão de pressão/fluxo durante a expiração sem ciclo entregue pelo ventilador.',
  doubleTrigger: 'Duplo disparo: dois ciclos empilhados, com expiração incompleta entre eles e tendência a volume excessivo.',
  premature: 'Ciclagem prematura: o ventilador encerra a inspiração antes do paciente; aparece esforço inspiratório logo após ciclar.',
  delayed: 'Ciclagem tardia: o ventilador mantém inspiração quando o paciente já quer expirar; gera distorção no fim da inspiração.',
  flowStarvation: 'Fome de fluxo: no VCV, a pressão fica escavada durante a inspiração por demanda de fluxo maior que a oferta.'
};

const TITLES = {
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

const VIEW_W = 420;
const VIEW_H = 270;
const LEFT = 54;
const RIGHT = 18;
const PLOT_W = VIEW_W - LEFT - RIGHT;
const BANDS = {
  pressure: { label: 'Pressão', unit: 'cmH₂O', top: 18, height: 66, min: -8, max: 45 },
  flow: { label: 'Fluxo', unit: 'L/min', top: 102, height: 66, min: -80, max: 80 },
  volume: { label: 'Volume', unit: 'mL', top: 186, height: 66, min: 0, max: 900 }
};

function toNumber(value, fallback) {
  const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function expDecay(phase, start, end, tau = 4) {
  const u = clamp((phase - start) / Math.max(0.001, end - start), 0, 1);
  return Math.exp(-tau * u);
}

function gaussian(x, center, width) {
  const z = (x - center) / width;
  return Math.exp(-0.5 * z * z);
}

function normaliseParams(params = {}) {
  const rr = clamp(toNumber(params.rr, 18), 6, 45);
  const peep = clamp(toNumber(params.peep, 8), 0, 22);
  const pplat = clamp(toNumber(params.pplat, peep + 16), peep + 4, 48);
  const ppeak = clamp(toNumber(params.ppeak, pplat + 5), pplat, 65);
  const vt = clamp(toNumber(params.vt, 420), 120, 900);
  const pco2 = clamp(toNumber(params.pco2, 40), 20, 100);
  const fio2 = clamp(toNumber(params.fio2, 40), 21, 100);
  const profile = params.profile || 'normal';
  const selectedMode = params.mode || 'VCV';
  const period = 60 / rr;
  const drive = clamp(pplat - peep, 4, 32);
  const resistanceGap = clamp(ppeak - pplat, 0, 28);
  const demand = clamp((pco2 - 40) / 45 + (rr - 18) / 35, 0, 1.4);
  return { rr, peep, pplat, ppeak, vt, pco2, fio2, profile, selectedMode, period, drive, resistanceGap, demand };
}

function tiFraction(mode, variant, cfg) {
  let ti = mode === 'PCV' ? 0.34 : mode === 'PSV' ? 0.38 : 0.30;
  if (cfg.profile === 'obstructive') ti -= 0.05;
  if (cfg.profile === 'ards') ti += 0.03;
  if (variant === 'premature') ti -= 0.08;
  if (variant === 'delayed') ti += 0.11;
  if (cfg.rr > 28) ti -= 0.04;
  return clamp(ti, 0.18, 0.55);
}

function intrinsicPeep(variant, cfg) {
  const obstructiveLoad = cfg.profile === 'obstructive' ? 2.5 : 0;
  const rrLoad = clamp((cfg.rr - 20) / 4, 0, 6);
  if (variant === 'autopeep') return clamp(3 + obstructiveLoad + rrLoad, 3, 12);
  if (cfg.profile === 'obstructive' && cfg.rr > 22) return clamp(1.5 + rrLoad, 0, 7);
  return 0;
}

function baseModeForVariant(variant, cfg) {
  if (variant === 'vcv') return 'VCV';
  if (variant === 'pcv') return 'PCV';
  if (variant === 'psv') return 'PSV';
  return cfg.selectedMode || 'VCV';
}

function breathPhase(time, cfg) {
  const raw = ((time % cfg.period) + cfg.period) % cfg.period;
  return raw / cfg.period;
}

function normalValues(phase, mode, cfg, variant = 'normal') {
  const ti = tiFraction(mode, variant, cfg);
  const exStart = ti;
  const intrinsic = intrinsicPeep(variant, cfg);
  const basePressure = cfg.peep + intrinsic;
  const supportPressure = cfg.peep + clamp(cfg.drive * (mode === 'PSV' ? 0.65 : 1), 4, 26);
  const pTarget = mode === 'PCV' || mode === 'PSV' ? supportPressure : cfg.pplat;
  const flowScale = clamp((cfg.vt / 420) * (cfg.rr / 18) * 42 + cfg.demand * 18, 22, 92);
  const expFlowScale = clamp(flowScale * (cfg.profile === 'obstructive' ? 0.72 : 1), 18, 85);

  let pressure = basePressure;
  let flow = 0;
  let volume = 0;

  if (phase < ti) {
    const u = phase / ti;
    if (mode === 'VCV') {
      const expected = basePressure + cfg.drive * (0.18 + 0.82 * u) + cfg.resistanceGap * 0.28;
      const starvation = variant === 'flowStarvation' ? (7 + 7 * cfg.demand) * Math.sin(Math.PI * u) : 0;
      pressure = expected - starvation;
      flow = flowScale;
      volume = cfg.vt * u;
    } else if (mode === 'PCV') {
      pressure = basePressure + (pTarget - basePressure) * smoothstep(0, 0.14, u);
      flow = flowScale * Math.exp(-2.5 * u) + 8;
      volume = cfg.vt * (1 - Math.exp(-2.8 * u)) / (1 - Math.exp(-2.8));
    } else {
      const triggerDip = -clamp(2 + cfg.demand * 3, 2, 7) * gaussian(u, 0.06, 0.04);
      pressure = basePressure + (pTarget - basePressure) * smoothstep(0.08, 0.24, u) + triggerDip;
      flow = flowScale * Math.exp(-2.1 * u) + 5;
      volume = cfg.vt * 0.85 * (1 - Math.exp(-2.6 * u)) / (1 - Math.exp(-2.6));
    }
  } else {
    const decay = expDecay(phase, exStart, 1, cfg.profile === 'obstructive' || variant === 'autopeep' ? 1.8 : 4.2);
    const remaining = variant === 'autopeep' || (cfg.profile === 'obstructive' && cfg.rr > 24) ? clamp(0.12 + cfg.rr / 180, 0.12, 0.36) : 0;
    pressure = basePressure + intrinsic * decay * 0.35;
    flow = -expFlowScale * decay;
    volume = cfg.vt * (remaining + (1 - remaining) * decay);
  }

  return { pressure, flow, volume };
}

function asynchronyValues(phase, mode, cfg, variant) {
  if (variant === 'doubleTrigger') {
    const ti = tiFraction(mode, variant, cfg);
    const gap = 0.035;
    const secondStart = ti + gap;
    const secondTi = clamp(ti * 0.78, 0.14, 0.35);
    if (phase < ti) return normalValues(phase, mode, cfg, 'normal');
    if (phase >= secondStart && phase < secondStart + secondTi) {
      const u = (phase - secondStart) / secondTi;
      const firstVolume = cfg.vt * 0.78;
      const pressure = cfg.peep + cfg.drive * (0.35 + 0.75 * u) + cfg.resistanceGap * 0.32;
      const flow = clamp((cfg.vt / 420) * 54 + cfg.demand * 20, 32, 96);
      const volume = firstVolume + cfg.vt * 0.75 * u;
      return { pressure, flow, volume };
    }
    const ex = expDecay(phase, secondStart + secondTi, 1, 2.4);
    return { pressure: cfg.peep + 2 * ex, flow: -70 * ex, volume: cfg.vt * 1.25 * ex };
  }

  const base = normalValues(phase, mode, cfg, variant);

  if (variant === 'ineffective') {
    const notch = gaussian(phase, 0.68, 0.025);
    const secondNotch = gaussian(phase, 0.86, 0.023) * (cfg.rr > 22 ? 1 : 0.35);
    const amp = notch + secondNotch;
    return {
      pressure: base.pressure - amp * clamp(5 + cfg.demand * 4, 4, 10),
      flow: base.flow + amp * clamp(24 + cfg.demand * 24, 18, 52),
      volume: base.volume + amp * 18
    };
  }

  if (variant === 'premature') {
    const postCycleEffort = gaussian(phase, tiFraction(mode, variant, cfg) + 0.05, 0.035);
    return {
      pressure: base.pressure - postCycleEffort * clamp(6 + cfg.demand * 5, 5, 12),
      flow: base.flow - postCycleEffort * clamp(30 + cfg.demand * 30, 25, 70),
      volume: base.volume
    };
  }

  if (variant === 'delayed') {
    const late = gaussian(phase, tiFraction(mode, variant, cfg) - 0.045, 0.035);
    return {
      pressure: base.pressure + late * clamp(7 + cfg.demand * 5, 6, 13),
      flow: base.flow - late * clamp(24 + cfg.demand * 22, 18, 52),
      volume: base.volume
    };
  }

  if (variant === 'flowStarvation') {
    return normalValues(phase, 'VCV', cfg, 'flowStarvation');
  }

  return base;
}

function valuesAt(time, variant, cfg) {
  const mode = baseModeForVariant(variant, cfg);
  const phase = breathPhase(time, cfg);
  if (['vcv', 'pcv', 'psv', 'autopeep'].includes(variant)) {
    const normalMode = variant === 'pcv' ? 'PCV' : variant === 'psv' ? 'PSV' : 'VCV';
    return normalValues(phase, normalMode, cfg, variant);
  }
  return asynchronyValues(phase, mode, cfg, variant);
}

function yFor(value, band) {
  const clipped = clamp(value, band.min, band.max);
  return band.top + band.height - ((clipped - band.min) / (band.max - band.min)) * band.height;
}

function xFor(t, duration) {
  return LEFT + (t / duration) * PLOT_W;
}

function pathFromSamples(samples, key, band, duration) {
  if (!samples.length) return '';
  return samples
    .map((sample, index) => `${index === 0 ? 'M' : 'L'} ${xFor(sample.t, duration).toFixed(1)} ${yFor(sample[key], band).toFixed(1)}`)
    .join(' ');
}

function generateSamples({ variant, cfg, progress, duration }) {
  const maxSamples = 260;
  const end = Math.max(0.02, progress * duration);
  const samples = [];
  const count = clamp(Math.ceil(maxSamples * progress), 2, maxSamples);
  for (let i = 0; i < count; i += 1) {
    const t = (i / (count - 1 || 1)) * end;
    samples.push({ t, ...valuesAt(t, variant, cfg) });
  }
  return samples;
}

function defaultDuration(cfg) {
  const cycles = cfg.rr >= 30 ? 4 : 3;
  return cfg.period * cycles;
}

export function VentWaveform({ variant = 'vcv', title, helper, params }) {
  const cfg = useMemo(() => normaliseParams(params), [params]);
  const duration = useMemo(() => defaultDuration(cfg), [cfg]);
  const [progress, setProgress] = useState(0.02);

  useEffect(() => {
    let frame;
    let start = performance.now();
    const cycleMs = clamp(duration * 1000, 2600, 9000);

    const tick = (now) => {
      const elapsed = (now - start) % cycleMs;
      const next = elapsed / cycleMs;
      setProgress(next < 0.015 ? 0.015 : next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, variant, cfg.rr, cfg.peep, cfg.pplat, cfg.vt, cfg.profile, cfg.selectedMode]);

  const samples = useMemo(() => generateSamples({ variant, cfg, progress, duration }), [variant, cfg, progress, duration]);
  const last = samples[samples.length - 1] || { t: 0, pressure: cfg.peep, flow: 0, volume: 0 };
  const cursorX = xFor(last.t, duration);
  const label = title || TITLES[variant] || TITLES.vcv;
  const modeLabel = baseModeForVariant(variant, cfg);

  const paths = {
    pressure: pathFromSamples(samples, 'pressure', BANDS.pressure, duration),
    flow: pathFromSamples(samples, 'flow', BANDS.flow, duration),
    volume: pathFromSamples(samples, 'volume', BANDS.volume, duration)
  };

  return (
    <div className="waveform-card live-waveform-card">
      <div className="waveform-head">
        <strong>{label}</strong>
        <small>{helper || HELPERS[variant] || HELPERS.vcv}</small>
      </div>
      <div className="waveform-meta">
        <span>Ao vivo</span>
        <span>Modo base: {modeLabel}</span>
        <span>FR {cfg.rr}/min</span>
        <span>PEEP {cfg.peep}</span>
        <span>Platô {cfg.pplat}</span>
        <span>VT {cfg.vt} mL</span>
      </div>
      <div className="waveform-svg-wrap dynamic-waveform-wrap">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="waveform-svg dynamic-waveform-svg" role="img" aria-label={`${label} dinâmica`}>
          <defs>
            <linearGradient id={`waveGrad-${variant}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
            </linearGradient>
          </defs>
          {Object.entries(BANDS).map(([key, band]) => {
            const zeroY = yFor(0, band);
            return (
              <g key={key}>
                <text x="10" y={band.top + 14} className="wave-label">{band.label}</text>
                <text x="10" y={band.top + 30} className="wave-unit">{band.unit}</text>
                <line x1={LEFT} x2={VIEW_W - RIGHT} y1={band.top + band.height} y2={band.top + band.height} className="wave-grid" />
                <line x1={LEFT} x2={VIEW_W - RIGHT} y1={band.top} y2={band.top} className="wave-grid soft" />
                <line x1={LEFT} x2={VIEW_W - RIGHT} y1={zeroY} y2={zeroY} className="wave-zero" />
                <path d={paths[key]} className={`live-wave live-wave-${key}`} />
                <circle cx={cursorX} cy={yFor(last[key], band)} r="3.3" className={`wave-dot wave-dot-${key}`} />
              </g>
            );
          })}
          <line x1={cursorX} x2={cursorX} y1="12" y2={VIEW_H - 12} className="wave-cursor" />
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
