import { useMemo, useState } from 'react';
import { BookOpenText, ClipboardList, Eye, HeartPulse, ScanLine, ShieldCheck, Waves } from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { Segmented, SelectField, ToggleRow } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { analyzePocus, defaultPocusState, pocusModeLabel } from '../lib/pocus.js';
import { atlasCategoryLabel, pocusAtlasEntries, pocusResourceLinks, simmModePearls } from '../data/pocusAtlas.js';

const modeOptions = [
  { value: 'shock', label: 'Choque' },
  { value: 'trauma', label: 'Trauma' },
  { value: 'dyspnea', label: 'Dispneia' },
  { value: 'vascular', label: 'Vascular' }
];

const atlasOptions = [
  { value: 'mode', label: 'Do modo' },
  { value: 'all', label: 'Todos' },
  { value: 'cardiac', label: 'Cardíaco' },
  { value: 'lung', label: 'Pulmão' },
  { value: 'trauma', label: 'Trauma' },
  { value: 'vascular', label: 'Vascular' },
  { value: 'aorta', label: 'Aorta' }
];

const contractilityOptions = [
  { value: 'unknown', label: 'Não avaliada' },
  { value: 'hyperdynamic', label: 'Hiperdinâmica' },
  { value: 'normal', label: 'Preservada' },
  { value: 'reduced', label: 'Reduzida' },
  { value: 'severelyReduced', label: 'Muito reduzida' }
];

const rvOptions = [
  { value: 'unknown', label: 'Não avaliado' },
  { value: 'normal', label: 'Normal' },
  { value: 'dilated', label: 'Dilatado' },
  { value: 'severe', label: 'Muito dilatado' }
];

const effusionOptions = [
  { value: 'unknown', label: 'Não avaliado' },
  { value: 'none', label: 'Ausente' },
  { value: 'small', label: 'Pequeno' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'large', label: 'Importante' }
];

const ivcOptions = [
  { value: 'unknown', label: 'Não avaliada' },
  { value: 'collapsed', label: 'Colabada' },
  { value: 'variable', label: 'Intermediária' },
  { value: 'plethoric', label: 'Pletórica' }
];

const lungOptions = [
  { value: 'unknown', label: 'Não avaliado' },
  { value: 'A', label: 'Perfil A' },
  { value: 'Bdiffuse', label: 'B bilateral/difuso' },
  { value: 'Bfocal', label: 'B focal' },
  { value: 'mixed', label: 'Misto' }
];

const pleuralOptions = [
  { value: 'none', label: 'Sem derrame marcado' },
  { value: 'right', label: 'Direito' },
  { value: 'left', label: 'Esquerdo' },
  { value: 'bilateral', label: 'Bilateral' }
];

const aortaOptions = [
  { value: 'notAssessed', label: 'Não avaliada' },
  { value: 'normal', label: 'Sem dilatação marcada' },
  { value: 'aneurysm', label: 'Aneurisma/dilatação' },
  { value: 'dissectionConcern', label: 'Preocupação para síndrome aórtica' }
];

function setField(setState, key) {
  return (value) => setState((old) => ({ ...old, [key]: value }));
}

function toggleField(setState, key) {
  return (value) => setState((old) => ({ ...old, [key]: value }));
}

function AtlasCard({ item }) {
  return (
    <article className="atlas-card">
      <div className="atlas-thumb-wrap">
        <img className="atlas-thumb" src={item.mediaUrl} alt={item.title} loading="lazy" />
        <span className="atlas-badge">{item.tag}</span>
      </div>
      <div className="atlas-body">
        <strong>{item.title}</strong>
        <p>{item.pearl}</p>
        <div className="atlas-links">
          <a href={item.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte</a>
          <span>{item.sourceName}</span>
        </div>
      </div>
    </article>
  );
}

export function PocusApp() {
  const [state, setState] = useState(defaultPocusState);
  const [atlasFilter, setAtlasFilter] = useState('mode');
  const analysis = useMemo(() => analyzePocus(state), [state]);
  const set = (key) => setField(setState, key);
  const toggle = (key) => toggleField(setState, key);
  const reset = () => setState({ ...defaultPocusState, mode: state.mode });

  const atlasEntries = useMemo(() => {
    if (atlasFilter === 'mode') return pocusAtlasEntries.filter((item) => item.modes.includes(state.mode));
    if (atlasFilter === 'all') return pocusAtlasEntries;
    return pocusAtlasEntries.filter((item) => item.category === atlasFilter);
  }, [atlasFilter, state.mode]);

  const learningLinks = useMemo(
    () => pocusResourceLinks.filter((item) => item.modes.includes(state.mode)),
    [state.mode]
  );

  return (
    <>
      <Card title="Modo de exame" kicker="POCUS integrado">
        <Segmented value={state.mode} onChange={set('mode')} options={modeOptions} />
        <div className="mode-note">
          <ScanLine size={18} />
          <span>{pocusModeLabel(state.mode)}</span>
        </div>
      </Card>

      <Card title="Autoridade SIMM" kicker="Como pensar">
        <div className="idea-list-wrap">
          <ul className="idea-list">
            {simmModePearls[state.mode].map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </Card>

      <Card title="Pump — cardíaco" kicker="RUSH">
        <div className="grid-2">
          <SelectField label="Contratilidade VE" value={state.contractility} onChange={set('contractility')} options={contractilityOptions} />
          <SelectField label="VD" value={state.rv} onChange={set('rv')} options={rvOptions} />
        </div>
        <div className="grid-2">
          <SelectField label="Derrame pericárdico" value={state.pericardialEffusion} onChange={set('pericardialEffusion')} options={effusionOptions} />
          <SelectField label="VCI" value={state.ivc} onChange={set('ivc')} options={ivcOptions} />
        </div>
        <div className="toggle-grid top-gap">
          <ToggleRow label="Strain de VD" helper="septal flattening, McConnell, VD>VE ou contexto compatível" checked={state.rvStrain} onChange={toggle('rvStrain')} />
          <ToggleRow label="Sinais de tamponamento" helper="colapso de câmaras direitas/plethora VCI + instabilidade" checked={state.tamponade} onChange={toggle('tamponade')} />
        </div>
      </Card>

      <Card title="Tank — pulmão e volume" kicker="Pulmão / VCI">
        <div className="grid-2">
          <SelectField label="Perfil pulmonar" value={state.lungProfile} onChange={set('lungProfile')} options={lungOptions} />
          <SelectField label="Derrame pleural" value={state.pleuralEffusion} onChange={set('pleuralEffusion')} options={pleuralOptions} />
        </div>
        <div className="toggle-grid top-gap">
          <ToggleRow label="Ausência de lung sliding" checked={state.lungSlidingAbsent} onChange={toggle('lungSlidingAbsent')} />
          <ToggleRow label="Lung point presente" checked={state.lungPoint} onChange={toggle('lungPoint')} />
          <ToggleRow label="Consolidação pulmonar/subpleural" checked={state.consolidation} onChange={toggle('consolidation')} />
          <ToggleRow label="Alteração de excursão diafragmática" checked={state.diaphragm} onChange={toggle('diaphragm')} />
        </div>
      </Card>

      <Card title="eFAST / Abdome / Aorta" kicker="Trauma e causas abdominais">
        <div className="split-title">Janelas FAST positivas</div>
        <div className="toggle-grid compact-grid">
          <ToggleRow label="RUQ / Morrison" checked={state.fastRUQ} onChange={toggle('fastRUQ')} />
          <ToggleRow label="LUQ / Esplenorrenal" checked={state.fastLUQ} onChange={toggle('fastLUQ')} />
          <ToggleRow label="Pelve" checked={state.fastPelvis} onChange={toggle('fastPelvis')} />
          <ToggleRow label="Pericárdio" checked={state.fastPericardial} onChange={toggle('fastPericardial')} />
        </div>
        <div className="grid-2 top-gap">
          <SelectField label="Aorta abdominal" value={state.aorta} onChange={set('aorta')} options={aortaOptions} />
          <ToggleRow label="Bexiga distendida" checked={state.bladderDistended} onChange={toggle('bladderDistended')} />
        </div>
        <div className="toggle-grid top-gap">
          <ToggleRow label="Hidronefrose marcada" checked={state.hydronephrosis} onChange={toggle('hydronephrosis')} />
          <ToggleRow label="Achado biliar relevante" checked={state.gallbladder} onChange={toggle('gallbladder')} />
        </div>
      </Card>

      <Card title="Pipes — DVT" kicker="Vascular">
        <div className="toggle-grid compact-grid">
          <ToggleRow label="Femoral direita incompressível" checked={state.dvtRightFemoral} onChange={toggle('dvtRightFemoral')} />
          <ToggleRow label="Femoral esquerda incompressível" checked={state.dvtLeftFemoral} onChange={toggle('dvtLeftFemoral')} />
          <ToggleRow label="Poplítea direita incompressível" checked={state.dvtRightPopliteal} onChange={toggle('dvtRightPopliteal')} />
          <ToggleRow label="Poplítea esquerda incompressível" checked={state.dvtLeftPopliteal} onChange={toggle('dvtLeftPopliteal')} />
        </div>
      </Card>

      <Card title="Fenótipo sugerido">
        {analysis.critical.length > 0 && (
          <div className="risk-banner risk-danger">
            <Eye size={22} />
            <div>
              <strong>Alerta crítico</strong>
              <span>{analysis.critical.join(' · ')}</span>
            </div>
          </div>
        )}
        <div className="result-stack">
          {analysis.phenotypes.map((item) => (
            <Result key={`${item.label}-${item.helper}`} label="POCUS" value={item.label} tone={item.tone} helper={item.helper} />
          ))}
        </div>
      </Card>

      <Card title="Checklist de completude">
        <div className="tag-list">
          {(analysis.missing.length ? analysis.missing : ['exame integrado sem lacuna obrigatória marcada']).map((item) => (
            <span key={item} className={analysis.missing.length ? 'tag tag-warning' : 'tag tag-success'}>{item}</span>
          ))}
        </div>
      </Card>

      <Card title="Achados e próximos passos">
        <div className="alert-stack">
          <div className="mini-card">
            <strong><Waves size={16} /> Achados marcados</strong>
            <ul className="check-list">
              {(analysis.findings.length ? analysis.findings : ['Nenhum achado marcado.']).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="mini-card">
            <strong><ClipboardList size={16} /> Próximos passos</strong>
            <ul className="check-list">
              {(analysis.nextSteps.length ? analysis.nextSteps : ['Correlacionar com exame físico, sinais vitais, ECG/laboratório e reavaliação seriada.']).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Biblioteca visual SIMM" kicker="Atlas aberto + FOAMed">
        <Segmented value={atlasFilter} onChange={setAtlasFilter} options={atlasOptions} />
        <div className="notice-box">
          Banco de imagens integrado com foco em ensino rápido. As mídias exibidas vêm do The POCUS Atlas (conteúdo aberto/FOAMed). Os links do POCUS 101 ficam abaixo como reforço didático.
        </div>
        <div className="split-title">Mostrando: {atlasFilter === 'mode' ? `modo ${pocusModeLabel(state.mode)}` : atlasCategoryLabel(atlasFilter)}</div>
        <div className="atlas-grid top-gap">
          {atlasEntries.map((item) => <AtlasCard key={item.id} item={item} />)}
        </div>
      </Card>

      <Card title="Referências práticas" kicker="Aprender sem perder tempo">
        <div className="resource-list">
          {learningLinks.map((item) => (
            <a key={item.url} className="resource-link" href={item.url} target="_blank" rel="noreferrer">
              <BookOpenText size={18} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.helper} · {item.sourceName}</small>
              </span>
            </a>
          ))}
        </div>
      </Card>

      <Card title="Laudo rápido" kicker="Pronto para copiar">
        <p className="clinical-text report-box">{analysis.report}</p>
      </Card>

      <div className="button-row">
        <button className="secondary-button" type="button" onClick={reset}><HeartPulse size={18} /> Limpar achados</button>
        <CopyButton text={analysis.report}><ShieldCheck size={18} /> Copiar laudo POCUS</CopyButton>
      </div>
    </>
  );
}
