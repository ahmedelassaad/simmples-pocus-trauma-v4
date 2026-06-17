import { useMemo, useState } from 'react';
import { Bug, ClipboardList, ShieldAlert } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { Segmented, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';

const tabs = [
  { value: 'animal', label: 'Animal' },
  { value: 'gravidade', label: 'Gravidade' },
  { value: 'resumo', label: 'Resumo' }
];

const animals = {
  bothrops: { label: 'Bothrops (jararaca)', class: 'Serpente', antivenom: 'Soro antibotrópico', severeSigns: ['sangramento', 'shock', 'darkUrine'], local: 'Dor, edema e equimose local.' },
  crotalus: { label: 'Crotalus (cascavel)', class: 'Serpente', antivenom: 'Soro anticrotálico', severeSigns: ['neuro', 'darkUrine'], local: 'Dor local pode ser discreta; neuro e rabdomiólise importam.' },
  lachesis: { label: 'Lachesis (surucucu)', class: 'Serpente', antivenom: 'Soro antilaquético', severeSigns: ['bleeding', 'shock', 'vagal'], local: 'Dor, edema, sintomas vagais e hipotensão.' },
  micrurus: { label: 'Micrurus (coral verdadeira)', class: 'Serpente', antivenom: 'Soro antielapídico', severeSigns: ['neuro', 'resp'], local: 'Sinais neurológicos e paralisia predominam.' },
  scorpion: { label: 'Escorpião', class: 'Escorpião', antivenom: 'Soro antiescorpiônico / antiaracnídico conforme fluxo local', severeSigns: ['autonomic', 'resp'], local: 'Dor intensa local; crianças podem deteriorar rapidamente.' },
  phoneutria: { label: 'Aranha armadeira', class: 'Aranha', antivenom: 'Soro antiaracnídico', severeSigns: ['autonomic', 'pain'], local: 'Dor intensa, sudorese, taquicardia; priapismo pode ocorrer.' },
  loxosceles: { label: 'Aranha marrom', class: 'Aranha', antivenom: 'Soro antiaracnídico conforme disponibilidade/protocolo', severeSigns: ['hemolysis'], local: 'Lesão cutânea, necrose e hemólise em casos sistêmicos.' }
};

export function PeconhaApp() {
  const [tab, setTab] = useState('animal');
  const [animal, setAnimal] = useState('bothrops');
  const [flags, setFlags] = useState({ pain: true, edema: false, bleeding: false, neuro: false, darkUrine: false, shock: false, resp: false, autonomic: false, hemolysis: false, vagal: false });
  const info = animals[animal];
  const severe = info.severeSigns.some((key) => flags[key]);
  const moderate = !severe && (flags.edema || flags.pain || flags.autonomic || flags.hemolysis);
  const tier = severe ? { tone: 'danger', text: 'Grave' } : moderate ? { tone: 'warning', text: 'Moderado' } : { tone: 'success', text: 'Leve' };
  const flaggedList = Object.entries(flags).filter(([,value]) => value).map(([key]) => key).join(', ') || 'nenhum';
  const report = useMemo(() => `SIMMples PEÇONHA\nAnimal: ${info.label} (${info.class})\nGravidade sugerida: ${tier.text}\nAchados marcados: ${flaggedList}\nLembrete: ${info.local}\nSoro provável: ${info.antivenom}.`, [info, tier.text, flaggedList]);

  return (
    <div className="compact-module">
      <Segmented value={tab} onChange={setTab} options={tabs} />
      {tab === 'animal' && (
        <Card className="compact-card" title="Acidente por animal peçonhento" kicker="SIMMples PEÇONHA">
          <SelectField label="Animal provável" value={animal} onChange={setAnimal} options={Object.entries(animals).map(([value, item]) => ({ value, label: item.label }))} />
          <div className="grid-2 compact-grid top-gap">
            <Result label="Classe" value={info.class} tone="neutral" helper="Triagem sindrômica" />
            <Result label="Soro provável" value={info.antivenom} tone="warning" helper="Conferir fluxo local" />
          </div>
          <p className="clinical-text top-gap">{info.local}</p>
        </Card>
      )}
      {tab === 'gravidade' && (
        <Card className="compact-card" title="Sinais de gravidade">
          <div className="grid-2 compact-grid">
            <Result label="Classificação" value={tier.text} tone={tier.tone} helper="Sugestão a partir dos achados" />
            <Result label="Soro" value={info.antivenom} tone={tier.tone} helper="Pensar cedo se grave" />
          </div>
          <div className="toggle-grid compact-toggle-grid top-gap">
            <ToggleRow label="Dor local importante" checked={flags.pain} onChange={(v)=>setFlags({ ...flags, pain: v })} />
            <ToggleRow label="Edema local" checked={flags.edema} onChange={(v)=>setFlags({ ...flags, edema: v })} />
            <ToggleRow label="Sangramento / incoagulabilidade" checked={flags.bleeding} onChange={(v)=>setFlags({ ...flags, bleeding: v })} />
            <ToggleRow label="Sinais neurológicos" checked={flags.neuro} onChange={(v)=>setFlags({ ...flags, neuro: v })} />
            <ToggleRow label="Urina escura / rabdomiólise" checked={flags.darkUrine} onChange={(v)=>setFlags({ ...flags, darkUrine: v })} />
            <ToggleRow label="Choque / hipotensão" checked={flags.shock} onChange={(v)=>setFlags({ ...flags, shock: v })} />
            <ToggleRow label="Dispneia / falência respiratória" checked={flags.resp} onChange={(v)=>setFlags({ ...flags, resp: v })} />
            <ToggleRow label="Autonômicos intensos" checked={flags.autonomic} onChange={(v)=>setFlags({ ...flags, autonomic: v })} />
            <ToggleRow label="Hemólise" checked={flags.hemolysis} onChange={(v)=>setFlags({ ...flags, hemolysis: v })} />
            <ToggleRow label="Vagais intensos" checked={flags.vagal} onChange={(v)=>setFlags({ ...flags, vagal: v })} />
          </div>
        </Card>
      )}
      {tab === 'resumo' && (
        <Card className="compact-card" title="Resumo e condutas gerais">
          <div className="micro-card-grid">
            {['Confirmar tempo do acidente e local da picada', 'Elevar membro e marcar progressão do edema quando aplicável', 'Controle de dor e monitorização', 'Solicitar coagulograma / CK / função renal conforme síndrome', 'Contato com centro de informação toxicológica e protocolo local de soro'].map((item) => <article className="mini-card" key={item}><strong><ShieldAlert size={15}/>{item}</strong></article>)}
          </div>
          <pre className="report-box top-gap">{report}</pre>
          <CopyButton text={report}><ClipboardList size={18}/> Copiar resumo PEÇONHA</CopyButton>
        </Card>
      )}
    </div>
  );
}
