import { ArrowLeft, Sparkles } from 'lucide-react';
import { BRAND } from '../brand.js';

export function BrandHeader({ title, subtitle, onBack }) {
  return (
    <header className="brand-header">
      <div className="header-row">
        {onBack ? (
          <button className="icon-button" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div className="spark"><Sparkles size={20} /></div>
        )}
        <img className="logo" src={BRAND.logoUrl} alt="Emergência SIMM" />
        <div className="brand-copy">
          <span>{BRAND.name}</span>
          <h1>{title}</h1>
        </div>
      </div>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </header>
  );
}
