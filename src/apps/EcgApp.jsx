import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, HeartPulse, Search } from 'lucide-react';
import { Card } from '../components/Layout.jsx';
import { Segmented } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { EcgStrip, EcgTwelveLead } from '../components/EcgWaveforms.jsx';

const tabs = [
  { value: 'ritmos', label: 'Ritmos' },
  { value: 'bradi', label: 'Bradi' },
  { value: 'taqui', label: 'Taqui' },
  { value: 'iam', label: 'IAM/OMI' }
];

const ECG_PATTERNS = [
  { id: 'sinus', tab: 'ritmos', name: 'Ritmo sinusal', rhythm: 'sinus', pattern: 'normal', rate: 75, type: 'Ritmo base', features: ['P antes de cada QRS', 'PR constante', 'QRS estreito'], explain: 'Ritmo regular com ativação atrial organizada e condução AV preservada.' },
  { id: 'sinus-brady', tab: 'bradi', name: 'Bradicardia sinusal', rhythm: 'brady', pattern: 'normal', rate: 45, type: 'Bradiarritmia', features: ['P sinusal', 'FC baixa', 'QRS estreito'], explain: 'Ritmo sinusal com frequência baixa; correlacionar com sintomas e contexto.' },
  { id: 'first-avb', tab: 'bradi', name: 'BAV 1º grau', rhythm: 'brady', pattern: 'normal', rate: 58, type: 'Bradiarritmia', features: ['PR prolongado', 'Sem bloqueio de QRS'], explain: 'Condução AV atrasada, mas todos os impulsos atriais conduzem.' },
  { id: 'mobitz1', tab: 'bradi', name: 'BAV 2º grau Mobitz I', rhythm: 'brady', pattern: 'mobitz1', rate: 55, type: 'Bradiarritmia', features: ['PR progressivamente maior', 'Batimento bloqueado'], explain: 'Padrão Wenckebach: aumento progressivo do atraso AV até pausa.' },
  { id: 'mobitz2', tab: 'bradi', name: 'BAV 2º grau Mobitz II', rhythm: 'brady', pattern: 'mobitz2', rate: 50, type: 'Bradiarritmia', features: ['PR fixo', 'QRS subitamente não conduzido'], explain: 'Bloqueio infranodal até prova em contrário; maior risco de progressão.' },
  { id: 'complete-av', tab: 'bradi', name: 'BAV total', rhythm: 'brady', pattern: 'complete-av', rate: 38, type: 'Bradiarritmia', features: ['Dissociação AV', 'Ritmo de escape'], explain: 'Atividade atrial e ventricular independentes; avaliar instabilidade e escape.' },
  { id: 'junctional', tab: 'bradi', name: 'Ritmo juncional', rhythm: 'brady', pattern: 'normal', rate: 48, type: 'Bradiarritmia', features: ['P ausente/invertida', 'QRS geralmente estreito'], explain: 'Escape juncional ou ritmo juncional ativo, conforme frequência e contexto.' },
  { id: 'afib', tab: 'ritmos', name: 'Fibrilação atrial', rhythm: 'afib', pattern: 'normal', rate: 125, type: 'Ritmo irregular', features: ['Irregularmente irregular', 'Sem onda P organizada'], explain: 'Ativação atrial caótica com resposta ventricular variável.' },
  { id: 'flutter', tab: 'taqui', name: 'Flutter atrial', rhythm: 'flutter', pattern: 'normal', rate: 150, type: 'Taquiarritmia supraventricular', features: ['Ondas F serrilhadas', 'Condução 2:1 comum'], explain: 'Circuito macro-reentrante atrial; pode simular TSV regular em condução 2:1.' },
  { id: 'svt', tab: 'taqui', name: 'TSV regular', rhythm: 'svt', pattern: 'normal', rate: 170, type: 'Taquiarritmia supraventricular', features: ['Regular', 'QRS estreito', 'P não evidente'], explain: 'Taquicardia regular de QRS estreito, geralmente por reentrada nodal ou via acessória.' },
  { id: 'vt', tab: 'taqui', name: 'Taquicardia ventricular monomórfica', rhythm: 'vt', pattern: 'normal', rate: 165, type: 'Taquiarritmia ventricular', features: ['QRS largo', 'Regular', 'Dissociação AV pode aparecer'], explain: 'Taquicardia de QRS largo deve ser tratada como ventricular até prova em contrário.' },
  { id: 'torsades', tab: 'taqui', name: 'Torsades de pointes', rhythm: 'torsades', pattern: 'normal', rate: 190, type: 'TV polimórfica', features: ['Amplitude variável', 'Eixo “torcendo”', 'Associada a QT longo'], explain: 'TV polimórfica com variação cíclica da amplitude e eixo.' },
  { id: 'vf', tab: 'taqui', name: 'Fibrilação ventricular', rhythm: 'vf', pattern: 'normal', rate: 240, type: 'Ritmo de PCR', features: ['Caótico', 'Sem QRS organizado'], explain: 'Ritmo caótico sem débito organizado; contexto de parada cardiorrespiratória.' },
  { id: 'stemi-anterior', tab: 'iam', name: 'IAM com supra anterior', rhythm: 'sinus', pattern: 'stemi-anterior', rate: 86, type: 'IAM com supra', features: ['Supra em V2–V4', 'T hiperagudas', 'Possível Q evolutiva'], explain: 'Padrão compatível com injúria transmural anterior no contexto clínico adequado.' },
  { id: 'stemi-inferior', tab: 'iam', name: 'IAM com supra inferior', rhythm: 'sinus', pattern: 'stemi-inferior', rate: 82, type: 'IAM com supra', features: ['Supra em II, III, aVF', 'Recíproca em I/aVL'], explain: 'Padrão inferior; avaliar VD/posterior conforme contexto e derivações adicionais.' },
  { id: 'stemi-lateral', tab: 'iam', name: 'IAM lateral alto/lateral', rhythm: 'sinus', pattern: 'stemi-lateral', rate: 88, type: 'IAM com supra', features: ['Supra em I/aVL ± V5–V6'], explain: 'Padrão lateral; pode ser sutil e depender de recíprocas.' },
  { id: 'posterior', tab: 'iam', name: 'IAM posterior', rhythm: 'sinus', pattern: 'stemi-posterior', rate: 85, type: 'IAM equivalente', features: ['Infra em V1–V3', 'R alto anterior', 'Confirmar V7–V9'], explain: 'Padrão espelho de supra posterior; considerar derivações posteriores.' },
  { id: 'rv', tab: 'iam', name: 'Infarto de VD', rhythm: 'sinus', pattern: 'rv-infarct', rate: 78, type: 'Extensão de IAM inferior', features: ['Supra inferior + V1/V4R', 'Suspeitar em hipotensão'], explain: 'Suspeitar especialmente em IAM inferior com sinais hemodinâmicos.' },
  { id: 'de-winter', tab: 'iam', name: 'De Winter', rhythm: 'sinus', pattern: 'de-winter', rate: 92, type: 'Oclusão coronariana', features: ['Infra ascendente em V1–V6', 'T altas e simétricas', 'Sem supra clássico'], explain: 'Padrão descrito como equivalente anterior de oclusão coronariana.' },
  { id: 'wellens-a', tab: 'iam', name: 'Wellens A', rhythm: 'sinus', pattern: 'wellens-a', rate: 70, type: 'Reperfusão/LAD crítica', features: ['T bifásica V2–V3', 'Paciente pode estar sem dor'], explain: 'Padrão de alto risco para lesão crítica proximal de DA no cenário adequado.' },
  { id: 'wellens-b', tab: 'iam', name: 'Wellens B', rhythm: 'sinus', pattern: 'wellens-b', rate: 70, type: 'Reperfusão/LAD crítica', features: ['T profundamente invertida V2–V4'], explain: 'Forma com inversão profunda e simétrica de T em precordiais anteriores.' },
  { id: 'aslanger', tab: 'iam', name: 'Aslanger', rhythm: 'sinus', pattern: 'aslanger', rate: 88, type: 'Oclusão inferior sutil', features: ['Supra isolado em III', 'Infra em I/aVL/V5–V6', 'V1 > V2'], explain: 'Padrão descrito em OMI inferior com doença multiarterial concomitante.' },
  { id: 'south-african-flag', tab: 'iam', name: 'Sinal da África do Sul', rhythm: 'sinus', pattern: 'south-african-flag', rate: 88, type: 'Oclusão diagonal/lateral alta', features: ['Supra em I, aVL, V2', 'Infra em III/inferiores'], explain: 'Padrão visual associado a oclusão de diagonal/lateral alta.' },
  { id: 'left-main', tab: 'iam', name: 'Tronco / multiarterial', rhythm: 'sinus', pattern: 'left-main-avr', rate: 96, type: 'Isquemia difusa', features: ['Supra em aVR', 'Infra difuso'], explain: 'Padrão de isquemia subendocárdica difusa; avaliar tronco, proximal DA ou choque/demanda.' },
  { id: 'hyperacute', tab: 'iam', name: 'Ondas T hiperagudas', rhythm: 'sinus', pattern: 'hyperacute-t', rate: 84, type: 'OMI precoce', features: ['T volumosas', 'Proporcionais ao QRS', 'Pode preceder supra'], explain: 'Sinal inicial possível de oclusão antes do supra franco.' },
  { id: 'lbbb', tab: 'iam', name: 'BRE / Sgarbossa', rhythm: 'sinus', pattern: 'lbbb', rate: 78, type: 'QRS largo com isquemia difícil', features: ['QRS largo', 'Discordância esperada', 'Aplicar Sgarbossa modificado'], explain: 'No bloqueio de ramo esquerdo, avaliar concordância e discordância excessiva.' },
  { id: 'rbbb', tab: 'ritmos', name: 'BRD', rhythm: 'sinus', pattern: 'rbbb', rate: 76, type: 'Condução intraventricular', features: ['QRS largo', 'rSR’ em V1', 'S ampla lateral'], explain: 'Bloqueio de ramo direito, importante na interpretação de dor torácica e taquicardias.' },
  { id: 'brugada', tab: 'ritmos', name: 'Brugada tipo 1', rhythm: 'sinus', pattern: 'brugada', rate: 76, type: 'Padrão canalopatia', features: ['Supra em cúpula V1–V2', 'T negativa'], explain: 'Padrão sugestivo em derivações direitas; correlacionar com história e contexto.' },
  { id: 'hyperk', tab: 'ritmos', name: 'Hipercalemia', rhythm: 'sinus', pattern: 'hyperkalemia', rate: 68, type: 'Distúrbio metabólico', features: ['T apiculada', 'P achatada', 'QRS alargando'], explain: 'Padrão dinâmico de toxicidade elétrica por potássio elevado.' },
  { id: 'wpw', tab: 'taqui', name: 'Pré-excitação / WPW', rhythm: 'sinus', pattern: 'wpw', rate: 78, type: 'Via acessória', features: ['PR curto', 'Onda delta', 'QRS alargado inicial'], explain: 'Pré-excitação ventricular por via acessória; muda conduta em FA pré-excitada.' }
];

function searchMatch(item, q) {
  if (!q) return true;
  const text = [item.name, item.type, item.explain, ...item.features].join(' ').toLowerCase();
  return text.includes(q.toLowerCase());
}

export function EcgApp() {
  const [tab, setTab] = useState('ritmos');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => ECG_PATTERNS.filter((item) => item.tab === tab && searchMatch(item, query)), [tab, query]);
  const [selectedId, setSelectedId] = useState('sinus');
  const selected = ECG_PATTERNS.find((item) => item.id === selectedId && item.tab === tab) || filtered[0] || ECG_PATTERNS[0];

  const report = `SIMMples ECG\nPadrão selecionado: ${selected.name}\nGrupo: ${selected.type}\nAchados: ${selected.features.join('; ')}\nInterpretação: ${selected.explain}`;

  return (
    <div className="compact-module">
      <Segmented value={tab} onChange={(value) => { setTab(value); setSelectedId(''); }} options={tabs} />
      <Card className="compact-card" title="ECG dinâmico" kicker="Curvas desenhadas no app">
        <div className="search-box"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ritmo, IAM, Wellens, Aslanger..." /></div>
        <div className="selector-scroll">
          {filtered.map((item) => (
            <button key={item.id} type="button" className={selected.id === item.id ? 'selector-chip active' : 'selector-chip'} onClick={() => setSelectedId(item.id)}>
              <span>{item.name}</span><small>{item.type}</small>
            </button>
          ))}
        </div>
        <div className="ecg-feature-card">
          <div>
            <span className="kicker">{selected.type}</span>
            <h3>{selected.name}</h3>
            <p>{selected.explain}</p>
          </div>
          <HeartPulse size={32} />
        </div>
        <EcgStrip title={`DII — ${selected.name}`} helper="Traçado animado e gerado em SVG, não imagem estática." pattern={selected.pattern} rhythm={selected.rhythm} rate={selected.rate} lead="II" />
        <EcgTwelveLead pattern={selected.pattern} rhythm={selected.rhythm} rate={selected.rate} />
      </Card>

      <Card className="compact-card" title="Achados-chave">
        <div className="tag-list">
          {selected.features.map((feature) => <span className="tag" key={feature}>{feature}</span>)}
        </div>
        <div className="notice-box top-gap"><AlertTriangle size={15} /> Curvas são didáticas e dinâmicas para reconhecimento visual. ECG real, calibração, filtros, derivações adicionais e contexto clínico continuam obrigatórios.</div>
        <CopyButton text={report}><Activity size={18} /> Copiar resumo ECG</CopyButton>
      </Card>
    </div>
  );
}
