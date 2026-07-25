import './ChoicePanel.css';

export interface ChoicePanelOption {
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ChoicePanelProps {
  prompt: string;
  options: ChoicePanelOption[];
  onSelect: (index: number) => void;
}

export function ChoicePanel({ prompt, options, onSelect }: ChoicePanelProps) {
  return (
    <div className="choice-panel">
      <div className="choice-panel__prompt">{prompt}</div>
      <div className="choice-panel__options">
        {options.map((option, index) => (
          <button
            key={`${option.label}-${index}`}
            type="button"
            className="choice-panel__option"
            onClick={() => onSelect(index)}
            disabled={option.disabled}
          >
            <strong>{option.label}</strong>
            {option.description && (
              <div className="choice-panel__description">
                {option.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
