import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, Archive, Bot, BrainCircuit, Clipboard, Clock3, Download, FilePlus2,
  FileText, HeartPulse, History, Import, KeyRound, LayoutTemplate, Lock, NotebookPen,
  Plus, Save, Search, ShieldCheck, Sparkles, Stethoscope, Trash2, Upload, UserRound,
  UsersRound, WandSparkles, ChevronRight, X, AlertTriangle, UserPlus, LockKeyhole, CheckCircle2
} from 'lucide-react';
import { Card, Result } from '../components/Layout.jsx';
import { Segmented } from '../components/Inputs.jsx';
import { CopyButton } from '../components/CopyButton.jsx';
import { hasVault, importEncryptedVault, loadVault, readEncryptedVault, resetVault, saveVault } from '../lib/secureVault.js';
import { deriveClinicalHypotheses } from '../lib/clinicalReasoning.js';
import { HorizontalRail } from '../components/HorizontalRail.jsx';

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


function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeVaultPayload(payload = {}) {
  const patients = Array.isArray(payload.patients)
    ? payload.patients.map((patient) => ({
        ...EMPTY_PATIENT,
        ...patient,
        id: patient?.id || uid('patient'),
        name: String(patient?.name || ''),
        bed: String(patient?.bed || ''),
        age: String(patient?.age || ''),
        priority: ['estavel', 'atencao', 'critico'].includes(patient?.priority) ? patient.priority : 'estavel',
        events: Array.isArray(patient?.events)
          ? patient.events
              .map((event) => ({
                id: event?.id || uid('event'),
                kind: event?.kind === 'intercorrencia' ? 'intercorrencia' : 'evolucao',
                text: cleanClinicalText(event?.text),
                createdAt: event?.createdAt || new Date().toISOString()
              }))
              .filter((event) => event.text)
          : [],
        tags: Array.isArray(patient?.tags) ? patient.tags.filter(Boolean).map(String) : []
      }))
    : [];

  const templates = Array.isArray(payload.templates)
    ? payload.templates
        .map((template) => ({
          id: template?.id || uid('template'),
          name: sanitizeClinicalPhrase(template?.name),
          type: ['evolucao', 'exame', 'pocus', 'intercorrencia'].includes(template?.type) ? template.type : 'evolucao',
          content: cleanClinicalText(template?.content)
        }))
        .filter((template) => template.name && template.content)
    : [];

  return {
    ...EMPTY_DATA,
    ...payload,
    patients,
    templates: templates.length ? templates : DEFAULT_TEMPLATES,
    preferences: { ...EMPTY_DATA.preferences, ...(payload.preferences || {}) }
  };
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const INVALID_CLINICAL_FRAGMENT = /^(pista|achado|sinal|evid[eê]ncia|hip[oó]tese|suspeita|compatibilidade)\s*[.:;,–—-]*$/i;

function cleanClinicalText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u00A0\t]+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([.!?])(?:\s*\1)+/g, '$1')
    .replace(/\b(?:Pista|Achado|Sinal)\s*[.:;,–—-]+\s*(?=$|\n)/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
    .join('\n')
    .trim();
}

function sanitizeClinicalPhrase(value, fallback = '') {
  const text = cleanClinicalText(value)
    .replace(/^[•·▪◦\-–—]+\s*/, '')
    .replace(/\s*[.:;,–—-]+$/, (ending) => ending.includes('.') || ending.includes('?') || ending.includes('!') ? ending : '');
  if (!text || INVALID_CLINICAL_FRAGMENT.test(text) || text.length < 3) return fallback;
  return text;
}

function completeSentence(value, fallback = '') {
  const text = sanitizeClinicalPhrase(value, fallback);
  if (!text) return '';
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function joinClinicalList(items) {
  const cleanItems = [...new Set(items.map((item) => sanitizeClinicalPhrase(item)).filter(Boolean))];
  if (cleanItems.length <= 1) return cleanItems[0] || '';
  if (cleanItems.length === 2) return `${cleanItems[0]} e ${cleanItems[1]}`;
  return `${cleanItems.slice(0, -1).join(', ')} e ${cleanItems.at(-1)}`;
}

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}

function buildEvolutionText(patient, includeIdentification = false) {
  if (!patient) return '';
  const sections = [
    ['História clínica', patient.story],
    ['Exame físico', patient.exam],
    ['POCUS / procedimentos', patient.pocus],
    ['Impressão diagnóstica', patient.assessment],
    ['Conduta / plano', patient.plan]
  ].filter(([, content]) => cleanClinicalText(content));

  const body = sections.map(([title, content]) => `${title}:\n${cleanClinicalText(content)}`).join('\n\n');
  if (!includeIdentification) return body;
  const identification = [
    patient.name ? `Paciente: ${cleanClinicalText(patient.name)}` : '',
    patient.bed ? `Leito: ${cleanClinicalText(patient.bed)}` : ''
  ].filter(Boolean).join(' | ');
  return [identification, body].filter(Boolean).join('\n\n');
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

function TextArea({ label, value, onChange, placeholder, rows = 6, fieldKey = '' }) {
  return (
    <label className="field text-field">
      <span>{label}</span>
      <textarea data-plantao-field={fieldKey || undefined} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} />
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
      <button type="button" className="plantao-action plantao-action-primary plantao-action-wide plantao-gate-main-action" onClick={submit} disabled={loading}>
        <span className="plantao-button-icon">{mode === 'create' ? <ShieldCheck size={18}/> : <LockKeyhole size={18}/>}</span>
        <span className="plantao-action-copy">
          <strong>{loading ? 'Abrindo o cofre...' : mode === 'create' ? 'Criar cofre clínico' : 'Desbloquear Plantão'}</strong>
          <small>{mode === 'create' ? 'Criptografia local e senha sob seu controle' : 'Acessar pacientes, evoluções e modelos'}</small>
        </span>
        <ChevronRight size={18}/>
      </button>
      <div className="plantao-gate-actions">
        <button type="button" className="plantao-gate-secondary" onClick={() => { setMode(mode === 'create' ? 'unlock' : 'create'); setError(''); }}>
          {mode === 'create' ? <LockKeyhole size={14}/> : <Plus size={14}/>}
          <span>{mode === 'create' ? 'Já tenho um cofre' : 'Criar novo cofre'}</span>
        </button>
        <button type="button" className="plantao-gate-secondary" onClick={() => fileRef.current?.click()}><Upload size={14}/><span>Importar backup</span></button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e)=>importBackup(e.target.files?.[0])} />
      </div>
    </div>
  );
}

function ConfirmDialog({ config, onClose }) {
  if (!config) return null;
  const confirm = () => {
    config.onConfirm?.();
    onClose();
  };
  return (
    <div className="plantao-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="plantao-dialog" role="alertdialog" aria-modal="true" aria-labelledby="plantao-dialog-title" aria-describedby="plantao-dialog-message">
        <button type="button" className="plantao-dialog-close" onClick={onClose} aria-label="Fechar confirmação"><X size={18}/></button>
        <div className="plantao-dialog-icon"><AlertTriangle size={24}/></div>
        <span className="kicker">Confirmação necessária</span>
        <h3 id="plantao-dialog-title">{config.title}</h3>
        <p id="plantao-dialog-message">{config.message}</p>
        <div className="plantao-dialog-actions">
          <button type="button" className="plantao-action plantao-action-muted plantao-dialog-action" onClick={onClose}>
            <span className="plantao-button-icon"><X size={16}/></span><span>Cancelar</span>
          </button>
          <button type="button" className="plantao-action plantao-action-danger plantao-dialog-action" onClick={confirm}>
            <span className="plantao-button-icon"><CheckCircle2 size={16}/></span><span>{config.confirmLabel || 'Confirmar'}</span>
          </button>
        </div>
      </section>
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
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [expandedHypothesis, setExpandedHypothesis] = useState('');
  const inactivityRef = useRef(null);
  const importRef = useRef(null);

  const selected = data.patients.find((patient) => patient.id === selectedId) || null;
  const hypotheses = useMemo(() => deriveClinicalHypotheses(selected || EMPTY_PATIENT), [selected]);
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
    setData(normalizeVaultPayload(payload));
    setUnlocked(true);
  };

  const updatePatient = (patch) => {
    if (!selected) return;
    setData((old) => ({
      ...old,
      patients: old.patients.map((patient) => patient.id === selected.id ? { ...patient, ...patch, updatedAt: new Date().toISOString() } : patient)
    }));
  };


  const focusClinicalField = (field) => {
    window.setTimeout(() => {
      const target = document.querySelector(`[data-plantao-field="${field}"]`);
      target?.focus?.();
      target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }, 40);
  };

  const insertSnippet = (snippet) => {
    if (!selectedId || !snippet?.field || !snippet?.text) return;
    setData((old) => ({
      ...old,
      patients: old.patients.map((patient) => {
        if (patient.id !== selectedId) return patient;
        const current = String(patient[snippet.field] || '').trim();
        const alreadyPresent = normalize(current).includes(normalize(snippet.text));
        const nextValue = alreadyPresent ? current : [current, snippet.text].filter(Boolean).join('\n');
        return { ...patient, [snippet.field]: nextValue, updatedAt: new Date().toISOString() };
      })
    }));
    setTab('evolucao');
    focusClinicalField(snippet.field);
    window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Trecho inserido no campo correspondente.' }));
  };

  const addHypothesisToAssessment = (item) => {
    if (!selectedId || !item?.label) return;
    setData((old) => ({
      ...old,
      patients: old.patients.map((patient) => {
        if (patient.id !== selectedId) return patient;
        const current = String(patient.assessment || '').trim();
        const line = item.why ? `${item.label}: ${item.why}` : item.label;
        const alreadyPresent = normalize(current).includes(normalize(item.label));
        return {
          ...patient,
          assessment: alreadyPresent ? current : [current, line].filter(Boolean).join('\n'),
          updatedAt: new Date().toISOString()
        };
      })
    }));
    setTab('evolucao');
    focusClinicalField('assessment');
    window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Hipótese adicionada à impressão diagnóstica.' }));
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
    const text = kind === 'evolucao' ? buildEvolutionText(selected) : cleanClinicalText(selected.notes);
    if (!text) {
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: kind === 'evolucao' ? 'Preencha ao menos uma seção da evolução.' : 'Descreva a intercorrência antes de registrar.' }));
      return;
    }
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
    const content = buildEvolutionText(selected);
    if (!content) {
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Preencha a evolução antes de salvá-la como modelo.' }));
      return;
    }
    const template = { id: uid('template'), name: `Modelo de ${selected.name || selected.bed || 'evolução'}`, type: 'evolucao', content };
    setData((old) => ({ ...old, templates: [template, ...old.templates] }));
    window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Evolução salva como modelo personalizável.' }));
  };

  const createTemplate = () => {
    if (!templateDraft.name.trim() || !templateDraft.content.trim()) {
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Informe o nome e o conteúdo do modelo.' }));
      return;
    }
    const nextTemplate = { id: uid('template'), name: sanitizeClinicalPhrase(templateDraft.name), type: templateDraft.type, content: cleanClinicalText(templateDraft.content) };
    setData((old) => ({ ...old, templates: [nextTemplate, ...old.templates] }));
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
      setAiAnswer(cleanClinicalText(result.answer || 'Sem resposta.'));
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
        <button type="button" className="plantao-lock-button" onClick={lock} aria-label="Bloquear o cofre clínico">
          <span className="plantao-button-icon"><LockKeyhole size={15}/></span>
          <span className="plantao-lock-copy"><strong>Bloquear</strong><small>Encerrar sessão</small></span>
        </button>
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
            <button type="button" className="plantao-action plantao-action-primary plantao-action-wide top-gap" onClick={createPatient}>
              <span className="plantao-button-icon"><UserPlus size={18}/></span>
              <span className="plantao-action-copy"><strong>Adicionar paciente</strong><small>Abrir um registro clínico criptografado</small></span>
              <ChevronRight size={18}/>
            </button>
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
              <span className={`priority-badge priority-${selected.priority}`}>{selected.priority === 'critico' ? 'Crítico' : selected.priority === 'atencao' ? 'Atenção' : 'Estável'}</span>
              <button type="button" className="plantao-action plantao-action-compact plantao-action-purple plantao-save-template" onClick={saveCurrentAsTemplate}>
                <span className="plantao-button-icon"><LayoutTemplate size={15}/></span>
                <span className="plantao-action-copy"><strong>Salvar como modelo</strong><small>Reutilizar esta estrutura</small></span>
                <ChevronRight size={15}/>
              </button>
              <button type="button" className="plantao-icon-button plantao-icon-danger" aria-label="Excluir paciente" title="Excluir paciente" onClick={()=>setConfirmDialog({
                title: 'Excluir este paciente?',
                message: 'O paciente e toda a linha do tempo serão removidos permanentemente deste cofre.',
                confirmLabel: 'Excluir paciente',
                onConfirm: () => { setData((old)=>({...old,patients:old.patients.filter((p)=>p.id!==selected.id)})); setSelectedId(''); setTab('pacientes'); }
              })}><Trash2 size={16}/></button>
            </div>
          </Card>
          <Card title="História e evolução" kicker="Texto aberto e editável">
            <div className="smart-composer-bar">
              <span><Sparkles size={14}/> Inserção rápida</span>
              <HorizontalRail className="smart-composer-rail" viewportClassName="smart-composer-options" ariaLabel="Atalhos de texto clínico">
                {QUICK_SNIPPETS.map((snippet)=><button type="button" key={snippet.label} onClick={()=>insertSnippet(snippet)}>{snippet.label}</button>)}
              </HorizontalRail>
            </div>
            <label className="field"><span>Queixa principal</span><div className="field-box"><input value={selected.chiefComplaint} onChange={(e)=>updatePatient({chiefComplaint:e.target.value})} placeholder="Motivo principal do atendimento" /></div></label>
            <TextArea fieldKey="story" label="História clínica" value={selected.story} onChange={(value)=>updatePatient({story:value})} placeholder="Escreva livremente. As hipóteses são atualizadas enquanto você digita..." rows={8}/>
            <TextArea fieldKey="exam" label="Exame físico" value={selected.exam} onChange={(value)=>updatePatient({exam:value})} placeholder="Exame geral, neurológico, cardiovascular, respiratório, abdominal..." rows={7}/>
            <TextArea fieldKey="pocus" label="POCUS / procedimentos" value={selected.pocus} onChange={(value)=>updatePatient({pocus:value})} placeholder="Achados, janelas, limitações e integração clínica..." rows={5}/>
            <TextArea fieldKey="assessment" label="Impressão diagnóstica" value={selected.assessment} onChange={(value)=>updatePatient({assessment:value})} placeholder="Hipótese principal e diferenciais..." rows={5}/>
            <TextArea fieldKey="plan" label="Conduta / plano" value={selected.plan} onChange={(value)=>updatePatient({plan:value})} placeholder="Condutas, pendências, metas e reavaliação..." rows={6}/>
            <div className="button-row top-gap">
              <button type="button" className="plantao-action plantao-action-secondary" onClick={()=>addEvent('evolucao')}>
                <span className="plantao-button-icon"><History size={17}/></span>
                <span className="plantao-action-copy"><strong>Salvar evolução</strong><small>Adicionar à linha do tempo</small></span>
              </button>
              <CopyButton text={buildEvolutionText(selected, true)}><Clipboard size={17}/> Copiar evolução</CopyButton>
            </div>
          </Card>
          <Card title="Intercorrência rápida" kicker="Registro cronológico">
            <TextArea fieldKey="notes" label="Descrição" value={selected.notes} onChange={(value)=>updatePatient({notes:value})} placeholder="Evento, horário, sinais vitais, avaliação, conduta e resposta..." rows={5}/>
            <button type="button" className="plantao-action plantao-action-primary plantao-action-wide" onClick={()=>addEvent('intercorrencia')}><span className="plantao-button-icon"><NotebookPen size={17}/></span><span className="plantao-action-copy"><strong>Registrar intercorrência</strong><small>Adicionar evento à linha do tempo</small></span><ChevronRight size={18}/></button>
          </Card>
        </> : <div className="empty-state tall"><UserRound size={32}/><strong>Selecione um paciente</strong><span>Acesse a aba Pacientes para abrir ou criar um registro.</span></div>
      )}

      {tab === 'hipoteses' && (
        selected ? <>
          <Card title="Hipóteses dinâmicas" kicker="Motor clínico local">
            <div className="hypothesis-intro"><BrainCircuit size={22}/><p>O motor local interpreta contexto, negações, dados objetivos e combinações sindrômicas. Ele prioriza coerência clínica e não substitui avaliação médica nem confirmação diagnóstica.</p></div>
            <div className="hypothesis-grid">
              {hypotheses.length ? hypotheses.map((item)=>{
                const isExpanded = expandedHypothesis === item.label;
                const toggleHypothesis = () => setExpandedHypothesis(isExpanded ? '' : item.label);
                return (
                  <article key={item.label} className={`hypothesis-card hypothesis-${item.level} ${isExpanded ? 'hypothesis-expanded' : ''}`}>
                    <button type="button" className="hypothesis-card-toggle" aria-expanded={isExpanded} onClick={toggleHypothesis}>
                      <div className="hypothesis-card-head"><span className="hypothesis-confidence">{item.confidence}</span><span className="hypothesis-count">Índice {item.score.toFixed(1)}</span></div>
                      <strong>{item.label}</strong>
                      <p>{item.why}</p>
                      <span className="hypothesis-expand-label">{isExpanded ? 'Recolher detalhes' : 'Ver elementos reconhecidos'}</span>
                    </button>
                    <div className="hypothesis-detail-panel" hidden={!isExpanded}>
                      {item.evidenceSummary && <small className="hypothesis-summary">{item.evidenceSummary}</small>}
                      <div className="hypothesis-evidence" aria-label="Elementos clínicos reconhecidos">{item.evidence.map((evidence)=><span key={evidence}>{evidence}</span>)}</div>
                      {item.contrary?.length > 0 && <div className="hypothesis-contrary" aria-label="Elementos contrários">{item.contrary.map((evidence)=><span key={evidence}>{evidence}</span>)}</div>}
                    </div>
                    <div className="hypothesis-card-footer">
                      <button type="button" className="hypothesis-add-button" onClick={() => addHypothesisToAssessment(item)}>
                        <CheckCircle2 size={14}/>
                        Adicionar à impressão
                      </button>
                    </div>
                  </article>
                );
              }) : <div className="empty-state"><Sparkles size={26}/><strong>Continue preenchendo o caso</strong><span>As sugestões aparecerão quando houver achados clínicos suficientes.</span></div>}
            </div>
          </Card>
          <Card title="Revisão opcional pela SIMM AI" kicker="Privacidade primeiro">
            <label className="privacy-consent"><input type="checkbox" checked={aiAllowed} onChange={(e)=>setAiAllowed(e.target.checked)}/><span>Autorizo enviar o texto clínico deste paciente ao provedor de IA configurado no projeto. Não inclua identificadores desnecessários.</span></label>
            <button type="button" className="plantao-action plantao-action-purple plantao-action-wide" disabled={!aiAllowed || aiLoading} onClick={askAi}><span className="plantao-button-icon"><Bot size={18}/></span><span className="plantao-action-copy"><strong>{aiLoading?'Analisando o caso...':'Revisar com SIMM AI'}</strong><small>{aiAllowed?'Sugestões clínicas sem inventar dados':'Autorize o envio do texto para habilitar'}</small></span><ChevronRight size={18}/></button>
            {aiAnswer && <div className="ai-clinical-answer"><strong><WandSparkles size={16}/> Sugestões da IA</strong><p>{aiAnswer}</p></div>}
          </Card>
        </> : <div className="empty-state tall"><BrainCircuit size={32}/><strong>Selecione um paciente</strong></div>
      )}

      {tab === 'modelos' && (
        <>
          <Card title="Modelos personalizáveis" kicker="Um toque para inserir">
            <div className="template-grid">
              {data.templates.map((template)=><article className="template-card" key={template.id}><span>{template.type}</span><strong>{template.name}</strong><p>{template.content.slice(0,140)}{template.content.length>140?'…':''}</p><div className="template-card-actions"><button type="button" className="plantao-action plantao-action-mini plantao-action-purple" onClick={()=>applyTemplate(template)} disabled={!selected}><span className="plantao-button-icon"><FilePlus2 size={14}/></span><span>Inserir modelo</span></button><button type="button" className="plantao-icon-button plantao-icon-danger" aria-label={`Excluir modelo ${template.name}`} title="Excluir modelo" onClick={()=>setConfirmDialog({title:'Excluir este modelo?',message:`O modelo “${template.name}” será removido do seu cofre.`,confirmLabel:'Excluir modelo',onConfirm:()=>setData((old)=>({...old,templates:old.templates.filter((item)=>item.id!==template.id)}))})}><Trash2 size={14}/></button></div></article>)}
            </div>
          </Card>
          {learnedSnippets.length > 0 && <Card title="Sugestões aprendidas" kicker="Trechos frequentes das suas evoluções"><div className="snippet-list">{learnedSnippets.map((item)=><button type="button" key={item.text} onClick={()=>selected&&updatePatient({notes:[selected.notes,item.text].filter(Boolean).join('\n')})}><Sparkles size={14}/><span>{item.text}</span><em>{item.count}×</em></button>)}</div></Card>}
          <Card title="Criar novo modelo" kicker="Totalmente editável">
            <div className="grid-2"><label className="field"><span>Nome</span><div className="field-box"><input value={templateDraft.name} onChange={(e)=>setTemplateDraft({...templateDraft,name:e.target.value})} placeholder="Ex.: evolução cardiogênico" /></div></label><label className="field"><span>Tipo</span><div className="field-box"><select value={templateDraft.type} onChange={(e)=>setTemplateDraft({...templateDraft,type:e.target.value})}><option value="evolucao">Evolução</option><option value="exame">Exame físico</option><option value="pocus">POCUS</option><option value="intercorrencia">Intercorrência</option></select></div></label></div>
            <TextArea label="Conteúdo" value={templateDraft.content} onChange={(value)=>setTemplateDraft({...templateDraft,content:value})} placeholder="Escreva o modelo como preferir..." rows={8}/>
            <button type="button" className="plantao-action plantao-action-primary plantao-action-wide" onClick={createTemplate}><span className="plantao-button-icon"><Plus size={17}/></span><span className="plantao-action-copy"><strong>Salvar novo modelo</strong><small>Disponibilizar na biblioteca personalizada</small></span><ChevronRight size={18}/></button>
          </Card>
        </>
      )}

      {tab === 'timeline' && (
        selected ? <Card title="Linha do tempo" kicker={`${selected.events?.length || 0} registros`}>
          <div className="timeline-list">
            {(selected.events || []).length === 0 && <div className="empty-state"><History size={26}/><strong>Sem registros ainda</strong></div>}
            {(selected.events || []).map((event)=><article className="timeline-event" key={event.id}><span><Clock3 size={14}/>{formatDate(event.createdAt)}</span><strong>{event.kind === 'intercorrencia' ? 'Intercorrência' : 'Evolução'}</strong><pre>{event.text}</pre><button type="button" className="plantao-icon-button plantao-icon-danger timeline-delete" aria-label="Excluir registro da linha do tempo" title="Excluir registro" onClick={()=>setConfirmDialog({title:'Excluir este registro?',message:'O registro será removido da linha do tempo deste paciente.',confirmLabel:'Excluir registro',onConfirm:()=>updatePatient({events:selected.events.filter((item)=>item.id!==event.id)})})}><Trash2 size={14}/></button></article>)}
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
              <button type="button" className="plantao-action plantao-action-secondary plantao-action-wide" onClick={exportBackup}><span className="plantao-button-icon"><Download size={17}/></span><span className="plantao-action-copy"><strong>Exportar backup</strong><small>Arquivo criptografado para guarda segura</small></span><ChevronRight size={16}/></button>
              <button type="button" className="plantao-action plantao-action-secondary plantao-action-wide" onClick={()=>importRef.current?.click()}><span className="plantao-button-icon"><Upload size={17}/></span><span className="plantao-action-copy"><strong>Importar backup</strong><small>Restaurar um cofre compatível</small></span><ChevronRight size={16}/></button>
              <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e)=>importBackup(e.target.files?.[0])}/>
            </div>
            <label className="field top-gap"><span>Bloqueio automático</span><div className="field-box"><select value={data.preferences?.autoLockMinutes || 15} onChange={(e)=>setData((old)=>({...old,preferences:{...old.preferences,autoLockMinutes:Number(e.target.value)}}))}><option value="5">5 minutos</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="60">60 minutos</option></select></div></label>
            <div className="notice-box top-gap">Este cofre é criptografado localmente no navegador. Não é um prontuário eletrônico certificado, não substitui o sistema institucional e pode ser perdido se o navegador for apagado sem backup.</div>
            <button type="button" className="plantao-action plantao-action-danger plantao-action-wide top-gap" onClick={()=>setConfirmDialog({title:'Apagar todo o cofre local?',message:'Todos os pacientes, modelos e registros serão apagados permanentemente deste dispositivo. Esta ação não pode ser desfeita.',confirmLabel:'Apagar cofre',onConfirm:()=>{resetVault();lock();}})}><span className="plantao-button-icon"><Trash2 size={16}/></span><span className="plantao-action-copy"><strong>Apagar cofre local</strong><small>Ação permanente e irreversível</small></span><ChevronRight size={18}/></button>
          </Card>
        </>
      )}
      <ConfirmDialog config={confirmDialog} onClose={()=>setConfirmDialog(null)} />
    </div>
  );
}
