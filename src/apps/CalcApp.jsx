import React, { useMemo, useState, useEffect } from 'react';

// Banco de Dados Fundido (Seu Calc Antigo + Backend do Sócio)
const DRUGS = [
  { id: 'noradrenalina', name: 'Noradrenalina', presentation: '4 mg/mL — amp. 4 mL', defaultAmt: 16, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 0.01, doseMax: 3.0, doseUnit: 'mcg/kg/min', visMultiplier: 100, isWeightBased: true, maxAvpConc: 0.04, pills: [{ text: "SG5% ou SF0.9%" }, { text: "Risco de Necrose Tissular", danger: true }] },
  { id: 'adrenalina', name: 'Adrenalina', presentation: '1 mg/mL — amp. 1 mL', defaultAmt: 10, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 0.01, doseMax: 1.0, doseUnit: 'mcg/kg/min', visMultiplier: 100, isWeightBased: true, maxAvpConc: 0.04, pills: [{ text: "SG5% ou SF0.9%" }, { text: "CVC Preferencial", danger: true }] },
  { id: 'vasopressina', name: 'Vasopressina', presentation: '20 UI/mL — amp. 1 mL', defaultAmt: 40, defaultVol: 100, unitAmt: 'UI', doseKind: 'uiMin', doseMin: 0.01, doseMax: 0.06, doseUnit: 'UI/min', visMultiplier: 10000, isWeightBased: false, maxAvpConc: 0, pills: [{ text: "SF0.9% Preferencial" }, { text: "CVC Obrigatório", danger: true }] },
  { id: 'dopamina', name: 'Dopamina', presentation: '5 mg/mL — amp. 10 mL', defaultAmt: 250, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 2.0, doseMax: 20.0, doseUnit: 'mcg/kg/min', visMultiplier: 1, isWeightBased: true, maxAvpConc: 3.2, pills: [{ text: "SG5% ou SF0.9%" }, { text: "Incompatível c/ Bic.", danger: true }] },
  { id: 'dobutamina', name: 'Dobutamina', presentation: '12,5 mg/mL — amp. 20 mL', defaultAmt: 250, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 2.5, doseMax: 20.0, doseUnit: 'mcg/kg/min', visMultiplier: 1, isWeightBased: true, maxAvpConc: 2.0, pills: [{ text: "SG5% ou SF0.9%" }] },
  { id: 'milrinona', name: 'Milrinona', presentation: '1 mg/mL — amp. 20 mL', defaultAmt: 20, defaultVol: 100, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 0.125, doseMax: 0.75, doseUnit: 'mcg/kg/min', visMultiplier: 10, isWeightBased: true, maxAvpConc: 999, pills: [{ text: "SG5% ou SF0.9%" }, { text: "Ajustar na Lesão Renal", danger: true }] },
  { id: 'nitroprussiato', name: 'Nitroprussiato de Sódio', presentation: '25 mg/mL — amp. 2 mL', defaultAmt: 50, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 0.3, doseMax: 10.0, doseUnit: 'mcg/kg/min', visMultiplier: 0, isWeightBased: true, maxAvpConc: 999, pills: [{ text: "Apenas SG5%" }, { text: "Fotossensível", danger: true }] },
  { id: 'nitroglicerina', name: 'Nitroglicerina (Tridil)', presentation: '5 mg/mL — amp. 5/10 mL', defaultAmt: 50, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgMin', doseMin: 5, doseMax: 200, doseUnit: 'mcg/min', visMultiplier: 0, isWeightBased: false, maxAvpConc: 999, pills: [{ text: "SG5% ou SF0.9%" }, { text: "Frasco de Vidro", danger: true }] },
  { id: 'esmolol', name: 'Esmolol', presentation: '10 mg/mL — amp. 10 mL', defaultAmt: 2500, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 50, doseMax: 300, doseUnit: 'mcg/kg/min', visMultiplier: 0, isWeightBased: true, maxAvpConc: 10.0, pills: [{ text: "SG5% ou SF0.9%" }] },
  { id: 'azul_metileno', name: 'Azul de Metileno', presentation: '10 mg/mL — amp. 10 mL', defaultAmt: 100, defaultVol: 500, unitAmt: 'mg', doseKind: 'mgKgH', doseMin: 0.25, doseMax: 2.0, doseUnit: 'mg/kg/h', visMultiplier: 0, isWeightBased: true, maxAvpConc: 999, pills: [{ text: "SG5% Exclusivo" }, { text: "Risco Serotoninérgico", danger: true }] }
];

function toNumber(value) {
  const number = parseFloat(String(value).replace(',', '.'));
  return number > 0 ? number : 0;
}

export default function SimmDvaApp() {
  const [activeTab, setActiveTab] = useState('calc');
  const [access, setAccess] = useState('CVC');
  const [drugId, setDrugId] = useState('noradrenalina');
  
  // Variáveis Fixas
  const [weight, setWeight] = useState('70');
  const [amt, setAmt] = useState('');
  const [vol, setVol] = useState('');
  
  // Variáveis Bidirecionais
  const [targetDose, setTargetDose] = useState('');
  const [flow, setFlow] = useState('');
  
  const [visValues, setVisValues] = useState({ dopamina: '', dobutamina: '', adrenalina: '', noradrenalina: '', milrinona: '', vasopressina: '' });

  const drug = useMemo(() => DRUGS.find((item) => item.id === drugId) || DRUGS[0], [drugId]);

  // Carrega diluição padrão ao mudar de droga
  useEffect(() => {
    setAmt(String(drug.defaultAmt));
    setVol(String(drug.defaultVol));
    setTargetDose('');
    setFlow('');
  }, [drug]);

  const weightNum = toNumber(weight);
  const amtNum = toNumber(amt);
  const volNum = toNumber(vol);
  const targetDoseNum = toNumber(targetDose);
  const flowNum = toNumber(flow);

  // Motor Matemático Core
  const workConc = useMemo(() => {
    if (volNum <= 0 || amtNum <= 0) return 0;
    const baseConc = amtNum / volNum; // mg/mL ou UI/mL
    if (drug.unitAmt === 'UI' || drug.doseKind === 'mgKgH') return baseConc;
    return baseConc * 1000; // mcg/mL
  }, [amtNum, volNum, drug]);

  // 1. O que corre na bomba (Cálculo Reverso)
  const currentDose = useMemo(() => {
    if (workConc === 0 || flowNum === 0) return null;
    if (drug.doseKind === 'mgKgH') return weightNum ? (flowNum * workConc) / weightNum : null;
    if (drug.isWeightBased) return weightNum ? (flowNum * workConc) / (weightNum * 60) : null;
    return (flowNum * workConc) / 60; // mcg/min ou UI/min
  }, [workConc, flowNum, weightNum, drug]);

  // 2. Qual vazão colocar (Cálculo Alvo)
  const targetFlow = useMemo(() => {
    if (workConc === 0 || targetDoseNum === 0) return null;
    if (drug.doseKind === 'mgKgH') return weightNum ? (targetDoseNum * weightNum) / workConc : null;
    if (drug.isWeightBased) return weightNum ? (targetDoseNum * weightNum * 60) / workConc : null;
    return (targetDoseNum * 60) / workConc;
  }, [workConc, targetDoseNum, weightNum, drug]);

  // Semáforo e Alertas Clínicos
  let doseColor = "var(--text-secondary)";
  let dosePercent = 0;
  let statusText = "Aguardando Dose";
  let alertWarning = null;

  // Analisa a dose que está digitada (ou a atual ou a alvo) para dar feedback visual
  const analyzedDose = targetDoseNum > 0 ? targetDoseNum : (currentDose || 0);

  if (analyzedDose > 0) {
    dosePercent = (analyzedDose / drug.doseMax) * 100;
    if (dosePercent > 100) dosePercent = 100;
    
    if (analyzedDose < drug.doseMin) { doseColor = "var(--accent-yellow)"; statusText = "Subdose Protocolar"; }
    else if (analyzedDose <= drug.doseMax) { doseColor = "var(--accent-green)"; statusText = "Faixa Segura"; }
    else { doseColor = "var(--accent-red)"; statusText = "Dose Acima do Teto"; alertWarning = "Dose Teto Ultrapassada."; }
  }

  // Alerta de Acesso Periférico (Concentração Base = amt/vol)
  if (access === 'AVP' && volNum > 0) {
    const baseConc = amtNum / volNum;
    if (drug.maxAvpConc === 0) { alertWarning = "Contraindicado em Acesso Periférico"; doseColor = "var(--accent-red)"; }
    else if (baseConc > drug.maxAvpConc && drug.maxAvpConc !== 999) { alertWarning = `Alta Conc. Periférica (Max: ${drug.maxAvpConc})`; }
  }

  // Escore VIS (Cálculo Dinâmico c/ Failsafe)
  const totalVis = useMemo(() => {
    const dopa = toNumber(visValues.dopamina); const dobuta = toNumber(visValues.dobutamina);
    const epi = toNumber(visValues.adrenalina); const norepi = toNumber(visValues.noradrenalina);
    const milrinone = toNumber(visValues.milrinona);
    
    const vasoUImin = toNumber(visValues.vasopressina);
    const vasoKGmin = weightNum ? (vasoUImin / weightNum) : 0; // Transforma UI/min em UI/kg/min

    return dopa + dobuta + (100 * epi) + (100 * norepi) + (10 * milrinone) + (10000 * vasoKGmin);
  }, [visValues, weightNum]);

  const copyPrescription = () => {
    const report = `RELATÓRIO CLÍNICO - DVA\nDroga: ${drug.name}\nPeso: ${weight || '--'} kg\nAcesso: ${access === 'CVC' ? 'Venoso Central' : 'Venoso Periférico'}\nDiluição: ${amt} ${drug.unitAmt} em ${vol} mL\n\nVazão na Bomba: ${flow || (targetFlow ? targetFlow.toFixed(1) : '--')} mL/h\nDose Resultante: ${currentDose ? currentDose.toFixed(3) : (targetDose || '--')} ${drug.doseUnit}\n\n[SIMMples DVA]`;
    navigator.clipboard.writeText(report);
    alert("Prescrição copiada.");
  };

  return (
    <>
      <style>{`
        :root { --bg-base: #020A1A; --brand-cyan: #00C9E8; --card-border: rgba(0, 201, 232, 0.2); --text-primary: #ffffff; --text-secondary: #8e9bb0; --accent-red: #ff453a; --accent-orange: #ff9f0a; --accent-yellow: #ffd60a; --accent-green: #30d158; --accent-purple: #bf5af2; --nav-bg: rgba(2, 10, 26, 0.95); }
        .simm-app { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; background-color: var(--bg-base); color: var(--text-primary); min-height: 100vh; padding: 20px 15px 120px 15px; max-width: 480px; margin: 0 auto; box-sizing: border-box; }
        .simm-app * { box-sizing: border-box; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 10px 0; border-bottom: 1px solid rgba(0, 201, 232, 0.1); }
        .brand-cluster { display: flex; align-items: center; gap: 12px; }
        .app-logo { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--brand-cyan); }
        .app-title { font-size: 18px; font-weight: 600; color: var(--brand-cyan); }
        
        .vis-badge { background: rgba(191, 90, 242, 0.15); border: 1px solid rgba(191, 90, 242, 0.3); color: var(--accent-purple); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        
        .toggle-container { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 4px; display: flex; position: relative; margin-bottom: 16px; border: 1px solid var(--card-border); }
        .toggle-btn { flex: 1; text-align: center; padding: 10px 0; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; cursor: pointer; transition: 0.3s; z-index: 2; }
        .toggle-btn.active { color: var(--brand-cyan); }
        .toggle-slider { position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px); background: rgba(0, 201, 232, 0.15); border: 1px solid var(--brand-cyan); border-radius: 8px; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 1; }
        
        .section-title { font-size: 11px; font-weight: 700; color: var(--brand-cyan); text-transform: uppercase; margin: 24px 0 12px 0; letter-spacing: 1px; border-bottom: 1px solid rgba(0,201,232,0.1); padding-bottom: 6px; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .input-group { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--card-border); border-radius: 8px; padding: 12px; margin-bottom: 12px; transition: 0.3s; }
        .input-group:focus-within { border-color: var(--brand-cyan); background: rgba(0, 201, 232, 0.05); }
        .input-group.disabled { opacity: 0.4; pointer-events: none; }
        .input-label { font-size: 9px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px; display: block; font-weight: 600; }
        .input-wrapper { display: flex; align-items: baseline; }
        .simm-app select, .simm-app input { width: 100%; background: transparent; border: none; color: var(--text-primary); font-size: 16px; font-weight: 700; outline: none; appearance: none; }
        .simm-app select option { background: var(--bg-base); color: var(--text-primary); }
        .unit { font-size: 11px; font-weight: 500; color: var(--text-secondary); margin-left: 6px; }
        
        .info-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .pill { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 6px 12px; font-size: 10px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .pill.danger { border-color: rgba(255, 69, 58, 0.4); color: var(--accent-red); background: rgba(255, 69, 58, 0.05); }

        .result-zone { background: rgba(0, 201, 232, 0.02); border: 1px solid var(--card-border); border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0; }
        .result-value { font-size: 32px; font-weight: 800; color: var(--brand-cyan); line-height: 1; margin-bottom: 8px; }
        .result-unit-text { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        
        .status-bar-container { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 12px 0 8px 0; overflow: hidden; }
        .status-bar-fill { height: 100%; transition: width 0.5s ease, background-color 0.5s ease; border-radius: 2px; }

        .alert-box { display: flex; align-items: center; gap: 10px; background: rgba(255, 69, 58, 0.1); border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 11px; font-weight: 600; color: var(--accent-red); text-transform: uppercase; }

        .btn-primary { width: 100%; background: var(--brand-cyan); color: #000; border: none; border-radius: 8px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 10px; transition: 0.2s; }
        
        .bottom-nav { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: center; background: var(--nav-bg); border-top: 1px solid rgba(0, 201, 232, 0.2); padding-bottom: env(safe-area-inset-bottom); z-index: 100; }
        .nav-container { display: flex; width: 100%; max-width: 480px; }
        .nav-item { flex: 1; padding: 14px 0; display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-secondary); cursor: pointer; transition: 0.3s; }
        .nav-item.active { color: var(--brand-cyan); }
        .nav-item svg { width: 20px; height: 20px; stroke-width: 2; }
        .nav-label { font-size: 10px; font-weight: 600; text-transform: uppercase; }
      `}</style>

      <div className="simm-app">
        <div className="top-bar">
          <div className="brand-cluster">
            <img src="./Logo_1.121-ezgif.com-resize.png" alt="SIMM" className="app-logo" />
            <div className="app-title">SIMMples DVA</div>
          </div>
          {totalVis > 0 && (
            <div className="vis-badge" style={{ color: totalVis > 15 ? 'var(--accent-red)' : 'var(--accent-purple)', borderColor: totalVis > 15 ? 'rgba(255,69,58,0.4)' : 'rgba(191,90,242,0.3)' }}>
              VIS: {totalVis.toFixed(1)}
            </div>
          )}
        </div>

        <div className="toggle-container">
          <div className={`toggle-btn ${access === 'CVC' ? 'active' : ''}`} onClick={() => setAccess('CVC')}>Acesso Central</div>
          <div className={`toggle-btn ${access === 'AVP' ? 'active' : ''}`} onClick={() => setAccess('AVP')}>Acesso Periférico</div>
          <div className="toggle-slider" style={{ transform: access === 'CVC' ? 'translateX(0)' : 'translateX(100%)' }}></div>
        </div>

        <div className="input-group">
          <span className="input-label">Droga Vasoativa</span>
          <select value={drugId} onChange={(e) => setDrugId(e.target.value)}>
            {DRUGS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="info-pills">
          {drug.pills.map((p, i) => (
            <div key={i} className={`pill ${p.danger ? 'danger'
