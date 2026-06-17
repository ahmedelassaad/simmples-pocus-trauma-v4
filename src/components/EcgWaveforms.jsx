import { useEffect, useMemo, useState } from 'react';

const LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

function g(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function leadBaseModifier(lead) {
  const map = {
    I: { amp: 0.85, qrs: 1, t: 0.7 }, II: { amp: 1.1, qrs: 1, t: 0.9 }, III: { amp: 0.75, qrs: 1, t: 0.65 },
    aVR: { amp: -0.65, qrs: -0.9, t: -0.55 }, aVL: { amp: 0.55, qrs: 0.75, t: 0.5 }, aVF: { amp: 0.85, qrs: 0.95, t: 0.75 },
    V1: { amp: 0.45, qrs: 0.65, t: 0.35 }, V2: { amp: 0.68, qrs: 0.85, t: 0.58 }, V3: { amp: 0.95, qrs: 1.1, t: 0.9 },
    V4: { amp: 1.1, qrs: 1.2, t: 0.95 }, V5: { amp: 1.0, qrs: 1.05, t: 0.85 }, V6: { amp: 0.8, qrs: 0.9, t: 0.7 }
  };
  return map[lead] || map.II;
}

function patternLead(pattern, lead) {
  const base = { st: 0, tScale: 1, tInvert: false, qWave: 0, rScale: 1, qrsWidth: 1, pBlock: false, prLong: false };
  const set = (leads, changes) => leads.includes(lead) ? { ...base, ...changes } : base;
  switch (pattern) {
    case 'stemi-anterior': return set(['V2','V3','V4'], { st: 1.1, tScale: 1.35, qWave: 0.12 });
    case 'stemi-inferior': return set(['II','III','aVF'], { st: 1.0, tScale: 1.2, qWave: 0.1 });
    case 'stemi-lateral': return set(['I','aVL','V5','V6'], { st: 0.85, tScale: 1.15, qWave: 0.08 });
    case 'stemi-posterior': return set(['V1','V2','V3'], { st: -0.75, tScale: 0.9, rScale: 1.45 });
    case 'rv-infarct': return set(['III','aVF','V1'], { st: lead === 'V1' ? 0.75 : 0.95, tScale: 1.0 });
    case 'de-winter': return set(['V2','V3','V4','V5'], { st: -0.65, tScale: 2.2, rScale: 1.12 });
    case 'wellens-a': return set(['V2','V3'], { st: 0.1, tScale: 1.15, tInvert: 'biphasic' });
    case 'wellens-b': return set(['V2','V3','V4'], { st: 0, tScale: 1.8, tInvert: true });
    case 'aslanger': {
      if (lead === 'III') return { ...base, st: 0.85, tScale: 1.1 };
      if (['I','aVL','V5','V6'].includes(lead)) return { ...base, st: -0.55, tScale: 0.85 };
      if (lead === 'V1') return { ...base, st: 0.32, tScale: 0.75 };
      if (lead === 'V2') return { ...base, st: 0.05, tScale: 0.65 };
      return base;
    }
    case 'south-african-flag': {
      if (['I','aVL','V2'].includes(lead)) return { ...base, st: 0.85, tScale: 1.1 };
      if (['III','aVF'].includes(lead)) return { ...base, st: -0.55, tScale: 0.8 };
      return base;
    }
    case 'left-main-avr': {
      if (lead === 'aVR') return { ...base, st: 0.75, tScale: 0.9 };
      if (['I','II','aVL','aVF','V3','V4','V5','V6'].includes(lead)) return { ...base, st: -0.55, tScale: 0.8 };
      return base;
    }
    case 'hyperacute-t': return set(['V2','V3','V4','II','III','aVF'], { st: 0.25, tScale: 2.0 });
    case 'lbbb': return { ...base, qrsWidth: 2.1, rScale: ['V1','V2'].includes(lead) ? -1.2 : 1.3, tInvert: ['I','aVL','V5','V6'].includes(lead) };
    case 'rbbb': return { ...base, qrsWidth: 1.8, rScale: ['V1','V2'].includes(lead) ? 1.65 : 0.9, tInvert: ['V1','V2'].includes(lead) };
    case 'brugada': return set(['V1','V2'], { st: 1.1, tScale: -0.8, qrsWidth: 1.35, rScale: 1.45 });
    case 'hyperkalemia': return { ...base, tScale: 2.3, pBlock: true, qrsWidth: 1.35 };
    case 'wpw': return { ...base, prLong: false, qrsWidth: 1.35, rScale: 1.08 };
    default: return base;
  }
}

function beatWave(t, lead, pattern, rhythm) {
  const m = leadBaseModifier(lead);
  const p = patternLead(pattern, lead);
  const width = p.qrsWidth || 1;
  const prShift = p.prLong ? 0.08 : 0;
  let y = 0;
  const pAmp = p.pBlock || rhythm === 'afib' || rhythm === 'svt' || rhythm === 'vt' || rhythm === 'vf' ? 0 : 0.13 * m.amp;
  y += pAmp * g(t, 0.18 + prShift, 0.035);
  if (rhythm === 'flutter') y += 0.12 * Math.sin(2 * Math.PI * 5.2 * t) + 0.04 * Math.sin(2 * Math.PI * 10.4 * t);
  if (rhythm === 'afib') y += 0.045 * Math.sin(2 * Math.PI * (7.5 + lead.length) * t) + 0.035 * Math.sin(2 * Math.PI * 11.2 * t);
  if (rhythm === 'vt') {
    y += 1.18 * Math.sin(2 * Math.PI * t) + 0.35 * Math.sin(4 * Math.PI * t + 0.8);
    return y * 0.8;
  }
  if (rhythm === 'torsades') {
    const env = 0.45 + 0.65 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.18 * t));
    return env * (1.25 * Math.sin(2 * Math.PI * 1.1 * t) + 0.28 * Math.sin(2 * Math.PI * 2.3 * t));
  }
  if (rhythm === 'vf') {
    return 0.65 * Math.sin(2 * Math.PI * 2.2 * t + lead.length) + 0.32 * Math.sin(2 * Math.PI * 6.3 * t) + 0.16 * Math.sin(2 * Math.PI * 13.1 * t);
  }
  y += -0.20 * m.qrs * g(t, 0.39 + prShift, 0.014 * width);
  y += 1.18 * m.qrs * (p.rScale || 1) * g(t, 0.42 + prShift, 0.014 * width);
  y += -(0.28 + p.qWave) * m.qrs * g(t, 0.455 + prShift, 0.017 * width);
  const stWindow = clamp((t - (0.49 + prShift)) / 0.06, 0, 1) * clamp(((0.66 + prShift) - t) / 0.06, 0, 1);
  y += (p.st || 0) * 0.34 * stWindow;
  let tWave = 0.42 * m.t * Math.abs(p.tScale || 1) * g(t, 0.73 + prShift, 0.085);
  if (p.tInvert === true || (p.tScale || 1) < 0) tWave *= -1;
  if (p.tInvert === 'biphasic') tWave = 0.34 * m.t * g(t, 0.68 + prShift, 0.045) - 0.44 * m.t * g(t, 0.78 + prShift, 0.055);
  y += tWave;
  if (pattern === 'wpw') y += 0.18 * m.qrs * g(t, 0.365, 0.035);
  return y;
}

function rrForRhythm(rhythm, rate, beatIndex) {
  if (rhythm === 'brady') return 60 / Math.max(32, rate || 45);
  if (rhythm === 'svt') return 60 / Math.max(130, rate || 165);
  if (rhythm === 'vt' || rhythm === 'torsades') return 60 / Math.max(140, rate || 170);
  if (rhythm === 'flutter') return 60 / Math.max(130, rate || 150);
  if (rhythm === 'afib') {
    const base = 60 / Math.max(70, rate || 120);
    return base * (0.72 + ((Math.sin(beatIndex * 12.9898) + 1) / 2) * 0.65);
  }
  return 60 / Math.max(45, rate || 75);
}

function pathForLead({ lead = 'II', pattern = 'normal', rhythm = 'sinus', rate = 75, phase = 0, width = 700, height = 84, seconds = 4.8 }) {
  const points = [];
  const samples = 520;
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
    let yVal = beatWave(tInBeat, lead, pattern, rhythm);
    if (rhythm === 'brady' && beatIndex % 3 === 2 && pattern === 'mobitz2') yVal = 0.02 * Math.sin(time * 20);
    if (pattern === 'mobitz1' && beatIndex % 4 === 3) yVal = 0.1 * g(tInBeat, 0.22, 0.04);
    if (pattern === 'complete-av') yVal += 0.16 * Math.sin(2 * Math.PI * time * 1.1);
    const y = height / 2 - yVal * (height * 0.32);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

export function EcgStrip({ title, helper, pattern = 'normal', rhythm = 'sinus', rate = 75, lead = 'II', compact = false }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => { setTick((value) => (value + 1) % 100000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const phase = (tick / 60) * 0.7;
  const path = useMemo(() => pathForLead({ lead, pattern, rhythm, rate, phase, height: compact ? 70 : 92, seconds: compact ? 3.6 : 4.8 }), [lead, pattern, rhythm, rate, phase, compact]);
  return (
    <div className="ecg-card">
      {(title || helper) && <div className="ecg-head"><strong>{title || lead}</strong>{helper && <small>{helper}</small>}</div>}
      <svg className="ecg-svg" viewBox={`0 0 700 ${compact ? 70 : 92}`} preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => <line key={`v${i}`} className={i % 5 === 0 ? 'ecg-grid major' : 'ecg-grid'} x1={i * 40} x2={i * 40} y1="0" y2={compact ? 70 : 92} />)}
        {Array.from({ length: 8 }).map((_, i) => <line key={`h${i}`} className={i % 5 === 0 ? 'ecg-grid major' : 'ecg-grid'} x1="0" x2="700" y1={i * 14} y2={i * 14} />)}
        <path className="ecg-path" d={path} />
        <text className="ecg-lead-label" x="10" y="18">{lead}</text>
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
  return (
    <div className="ecg-12lead">
      {LEADS.map((lead) => (
        <svg key={lead} className="ecg-mini-svg" viewBox="0 0 280 72" preserveAspectRatio="none" aria-label={`Derivação ${lead}`}>
          {Array.from({ length: 8 }).map((_, i) => <line key={`v${i}`} className="ecg-grid" x1={i * 40} x2={i * 40} y1="0" y2="72" />)}
          {Array.from({ length: 6 }).map((_, i) => <line key={`h${i}`} className="ecg-grid" x1="0" x2="280" y1={i * 14.4} y2={i * 14.4} />)}
          <path className="ecg-path mini" d={pathForLead({ lead, pattern, rhythm, rate, phase, width: 280, height: 72, seconds: 2.8 })} />
          <text className="ecg-lead-label" x="7" y="15">{lead}</text>
        </svg>
      ))}
    </div>
  );
}
