import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { AppTile } from './AppTile';
import './HomeScreen.css';

export function HomeScreen() {
  return (
    <div className="home-screen">
      <ChamferedHeader level={1}>Traveller Toolkit</ChamferedHeader>
      <div className="home-screen__grid">
        <AppTile href="#character" icon="🧑‍🚀" title="Character Creation" description="Build a traveller" />
        <AppTile href="#planet" icon="🪐" title="Planet Generator" description="Random world builder" />
        <AppTile href="#trade" icon="📦" title="Trade" description="Passengers, freight & speculative cargo" />
      </div>
    </div>
  );
}
