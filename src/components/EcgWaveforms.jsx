import { useEffect, useMemo, useState } from 'react';

const LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

function g(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function plateau(t, start, end, rise = 0.035) {
  return clamp((t - start) / rise, 0, 1) * clamp((end - t) / rise, 0, 1);
}

function saw(x) {
  const f = x - Math.floor(x);
  return 2 * f - 1;
}

function leadMorph(lead) {
  const map = {
    I:   { p: 0.11, q: -0.08, r: 0.84, s: -0.18, t: 0.34 },
    II:  { p: 0.16, q: -0.10, r: 1.08, s: -0.22, t: 0.44 },
    III: { p: 0.08, q: -0.07, r: 0.62, s: -0.18, t: 0.27 },
    aVR: { p: -0.08, q: 0.06, r: -0.72, s: 0.18, t: -0.28 },
    aVL: { p: 0.06, q: -0.05, r: 0.52, s: -0.12, t: 0.21 },
    aVF: { p: 0.10, q: -0.08, r: 0.82, s: -0.18, t: 0.34 },
    V1:  { p: 0.04, q: -0.02, r: 0.22, s: -0.92, t: 0.12 },
    V2:  { p: 0.05, q: -0.03, r: 0.44, s: -0.76, t: 0.21 },
    V3:  { p: 0.07, q: -0.05, r: 0.80, s: -0.50, t: 0.34 },
    V4:  { p: 0.08, q: -0.07, r: 1.16, s: -0.22, t: 0.45 },
    V5:  { p: 0.08, q: -0.06, r: 1.02, s: -0.10, t: 0.38 },
    V6:  { p: 0.07, q: -0.05, r: 0.82, s: -0.07, t: 0.30 }
  };
  return map[lead] || map.II;
}

function leadIn(leads, lead) {
  return leads.includes(lead);
}

function basePattern() {
  return {
    st: 0,
    stShape: 'flat',
    tScale: 1,
    tInvert: false,
    tBiphasic: false,
    tSharp: false,
    qWave: 0,
    rScale: 1,
    sScale: 1,
    qrsWidth: 1,
    pScale: 1,
    prShift: 0,
    delta: false,
    qrsKind: 'normal',
    paced: false,
    brugada: false
  };
}

function patternLead(pattern, lead) {
  const base = basePattern();
  const apply = (leads, changes) => leadIn(leads, lead) ? { ...base, ...changes } : base;
  switch (pattern) {
    case 'first-avb': return { ...base, prShift: 0.075 };
    case 'junctional': return { ...base, pScale: -0.55, prShift: -0.045 };
    case 'stemi-anterior': {
      if (leadIn(['V2','V3','V4','V5'], lead)) return { ...base, st: lead === 'V3' ? 1.25 : 0.95, tScale: 1.55, qWave: 0.12 };
      if (leadIn(['II','III','aVF'], lead)) return { ...base, st: -0.26, tScale: 0.85 };
      return base;
    }
    case 'stemi-inferior': {
      if (lead === 'III') return { ...base, st: 1.12, tScale: 1.35, qWave: 0.10 };
      if (leadIn(['II','aVF'], lead)) return { ...base, st: 0.86, tScale: 1.18, qWave: 0.08 };
      if (leadIn(['I','aVL'], lead)) return { ...base, st: -0.55, tScale: 0.75 };
      return base;
    }
    case 'stemi-lateral': {
      if (leadIn(['I','aVL','V5','V6'], lead)) return { ...base, st: leadIn(['I','aVL'], lead) ? 0.80 : 0.68, tScale: 1.18, qWave: 0.07 };
      if (leadIn(['III','aVF'], lead)) return { ...base, st: -0.42, tScale: 0.75 };
      return base;
    }
    case 'stemi-posterior': return apply(['V1','V2','V3'], { st: -0.72, stShape: 'horizontal', tScale: 1.25, rScale: 1.9, sScale: 0.55 });
    case 'rv-infarct': {
      if (leadIn(['II','III','aVF'], lead)) return { ...base, st: lead === 'III' ? 1.05 : 0.75, tScale: 1.1 };
      if (lead === 'V1') return { ...base, st: 0.72, tScale: 0.8, rScale: 1.35, sScale: 0.75 };
      if (leadIn(['I','aVL'], lead)) return { ...base, st: -0.35, tScale: 0.85 };
      return base;
    }
    case 'de-winter': {
      if (leadIn(['V2','V3','V4','V5','V6'], lead)) return { ...base, st: -0.60, stShape: 'upsloping', tScale: 2.55, rScale: 1.15 };
      if (lead === 'aVR') return { ...base, st: 0.35, tScale: 0.75 };
      return base;
    }
    case 'wellens-a': return apply(['V2','V3'], { st: 0.05, tScale: 1.25, tBiphasic: true });
    case 'wellens-b': return apply(['V2','V3','V4'], { st: 0.02, tScale: 2.10, tInvert: true });
    case 'aslanger': {
      if (lead === 'III') return { ...base, st: 0.88, tScale: 1.15 };
      if (leadIn(['V4','V5','V6'], lead)) return { ...base, st: -0.58, tScale: 1.05 };
      if (leadIn(['I','aVL'], lead)) return { ...base, st: -0.35, tScale: 0.85 };
      if (lead === 'V1') return { ...base, st: 0.33, tScale: 0.70 };
      if (lead === 'V2') return { ...base, st: -0.10, tScale: 0.65 };
      return base;
    }
    case 'south-african-flag': {
      if (leadIn(['I','aVL','V2'], lead)) return { ...base, st: 0.86, tScale: 1.18, qWave: lead === 'aVL' ? 0.08 : 0.02 };
      if (leadIn(['III','aVF'], lead)) return { ...base, st: -0.52, tScale: 0.78 };
      return base;
    }
    case 'left-main-avr': {
      if (lead === 'aVR') return { ...base, st: 0.82, tScale: 0.75 };
      if (lead === 'V1') return { ...base, st: 0.28, tScale: 0.8 };
      if (leadIn(['I','II','aVL','aVF','V3','V4','V5','V6'], lead)) return { ...base, st: -0.62, stShape: 'horizontal', tScale: 0.82 };
      return base;
    }
    case 'hyperacute-t': {
      if (leadIn(['V2','V3','V4','II','III','aVF'], lead)) return { ...base, st: 0.18, tScale: 2.45 };
      return base;
    }
    case 'lbbb': return { ...base, qrsWidth: 2.35, qrsKind: 'lbbb' };
    case 'rbbb': return { ...base, qrsWidth: 1.85, qrsKind: 'rbbb', tInvert: leadIn(['V1','V2','V3'], lead) };
    case 'brugada': return leadIn(['V1','V2'], lead) ? { ...base, qrsWidth: 1.55, qrsKind: 'rbbb', brugada: true, st: 1.18, tInvert: true, tScale: 1.05 } : base;
    case 'hyperkalemia': return { ...base, tScale: 2.55, tSharp: true, pScale: 0.25, prShift: 0.04, qrsWidth: 1.45 };
    case 'wpw': return { ...base, prShift: -0.075, delta: true, qrsWidth: 1.38, rScale: 1.05 };
    case 'paced': return { ...base, qrsWidth: 2.35, qrsKind: 'lbbb', paced: true, pScale: 0 };
    default: return base;
  }
}

function qrsNormal(t, m, p, qrsCenter) {
  const w = p.qrsWidth || 1;
  let q = (m.q - p.qWave) * g(t, qrsCenter - 0.032 * w, 0.010 * w);
  let r = m.r * p.rScale * g(t, qrsCenter, 0.012 * w);
  let s = m.s * p.sScale * g(t, qrsCenter + 0.034 * w, 0.014 * w);
  if (p.delta) r += 0.26 * Math.sign(m.r || 1) * g(t, qrsCenter - 0.060, 0.035);
  return q + r + s;
}

function qrsRbbb(t, m, lead, p, qrsCenter) {
  const w = p.qrsWidth || 1.8;
  if (leadIn(['V1','V2'], lead)) {
    return 0.30 * g(t, qrsCenter - 0.045, 0.011 * w) - 0.50 * g(t, qrsCenter - 0.005, 0.013 * w) + 1.05 * g(t, qrsCenter + 0.050, 0.018 * w);
  }
  if (leadIn(['I','aVL','V5','V6'], lead)) {
    return m.r * 0.92 * g(t, qrsCenter - 0.020, 0.014 * w) - 0.72 * g(t, qrsCenter + 0.060, 0.023 * w);
  }
  return qrsNormal(t, m, p, qrsCenter) - 0.22 * g(t, qrsCenter + 0.055, 0.020 * w);
}

function qrsLbbb(t, m, lead, p, qrsCenter) {
  const w = p.qrsWidth || 2.2;
  if (leadIn(['V1','V2'], lead)) {
    return 0.12 * g(t, qrsCenter - 0.055, 0.012 * w) - 1.08 * g(t, qrsCenter + 0.020, 0.034 * w);
  }
  if (leadIn(['I','aVL','V5','V6'], lead)) {
    return 0.55 * g(t, qrsCenter - 0.030, 0.020 * w) + 0.86 * g(t, qrsCenter + 0.035, 0.028 * w) - 0.06 * g(t, qrsCenter + 0.095, 0.014 * w);
  }
  return qrsNormal(t, m, { ...p, rScale: 0.9 }, qrsCenter) + 0.32 * Math.sign(m.r || 1) * g(t, qrsCenter + 0.050, 0.030 * w);
}

function secondaryStTFromBundle(lead, p, qrsTerminal) {
  if (p.qrsKind === 'lbbb') {
    if (leadIn(['V1','V2'], lead)) return { st: 0.34, tInvert: false, tScale: 0.85 };
    if (leadIn(['I','aVL','V5','V6'], lead)) return { st: -0.30, tInvert: true, tScale: 0.9 };
  }
  if (p.qrsKind === 'rbbb') {
    if (leadIn(['V1','V2','V3'], lead)) return { st: -0.20, tInvert: true, tScale: 0.8 };
  }
  return { st: 0, tInvert: false, tScale: 1 };
}

function beatWave({ t, lead, pattern, rhythm, beatIndex = 0, time = 0, pOnly = false }) {
  const m = leadMorph(lead);
  const p = patternLead(pattern, lead);
  const basePr = 0.165 + (p.prShift || 0);
  let qrsCenter = 0.38 + (p.prShift || 0);
  let y = 0;

  if (rhythm === 'asystole') return 0.006 * Math.sin(2 * Math.PI * time * 13) + 0.004 * Math.sin(2 * Math.PI * time * 3.7);

  if (rhythm === 'vf') {
    const leadIndex = LEADS.indexOf(lead) + 1;
    const envelope = 0.74 + 0.18 * Math.sin(2 * Math.PI * 0.24 * time + leadIndex * 0.19) + 0.08 * Math.sin(2 * Math.PI * 0.52 * time);
    const coarse = 0.68 * Math.sin(2 * Math.PI * (3.8 + leadIndex * 0.05) * time + 0.6 * leadIndex)
      + 0.24 * Math.sin(2 * Math.PI * 7.6 * time + 0.9)
      + 0.16 * Math.sin(2 * Math.PI * 11.8 * time + 0.35 * leadIndex);
    return envelope * coarse + 0.02 * Math.sin(2 * Math.PI * 18 * time);
  }

  if (rhythm === 'torsades') {
    const leadIndex = LEADS.indexOf(lead) + 1;
    const twist = Math.sin(2 * Math.PI * 0.22 * time + leadIndex * 0.12);
    const envelope = 0.22 + 0.95 * Math.abs(twist);
    const carrier = Math.sin(2 * Math.PI * 3.35 * time + 0.15 * leadIndex)
      + 0.34 * Math.sin(2 * Math.PI * 6.7 * time + 0.8)
      + 0.12 * Math.sin(2 * Math.PI * 10.1 * time + 0.3);
    return envelope * carrier * Math.sign(twist || 1) + 0.05 * Math.sin(2 * Math.PI * 0.9 * time);
  }

  if (rhythm === 'vt') {
    const polarity = leadIn(['aVR','V1','V2'], lead) ? -1 : 1;
    return polarity * (0.98 * Math.sin(2 * Math.PI * t) + 0.38 * Math.sin(4 * Math.PI * t + 0.65)) + 0.12 * Math.sin(6 * Math.PI * t);
  }

  if (rhythm === 'flutter') {
    y += 0.11 * saw(5.5 * t + 0.10) + 0.035 * Math.sin(2 * Math.PI * 11 * t);
  }

  if (rhythm === 'afib') {
    y += 0.045 * Math.sin(2 * Math.PI * (7.2 + lead.length * 0.2) * t + beatIndex) + 0.025 * Math.sin(2 * Math.PI * 13.1 * t + lead.length);
  }

  let pAmp = m.p * (p.pScale ?? 1);
  if (rhythm === 'afib' || rhythm === 'svt' || rhythm === 'vt' || rhythm === 'vf' || rhythm === 'torsades') pAmp = 0;
  if (rhythm === 'junctional') {
    pAmp = -Math.abs(m.p) * 0.75;
    y += pAmp * g(t, qrsCenter + 0.08, 0.030);
  } else if (pAmp !== 0) {
    y += pAmp * g(t, Math.max(0.06, qrsCenter - basePr), 0.032);
  }

  if (pOnly) return y;

  if (p.paced) {
    y += 1.35 * g(t, qrsCenter - 0.07, 0.003) - 0.55 * g(t, qrsCenter - 0.064, 0.003);
  }

  let qrs = 0;
  if (p.qrsKind === 'rbbb') qrs = qrsRbbb(t, m, lead, p, qrsCenter);
  else if (p.qrsKind === 'lbbb') qrs = qrsLbbb(t, m, lead, p, qrsCenter);
  else qrs = qrsNormal(t, m, p, qrsCenter);
  y += qrs;

  const bundle = secondaryStTFromBundle(lead, p, qrs);
  let st = (p.st || 0) + bundle.st;
  let stSegment = plateau(t, qrsCenter + 0.055, qrsCenter + 0.205, 0.030);
  if (p.stShape === 'upsloping') stSegment *= clamp((t - (qrsCenter + 0.055)) / 0.20, 0.35, 1.15);
  if (p.stShape === 'horizontal') stSegment *= 1.03;
  if (p.brugada && leadIn(['V1','V2'], lead)) {
    const cove = plateau(t, qrsCenter + 0.035, qrsCenter + 0.235, 0.040) * clamp(1.12 - (t - qrsCenter) * 2.1, 0.25, 1.05);
    y += 0.50 * cove;
  } else {
    y += st * 0.36 * stSegment;
  }

  let tCenter = qrsCenter + 0.315;
  let tWidth = p.tSharp ? 0.045 : 0.082;
  let tAmp = m.t * (p.tScale ?? 1) * (bundle.tScale ?? 1);
  const invert = p.tInvert || bundle.tInvert;
  if (p.tBiphasic) {
    y += 0.32 * Math.abs(m.t) * g(t, tCenter - 0.050, 0.043) - 0.44 * Math.abs(m.t) * g(t, tCenter + 0.045, 0.056);
  } else {
    if (invert) tAmp = -Math.abs(tAmp);
    y += tAmp * g(t, tCenter, tWidth);
  }

  return y;
}

function rrForRhythm(rhythm, rate, beatIndex) {
  if (rhythm === 'asystole') return 10;
  if (rhythm === 'brady' || rhythm === 'junctional') return 60 / Math.max(32, rate || 45);
  if (rhythm === 'svt') return 60 / Math.max(130, rate || 165);
  if (rhythm === 'vt' || rhythm === 'torsades') return 60 / Math.max(140, rate || 170);
  if (rhythm === 'flutter') return 60 / Math.max(130, rate || 150);
  if (rhythm === 'paced') return 60 / Math.max(45, rate || 70);
  if (rhythm === 'afib') {
    const base = 60 / Math.max(70, rate || 120);
    return base * (0.70 + ((Math.sin(beatIndex * 12.9898) + 1) / 2) * 0.72);
  }
  return 60 / Math.max(45, rate || 75);
}

function droppedBeat(pattern, beatIndex) {
  if (pattern === 'mobitz1') return beatIndex % 4 === 3;
  if (pattern === 'mobitz2') return beatIndex % 3 === 2;
  return false;
}

function pathForLead({ lead = 'II', pattern = 'normal', rhythm = 'sinus', rate = 75, phase = 0, width = 700, height = 92, seconds = 4.8 }) {
  const points = [];
  const samples = Math.max(260, Math.round(width * 0.8));
  let beatIndex = 0;
  let currentBeatStart = -phase;
  let rr = rrForRhythm(rhythm, rate, beatIndex);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * width;
    const time = (i / (samples - 1)) * seconds;
    while (time - currentBeatStart > rr) {
      beatIndex += 1;
      currentBeatStart += rr;
      rr = rrForRhythm(rhythm, rate, beatIndex);
    }
    const tInBeat = (time - currentBeatStart) / rr;
    let yVal = beatWave({ t: tInBeat, lead, pattern, rhythm, beatIndex, time, pOnly: droppedBeat(pattern, beatIndex) });
    if (pattern === 'complete-av') {
      const pCycle = 0.72;
      const pPhase = ((time + 0.05 * lead.length) % pCycle) / pCycle;
      yVal += leadMorph(lead).p * 0.9 * g(pPhase, 0.20, 0.035);
    }
    const scale = rhythm === 'vf' || rhythm === 'torsades' || rhythm === 'vt' ? 0.28 : 0.30;
    const y = height / 2 - yVal * (height * scale);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

function gridLines(width, height, majorEvery = 5) {
  const v = [];
  const h = [];
  const small = 20;
  for (let x = 0; x <= width; x += small) v.push({ x, major: Math.round(x / small) % majorEvery === 0 });
  for (let y = 0; y <= height; y += small) h.push({ y, major: Math.round(y / small) % majorEvery === 0 });
  return { v, h };
}

function Calibration({ x = 22, y = 48, h = 24, w = 36 }) {
  return <path className="ecg-calibration" d={`M ${x} ${y} L ${x + 5} ${y} L ${x + 5} ${y - h} L ${x + w} ${y - h} L ${x + w} ${y} L ${x + w + 8} ${y}`} />;
}

export function EcgStrip({ title, helper, pattern = 'normal', rhythm = 'sinus', rate = 75, lead = 'II', compact = false }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => { setTick((value) => (value + 1) % 100000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const height = compact ? 74 : 100;
  const phase = (tick / 60) * 0.72;
  const grid = useMemo(() => gridLines(700, height), [height]);
  const path = useMemo(() => pathForLead({ lead, pattern, rhythm, rate, phase, height, seconds: compact ? 3.6 : 5.2 }), [lead, pattern, rhythm, rate, phase, compact, height]);
  return (
    <div className="ecg-card">
      {(title || helper) && <div className="ecg-head"><strong>{title || lead}</strong>{helper && <small>{helper}</small>}</div>}
      <svg className="ecg-svg" viewBox={`0 0 700 ${height}`} preserveAspectRatio="none" aria-hidden="true">
        {grid.v.map((line) => <line key={`v${line.x}`} className={line.major ? 'ecg-grid major' : 'ecg-grid'} x1={line.x} x2={line.x} y1="0" y2={height} />)}
        {grid.h.map((line) => <line key={`h${line.y}`} className={line.major ? 'ecg-grid major' : 'ecg-grid'} x1="0" x2="700" y1={line.y} y2={line.y} />)}
        <Calibration y={height - 18} />
        <path className="ecg-path" d={path} />
        <text className="ecg-lead-label" x="10" y="18">{lead}</text>
        <text className="ecg-cal-label" x="66" y={height - 20}>25 mm/s • 10 mm/mV didático</text>
      </svg>
    </div>
  );
}

export function EcgTwelveLead({ pattern = 'normal', rhythm = 'sinus', rate = 75 }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => { setTick((value) => (value + 1) % 100000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const phase = (tick / 60) * 0.62;
  const grid = useMemo(() => gridLines(300, 82), []);
  return (
    <div className="ecg-12lead">
      {LEADS.map((lead) => (
        <svg key={lead} className="ecg-mini-svg" viewBox="0 0 300 82" preserveAspectRatio="none" aria-label={`Derivação ${lead}`}>
          {grid.v.map((line) => <line key={`v${lead}${line.x}`} className={line.major ? 'ecg-grid major' : 'ecg-grid'} x1={line.x} x2={line.x} y1="0" y2="82" />)}
          {grid.h.map((line) => <line key={`h${lead}${line.y}`} className={line.major ? 'ecg-grid major' : 'ecg-grid'} x1="0" x2="300" y1={line.y} y2={line.y} />)}
          <path className="ecg-path mini" d={pathForLead({ lead, pattern, rhythm, rate, phase, width: 300, height: 82, seconds: 2.8 })} />
          <text className="ecg-lead-label" x="7" y="15">{lead}</text>
        </svg>
      ))}
    </div>
  );
}
