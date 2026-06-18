import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, Archive, Bot, BrainCircuit, Clipboard, Clock3, Download, FilePlus2,
  FileText, HeartPulse, History, Import, KeyRound, LayoutTemplate, Lock, NotebookPen,
  Plus, Save, Search, ShieldCheck, Sparkles, Stethoscope, Trash2, Upload, UserRound,
  UsersRound, WandSparkles
} from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { Segmented } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { hasVault, importEncryptedVault, loadVault, readEncryptedVault, resetVault, saveVault } from '../lib/secureVault.js';

const DEFAULT_TEMPLATES = [
  {
    id: 'evolucao-ps',
    name: 'Evolução — Sala de Emergência',
    type: 'evolucao',
    content: `# Evolução\nPaciente em acompanhamento na Sala de Emergência.\n\n## Estado atual\n\n## Exame físico\nGeral: \nNeurológico: \nCardiovascular: \nRespiratório: \nAbdome: \nExtremidades/perfusão: \n\n## Exames / POCUS\n\n## Impressão diagnóstica\n\n## Conduta\n`
  },
  {
    id: 'exame-fisico',
    name: 'Exame físico completo',
    type: 'exame',
    content: `BEG/REG, corado, hidratado, anictérico, acianótico.\nNeurológico: Glasgow __, pupilas __, sem déficit focal evidente.\nCardiovascular: bulhas rítmicas, sem sopros evidentes, perfusão periférica __, TEC __ s.\nRespiratório: MV __, sem/ com ruídos adventícios, esforço respiratório __.\nAbdome: plano/globoso, flácido, doloroso em __, sem sinais de irritação peritoneal.\nExtremidades: pulsos __, edema __, sinais de TVP __.`
  },
  {
    id: 'pocus-rush',
    name: 'POCUS — RUSH estruturado',
    type: 'pocus',
    content: `POCUS à beira-leito:\nPump: função global de VE __; VD __; derrame pericárdico __; sinais de tamponamento __.\nTank: VCI __; perfil pulmonar __; derrame pleural __; FAST __.\nPipes: aorta abdominal __; pesquisa de TVP __.\nIntegração: achados compatíveis com __.`
  },
  {
    id: 'intercorrencia',
    name: 'Intercorrência',
    type: 'intercorrencia',
    content: `# Intercorrência\nHorário: __\nEvento: __\nSinais vitais: __\nAvaliação imediata: __\nHipóteses: __\nCondutas realizadas: __\nResposta: __\nPlano de reavaliação: __`
  }
];

const EMPTY_DATA = {
  version: 1,
  patients: [],
  templates: DEFAULT_TEMPLATES,
  preferences: { autoLockMinutes: 15 }
};

const EMPTY_PATIENT = {
  name: '', bed: '', age: '', sex: '', priority: 'estavel',
  chiefComplaint: '', story: '', exam: '', pocus: '', assessment: '', plan: '',
  notes: '', events: [], tags: []
};

const QUICK_SNIPPETS = [
  { label: 'Hemodinâmica estável', field: 'exam', text: 'Hemodinamicamente estável, perfusão periférica preservada, TEC < 3 s.' },
  { label: 'Sem esforço respiratório', field: 'exam', text: 'Eupneico em ar ambiente, sem uso de musculatura acessória.' },
  { label: 'Neurológico preservado', field: 'exam', text: 'Alerta, orientado, sem déficit focal evidente ao exame.' },
  { label: 'POCUS sem derrame', field: 'pocus', text: 'Sem derrame pericárdico significativo ao POCUS.' },
  { label: 'Pulmão perfil A', field: 'pocus', text: 'Perfil A bilateral, com deslizamento pleural preservado.' },
  { label: 'Reavaliação programada', field: 'plan', text: 'Reavaliar clínica, sinais vitais e resposta às medidas instituídas.' }
];

const HYPOTHESIS_RULES = [
  { terms: ['dor torac', 'opress', 'tropon', 'supra', 'st'], label: 'Síndrome coronariana aguda', level: 'danger', why: 'Dor torácica/isquemia/biomarcadores.' },
  { terms: ['dispne', 'hipox', 'edema', 'b linha', 'crepit'], label: 'Edema agudo de pulmão / IC', level: 'warning', why: 'Dispneia + congestão/hipoxemia.' },
  { terms: ['dispne', 'dor pleurit', 'taquic', 'tromb', 'vd dilat'], label: 'Tromboembolismo pulmonar', level: 'danger', why: 'Dispneia, dor pleurítica ou sinais de VD/TVP.' },
  { terms: ['febre', 'hipotens', 'lactato', 'foco', 'sepse'], label: 'Sepse / choque séptico', level: 'danger', why: 'Infecção suspeita com disfunção orgânica/hipoperfusão.' },
  { terms: ['deficit', 'afasia', 'hemip', 'desvio do olhar', 'nihss'], label: 'AVC agudo', level: 'danger', why: 'Déficit focal ou sinal cortical.' },
  { terms: ['cefaleia', 'pior da vida', 'rigidez', 'hsa'], label: 'Hemorragia subaracnoide', level: 'danger', why: 'Cefaleia súbita/meningismo.' },
  { terms: ['dor abdominal', 'defesa', 'periton', 'lactato'], label: 'Abdome agudo / isquemia mesentérica', level: 'warning', why: 'Dor abdominal com irritação/perfusão alterada.' },
  { terms: ['hematem', 'melena', 'hematoque', 'sangramento digest'], label: 'Hemorragia digestiva', level: 'warning', why: 'Sangramento gastrointestinal descrito.' },
  { terms: ['trauma', 'fast positiv', 'pelve', 'choque'], label: 'Choque hemorrágico no trauma', level: 'danger', why: 'Trauma + possível fonte hemorrágica.' },
  { terms: ['sibil', 'asma', 'broncoesp', 'expir'], label: 'Crise asmática / broncoespasmo', level: 'warning', why: 'Sibilância e obstrução expiratória.' },
  { terms: ['dpo', 'hipercap', 'pco2', 'sonol'], label: 'Exacerbação de DPOC / insuficiência ventilatória', level: 'warning', why: 'Doença obstrutiva + retenção de CO₂.' },
  { terms: ['oliguria', 'creatin', 'hipercal', 'renal'], label: 'Lesão renal aguda / distúrbio eletrolítico', level: 'warning', why: 'Oligúria, função renal ou potássio alterados.' },
  { terms: ['convuls', 'pos ictal', 'todd'], label: 'Crise epiléptica / estado pós-ictal', level: 'warning', why: 'Evento convulsivo ou déficit pós-ictal.' },
  { terms: ['rebaix', 'coma', 'intox', 'miose'], label: 'Intoxicação / encefalopatia tóxico-metabólica', level: 'warning', why: 'Alteração de consciência e pistas toxicológicas.' },
  { terms: ['febre', 'rigidez nuca', 'mening'], label: 'Meningite / encefalite', level: 'danger', why: 'Febre associada a sinais meníngeos/neurológicos.' },
  { terms: ['dor dorsal', 'dor rasgando', 'assimetria de pulso', 'aorta'], label: 'Síndrome aórtica aguda', level: 'danger', why: 'Dor abrupta ou sinais vasculares/aórticos.' },
  { terms: ['hipotens', 'derrame pericard', 'tampon', 'vc i pletor'], label: 'Tamponamento cardíaco', level: 'danger', why: 'Instabilidade com achados pericárdicos/venosos.' },
  { terms: ['ausencia de sliding', 'lung point', 'pneumotorax'], label: 'Pneumotórax', level: 'danger', why: 'Achados pulmonares compatíveis.' },
  { terms: ['hiperglic', 'cetona', 'anion gap', 'cetoacid'], label: 'Cetoacidose diabética', level: 'warning', why: 'Hiperglicemia com cetose/acidose e ânion gap.' },
  { terms: ['palpit', 'taquicardia', 'qrs largo', 'arritm'], label: 'Taquiarritmia', level: 'warning', why: 'Sintomas e achados eletrocardiográficos de arritmia.' }
];

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function formatDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function deriveHypotheses(patient) {
  const source = normalize([
    patient.chiefComplaint, patient.story, patient.exam, patient.pocus,
    patient.assessment, patient.notes, patient.events?.map((item) => item.text).join(' ')
  ].join(' '));
  if (!source.trim()) return [];
  return HYPOTHESIS_RULES.map((rule) => {
    const hits = rule.terms.filter((term) => source.includes(normalize(term)));
    return { ...rule, hits, score: hits.length };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);
}

function frequentSnippets(data) {
  const texts = data.patients.flatMap((patient) => patient.events || []).map((event) => event.text || '').filter((text) => text.length > 40);
  const counts = new Map();
  texts.forEach((text) => {
    text.split(/\n+/).map((line) => line.trim()).filter((line) => line.length >= 25 && line.length <= 180).forEach((line) => {
      const key = normalize(line);
      const current = counts.get(key) || { text: line, count: 0 };
      current.count += 1;
      counts.set(key, current);
    });
  });
  return [...counts.values()].filter((item) => item.count >= 2).sort((a, b) => b.count - a.count).slice(0, 8);
}

function TextArea({ label, value, onChange, placeholder, rows = 6 }) {
  return (
    <label className="field text-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} />
    </label>
  );
}

function VaultGate({ onUnlock }) {
  const exists = hasVault();
  const [mode, setMode] = useState(exists ? 'unlock' : 'create');
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const submit = async () => {
    setError('');
    if (passphrase.length < 6) return setError('Use pelo menos 6 caracteres.');
    if (mode === 'create' && passphrase !== confirm) return setError('As senhas não coincidem.');
    setLoading(true);
    try {
      if (mode === 'create') await saveVault(passphrase, EMPTY_DATA);
      const payload = await loadVault(passphrase);
      onUnlock(passphrase, payload);
    } catch (err) {
      setError(err.message || 'Falha ao abrir o cofre.');
    } finally {
      setLoading(false);
    }
  };

  const importBackup = async (file) => {
    if (!file) return;
    try {
      importEncryptedVault(await file.text());
      setMode('unlock');
      setError('Backup importado. Digite a senha do cofre.');
    } catch (err) {
      setError(err.message || 'Não foi possível importar.');
    }
  };

  return (
    <div className="plantao-gate">
      <div className="plantao-gate-orb"><Lock size={34} /></div>
      <span className="kicker">Cofre clínico local</span>
      <h2>{mode === 'create' ? 'Criar SIMMples Plantão' : 'Desbloquear SIMMples Plantão'}</h2>
      <p>Os dados são cifrados no aparelho com AES-GCM. A senha não é armazenada e não pode ser recuperada.</p>
      <label className="field plantao-password">
        <span>Senha do cofre</span>
        <div className="field-box"><KeyRound size={17} /><input type="password" value={passphrase} onChange={(e)=>setPassphrase(e.target.value)} placeholder="Mínimo de 6 caracteres" /></div>
      </label>
      {mode === 'create' && (
        <label className="field plantao-password">
          <span>Confirmar senha</span>
          <div className="field-box"><ShieldCheck size={17} /><input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="Repita a senha" /></div>
        </label>
      )}
      {error && <div className="plantao-gate-error">{error}</div>}
      <button type="button" className="primary-button" onClick={submit} disabled={loading}>
        <Lock size={18} /> {loading ? 'Abrindo...' : mode === 'create' ? 'Criar cofre' : 'Desbloquear'}
      </button>
      <div className="plantao-gate-actions">
        <button type="button" onClick={() => { setMode(mode === 'create' ? 'unlock' : 'create'); setError(''); }}>
          {mode === 'create' ? 'Já tenho um cofre' : 'Criar novo cofre'}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()}><Upload size={14}/> Importar backup</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e)=>importBackup(e.target.files?.[0])} />
      </div>
    </div>
  );
}

export function PlantaoApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [data, setData] = useState(EMPTY_DATA);
  const [tab, setTab] = useState('pacientes');
  const [selectedId, setSelectedId] = useState('');
  const [patientDraft, setPatientDraft] = useState(EMPTY_PATIENT);
  const [patientSearch, setPatientSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [aiAllowed, setAiAllowed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [templateDraft, setTemplateDraft] = useState({ name: '', type: 'evolucao', content: '' });
  const inactivityRef = useRef(null);
  const importRef = useRef(null);

  const selected = data.patients.find((patient) => patient.id === selectedId) || null;
  const hypotheses = useMemo(() => deriveHypotheses(selected || EMPTY_PATIENT), [selected]);
  const learnedSnippets = useMemo(() => frequentSnippets(data), [data]);
  const filteredPatients = useMemo(() => {
    const q = normalize(patientSearch);
    return data.patients.filter((patient) => !q || normalize(`${patient.name} ${patient.bed} ${patient.chiefComplaint} ${patient.assessment}`).includes(q));
  }, [data.patients, patientSearch]);

  const lock = () => {
    setUnlocked(false);
    setPassphrase('');
    setSelectedId('');
    setAiAnswer('');
  };

  useEffect(() => {
    if (!unlocked) return undefined;
    const resetTimer = () => {
      clearTimeout(inactivityRef.current);
      const minutes = Number(data.preferences?.autoLockMinutes || 15);
      inactivityRef.current = setTimeout(lock, Math.max(1, minutes) * 60 * 1000);
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(inactivityRef.current);
      ['pointerdown', 'keydown', 'touchstart'].forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [unlocked, data.preferences?.autoLockMinutes]);

  useEffect(() => {
    if (!unlocked || !passphrase) return undefined;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await saveVault(passphrase, data);
        setLastSaved(new Date());
      } catch (err) {
        window.dispatchEvent(new CustomEvent('simm-toast', { detail: err.message || 'Falha ao salvar o cofre.' }));
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [data, unlocked, passphrase]);

  const unlock = (password, payload) => {
    setPassphrase(password);
    setData({ ...EMPTY_DATA, ...payload, templates: payload.templates?.length ? payload.templates : DEFAULT_TEMPLATES });
    setUnlocked(true);
  };

  const updatePatient = (patch) => {
    if (!selected) return;
    setData((old) => ({
      ...old,
      patients: old.patients.map((patient) => patient.id === selected.id ? { ...patient, ...patch, updatedAt: new Date().toISOString() } : patient)
    }));
  };


  const insertSnippet = (snippet) => {
    if (!selected) return;
    const current = selected[snippet.field] || '';
    updatePatient({ [snippet.field]: current ? `${current}
${snippet.text}` : snippet.text });
    window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Trecho inserido. Edite livremente.' }));
  };

  const createPatient = () => {
    if (!patientDraft.name.trim() && !patientDraft.bed.trim()) {
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Informe ao menos nome ou leito.' }));
      return;
    }
    const patient = { ...EMPTY_PATIENT, ...patientDraft, id: uid('patient'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setData((old) => ({ ...old, patients: [patient, ...old.patients] }));
    setSelectedId(patient.id);
    setPatientDraft(EMPTY_PATIENT);
    setTab('evolucao');
  };

  const addEvent = (kind = 'evolucao') => {
    if (!selected) return;
    const text = kind === 'evolucao'
      ? `Evolução:\n${selected.story}\n\nExame físico:\n${selected.exam}\n\nPOCUS:\n${selected.pocus}\n\nImpressão diagnóstica:\n${selected.assessment}\n\nConduta:\n${selected.plan}`
      : selected.notes;
    if (!text.trim()) return;
    const event = { id: uid('event'), kind, text, createdAt: new Date().toISOString() };
    updatePatient({ events: [event, ...(selected.events || [])] });
    window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Registro adicionado à linha do tempo.' }));
  };

  const applyTemplate = (template) => {
    if (!selected) return;
    const target = template.type === 'exame' ? 'exam' : template.type === 'pocus' ? 'pocus' : template.type === 'intercorrencia' ? 'notes' : 'story';
    const current = selected[target] || '';
    updatePatient({ [target]: current ? `${current}\n\n${template.content}` : template.content });
    setTab('evolucao');
  };

  const saveCurrentAsTemplate = () => {
    if (!selected) return;
    const content = [selected.story, selected.exam, selected.pocus, selected.assessment, selected.plan].filter(Boolean).join('\n\n');
    if (!content.trim()) return;
    const template = { id: uid('template'), name: `Modelo de ${selected.name || selected.bed || 'evolução'}`, type: 'evolucao', content };
    setData((old) => ({ ...old, templates: [template, ...old.templates] }));
    window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Evolução salva como modelo personalizável.' }));
  };

  const createTemplate = () => {
    if (!templateDraft.name.trim() || !templateDraft.content.trim()) return;
    setData((old) => ({ ...old, templates: [{ ...templateDraft, id: uid('template') }, ...old.templates] }));
    setTemplateDraft({ name: '', type: 'evolucao', content: '' });
  };

  const importLastReport = () => {
    if (!selected) return;
    try {
      const report = JSON.parse(localStorage.getItem('simm-last-report') || 'null');
      if (!report?.text) throw new Error();
      updatePatient({ notes: [selected.notes, `[${report.source || 'SIMM Suite'} — ${formatDate(report.createdAt)}]\n${report.text}`].filter(Boolean).join('\n\n') });
      setTab('evolucao');
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Último relatório importado para o paciente.' }));
    } catch {
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Nenhum relatório copiado recentemente.' }));
    }
  };

  const askAi = async () => {
    if (!selected || !aiAllowed) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const response = await fetch('/api/simm-ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appTitle: 'SIMMples Plantão',
          appSubtitle: 'Revisão opcional de evolução clínica',
          mode: 'Sugira hipóteses diagnósticas diferenciais, red flags, dados faltantes e uma organização objetiva da avaliação. Não invente dados e deixe explícito que são sugestões.',
          userQuestion: 'Analise o caso clínico abaixo.',
          pageContext: `Queixa: ${selected.chiefComplaint}\nHistória: ${selected.story}\nExame: ${selected.exam}\nPOCUS: ${selected.pocus}\nImpressão atual: ${selected.assessment}\nPlano: ${selected.plan}`
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha na análise.');
      setAiAnswer(result.answer || 'Sem resposta.');
    } catch (err) {
      setAiAnswer(err.message || 'Falha ao chamar a IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const exportBackup = () => {
    const blob = new Blob([readEncryptedVault()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `simm-plantao-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file) => {
    if (!file) return;
    try {
      importEncryptedVault(await file.text());
      lock();
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Backup importado. Desbloqueie com a senha correspondente.' }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: err.message || 'Backup inválido.' }));
    }
  };

  const openModule = (slug) => window.dispatchEvent(new CustomEvent('simm:navigate', { detail: slug }));

  if (!unlocked) return <VaultGate onUnlock={unlock} />;

  const tabs = [
    { value: 'pacientes', label: 'Pacientes' },
    { value: 'evolucao', label: 'Evolução' },
    { value: 'hipoteses', label: 'Hipóteses' },
    { value: 'modelos', label: 'Modelos' },
    { value: 'timeline', label: 'Linha do tempo' },
    { value: 'integracoes', label: 'Integrações' }
  ];

  return (
    <div className="compact-module plantao-module">
      <div className="plantao-statusbar">
        <div><ShieldCheck size={16}/><span>Cofre AES-GCM</span></div>
        <div className={saving ? 'plantao-save saving' : 'plantao-save'}><Save size={14}/>{saving ? 'Salvando...' : lastSaved ? `Salvo ${formatDate(lastSaved)}` : 'Pronto'}</div>
        <button type="button" onClick={lock}><Lock size={15}/> Bloquear</button>
      </div>

      <Segmented value={tab} onChange={setTab} options={tabs} />

      {tab === 'pacientes' && (
        <>
          <Card className="plantao-hero-card" kicker="Central de plantão" title="Pacientes em acompanhamento">
            <div className="grid-3 compact-grid">
              <Result label="Pacientes" value={data.patients.length} helper="cofre atual" />
              <Result label="Críticos" value={data.patients.filter((p)=>p.priority==='critico').length} tone={data.patients.some((p)=>p.priority==='critico') ? 'danger' : 'success'} helper="prioridade marcada" />
              <Result label="Registros" value={data.patients.reduce((sum,p)=>sum+(p.events?.length||0),0)} helper="linha do tempo" />
            </div>
          </Card>

          <Card title="Novo paciente" kicker="Cadastro rápido">
            <div className="grid-3 compact-grid">
              <label className="field"><span>Nome / identificação</span><div className="field-box"><UserRound size={16}/><input value={patientDraft.name} onChange={(e)=>setPatientDraft({...patientDraft,name:e.target.value})} placeholder="Nome ou iniciais" /></div></label>
              <label className="field"><span>Leito</span><div className="field-box"><input value={patientDraft.bed} onChange={(e)=>setPatientDraft({...patientDraft,bed:e.target.value})} placeholder="SE 03" /></div></label>
              <label className="field"><span>Idade</span><div className="field-box"><input value={patientDraft.age} onChange={(e)=>setPatientDraft({...patientDraft,age:e.target.value})} placeholder="anos" /></div></label>
            </div>
            <div className="plantao-priority-row top-gap">
              {[
                ['estavel','Estável'],['atencao','Atenção'],['critico','Crítico']
              ].map(([value,label])=><button key={value} type="button" className={patientDraft.priority===value?`priority-chip priority-${value} active`:`priority-chip priority-${value}`} onClick={()=>setPatientDraft({...patientDraft,priority:value})}>{label}</button>)}
            </div>
            <button type="button" className="primary-button top-gap" onClick={createPatient}><Plus size={18}/> Criar paciente</button>
          </Card>

          <Card title="Lista do plantão" kicker="Busca instantânea">
            <div className="search-box"><Search size={16}/><input value={patientSearch} onChange={(e)=>setPatientSearch(e.target.value)} placeholder="Buscar por nome, leito, queixa ou hipótese..." /></div>
            <div className="patient-list top-gap">
              {filteredPatients.length === 0 && <div className="empty-state"><UsersRound size={26}/><strong>Nenhum paciente encontrado</strong><span>Crie um novo registro ou ajuste a busca.</span></div>}
              {filteredPatients.map((patient)=>(
                <button key={patient.id} type="button" className={selectedId===patient.id?'patient-card active':'patient-card'} onClick={()=>{setSelectedId(patient.id);setTab('evolucao');}}>
                  <span className={`patient-priority priority-${patient.priority}`}></span>
                  <div><strong>{patient.name || 'Sem nome'} <em>{patient.bed || 'sem leito'}</em></strong><small>{patient.chiefComplaint || patient.assessment || 'Sem resumo clínico'}</small></div>
                  <Clock3 size={15}/>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'evolucao' && (
        selected ? <>
          <Card className="patient-context-card" kicker={`Leito ${selected.bed || '--'}`} title={selected.name || 'Paciente sem nome'}>
            <div className="patient-context-actions">
              <span className={`priority-badge priority-${selected.priority}`}>{selected.priority}</span>
              <button type="button" onClick={saveCurrentAsTemplate}><LayoutTemplate size={15}/> Salvar como modelo</button>
              <button type="button" className="danger-ghost" onClick={()=>{ if(confirm('Excluir este paciente do cofre?')) { setData((old)=>({...old,patients:old.patients.filter((p)=>p.id!==selected.id)})); setSelectedId(''); setTab('pacientes'); } }}><Trash2 size={15}/></button>
            </div>
          </Card>
          <Card title="História e evolução" kicker="Texto aberto e editável">
            <div className="smart-composer-bar">
              <span><Sparkles size={14}/> Inserção rápida</span>
              <div>{QUICK_SNIPPETS.map((snippet)=><button type="button" key={snippet.label} onClick={()=>insertSnippet(snippet)}>{snippet.label}</button>)}</div>
            </div>
            <label className="field"><span>Queixa principal</span><div className="field-box"><input value={selected.chiefComplaint} onChange={(e)=>updatePatient({chiefComplaint:e.target.value})} placeholder="Motivo principal do atendimento" /></div></label>
            <TextArea label="História clínica" value={selected.story} onChange={(value)=>updatePatient({story:value})} placeholder="Escreva livremente. As hipóteses são atualizadas enquanto você digita..." rows={8}/>
            <TextArea label="Exame físico" value={selected.exam} onChange={(value)=>updatePatient({exam:value})} placeholder="Exame geral, neurológico, cardiovascular, respiratório, abdominal..." rows={7}/>
            <TextArea label="POCUS / procedimentos" value={selected.pocus} onChange={(value)=>updatePatient({pocus:value})} placeholder="Achados, janelas, limitações e integração clínica..." rows={5}/>
            <TextArea label="Impressão diagnóstica" value={selected.assessment} onChange={(value)=>updatePatient({assessment:value})} placeholder="Hipótese principal e diferenciais..." rows={5}/>
            <TextArea label="Conduta / plano" value={selected.plan} onChange={(value)=>updatePatient({plan:value})} placeholder="Condutas, pendências, metas e reavaliação..." rows={6}/>
            <div className="button-row top-gap">
              <button type="button" className="secondary-button" onClick={()=>addEvent('evolucao')}><History size={17}/> Salvar na linha do tempo</button>
              <CopyButton text={`Paciente: ${selected.name}\nLeito: ${selected.bed}\n\nHistória:\n${selected.story}\n\nExame físico:\n${selected.exam}\n\nPOCUS:\n${selected.pocus}\n\nImpressão diagnóstica:\n${selected.assessment}\n\nConduta:\n${selected.plan}`}><Clipboard size={17}/> Copiar evolução</CopyButton>
            </div>
          </Card>
          <Card title="Intercorrência rápida" kicker="Registro cronológico">
            <TextArea label="Descrição" value={selected.notes} onChange={(value)=>updatePatient({notes:value})} placeholder="Evento, horário, sinais vitais, avaliação, conduta e resposta..." rows={5}/>
            <button type="button" className="primary-button" onClick={()=>addEvent('intercorrencia')}><NotebookPen size={17}/> Registrar intercorrência</button>
          </Card>
        </> : <div className="empty-state tall"><UserRound size={32}/><strong>Selecione um paciente</strong><span>Acesse a aba Pacientes para abrir ou criar um registro.</span></div>
      )}

      {tab === 'hipoteses' && (
        selected ? <>
          <Card title="Hipóteses dinâmicas" kicker="Motor clínico local">
            <div className="hypothesis-intro"><BrainCircuit size={22}/><p>As sugestões abaixo são geradas localmente por padrões do texto. Elas não substituem raciocínio clínico, exame ou confirmação diagnóstica.</p></div>
            <div className="hypothesis-grid">
              {hypotheses.length ? hypotheses.map((item)=>(
                <article key={item.label} className={`hypothesis-card hypothesis-${item.level}`}>
                  <span>{item.score} pista{item.score>1?'s':''}</span><strong>{item.label}</strong><p>{item.why}</p><small>{item.hits.join(' • ')}</small>
                </article>
              )) : <div className="empty-state"><Sparkles size={26}/><strong>Continue escrevendo a história</strong><span>As hipóteses aparecerão dinamicamente.</span></div>}
            </div>
          </Card>
          <Card title="Revisão opcional pela SIMM AI" kicker="Privacidade primeiro">
            <label className="privacy-consent"><input type="checkbox" checked={aiAllowed} onChange={(e)=>setAiAllowed(e.target.checked)}/><span>Autorizo enviar o texto clínico deste paciente ao provedor de IA configurado no projeto. Não inclua identificadores desnecessários.</span></label>
            <button type="button" className="primary-button" disabled={!aiAllowed || aiLoading} onClick={askAi}><Bot size={18}/>{aiLoading?'Analisando...':'Revisar caso com SIMM AI'}</button>
            {aiAnswer && <div className="ai-clinical-answer"><strong><WandSparkles size={16}/> Sugestões da IA</strong><p>{aiAnswer}</p></div>}
          </Card>
        </> : <div className="empty-state tall"><BrainCircuit size={32}/><strong>Selecione um paciente</strong></div>
      )}

      {tab === 'modelos' && (
        <>
          <Card title="Modelos personalizáveis" kicker="Um toque para inserir">
            <div className="template-grid">
              {data.templates.map((template)=><article className="template-card" key={template.id}><span>{template.type}</span><strong>{template.name}</strong><p>{template.content.slice(0,140)}{template.content.length>140?'…':''}</p><div><button type="button" onClick={()=>applyTemplate(template)} disabled={!selected}><FilePlus2 size={14}/> Inserir</button><button type="button" onClick={()=>setData((old)=>({...old,templates:old.templates.filter((item)=>item.id!==template.id)}))}><Trash2 size={14}/></button></div></article>)}
            </div>
          </Card>
          {learnedSnippets.length > 0 && <Card title="Sugestões aprendidas" kicker="Trechos frequentes das suas evoluções"><div className="snippet-list">{learnedSnippets.map((item)=><button type="button" key={item.text} onClick={()=>selected&&updatePatient({notes:[selected.notes,item.text].filter(Boolean).join('\n')})}><Sparkles size={14}/><span>{item.text}</span><em>{item.count}×</em></button>)}</div></Card>}
          <Card title="Criar novo modelo" kicker="Totalmente editável">
            <div className="grid-2"><label className="field"><span>Nome</span><div className="field-box"><input value={templateDraft.name} onChange={(e)=>setTemplateDraft({...templateDraft,name:e.target.value})} placeholder="Ex.: evolução cardiogênico" /></div></label><label className="field"><span>Tipo</span><div className="field-box"><select value={templateDraft.type} onChange={(e)=>setTemplateDraft({...templateDraft,type:e.target.value})}><option value="evolucao">Evolução</option><option value="exame">Exame físico</option><option value="pocus">POCUS</option><option value="intercorrencia">Intercorrência</option></select></div></label></div>
            <TextArea label="Conteúdo" value={templateDraft.content} onChange={(value)=>setTemplateDraft({...templateDraft,content:value})} placeholder="Escreva o modelo como preferir..." rows={8}/>
            <button type="button" className="primary-button" onClick={createTemplate}><Plus size={17}/> Salvar modelo</button>
          </Card>
        </>
      )}

      {tab === 'timeline' && (
        selected ? <Card title="Linha do tempo" kicker={`${selected.events?.length || 0} registros`}>
          <div className="timeline-list">
            {(selected.events || []).length === 0 && <div className="empty-state"><History size={26}/><strong>Sem registros ainda</strong></div>}
            {(selected.events || []).map((event)=><article className="timeline-event" key={event.id}><span><Clock3 size={14}/>{formatDate(event.createdAt)}</span><strong>{event.kind === 'intercorrencia' ? 'Intercorrência' : 'Evolução'}</strong><pre>{event.text}</pre><button type="button" onClick={()=>updatePatient({events:selected.events.filter((item)=>item.id!==event.id)})}><Trash2 size={14}/></button></article>)}
          </div>
        </Card> : <div className="empty-state tall"><History size={32}/><strong>Selecione um paciente</strong></div>
      )}

      {tab === 'integracoes' && (
        <>
          <Card title="Integração SIMM Suite" kicker="Leve dados entre os módulos">
            <div className="integration-actions">
              <button type="button" onClick={importLastReport} disabled={!selected}><Import size={18}/><span><strong>Importar último relatório</strong><small>Usa o último resumo copiado em qualquer módulo.</small></span></button>
              {[
                ['ecg','ECG',Activity],['iam','IAM',HeartPulse],['avc','AVC',BrainCircuit],['pocus','POCUS',Stethoscope],['gaso','GASO',FileText],['vent','VENT',Activity],['calc','Calc',FileText],['trauma','Trauma',Archive],['sepse','Sepse',ShieldCheck],['ped','PED',UsersRound],['intox','INTOX',Bot],['peconha','PEÇONHA',ShieldCheck]
              ].map(([slug,label,Icon])=><button type="button" key={slug} onClick={()=>openModule(slug)}><Icon size={18}/><span><strong>Abrir SIMMples {label}</strong><small>Calcule, copie o relatório e importe aqui.</small></span></button>)}
            </div>
          </Card>
          <Card title="Segurança e backup" kicker="Controle do usuário">
            <div className="grid-2 compact-grid">
              <button type="button" className="secondary-button" onClick={exportBackup}><Download size={17}/> Exportar backup criptografado</button>
              <button type="button" className="secondary-button" onClick={()=>importRef.current?.click()}><Upload size={17}/> Importar backup</button>
              <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e)=>importBackup(e.target.files?.[0])}/>
            </div>
            <label className="field top-gap"><span>Bloqueio automático</span><div className="field-box"><select value={data.preferences?.autoLockMinutes || 15} onChange={(e)=>setData((old)=>({...old,preferences:{...old.preferences,autoLockMinutes:Number(e.target.value)}}))}><option value="5">5 minutos</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="60">60 minutos</option></select></div></label>
            <div className="notice-box top-gap">Este cofre é criptografado localmente no navegador. Não é um prontuário eletrônico certificado, não substitui o sistema institucional e pode ser perdido se o navegador for apagado sem backup.</div>
            <button type="button" className="danger-button top-gap" onClick={()=>{if(confirm('Apagar permanentemente todo o cofre deste dispositivo?')){resetVault();lock();}}}><Trash2 size={16}/> Apagar cofre local</button>
          </Card>
        </>
      )}
    </div>
  );
}
