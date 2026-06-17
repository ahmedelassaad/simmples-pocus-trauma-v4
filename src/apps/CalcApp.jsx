import React, { useMemo, useRef, useState } from 'react';

const DRUGS = [
  { id: 'noradrenalina', name: 'Noradrenalina', presentation: '4 mg/mL — amp. 4 mL', dilution: 'Diluir 16 mg (4 amp) em SG 5% 234 mL', concentrationLabel: '60 mcg/mL', concentration: 60, doseKind: 'mcgKgMin', doseMin: 0.02, doseMax: 2, doseUnit: 'mcg/kg/min' },
  { id: 'dobutamina', name: 'Dobutamina', presentation: '12,5 mg/mL — amp. 20 mL', dilution: 'Diluir 1000 mg (4 amp) em SF 0,9% 170 mL', concentrationLabel: '4000 mcg/mL', concentration: 4000, doseKind: 'mcgKgMin', doseMin: 2, doseMax: 20, doseUnit: 'mcg/kg/min' },
  { id: 'adrenalina', name: 'Adrenalina', presentation: '1 mg/mL — amp. 1 mL', dilution: 'Diluir 6 mg (6 amp) em SF 0,9% 94 mL', concentrationLabel: '60 mcg/mL', concentration: 60, doseKind: 'mcgMin', doseMin: 1, doseMax: 20, doseUnit: 'mcg/min' },
  { id: 'vasopressina', name: 'Vasopressina', presentation: '20 UI/mL — amp. 1 mL', dilution: 'Diluir 20 UI (1 amp) em SF 0,9% 100 mL', concentrationLabel: '0,2 UI/mL', concentration: 0.2, doseKind: 'uiMin', doseMin: 0.01, doseMax: 0.04, doseUnit: 'UI/min' },
  { id: 'nitroprussiato', name: 'Nitroprussiato (Nipride)', presentation: '25 mg/mL — amp. 2 mL', dilution: 'Diluir 50 mg (1 amp) em SG 5% 248 mL', concentrationLabel: '200 mcg/mL', concentration: 200, doseKind: 'mcgKgMin', doseMin: 0.5, doseMax: 10, doseUnit: 'mcg/kg/min' },
  { id: 'nitroglicerina', name: 'Nitroglicerina (Tridil)', presentation: '5 mg/mL — amp. 5/10 mL', dilution: 'Diluir 50 mg em SG 5% 250 mL', concentrationLabel: '200 mcg/mL', concentration: 200, doseKind: 'mcgKgMin', doseMin: 0.5, doseMax: 10, doseUnit: 'mcg/kg/min' },
  { id: 'milrinone', name: 'Milrinone', presentation: '1 mg/mL — amp. 20 mL', dilution: 'Diluir 20 mg (1 amp) em SF 0,9% 80 mL', concentrationLabel: '200 mcg/mL', concentration: 200, doseKind: 'mcgKgMin', doseMin: 0.375, doseMax: 0.75, doseUnit: 'mcg/kg/min' },
  { id: 'azul-metileno', name: 'Azul de Metileno', presentation: '10 mg/mL — amp. 10 mL', dilution: 'Diluir 1000 mg (10 amp) em SF 0,9% 100 mL', concentrationLabel: '5 mg/mL', concentration: 5, doseKind: 'mgKgH', doseMin: 0.5, doseMax: 4, doseUnit: 'mg/kg/h' }
];

function toNumber(value) {
  const number = parseFloat(String(value).replace(',', '.'));
  return number > 0 ? number : null;
}

function calcFlowFromDose(drug, dose, weight) {
  if (!drug || dose === null) return null;
  if (drug.doseKind === 'mcgKgMin') return weight ? (dose * weight * 60) / drug.concentration : null;
  if (drug.doseKind === 'mcgMin') return (dose * 60) / drug.concentration;
  if (drug.doseKind === 'uiMin') return (dose * 60) / drug.concentration;
  if (drug.doseKind === 'mgKgH') return weight ? (dose * weight) / drug.concentration : null;
  return null;
}

function calcDoseFromFlow(drug, flow, weight) {
  if (!drug || !flow) return null;
  if (drug.doseKind === 'mcgKgMin') return weight ? (flow * drug.concentration) / 60 / weight : null;
  if (drug.doseKind === 'mcgMin') return (flow * drug.concentration) / 60;
  if (drug.doseKind === 'uiMin') return (flow * drug.concentration) / 60;
  if (drug.doseKind === 'mgKgH') return weight ? (flow * drug.concentration) / weight : null;
  return null;
}

export default function SimmDvaApp() {
  const [activeTab, setActiveTab] = useState('calc');
  const [drugId, setDrugId] = useState('noradrenalina');
  const [weight, setWeight] = useState('70');
  const [flow, setFlow] = useState('');
  const [targetDose, setTargetDose] = useState('');
  
  const [visValues, setVisValues] = useState({ dopamina: '', dobutamina: '', adrenalina: '', noradrenalina: '', milrinone: '', vasopressina: '' });

  const drug = useMemo(() => DRUGS.find((item) => item.id === drugId) || DRUGS[0], [drugId]);
  const weightNum = toNumber(weight);
  const flowNum = toNumber(flow);
  const targetDoseNum = toNumber(targetDose);

  const currentDose = useMemo(() => calcDoseFromFlow(drug, flowNum, weightNum), [drug, flowNum, weightNum]);
  const targetFlow = useMemo(() => calcFlowFromDose(drug, targetDoseNum, weightNum), [drug, targetDoseNum, weightNum]);

  // Semáforo para Dose Alvo
  let doseColor = "var(--text-secondary)";
  let dosePercent = 0;
  let statusText = "Aguardando parâmetros";

  if (targetDoseNum !== null) {
    dosePercent = (targetDoseNum / drug.doseMax) * 100;
    if (dosePercent > 100) dosePercent = 100;
    
    if (targetDoseNum < drug.doseMin) { doseColor = "var(--accent-yellow)"; statusText = "Subdose Protocolar"; }
    else if (targetDoseNum <= drug.doseMax) { doseColor = "var(--accent-green)"; statusText = "Faixa Segura"; }
    else { doseColor = "var(--accent-red)"; statusText = "Acima do Teto Protocolar"; }
  }

  // Escore VIS Seguro (Vasopressina calculada em UI/min dividida pelo peso)
  const totalVis = useMemo(() => {
    const dopa = toNumber(visValues.dopamina) || 0;
    const dobuta = toNumber(visValues.dobutamina) || 0;
    const epi = toNumber(visValues.adrenalina) || 0;
    const norepi = toNumber(visValues.noradrenalina) || 0;
    const milrinone = toNumber(visValues.milrinone) || 0;
    
    const vasoUImin = toNumber(visValues.vasopressina) || 0;
    const vasoKGmin = weightNum ? (vasoUImin / weightNum) : 0; // Conversão Segura

    return dopa + dobuta + (100 * epi) + (100 * norepi) + (10 * milrinone) + (10000 * vasoKGmin);
  }, [visValues, weightNum]);

  const copyPrescription = () => {
    const report = `RELATÓRIO CLÍNICO - DVA\n\nDroga: ${drug.name}\nPeso: ${weight || '--'} kg\nDiluição Padrão: ${drug.dilution} (${drug.concentrationLabel})\n\nDose Alvo: ${targetDose || '--'} ${drug.doseUnit}\nVazão na Bomba: ${targetFlow ? targetFlow.toFixed(1) : '--'} mL/h\n\n[SIMMples DVA]`;
    navigator.clipboard.writeText(report);
    alert("Prescrição copiada.");
  };

  return (
    <>
      <style>{`
        :root { --bg-base: #020A1A; --brand-cyan: #00C9E8; --card-border: rgba(0, 201, 232, 0.2); --text-primary: #ffffff; --text-secondary: #8e9bb0; --accent-red: #ff453a; --accent-yellow: #ffd60a; --accent-green: #30d158; }
        .simm-app { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; background-color: var(--bg-base); color: var(--text-primary); min-height: 100vh; padding: 20px 15px 120px 15px; max-width: 480px; margin: 0 auto; box-sizing: border-box; }
        .simm-app * { box-sizing: border-box; }
        .top-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding: 10px 0; border-bottom: 1px solid rgba(0, 201, 232, 0.1); }
        .app-title { font-size: 18px; font-weight: 600; color: var(--brand-cyan); letter-spacing: 0.5px; }
        
        .toggle-container { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 4px; display: flex; position: relative; margin-bottom: 20px; border: 1px solid var(--card-border); }
        .toggle-btn { flex: 1; text-align: center; padding: 10px 0; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; cursor: pointer; transition: 0.3s; z-index: 2; }
        .toggle-btn.active { color: var(--brand-cyan); }
        .toggle-slider { position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px); background: rgba(0, 201, 232, 0.15); border: 1px solid var(--brand-cyan); border-radius: 8px; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 1; }
        
        .section-title { font-size: 11px; font-weight: 700; color: var(--brand-cyan); text-transform: uppercase; margin: 24px 0 12px 0; letter-spacing: 1px; border-bottom: 1px solid rgba(0,201,232,0.1); padding-bottom: 6px; }
        .input-group { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--card-border); border-radius: 8px; padding: 12px; margin-bottom: 12px; transition: 0.3s; }
        .input-group:focus-within { border-color: var(--brand-cyan); background: rgba(0, 201, 232, 0.05); }
        .input-label { font-size: 9px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px; display: block; font-weight: 600; }
        .input-wrapper { display: flex; align-items: baseline; }
        .simm-app select, .simm-app input { width: 100%; background: transparent; border: none; color: var(--text-primary); font-size: 16px; font-weight: 700; outline: none; appearance: none; }
        .simm-app select option { background: var(--bg-base); color: var(--text-primary); }
        .unit { font-size: 11px; font-weight: 500; color: var(--text-secondary); margin-left: 6px; }
        
        .drug-protocol { font-size: 12px; color: var(--text-secondary); line-height: 1.4; padding: 0 4px; margin-bottom: 20px; border-left: 2px solid var(--brand-cyan); padding-left: 10px; }
        .drug-protocol strong { color: var(--text-primary); }

        .result-zone { background: rgba(0, 201, 232, 0.02); border: 1px solid var(--card-border); border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0; }
        .result-value { font-size: 38px; font-weight: 800; color: var(--brand-cyan); line-height: 1; margin-bottom: 8px; }
        .result-unit-text { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        
        .status-bar-container { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 12px 0 8px 0; overflow: hidden; }
        .status-bar-fill { height: 100%; transition: width 0.5s ease, background-color 0.5s ease; border-radius: 2px; }

        .btn-primary { width: 100%; background: var(--brand-cyan); color: #000; border: none; border-radius: 8px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 10px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      `}</style>

      <div className="simm-app">
        <div className="top-bar">
          <div className="app-title">SIMMples DVA</div>
        </div>

        <div className="toggle-container">
          <div className={`toggle-btn ${activeTab === 'calc' ? 'active' : ''}`} onClick={() => setActiveTab('calc')}>Bomba (DVA)</div>
          <div className={`toggle-btn ${activeTab === 'vis' ? 'active' : ''}`} onClick={() => setActiveTab('vis')}>Escore VIS</div>
          <div className="toggle-slider" style={{ transform: activeTab === 'calc' ? 'translateX(0)' : 'translateX(100%)' }}></div>
        </div>

        {activeTab === 'calc' && (
          <div>
            <div className="section-title">Prescrição e Alvos</div>
            
            <div className="input-group">
              <span className="input-label">Medicamento Vasoativo</span>
              <select value={drugId} onChange={(e) => { setDrugId(e.target.value); setTargetDose(''); setFlow(''); }}>
                {DRUGS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="drug-protocol">
              <strong>Preparo Institucional:</strong> {drug.dilution}<br/>
              Apresentação: {drug.presentation}
            </div>

            <div className="grid-2">
              <div className="input-group">
                <span className="input-label">Peso Paciente</span>
                <div className="input-wrapper">
                  <input type="number" inputMode="numeric" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" />
                  <span className="unit">kg</span>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Dose Alvo</span>
                <div className="input-wrapper">
                  <input type="number" inputMode="numeric" value={targetDose} onChange={e => setTargetDose(e.target.value)} placeholder="Ex: 0.1" />
                  <span className="unit">{drug.doseUnit}</span>
                </div>
              </div>
            </div>

            <div className="result-zone">
              <div className="result-unit-text">Vazão Sugerida na Bomba</div>
              <div className="result-value">{targetFlow !== null ? targetFlow.toFixed(1) : '--'} <span style={{fontSize: '16px', color: 'var(--text-secondary)'}}>mL/h</span></div>
              
              <div className="status-bar-container">
                <div className="status-bar-fill" style={{ width: `${dosePercent}%`, backgroundColor: doseColor }}></div>
              </div>
              <div className="result-unit-text" style={{ color: doseColor }}>{statusText}</div>
            </div>

            <div className="section-title">Cálculo Reverso (Beira Leito)</div>
            <div className="input-group">
              <span className="input-label">O que está correndo na bomba agora?</span>
              <div className="input-wrapper">
                <input type="number" inputMode="numeric" value={flow} onChange={e => setFlow(e.target.value)} placeholder="Ex: 15" />
                <span className="unit">mL/h</span>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', margin: '16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Dose Real: <strong style={{color: 'var(--brand-cyan)'}}>{currentDose !== null ? currentDose.toFixed(3) : '--'} {drug.doseUnit}</strong>
            </div>

            <button className="btn-primary" onClick={copyPrescription}>Copiar Prescrição Clínica</button>
          </div>
        )}

        {activeTab === 'vis' && (
          <div>
            <div className="section-title">Vasoactive-Inotropic Score (VIS)</div>
            <div style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px'}}>
              Insira a dose atual para cálculo do Risco de Mortalidade Chocogênica.
            </div>

            <div className="grid-2">
              <div className="input-group"><span className="input-label">Nora (mcg/kg/min)</span><input type="number" inputMode="numeric" value={visValues.noradrenalina} onChange={e => setVisValues({...visValues, noradrenalina: e.target.value})} placeholder="0.0" /></div>
              <div className="input-group"><span className="input-label">Epi (mcg/kg/min)</span><input type="number" inputMode="numeric" value={visValues.adrenalina} onChange={e => setVisValues({...visValues, adrenalina: e.target.value})} placeholder="0.0" /></div>
              <div className="input-group"><span className="input-label">Vaso (UI/min)</span><input type="number" inputMode="numeric" value={visValues.vasopressina} onChange={e => setVisValues({...visValues, vasopressina: e.target.value})} placeholder="0.0" /></div>
              <div className="input-group"><span className="input-label">Dobutamina</span><input type="number" inputMode="numeric" value={visValues.dobutamina} onChange={e => setVisValues({...visValues, dobutamina: e.target.value})} placeholder="0.0" /></div>
              <div className="input-group"><span className="input-label">Milrinone</span><input type="number" inputMode="numeric" value={visValues.milrinone} onChange={e => setVisValues({...visValues, milrinone: e.target.value})} placeholder="0.0" /></div>
              <div className="input-group"><span className="input-label">Dopamina</span><input type="number" inputMode="numeric" value={visValues.dopamina} onChange={e => setVisValues({...visValues, dopamina: e.target.value})} placeholder="0.0" /></div>
            </div>

            <div className="result-zone">
              <div className="result-unit-text">Escore VIS Total</div>
              <div className="result-value" style={{color: totalVis > 15 ? 'var(--accent-red)' : 'var(--brand-cyan)'}}>{totalVis.toFixed(1)}</div>
              <div className="status-bar-container">
                <div className="status-bar-fill" style={{ width: `${Math.min((totalVis/30)*100, 100)}%`, backgroundColor: totalVis > 15 ? 'var(--accent-red)' : 'var(--brand-cyan)' }}></div>
              </div>
              <div className="result-unit-text" style={{color: totalVis > 15 ? 'var(--accent-red)' : 'var(--text-secondary)'}}>
                {totalVis > 15 ? "Alto Risco de Mortalidade" : "Baixo Risco Relativo"}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
