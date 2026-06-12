import { useState } from 'react';
import { Card, Result } from '../components/Layout.jsx';
import { NumberField, Segmented } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';

export function CalcApp() {
  const [access, setAccess] = useState('central');
  const [weight, setWeight] = useState('');
  const [flow, setFlow] = useState('');
  const [amount, setAmount] = useState('');
  const [volume, setVolume] = useState('');
  const text = `SIMMples Calc\nAcesso: ${access === 'central' ? 'central' : 'periférico'}\nPeso: ${weight || '--'} kg | Vazão: ${flow || '--'} mL/h | Quantidade: ${amount || '--'} | Volume: ${volume || '--'} mL\nMódulo de cálculo medicamentoso: configurar tabela institucional validada antes de uso assistencial.`;

  return (
    <>
      <Card title="VIS / Infusões" kicker="Estrutura visual extraída e reconstruída">
        <Result label="VIS" value="0.0" helper="Campo reservado para protocolo institucional validado" />
        <Segmented value={access} onChange={setAccess} options={[{ value: 'central', label: 'Acesso Central' }, { value: 'peripheral', label: 'Acesso Periférico' }]} />
        <div className="notice-box">
          Este módulo foi deixado como base visual/configurável. Para uso assistencial real, conecte uma tabela institucional validada, versionada e revisada por responsáveis técnicos.
        </div>
      </Card>

      <Card title="Parâmetros">
        <div className="grid-2">
          <NumberField label="Peso" value={weight} onChange={setWeight} unit="kg" />
          <NumberField label="Vazão Atual" value={flow} onChange={setFlow} unit="mL/h" />
          <NumberField label="Quantidade" value={amount} onChange={setAmount} unit="unidade do protocolo" />
          <NumberField label="Volume" value={volume} onChange={setVolume} unit="mL" />
        </div>
        <Result label="Dose calculada" value="Configurar protocolo" helper="Sem tabela validada embutida" />
      </Card>

      <Card title="Tabela de Titulação">
        <p className="clinical-text">Área preparada para receber faixas, limites, avisos e titulação conforme protocolo interno da SIMM/hospital.</p>
      </Card>

      <CopyButton text={text}>Copiar Prescrição</CopyButton>
    </>
  );
}
