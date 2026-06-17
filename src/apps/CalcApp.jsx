import React, { useMemo, useState, useEffect, useRef } from 'react';

// Banco de Dados unificado e revisado
const DRUGS = [
  { id: 'noradrenalina', name: 'Noradrenalina', presentation: '4 mg/mL — ampola 4 mL', defaultAmt: 16, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 0.01, doseMax: 3.0, doseUnit: 'mcg/kg/min', visMultiplier: 100, isWeightBased: true, maxAvpConc: 0.04, chartSteps: [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 3.0], pills: [{ text: "SG5% ou SF0.9%" }, { text: "Risco de Necrose Tissular", danger: true }], note: 'Nesta diluição, cada 1 mL/h corresponds a 1 mcg/min. Dose em mcg/kg/min = vazão ÷ peso.' },
  { id: 'adrenalina', name: 'Adrenalina', presentation: '1 mg/mL — ampola 1 mL', defaultAmt: 10, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 0.01, doseMax: 1.0, doseUnit: 'mcg/kg/min', visMultiplier: 100, isWeightBased: true, maxAvpConc: 0.04, chartSteps: [0.01, 0.05, 0.1, 0.2, 0.5, 1.0], pills: [{ text: "SG5% ou SF0.9%" }, { text: "CVC Preferencial", danger: true }], note: 'Nesta diluição, cada 1 mL/h corresponde a 1 mcg/min.' },
  { id: 'vasopressina', name: 'Vasopressina', presentation: '20 UI/mL — ampola 1 mL', defaultAmt: 40, defaultVol: 100, unitAmt: 'UI', doseKind: 'uiMin', doseMin: 0.01, doseMax: 0.06, doseUnit: 'UI/min', visMultiplier: 10000, isWeightBased: false, maxAvpConc: 0, chartSteps: [0.01, 0.02, 0.03, 0.04, 0.06], pills: [{ text: "SF0.9% Preferencial" }, { text: "CVC Obrigatório", danger: true }], note: 'Dose usual informada: 0,01 a 0,04 UI/min, equivalente a aproximadamente 3 a 12 mL/h nesta diluição.' },
  { id: 'dopamina', name: 'Dopamina', presentation: '5 mg/mL — ampola 10 mL', defaultAmt: 250, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 2.0, doseMax: 20.0, doseUnit: 'mcg/kg/min', visMultiplier: 1, isWeightBased: true, maxAvpConc: 3.2, chartSteps: [2.0, 5.0, 10.0, 15.0, 20.0], pills: [{ text: "SG5% ou SF0.9%" }, { text: "Incompatível c/ Bicarbonato", danger: true }], note: 'Dose usual informada: 5 a 20 mcg/kg/min.' },
  { id: 'dobutamina', name: 'Dobutamina', presentation: '12,5 mg/mL — ampola 20 mL', defaultAmt: 250, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 2.5, doseMax: 20.0, doseUnit: 'mcg/kg/min', visMultiplier: 1, isWeightBased: true, maxAvpConc: 2.0, chartSteps: [2.5, 5.0, 10.0, 15.0, 20.0], pills: [{ text: "SG5% ou SF0.9%" }], note: 'Dose usual informada: 2,5 a 20 mcg/kg/min.' },
  { id: 'milrinona', name: 'Milrinona', presentation: '1 mg/mL — ampola 20 mL', defaultAmt: 20, defaultVol: 100, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 0.125, doseMax: 0.75, doseUnit: 'mcg/kg/min', visMultiplier: 10, isWeightBased: true, maxAvpConc: 999, chartSteps: [0.125, 0.25, 0.375, 0.5, 0.75], pills: [{ text: "SG5% ou SF0.9%" }, { text: "Ajustar na Lesão Renal", danger: true }], note: 'Dose usual informada: 0,375 a 0,75 mcg/kg/min.' },
  { id: 'nitroprussiato', name: 'Nitroprussiato de sódio', presentation: '25 mg/mL — ampola 2 mL', defaultAmt: 50, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 0.3, doseMax: 10.0, doseUnit: 'mcg/kg/min', visMultiplier: 0, isWeightBased: true, maxAvpConc: 999, chartSteps: [0.3, 0.5, 1.0, 3.0, 5.0, 10.0], pills: [{ text: "Apenas SG5%" }, { text: "Fotossensível", danger: true }], note: 'Dose usual informada: 0,3 a 10 mcg/kg/min.' },
  { id: 'nitroglicerina', name: 'Nitroglicerina', presentation: '5 mg/mL — ampola 5/10 mL', defaultAmt: 50, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgMin', doseMin: 5, doseMax: 200, doseUnit: 'mcg/min', visMultiplier: 0, isWeightBased: false, maxAvpConc: 999, chartSteps: [5, 10, 20, 50, 100, 200], pills: [{ text: "SG5% ou SF0.9%" }, { text: "Frasco de Vidro", danger: true }], note: 'Dose usual informada: 5 a 200 mcg/min.' },
  { id: 'esmolol', name: 'Esmolol', presentation: '10 mg/mL — ampola 10 mL', defaultAmt: 2500, defaultVol: 250, unitAmt: 'mg', doseKind: 'mcgKgMin', doseMin: 50, doseMax: 300, doseUnit: 'mcg/kg/min', visMultiplier: 0, isWeightBased: true, maxAvpConc: 10.0, chartSteps: [50, 100, 150, 200, 300], pills: [{ text: "SG5% ou SF0.9%" }], note: 'Dose usual informada: 50 a 300 mcg/kg/min.' },
  { id: 'azul_metileno', name: 'Azul de Metileno', presentation: '10 mg/mL — ampola 10 mL', defaultAmt: 100, defaultVol: 500, unitAmt: 'mg', doseKind: 'mgKgH', doseMin: 0.25, doseMax: 2.0, doseUnit: 'mg/kg/h', visMultiplier: 0, isWeightBased: true, maxAvpConc: 999, chartSteps: [0.25, 0.5, 1.0, 1.5, 2.0], bolus: { min: 1.5, max: 2, unit: 'mg/kg', minutes: 10 }, pills: [{ text: "SG5 Exclusivo" }, { text: "Risco Serotoninérgico", danger: true }], note: 'Dose usual informada: bolus 1,5 a 2 mg/kg em 10 min; contínuo 0,5 a 4 mg/kg/h.' }
];

function toNumber(value) {
  if (!value) return 0;
  const number = parseFloat(String(value).replace(',', '.'));
  return isNaN(number) ? 0 : number;
}

const formatDecimal = (val) => {
  if (!val) return '';
  let cleaned = val.replace(/\./g, ',');
  cleaned = cleaned.replace(/[^0-9,]/g, '');
  const parts = cleaned.split(',');
  if (parts.length > 2) {
    cleaned = parts[0] + ',' + parts.slice(1).join('');
  }
  return cleaned;
};

export function CalcApp() {
  const [activeTab, setActiveTab] = useState('calc');
  const [access, setAccess] = useState('CVC');
  const [drugId, setDrugId] = useState('noradrenalina');
  
  // Valores iniciais preenchidos para evitar tela vazia no primeiro carregamento
  const [weight, setWeight] = useState('70');
  const [amt, setAmt] = useState('16');
  const [vol, setVol] = useState('250');
  const [targetDose, setTargetDose] = useState('0,01');
  const [flow, setFlow] = useState('');
  
  const [visValues, setVisValues] = useState({ dopamina: '', dobutamina: '', adrenalina: '', noradrenalina: '', milrinona: '', vasopressina: '' });

  const weightRef = useRef(null);
  const targetDoseRef = useRef(null);
  const flowRef = useRef(null);

  const drug = useMemo(() => DRUGS.find((item) => item.id === drugId) || DRUGS[0], [drugId]);

  // ENGINE DE PREENCHIMENTO AUTOMÁTICO - Roda ao trocar o medicamento
  useEffect(() => {
    setAmt(formatDecimal(String(drug.defaultAmt)));
    setVol(formatDecimal(String(drug.defaultVol)));
    setTargetDose(formatDecimal(String(drug.doseMin))); // Preenche automaticamente com a dose de segurança inicial
    setFlow('');
  }, [drug]);

  const weightNum = toNumber(weight);
  const amtNum = toNumber(amt);
  const volNum = toNumber(vol);
  const targetDoseNum = toNumber(targetDose);
  const flowNum = toNumber(flow);

  const doseDigits = useMemo(() => {
    if (drug.doseKind === 'uiMin') return 3;
    if (drug.doseKind === 'mcgKgMin' && drug.doseMax <= 3) return 3;
    return 2;
  }, [drug]);

  const workConc = useMemo(() => {
    if (volNum <= 0 || amtNum <= 0) return 0;
    const baseConc = amtNum / volNum; 
    if (drug.unitAmt === 'UI' || drug.doseKind === 'mgKgH') return baseConc;
    return baseConc * 1000; 
  }, [amtNum, volNum, drug]);

  // Cálculo Reverso (Bomba -> Dose)
  const currentDose = useMemo(() => {
    if (workConc === 0 || flowNum === 0) return null;
    if (drug.doseKind === 'mgKgH') return weightNum ? (flowNum * workConc) / weightNum : null;
    if (drug.isWeightBased) return weightNum ? (flowNum * workConc) / (weightNum * 60) : null;
    return (flowNum * workConc) / 60; 
  }, [workConc, flowNum, weightNum, drug]);

  // Cálculo de Alvo (Dose -> Bomba)
  const targetFlow = useMemo(() => {
    if (workConc === 0 || targetDoseNum === 0) return null;
    if (drug.doseKind === 'mgKgH') return workConc > 0 ? (targetDoseNum * weightNum) / workConc : null;
    if (drug.isWeightBased) return workConc > 0 ? (targetDoseNum * weightNum * 60) / workConc : null;
    return (targetDoseNum * 60) / workConc;
  }, [workConc, targetDoseNum, weightNum, drug]);

  const calculatedBolus = useMemo(() => {
    if (!drug.bolus || weightNum <= 0 || workConc === 0) return null;
    const baseConcMgMl = amtNum / volNum;
    const minMg = drug.bolus.min * weightNum;
    const maxMg = drug.bolus.max * weightNum;
    const minMl = minMg / baseConcMgMl;
    const maxMl = maxMg / baseConcMgMl;
    return { minMg, maxMg, minMl, maxMl, minutes: drug.bolus.minutes };
  }, [drug, weightNum, amtNum, volNum, workConc]);

  const titrationRows = useMemo(() => {
    if (workConc === 0) return [];
    return drug.chartSteps.map((step) => {
      let requiredRate = 0;
      if (drug.doseKind === 'mgKgH') requiredRate = workConc > 0 ? (step * weightNum) / workConc : 0;
      else if (drug.isWeightBased) requiredRate = weightNum ? (step * weightNum * 60) / workConc : 0;
      else requiredRate = (step * 60) / workConc;
      return { dose: step, flow: requiredRate };
    });
  }, [drug, weightNum, workConc]);

  let doseColor = "var(--brand-cyan)";
  let dosePercent = 0;
  let statusText = "Faixa de Segurança Ativa";
  let alertWarning = null;
  let isDangerZone = false;

  const analyzedDose = targetDoseNum > 0 ? targetDoseNum : (currentDose || 0);

  if (analyzedDose > 0) {
    dosePercent = (analyzedDose / drug.doseMax) * 100;
    if (dosePercent > 100) dosePercent = 100;
    
    if (analyzedDose < drug.doseMin) { doseColor = "var(--accent-yellow)"; statusText = "Subdose Protocolar"; }
    else if (analyzedDose <= drug.doseMax) { doseColor = "var(--accent-green)"; statusText = "Dose Segura e Otimizada"; }
    else { doseColor = "var(--accent-red)"; statusText = "Alvo Acima do Teto Limite"; alertWarning = "Dose Limite do Protocolo Ultrapassada."; isDangerZone = true; }
  }

  if (access === 'AVP' && volNum > 0) {
    const baseConc = amtNum / volNum;
    if (drug.maxAvpConc === 0) { alertWarning = "Concentração Contraindicada em Via Periférica"; doseColor = "var(--accent-red)"; isDangerZone = true; }
    else if (baseConc > drug.maxAvpConc && drug.maxAvpConc !== 999) { alertWarning = `Concentração Periférica Elevada (Máx Seguro: ${drug.maxAvpConc} mg/mL)`; doseColor = "var(--accent-orange)"; }
  }

  const totalVis = useMemo(() => {
    const dopa = toNumber(visValues.dopamina); const dobuta = toNumber(visValues.dobutamina);
    const epi = toNumber(visValues.adrenalina); const norepi = toNumber(visValues.noradrenalina);
    const milrinone = toNumber(visValues.milrinona);
    const vasoUImin = toNumber(visValues.vasopressina);
    const vasoKGmin = weightNum ? (vasoUImin / weightNum) : 0;
    return dopa + dobuta + (100 * epi) + (100 * norepi) + (10 * milrinone) + (10000 * vasoKGmin);
  }, [visValues, weightNum]);

  const formatReportNumber = (num, digits = 1) => {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return String(num.toFixed(digits)).replace('.', ',');
  };

  const copyPrescription = () => {
    const report = `RELATÓRIO CLÍNICO - INFUSÕES CRÍTICAS\n\nDroga Utilizada: ${drug.name}\nPeso Operacional: ${weight || '--'} kg\nAcesso Disponível: ${access === 'CVC' ? 'Via Central' : 'Via Periférica'}\nMontagem da Solução: ${amt} ${drug.unitAmt} em ${vol} mL\n\nParâmetros Ajustados:\n• Vazão da Bomba: ${flow || (targetFlow ? formatReportNumber(targetFlow) : '--')} mL/h\n• Entrega de Dose: ${currentDose ? formatReportNumber(currentDose, doseDigits) : (targetDose || '--')} ${drug.doseUnit}\n\n[SIMMples DVA - Dashboard de Elite]`;
    navigator.clipboard.writeText(report);
    alert("Prescrição copiada com sucesso.");
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter' && nextRef?.current) {
      e.preventDefault();
      nextRef.current.focus();
    }
  };

  return (
    <>
      <style>{`
        :root { --bg-base: #020A1A; --brand-cyan: #00C9E8; --card-glass: rgba(8, 24, 60, 0.65); --card-border: rgba(0, 201, 232, 0.18); --text-primary: #ffffff; --text-secondary: #8e9bb0; --accent-red: #ff453a; --accent-orange: #ff9f0a; --accent-yellow: #ffd60a; --accent-green: #30d158; --accent-purple: #bf5af2; --nav-bg: rgba(2, 10, 26, 0.95); }
        .simm-wrapper { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; background-color: var(--bg-base); background-image: radial-gradient(circle at 50% -20%, rgba(0, 201, 232, 0.12), transparent 60%); color: var(--text-primary); min-height: 100vh; padding: 15px 15px 120px 15px; -webkit-font-smoothing: antialiased; }
        .simm-wrapper * { box-sizing: border-box; margin: 0; padding: 0; }
        .glass-shell { width: 100%; max-width: 460px; margin: 0 auto; background: var(--card-glass); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border: 1px solid var(--card-border); border-radius: 28px; padding: 24px 20px; box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5); }
        
        .top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .brand-block { display: flex; align-items: center; gap: 10px; }
        .app-title { font-size: 19px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }
        .app-title span { color: var(--brand-cyan); }
        
        .floating-vis { background: rgba(191, 90, 242, 0.12); border: 1px solid rgba(191, 90, 242, 0.3); color: var(--accent-purple); padding: 5px 10px; border-radius: 30px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; transition: 0.3s; }
        
        .nav-toggle-container { background: rgba(0, 0, 0, 0.3); border-radius: 16px; padding: 3px; display: flex; position: relative; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .toggle-btn { flex: 1; text-align: center; padding: 10px 0; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; cursor: pointer; z-index: 2; transition: color 0.3s; letter-spacing: 0.5px; }
        .toggle-btn.active { color: var(--brand-cyan); }
        .toggle-slider { position: absolute; top: 3px; bottom: 3px; width: calc(50% - 3px); background: rgba(0, 201, 232, 0.12); border: 1px solid var(--brand-cyan); border-radius: 12px; transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1); z-index: 1; }
        
        .section-title { font-size: 10px; font-weight: 800; color: var(--brand-cyan); text-transform: uppercase; margin: 20px 0 12px 0; letter-spacing: 1.2px; border-bottom: 1px solid rgba(0,201,232,0.08); padding-bottom: 4px; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .input-box { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; transition: 0.3s; }
        .input-box:focus-within { border-color: var(--brand-cyan); background: rgba(0, 201, 232, 0.04); box-shadow: 0 0 15px rgba(0, 201, 232, 0.05); }
        .input-box.disabled { opacity: 0.25; pointer-events: none; }
        .input-label { font-size: 9px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 5px; display: block; font-weight: 700; letter-spacing: 0.3px; }
        .input-wrapper { display: flex; align-items: baseline; }
        .simm-wrapper select, .simm-wrapper input[type="text"] { width: 100%; background: transparent; border: none; color: var(--text-primary); font-size: 17px; font-weight: 700; outline: none; appearance: none; }
        .simm-wrapper select option { background: #020A1A; color: #fff; }
        .unit-tag { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-left: 4px; }
        
        .info-pills { display: flex; flex-wrap: wrap; gap: 6px; margin: -4px 0 16px 0; }
        .pill { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 5px 10px; font-size: 9px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.3px; }
        .pill.danger { border-color: rgba(255, 69, 58, 0.3); color: var(--accent-red); background: rgba(255, 69, 58, 0.03); }

        .glow-result-zone { background: radial-gradient(circle at top, rgba(0, 201, 232, 0.08) 0%, transparent 80%); border: 1px solid var(--card-border); border-radius: 20px; padding: 24px 16px; text-align: center; margin: 16px 0; transition: 0.4s; }
        .glow-result-zone.danger-alert { background: radial-gradient(circle at top, rgba(255, 69, 58, 0.12) 0%, transparent 80%); border-color: rgba(255, 69, 58, 0.3); }
        .glow-result-zone.warning-alert { background: radial-gradient(circle at top, rgba(255, 159, 10, 0.12) 0%, transparent 80%); border-color: rgba(255, 159, 10, 0.3); }
        
        .display-value { font-size: 42px; font-weight: 800; color: var(--brand-cyan); letter-spacing: -1px; line-height: 1; margin-bottom: 6px; font-variant-numeric: tabular-nums; }
        .glow-result-zone.danger-alert .display-value { color: var(--accent-red); }
        .glow-result-zone.warning-alert .display-value { color: var(--accent-orange); }
        .display-unit { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
        
        .premium-progress-track { width: 100%; height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; margin: 14px 0 8px 0; overflow: hidden; }
        .premium-progress-fill { height: 100%; width: 0%; transition: width 0.6s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.4s; border-radius: 3px; }

        .clinical-guardrail-alert { display: flex; align-items: center; gap: 8px; background: rgba(255, 69, 58, 0.08); border-radius: 10px; padding: 10px 14px; margin-top: 14px; font-size: 11px; font-weight: 700; color: var(--accent-red); text-transform: uppercase; border-left: 3px solid var(--accent-red); text-align: left; }
        .clinical-guardrail-alert.warning-mode { color: var(--accent-orange); border-left-color: var(--accent-orange); background: rgba(255, 159, 10, 0.08); }

        .btn-action-prime { width: 100%; background: var(--brand-cyan); color: #020A1A; border: none; border-radius: 14px; padding: 15px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); margin-top: 8px; box-shadow: 0 4px 15px rgba(0, 201, 232, 0.15); }
        .btn-action-prime:active { transform: scale(0.98); }

        .premium-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .premium-table th { font-weight: 800; color: var(--brand-cyan); text-align: left; padding: 10px; border-bottom: 1px solid rgba(0, 201, 232, 0.15); text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
        .premium-table td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-primary); font-size: 13px; font-variant-numeric: tabular-nums; }

        .bottom-suite-nav { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: center; background: var(--nav-bg); border-top: 1px solid rgba(0, 201, 232, 0.15); padding-bottom: env(safe-area-inset-bottom); z-index: 100; backdrop-filter: blur(10px); }
        .nav-shell { display: flex; width: 100%; max-width: 460px; }
        .nav-tab-item { flex: 1; padding: 14px 0; display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-secondary); cursor: pointer; transition: 0.3s; }
        .nav-tab-item.active { color: var(--brand-cyan); }
        .nav-tab-item svg { width: 18px; height: 18px; stroke-width: 2.5; }
        .nav-tab-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
        
        .fade-engine { animation: simmFade 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }
        @keyframes simmFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="simm-wrapper">
        <div className="glass-shell">
          
          <div className="top-header">
            <div className="brand-block">
              <div className="app-title">SIMMples<span>.calc</span></div>
            </div>
            {totalVis > 0 && (
              <div className="floating-vis" style={{ color: totalVis > 15 ? 'var(--accent-red)' : 'var(--accent-purple)', borderColor: totalVis > 15 ? 'rgba(255,69,58,0.4)' : 'rgba(191,90,242,0.3)' }}>
                VIS Load: {formatReportNumber(totalVis)}
              </div>
            )}
          </div>

          <div className="nav-toggle-container">
            <div className={`toggle-btn ${activeTab === 'calc' ? 'active' : ''}`} onClick={() => setActiveTab('calc')}>Infusão</div>
            <div className={`toggle-btn ${activeTab === 'titulacao' ? 'active' : ''}`} onClick={() => setActiveTab('titulacao')}>Titulação</div>
            <div className="toggle-slider" style={{ transform: activeTab === 'calc' ? 'translateX(0)' : (activeTab === 'titulacao' ? 'translateX(100%)' : 'translateX(200%)'), width: '33.33%' }}></div>
            <div className={`toggle-btn ${activeTab === 'vis' ? 'active' : ''}`} onClick={() => setActiveTab('vis')}>Score VIS</div>
          </div>

          {/* ABA 1: CALCULADORA DE INFUSÃO */}
          {activeTab === 'calc' && (
            <div className="fade-engine">
              <div className="section-title">1. Seleção e Via de Acesso</div>
              <div className="input-box">
                <span className="input-label">Droga Ativa</span>
                <select value={drugId} onChange={(e) => setDrugId(e.target.value)}>
                  {DRUGS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="nav-toggle-container">
                <div className={`toggle-btn ${access === 'CVC' ? 'active' : ''}`} onClick={() => setAccess('CVC')}>Acesso Central</div>
                <div className={`toggle-btn ${access === 'AVP' ? 'active' : ''}`} onClick={() => setAccess('AVP')}>Acesso Periférico</div>
                <div className="toggle-slider" style={{ transform: access === 'CVC' ? 'translateX(0)' : 'translateX(100%)' }}></div>
              </div>

              <div className="info-pills">
                {drug.pills.map((p, i) => (
                  <div key={i} className={`pill ${p.danger ? 'danger' : ''}`}>{p.text}</div>
                ))}
              </div>

              <div className="grid-2">
                <div className={`input-box ${!drug.isWeightBased ? 'disabled' : ''}`}>
                  <span className="input-label">Peso Corporal</span>
                  <div className="input-wrapper">
                    <input ref={weightRef} type="text" inputMode="decimal" value={weight} onChange={e => setWeight(formatDecimal(e.target.value))} onKeyDown={(e) => handleKeyDown(e, targetDoseRef)} />
                    <span className="unit-tag">kg</span>
                  </div>
                </div>
              </div>

              <div className="section-title">2. Diluição Mecânica</div>
              <div className="grid-2">
                <div className="input-box">
                  <span className="input-label">Massa ({drug.unitAmt})</span>
                  <div className="input-wrapper">
                    <input type="text" inputMode="decimal" value={amt} onChange={e => setAmt(formatDecimal(e.target.value))} />
                    <span className="unit-tag">{drug.unitAmt}</span>
                  </div>
                </div>
                <div className="input-box">
                  <span className="input-label">Volume Total</span>
                  <div className="input-wrapper">
                    <input type="text" inputMode="decimal" value={vol} onChange={e => setVol(formatDecimal(e.target.value))} />
                    <span className="unit-tag">mL</span>
                  </div>
                </div>
              </div>

              <div className="section-title">3. Modulação Bidirecional</div>
              <div className="grid-2">
                <div className="input-box">
                  <span className="input-label">Dose Alvo</span>
                  <div className="input-wrapper">
                    <input ref={targetDoseRef} type="text" inputMode="decimal" value={targetDose} onChange={e => { setTargetDose(formatDecimal(e.target.value)); setFlow(''); }} onKeyDown={(e) => handleKeyDown(e, flowRef)} placeholder={formatReportNumber(drug.doseMin)} />
                  </div>
                  <span className="unit-tag" style={{ marginLeft: 0, marginTop: '2px', display: 'block', fontSize: '10px' }}>{drug.doseUnit}</span>
                </div>
                <div className="input-box">
                  <span className="input-label">Vazão Corrente</span>
                  <div className="input-wrapper">
                    <input ref={flowRef} type="text" inputMode="decimal" value={flow} onChange={e => { setFlow(formatDecimal(e.target.value)); setTargetDose(''); }} placeholder="mL/h" />
                    <span className="unit-tag">mL/h</span>
                  </div>
                </div>
              </div>

              <div className={`glow-result-zone ${isDangerZone ? 'danger-alert' : (alertWarning ? 'warning-alert' : '')}`}>
                <div className="display-unit">Visor de Entrega Final</div>
                {targetDoseNum > 0 ? (
                   <div className="display-value">{targetFlow !== null ? formatReportNumber(targetFlow) : '--'}<span style={{fontSize: '16px', fontWeight: '500', marginLeft: '4px'}}>mL/h</span></div>
                ) : (
                   <div className="display-value">{currentDose !== null ? formatReportNumber(currentDose, doseDigits) : '--'}<span style={{fontSize: '14px', fontWeight: '500', marginLeft: '4px'}}>{drug.doseUnit}</span></div>
                )}
                
                <div className="premium-progress-track">
                  <div className="premium-progress-fill" style={{ width: `${dosePercent}%`, backgroundColor: doseColor }}></div>
                </div>
                <div className="display-unit" style={{ color: doseColor, fontSize: '10px', fontWeight: '800' }}>{statusText}</div>

                {alertWarning && (
                  <div className={`clinical-guardrail-alert ${isDangerZone ? '' : 'warning-mode'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {alertWarning}
                  </div>
                )}
              </div>

              {calculatedBolus && (
                <div className="checklist" style={{ borderLeftColor: 'var(--accent-purple)', background: 'rgba(191, 90, 242, 0.03)', padding: '16px', borderRadius: '12px', marginTop: '16px', fontSize: '13px', lineHeight: '1.5' }}>
                  <span className="checklist-title" style={{ color: 'var(--accent-purple)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ataque / Bolus Recomendado</span>
                  • Massa total: <strong style={{ color: 'var(--text-primary)' }}>{formatReportNumber(calculatedBolus.minMg)} a {formatReportNumber(calculatedBolus.maxMg)} mg</strong><br/>
                  • Volume da solução: <strong style={{ color: 'var(--text-primary)' }}>{formatReportNumber(calculatedBolus.minMl)} a {formatReportNumber(calculatedBolus.maxMl)} mL</strong><br/>
                  • Tempo de infusão: Administrar em <strong style={{ color: 'var(--text-primary)' }}>{calculatedBolus.minutes} minutos</strong>.
                </div>
              )}

              <button className="btn-action-prime" onClick={copyPrescription}>Copiar Parâmetros e Conduta</button>
            </div>
          )}

          {/* ABA 2: TABELA DE TITULAÇÃO DINÂMICA */}
          {activeTab === 'titulacao' && (
            <div className="fade-engine">
              <div className="section-title">Grade de Correspondência ({drug.name})</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', paddingLeft: '4px' }}>
                Diluição calculada para massa de {amt} {drug.unitAmt} em {vol} mL. Peso de referência: {weight || '--'} kg.
              </div>

              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Dose Alvo</th>
                    <th>Vazão de Bomba</th>
                  </tr>
                </thead>
                <tbody>
                  {titrationRows.map((row, i) => (
                    <tr key={i}>
                      <td><strong>{formatReportNumber(row.dose, doseDigits)}</strong> {drug.doseUnit}</td>
                      <td>{row.flow > 0 ? `${formatReportNumber(row.flow)} mL/h` : 'Parâmetros insuficientes'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0, 201, 232, 0.05)', borderLeft: '2px solid var(--brand-cyan)', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', color: '#ddd' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--brand-cyan)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Notas de Beira-Leito</span>
                {drug.note}
              </div>
            </div>
          )}

          {/* ABA 3: ESCORE VIS COM FAILSAFE */}
          {activeTab === 'vis' && (
            <div className="fade-engine">
              <div className="section-title">Vasoactive-Inotropic Score (VIS)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', paddingLeft: '4px' }}>
                Determine a carga adrenérgica total para estimar falência miocárdica crônica.
              </div>

              <div className="grid-2">
                <div className="input-box"><span className="input-label">Nora (mcg/kg/min)</span><div className="input-wrapper"><input type="text" inputMode="decimal" value={visValues.noradrenalina} onChange={e => setVisValues({ ...visValues, noradrenalina: formatDecimal(e.target.value) })} placeholder="0,0" /></div></div>
                <div className="input-box"><span className="input-label">Adrenalina (mcg/kg/min)</span><div className="input-wrapper"><input type="text" inputMode="decimal" value={visValues.adrenalina} onChange={e => setVisValues({ ...visValues, adrenalina: formatDecimal(e.target.value) })} placeholder="0,0" /></div></div>
              </div>
              
              <div className="grid-2">
                <div className="input-box"><span className="input-label">Vasopressina (UI/min)</span><div className="input-wrapper"><input type="text" inputMode="decimal" value={visValues.vasopressina} onChange={e => setVisValues({ ...visValues, vasopressina: formatDecimal(e.target.value) })} placeholder="0,0" /></div></div>
                <div className="input-box"><span className="input-label">Dobutamina (mcg/kg/min)</span><div className="input-wrapper"><input type="text" inputMode="decimal" value={visValues.dobutamina} onChange={e => setVisValues({ ...visValues, dobutamina: formatDecimal(e.target.value) })} placeholder="0,0" /></div></div>
              </div>

              <div className="grid-2">
                <div className="input-box"><span className="input-label">Milrinona (mcg/kg/min)</span><div className="input-wrapper"><input type="text" inputMode="decimal" value={visValues.milrinona} onChange={e => setVisValues({ ...visValues, milrinona: formatDecimal(e.target.value) })} placeholder="0,0" /></div></div>
                <div className="input-box"><span className="input-label">Dopamina (mcg/kg/min)</span><div className="input-wrapper"><input type="text" inputMode="decimal" value={visValues.dopamina} onChange={e => setVisValues({ ...visValues, dopamina: formatDecimal(e.target.value) })} placeholder="0,0" /></div></div>
              </div>

              <div className={`glow-result-zone ${totalVis > 15 ? 'danger-alert' : ''}`}>
                <div className="display-unit">Score de Carga Hemodinâmica</div>
                <div className="display-value" style={{ color: totalVis > 15 ? 'var(--accent-red)' : 'var(--brand-cyan)' }}>{formatReportNumber(totalVis)}</div>
                <div className="premium-progress-track">
                  <div className="premium-progress-fill" style={{ width: `${Math.min((totalVis / 40) * 100, 100)}%`, backgroundColor: totalVis > 15 ? 'var(--accent-red)' : 'var(--brand-cyan)' }}></div>
                </div>
                <div className="display-unit" style={{ color: totalVis > 15 ? 'var(--accent-red)' : 'var(--text-secondary)', fontWeight: '800' }}>
                  {totalVis > 15 ? "Dano Tecidual e Alto Risco de Mortalidade" : "Suporte Vascular Compensado"}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="bottom-suite-nav">
        <div className="nav-shell">
          <div className={`nav-tab-item ${activeTab === 'calc' ? 'active' : ''}`} onClick={() => setActiveTab('calc')}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="16" y2="14" /><line x1="12" y1="8" x2="12" y2="16" /></svg>
            <span className="nav-tab-label">Infusão</span>
          </div>
          <div className={`nav-tab-item ${activeTab === 'titulacao' ? 'active' : ''}`} onClick={() => setActiveTab('titulacao')}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M3 14h18M3 6h18M3 18h18" /></svg>
            <span className="nav-tab-label">Titulação</span>
          </div>
          <div className={`nav-tab-item ${activeTab === 'vis' ? 'active' : ''}`} onClick={() => setActiveTab('vis')}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            <span className="nav-tab-label">Escore VIS</span>
          </div>
        </div>
      </div>
    </>
  );
}
