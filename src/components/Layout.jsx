import { BrandHeader } from './BrandHeader.jsx';
import { AiPanel } from './AiPanel.jsx';

export function AppShell({ title, subtitle, children, onBack, footer, hideAi = false }) {
  return (
    <main className="page-shell">
      <div className="phone-frame">
        <BrandHeader title={title} subtitle={subtitle} onBack={onBack} />
        <section className="app-content route-stage">{children}</section>
        {!hideAi && <AiPanel appTitle={title} appSubtitle={subtitle} />}
        <footer className="footer-note">
          {footer || 'Ferramenta educacional e de suporte à decisão. A conduta final é responsabilidade do médico assistente.'}
        </footer>
      </div>
    </main>
  );
}

export function Card({ title, kicker, children, className = '', tone = 'default' }) {
  return (
    <section className={`card card-tone-${tone} ${className}`}>
      {(kicker || title) && (
        <div className="card-head">
          {kicker && <span className="kicker">{kicker}</span>}
          {title && <h2>{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Result({ label, value, tone = 'neutral', helper }) {
  return (
    <div className={`result result-${tone}`} data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
      <i className="result-accent" aria-hidden="true" />
    </div>
  );
}
