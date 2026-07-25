import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';

interface CharacteristicsStepProps {
  onContinue: () => void;
}

export function CharacteristicsStep({ onContinue }: CharacteristicsStepProps) {
  return (
    <div>
      <ChamferedHeader>Characteristics</ChamferedHeader>
      <p>Roll and assign your characteristics.</p>
      <button onClick={onContinue}>Continue</button>
    </div>
  );
}
