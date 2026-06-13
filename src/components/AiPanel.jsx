import { useMemo, useState } from 'react';
import { Bot, CheckCircle2, ClipboardCheck, Copy, FileText, Loader2, MessageSquare, Sparkles } from 'lucide-react';

const ACTIONS = [
  { id: 'explicar', label: 'Explicar tela', icon: MessageSquare, prompt: 'Explique de forma prática os principais resultados e campos visíveis nesta tela.' },
  { id: 'checar', label: 'Checar campos', icon: ClipboardCheck, prompt: 'Cheque campos ausentes, incoerências visíveis e pontos que exigem conferência.' },
  { id: 'resumo', label: 'Resumo', icon: FileText, prompt: 'Gere um resumo curto e organizado do que está preenchido na tela.' },
  { id: 'seguranca', label: 'Dupla checagem', icon: CheckCircle2, prompt: 'Gere uma checklist objetiva de segurança para revisar antes de usar as informações.' }
];

function captureScreenContext() {
  const content = document.querySelector('.app-content');
  if (!content) return '';
  return content.innerText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, 9000);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    window.dispatchEvent(new CustomEvent('toast', { detail: 'Resposta da IA copiada.' }));
  } catch {
    window.dispatchEvent(new CustomEvent('toast', { detail: 'Não foi possível copiar.' }));
  }
}

export function AiPanel({ appTitle, appSubtitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const placeholder = useMemo(() => {
    if (appTitle?.toLowerCase().includes('vent')) return 'Ex: explique essa curva/assincronia sem mudar os cálculos';
    if (appTitle?.toLowerCase().includes('calc')) return 'Ex: gere um resumo para dupla checagem';
    if (appTitle?.toLowerCase().includes('pocus')) return 'Ex: organize os achados em linguagem de laudo';
    return 'Pergunte algo sobre a tela atual';
  }, [appTitle]);

  const askAi = async (action) => {
    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/simm-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appTitle,
          appSubtitle,
          mode: action?.prompt || 'Pergunta livre sobre a tela atual',
          userQuestion: question,
          pageContext: captureScreenContext()
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Falha ao chamar a IA.');
      setAnswer(data.answer || 'Sem resposta.');
    } catch (err) {
      setError(err?.message || 'Erro inesperado ao chamar a IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={isOpen ? 'ai-panel ai-panel-open' : 'ai-panel'} aria-label="SIMM AI">
      <button type="button" className="ai-toggle" onClick={() => setIsOpen((value) => !value)}>
        <Sparkles size={18} />
        <span>SIMM AI</span>
      </button>

      {isOpen && (
        <div className="ai-card">
          <div className="ai-head">
            <div>
              <span className="kicker">Camada consultiva</span>
              <strong><Bot size={17} /> SIMM AI</strong>
            </div>
            <small>Não altera conteúdo, cálculos ou curvas.</small>
          </div>

          <div className="ai-action-grid">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.id} type="button" onClick={() => askAi(action)} disabled={loading}>
                  <Icon size={15} />
                  {action.label}
                </button>
              );
            })}
          </div>

          <label className="ai-question">
            <span>Pergunta livre</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={placeholder}
              rows={3}
            />
          </label>

          <button type="button" className="primary-button ai-send" onClick={() => askAi(null)} disabled={loading}>
            {loading ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
            {loading ? 'Analisando tela...' : 'Perguntar à IA'}
          </button>

          {error && <div className="ai-error">{error}</div>}

          {answer && (
            <div className="ai-answer">
              <div className="ai-answer-top">
                <strong>Resposta</strong>
                <button type="button" onClick={() => copyToClipboard(answer)}>
                  <Copy size={14} /> Copiar
                </button>
              </div>
              <p>{answer}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
