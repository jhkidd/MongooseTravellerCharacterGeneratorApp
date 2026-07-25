import { useCharacter } from '../../context/CharacterContext';
import { getSelectableCareers } from '../../data/career-loader';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { getQualificationDM } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface CareerSelectionStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function CareerSelectionStep({ context, onAdvance }: CareerSelectionStepProps) {
  const { character } = useCharacter();
  const careers = getSelectableCareers();

  return (
    <div>
      <ChamferedHeader>Choose a Career</ChamferedHeader>
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
        Select a career to attempt qualification, or become a Drifter with no entry roll.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {careers.map((career) => {
          const qualification = career.qualification;
          const dm = getQualificationDM(qualification, character, context);

          return (
            <button
              key={career.id}
              type="button"
              onClick={() => onAdvance({ type: 'SELECT_CAREER', careerId: career.id })}
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                color: 'var(--color-text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div>
                <strong style={{ color: 'var(--color-accent)' }}>{career.name}</strong>
                <div style={{ fontSize: '0.85em', opacity: 0.8 }}>{career.description}</div>
                {qualification && (
                  <div style={{ fontSize: '0.8em', marginTop: '0.25rem' }}>
                    Qualification: {qualification.characteristic} {qualification.target}+
                    {dm !== 0 && ` (${dm > 0 ? '+' : ''}${dm} DM)`}
                  </div>
                )}
              </div>
              {qualification && <SuccessChance baseTarget={qualification.target} dm={dm} />}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onAdvance({ type: 'SELECT_DRIFTER' })}
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: 'var(--color-text-primary)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <strong style={{ color: 'var(--color-text-secondary)' }}>Drifter</strong>
          <div style={{ fontSize: '0.85em', opacity: 0.8 }}>
            No qualification needed — wander the stars and see what the term brings.
          </div>
        </button>
      </div>
    </div>
  );
}
