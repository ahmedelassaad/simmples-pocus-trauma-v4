import { useMemo, useState } from 'react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { interpretGaso } from '../lib/gaso.js';

export function GasoApp() {
  const [values, setValues] = useState({ ph: '', pco2: '', hco3: '', na: '', cl: '', alb: '' });
  const set = (key) => (value) => setValues((old) => ({ ...old, [key]: value }));
  const result = useMemo(() => interpretGaso(values), [values]);

  return (
    <>
      <Card title="Parâmetros">
        <div className="grid-3">
          <NumberField label="pH" value={values.ph} onChange={set('ph')} placeholder="7.32" />
          <NumberField label="pCO₂" value={values.pco2} onChange={set('pco2')} unit="mmHg" placeholder="28" />
          <NumberField label="HCO₃⁻" value={values.hco3} onChange={set('hco3')} unit="mEq/L" placeholder="14" />
        </div>
      </Card>

      <Card title="Eletrólitos / Refino">
        <div className="grid-3">
          <NumberField label="Na" value={values.na} onChange={set('na')} unit="mEq/L" placeholder="140" />
          <NumberField label="Cl" value={values.cl} onChange={set('cl')} unit="mEq/L" placeholder="104" />
          <NumberField label="Alb" value={values.alb} onChange={set('alb')} unit="g/dL" placeholder="4.0" />
        </div>
      </Card>

      <Card title="Distúrbio Primário">
        <Result label="Status" value={result.status} tone={result.tone} />
        <Result label="Primário" value={result.primary} tone={result.tone} />
      </Card>

      <Card title="Compensação / Secundário">
        <p className="clinical-text">{result.compensation}</p>
      </Card>

      <Card title="Refino Metabólico (Terciário)">
        <p className="clinical-text">{result.metabolic}</p>
      </Card>

      <CopyButton text={result.report}>Copiar Relatório Clínico</CopyButton>
    </>
  );
}
