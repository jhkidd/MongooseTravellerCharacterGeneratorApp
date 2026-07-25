import { getSuccessChance } from '../../../engine/dice';
import './SuccessChance.css';

interface Tier {
  label: string;
  baseTarget: number;
}

interface SuccessChanceProps {
  baseTarget: number;
  dm: number;
  label?: string;
  tiers?: Tier[];
}

function getColorClass(chance: number): string {
  if (chance >= 70) return 'success-chance--high';
  if (chance >= 30) return 'success-chance--medium';
  return 'success-chance--low';
}

function getChanceForTarget(baseTarget: number, dm: number): number {
  return getSuccessChance(baseTarget - dm);
}

export function SuccessChance({
  baseTarget,
  dm,
  label,
  tiers,
}: SuccessChanceProps) {
  const chance = getChanceForTarget(baseTarget, dm);
  const colorClass = getColorClass(chance);

  return (
    <div className={`success-chance ${colorClass}`}>
      <div className="success-chance__row">
        {label && <span className="success-chance__label">{label}</span>}
        <span className="success-chance__value">{chance}%</span>
      </div>
      {tiers?.map((tier) => {
        const tierChance = getChanceForTarget(tier.baseTarget, dm);

        return (
          <div key={tier.label} className="success-chance__tier">
            <span className="success-chance__tier-label">{tier.label}</span>
            <span className="success-chance__tier-value">{tierChance}%</span>
          </div>
        );
      })}
    </div>
  );
}
