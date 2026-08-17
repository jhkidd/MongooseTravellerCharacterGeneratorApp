import { BackToHomeLink } from '../home/BackToHomeLink';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import './PlanetGeneratorPlaceholder.css';

export function PlanetGeneratorPlaceholder() {
  return (
    <div className="planet-generator-placeholder">
      <BackToHomeLink />
      <ChamferedHeader level={1}>Planet Generator</ChamferedHeader>
      <p>Random world generation is coming soon.</p>
    </div>
  );
}
