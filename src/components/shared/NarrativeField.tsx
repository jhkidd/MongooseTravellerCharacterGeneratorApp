import './NarrativeField.css';

interface NarrativeFieldProps {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NarrativeField({
  prompt,
  value,
  onChange,
  placeholder,
}: NarrativeFieldProps) {
  return (
    <div className="narrative-field">
      <span className="narrative-field__prompt">{prompt}</span>
      <textarea
        className="narrative-field__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Write your story...'}
      />
    </div>
  );
}
