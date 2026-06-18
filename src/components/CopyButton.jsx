import { ClipboardCheck, Send } from 'lucide-react';

function persistReport(text) {
  const payload = {
    text,
    source: document.querySelector('.brand-copy h1')?.textContent || 'SIMMples Suite',
    createdAt: new Date().toISOString()
  };
  localStorage.setItem('simm-last-report', JSON.stringify(payload));
  return payload;
}

export function CopyButton({ text, children = 'Copiar relatório clínico' }) {
  async function copy() {
    try {
      persistReport(text);
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Relatório copiado e disponibilizado no SIMMples Plantão.' }));
    } catch {
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Não foi possível copiar automaticamente.' }));
    }
  }

  function sendToPlantao() {
    persistReport(text);
    window.dispatchEvent(new CustomEvent('simm:navigate', { detail: 'plantao' }));
    window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Relatório enviado para importação no SIMMples Plantão.' }));
  }

  return (
    <div className="report-action-row">
      <button className="primary-button" type="button" onClick={copy}>
        <ClipboardCheck size={18} />
        {children}
      </button>
      <button className="secondary-button report-send-button" type="button" onClick={sendToPlantao}>
        <Send size={17} />
        Plantão
      </button>
    </div>
  );
}
