import { Activity, Calculator, Droplets, HeartPulse, Stethoscope, Syringe, Wind } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell, Card } from './components/Layout.jsx';
import { Toast } from './components/Toast.jsx';
import { GasoApp } from './apps/GasoApp.jsx';
import { VentApp } from './apps/VentApp.jsx';
import { CalcApp } from './apps/CalcApp.jsx';
import { TraumaApp } from './apps/TraumaApp.jsx';
import { SepseApp } from './apps/SepseApp.jsx';
import { PocusApp } from './apps/PocusApp.jsx';
import { APP_IDEAS } from './data/appIdeas.js';

const apps = {
  gaso: { title: 'SIMMples GASO', subtitle: 'Gasometria arterial estruturada', icon: Droplets, component: GasoApp },
  vent: { title: 'SIMMples VENT', subtitle: 'Ventilação mecânica no DE', icon: Wind, component: VentApp },
  calc: { title: 'SIMMples Calc', subtitle: 'Base visual para calculadoras institucionais', icon: Calculator, component: CalcApp },
  trauma: { title: 'SIMMples TRAUMA', subtitle: 'Hemorragia oculta e choque', icon: Activity, component: TraumaApp },
  sepse: { title: 'SIMMples SEPSE', subtitle: 'Triagem de gravidade e primeira hora', icon: HeartPulse, component: SepseApp },
  pocus: { title: 'SIMMples POCUS', subtitle: 'RUSH/choque e laudo rápido', icon: Stethoscope, component: PocusApp }
};

function routeFromPath() {
  const slug = window.location.pathname.replace(/^\//, '').split('/')[0];
  return apps[slug] ? slug : 'home';
}

export default function App() {
  const [route, setRoute] = useState(routeFromPath());

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const open = (slug) => {
    window.history.pushState({}, '', slug === 'home' ? '/' : `/${slug}`);
    setRoute(slug);
  };

  const Current = useMemo(() => route !== 'home' ? apps[route]?.component : null, [route]);
  const meta = apps[route];

  if (route !== 'home' && Current) {
    return (
      <>
        <AppShell title={meta.title} subtitle={meta.subtitle} onBack={() => open('home')}>
          <Current />
        </AppShell>
        <Toast />
      </>
    );
  }

  return (
    <>
      <AppShell title="SIMMples Suite" subtitle="Base única para aplicativos rápidos da Emergência SIMM" footer="Suite reconstruída a partir da interface pública e preparada para evoluir novos módulos com a mesma identidade visual.">
        <div className="hero-panel">
          <div>
            <span className="kicker">A verdadeira Medicina de Emergência é na SIMM</span>
            <h2>Apps de bolso, visual premium, relatório copiável e fluxo de plantão.</h2>
          </div>
          <Syringe className="hero-icon" size={40} aria-hidden="true" />
        </div>

        <div className="app-grid">
          {Object.entries(apps).map(([slug, app]) => {
            const Icon = app.icon;
            return (
              <button key={slug} className="app-tile" onClick={() => open(slug)} type="button">
                <Icon size={25} />
                <strong>{app.title}</strong>
                <span>{app.subtitle}</span>
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
          <p className="clinical-text">Cada rota pode virar um domínio próprio na Vercel: /gaso, /vent, /calc, /trauma, /sepse e /pocus. Para separar, mantenha os componentes compartilhados e publique cada app apontando para o respectivo módulo.</p>
        </Card>
      </AppShell>
      <Toast />
    </>
  );
}
