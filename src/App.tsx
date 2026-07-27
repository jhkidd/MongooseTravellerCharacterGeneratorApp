import { useState, useEffect } from 'react';
import { CharacterProvider } from './context/CharacterContext';
import { CharacterSummary } from './components/sidebar/CharacterSummary';
import { WizardShell } from './components/wizard/WizardShell';
import { EffectGallery } from './components/dev/EffectGallery';
import './theme/global.css';
import './App.css';

function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    function onHashChange() { setHash(window.location.hash); }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (hash === '#dev') {
    return <EffectGallery />;
  }

  return (
    <CharacterProvider>
      <div className="app">
        <div className="app__sidebar">
          <CharacterSummary />
        </div>
        <main className="app__main">
          <WizardShell />
        </main>
      </div>
    </CharacterProvider>
  );
}

export default App;
