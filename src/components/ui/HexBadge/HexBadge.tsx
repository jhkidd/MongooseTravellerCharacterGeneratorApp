import './HexBadge.css';

interface HexBadgeProps {
  value: number | string;
  label?: string;
  dm?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'empty' | 'success' | 'failure';
  className?: string;
}

function formatDM(dm: number): string {
  if (dm > 0) return `+${dm}`;
  if (dm < 0) return `\u2212${Math.abs(dm)}`;
  return '';
}

export function HexBadge({
  value,
  label,
  dm,
  size = 'md',
  variant = 'default',
  className = '',
}: HexBadgeProps) {
  const classes = [
    'hex-badge',
    `hex-badge--${size}`,
    variant !== 'default' ? `hex-badge--${variant}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="hex-badge__hex">
        <span className="hex-badge__value">{value}</span>
        {dm != null && dm !== 0 && (
          <span className="hex-badge__dm">{formatDM(dm)}</span>
        )}
      </div>
      {label && <span className="hex-badge__label">{label}</span>}
    </div>
  );
}
