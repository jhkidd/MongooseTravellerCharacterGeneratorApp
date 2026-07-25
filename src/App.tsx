import { CharacterProvider } from './context/CharacterContext';
import { CharacterSummary } from './components/sidebar/CharacterSummary';
import { WizardShell } from './components/wizard/WizardShell';
import './theme/global.css';
import './App.css';

function App() {
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
