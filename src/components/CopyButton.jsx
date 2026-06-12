import { ClipboardCheck } from 'lucide-react';

export function CopyButton({ text, children = 'Copiar Relatório Clínico' }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Copiado para a área de transferência.' }));
    } catch {
      window.dispatchEvent(new CustomEvent('simm-toast', { detail: 'Não foi possível copiar automaticamente.' }));
    }
  }

  return (
    <button className="primary-button" type="button" onClick={copy}>
      <ClipboardCheck size={18} />
      {children}
    </button>
  );
}
