import './SkillPicker.css';

interface SkillPickerProps {
  skills: string[];
  maxPicks: number;
  selected: string[];
  onToggle: (skill: string) => void;
}

export function SkillPicker({ skills, maxPicks, selected, onToggle }: SkillPickerProps) {
  const remaining = maxPicks - selected.length;

  return (
    <div className="skill-picker">
      <div className="skill-picker__count">
        {remaining} remaining (pick {maxPicks} total)
      </div>
      <div className="skill-picker__grid">
        {skills.map((skill) => {
          const isSelected = selected.includes(skill);
          const isDisabled = !isSelected && remaining <= 0;

          return (
            <button
              key={skill}
              type="button"
              className={`skill-picker__skill ${isSelected ? 'skill-picker__skill--selected' : ''}`}
              onClick={() => onToggle(skill)}
              disabled={isDisabled}
            >
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
