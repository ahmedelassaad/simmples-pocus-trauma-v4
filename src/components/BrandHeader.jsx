import { ArrowLeft, Command, Sparkles } from 'lucide-react';
import { BRAND } from '../brand.js';

export function BrandHeader({ title, subtitle, onBack }) {
  return (
    <header className="brand-header">
      <div className="header-row">
        {onBack ? (
          <button className="icon-button" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={21} />
          </button>
        ) : (
          <div className="spark"><Sparkles size={19} /></div>
        )}
        <img className="logo" src={BRAND.logoUrl} alt="Emergência SIMM" />
        <div className="brand-copy">
          <span>{BRAND.name}</span>
          <h1>{title}</h1>
        </div>
        <div className="header-status" aria-label="SIMM Suite ativa"><Command size={14}/><span>LIVE</span></div>
      </div>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </header>
  );
}
