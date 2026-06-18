import { Activity, Ambulance, Baby, Biohazard, Brain, Bug, Calculator, ClipboardPlus, FlaskConical, HeartPulse, Pill, ScanLine, Syringe, Wind } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell, Card } from './components/Layout.jsx';
import { Toast } from './components/Toast.jsx';
import { GasoApp } from './apps/GasoApp.jsx';
import { VentApp } from './apps/VentApp.jsx';
import { CalcApp } from './apps/CalcApp.jsx';
import { TraumaApp } from './apps/TraumaApp.jsx';
import { SepseApp } from './apps/SepseApp.jsx';
import { PocusApp } from './apps/PocusApp.jsx';
import { IamApp } from './apps/IamApp.jsx';
import { AvcApp } from './apps/AvcApp.jsx';
import { EcgApp } from './apps/EcgApp.jsx';
import { PedApp } from './apps/PedApp.jsx';
import { IntoxApp } from './apps/IntoxApp.jsx';
import { PeconhaApp } from './apps/PeconhaApp.jsx';
import { PlantaoApp } from './apps/PlantaoApp.jsx';
import { APP_IDEAS } from './data/appIdeas.js';

const apps = {
  plantao: { title: 'SIMMples Plantão', subtitle: 'Cofre clínico, evoluções e hipóteses dinâmicas', icon: ClipboardPlus, component: PlantaoApp, hideAi: true },
  gaso: { title: 'SIMMples GASO', subtitle: 'Gasometria arterial estruturada', icon: FlaskConical, component: GasoApp },
  vent: { title: 'SIMMples VENT', subtitle: 'Ventilação mecânica no DE', icon: Wind, component: VentApp },
  calc: { title: 'SIMMples Calc', subtitle: 'DVA, VIS e dose ↔ vazão', icon: Calculator, component: CalcApp },
  iam: { title: 'SIMMples IAM', subtitle: 'Dor torácica, HEART/TIMI e OMI', icon: HeartPulse, component: IamApp },
  avc: { title: 'SIMMples AVC', subtitle: 'NIHSS, ABCD², LVO e ASPECTS', icon: Brain, component: AvcApp },
  ecg: { title: 'SIMMples ECG', subtitle: 'Ritmos, OMI e 12 derivações dinâmicas', icon: Activity, component: EcgApp },
  ped: { title: 'SIMMples PED', subtitle: 'Triagem, PEWS, cálculos e hidratação', icon: Baby, component: PedApp },
  intox: { title: 'SIMMples INTOX', subtitle: 'Toxidromes, ECG tóxico e antídotos', icon: Pill, component: IntoxApp },
  peconha: { title: 'SIMMples PEÇONHA', subtitle: 'Animais peçonhentos e soroterapia', icon: Bug, component: PeconhaApp },
  trauma: { title: 'SIMMples TRAUMA', subtitle: 'Hemorragia oculta e choque', icon: Ambulance, component: TraumaApp },
  sepse: { title: 'SIMMples SEPSE', subtitle: 'Triagem de gravidade e primeira hora', icon: Biohazard, component: SepseApp },
  pocus: { title: 'SIMMples POCUS', subtitle: 'RUSH/choque e laudo rápido', icon: ScanLine, component: PocusApp }
};

function routeFromPath() {
  const slug = window.location.pathname.replace(/^\//, '').split('/')[0];
  return apps[slug] ? slug : 'home';
}

function SuiteDock({ active, onOpen }) {
  return (
    <nav className="suite-dock suite-dock-top" aria-label="Trocar app da SIMM Suite">
      {Object.entries(apps).map(([slug, app]) => {
        const Icon = app.icon;
        return (
          <button
            key={slug}
            type="button"
            className={active === slug ? 'suite-dock-item suite-dock-active' : 'suite-dock-item'}
            onClick={() => onOpen(slug)}
          >
            <Icon size={16} />
            <span>{app.title.replace('SIMMples ', '')}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [route, setRoute] = useState(routeFromPath());

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath());
    const onNavigate = (event) => {
      const slug = event.detail;
      if (!apps[slug]) return;
      window.history.pushState({}, '', `/${slug}`);
      setRoute(slug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('simm:navigate', onNavigate);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('simm:navigate', onNavigate);
    };
  }, []);

  const open = (slug) => {
    window.history.pushState({}, '', slug === 'home' ? '/' : `/${slug}`);
    setRoute(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const Current = useMemo(() => route !== 'home' ? apps[route]?.component : null, [route]);
  const meta = apps[route];

  if (route !== 'home' && Current) {
    return (
      <>
        <AppShell title={meta.title} subtitle={meta.subtitle} onBack={() => open('home')} hideAi={meta.hideAi}>
          <SuiteDock active={route} onOpen={open} />
          <Current />
        </AppShell>
        <Toast />
      </>
    );
  }

  return (
    <>
      <AppShell title="SIMMples Suite" subtitle="Base única para aplicativos rápidos da Emergência SIMM" footer="Suite reconstruída a partir da interface pública e preparada para evoluir novos módulos com a mesma identidade visual.">
        <div className="hero-panel suite-command-hero">
          <div>
            <span className="kicker">SIMM Clinical Operating System</span>
            <h2>Decisão, documentação e cálculo clínico em uma experiência única.</h2>
            <p>Agora com SIMMples Plantão, integração entre módulos e linguagem visual semântica.</p>
          </div>
          <Syringe className="hero-icon" size={42} aria-hidden="true" />
        </div>

        <div className="app-grid app-grid-compact">
          {Object.entries(apps).map(([slug, app]) => {
            const Icon = app.icon;
            return (
              <button key={slug} className={`app-tile app-tile-${slug}`} data-app={slug} onClick={() => open(slug)} type="button">
                <span className="app-tile-icon"><Icon size={24} /></span>
                <span className="app-tile-copy"><strong>{app.title}</strong><small>{app.subtitle}</small></span>
                <span className="app-tile-arrow" aria-hidden="true">↗</span>
              </button>
            );
          })}
        </div>

        <Card title="Próximos apps possíveis">
          <ul className="idea-list">
            {APP_IDEAS.map((idea) => <li key={idea}>{idea}</li>)}
          </ul>
        </Card>

        <Card title="Como transformar em apps separados">
          <p className="clinical-text">Cada rota pode virar um domínio próprio na Vercel: /plantao, /gaso, /vent, /calc, /iam, /avc, /ecg, /ped, /intox, /peconha, /trauma, /sepse e /pocus. Para separar, mantenha os componentes compartilhados e publique cada app apontando para o respectivo módulo.</p>
        </Card>
      </AppShell>
      <Toast />
    </>
  );
}
