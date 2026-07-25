import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';

interface BackgroundStepProps {
  onContinue: () => void;
}

export function BackgroundStep({ onContinue }: BackgroundStepProps) {
  return (
    <div>
      <ChamferedHeader>Background</ChamferedHeader>
      <p>Set your Traveller&apos;s background details.</p>
      <button onClick={onContinue}>Continue</button>
    </div>
  );
}
