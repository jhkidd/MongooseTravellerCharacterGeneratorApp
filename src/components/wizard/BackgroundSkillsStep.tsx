import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';

interface BackgroundSkillsStepProps {
  onContinue: () => void;
}

export function BackgroundSkillsStep({ onContinue }: BackgroundSkillsStepProps) {
  return (
    <div>
      <ChamferedHeader>Background Skills</ChamferedHeader>
      <p>Choose your background skills.</p>
      <button onClick={onContinue}>Continue</button>
    </div>
  );
}
