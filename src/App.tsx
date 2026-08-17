import { useState, useEffect } from 'react';
import { CharacterProvider } from './context/CharacterContext';
import { CharacterSummary } from './components/sidebar/CharacterSummary';
import { WizardShell } from './components/wizard/WizardShell';
import { EffectGallery } from './components/dev/EffectGallery';
import { HomeScreen } from './components/home/HomeScreen';
import { BackToHomeLink } from './components/home/BackToHomeLink';
import { PlanetGeneratorPage } from './components/planet/PlanetGeneratorPage';
import './theme/global.css';
import './App.css';

type Route = 'home' | 'character' | 'planet' | 'dev';

function getRoute(hash: string): Route {
  switch (hash) {
    case '#character':
      return 'character';
    case '#planet':
      return 'planet';
    case '#dev':
      return 'dev';
    default:
      return 'home';
  }
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute(window.location.hash));

  useEffect(() => {
    function onHashChange() { setRoute(getRoute(window.location.hash)); }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === 'dev') {
    return <EffectGallery />;
  }

  if (route === 'planet') {
    return <PlanetGeneratorPage />;
  }

  if (route === 'character') {
    return (
      <CharacterProvider>
        <div className="app">
          <div className="app__sidebar">
            <CharacterSummary />
          </div>
          <main className="app__main">
            <div className="app__main-content">
              <BackToHomeLink />
              <WizardShell />
            </div>
          </main>
        </div>
      </CharacterProvider>
    );
  }

  return <HomeScreen />;
}

export default App;
