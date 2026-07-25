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
  return '+0';
}

/** SVG hex outline for the empty/drop-target state */
function HexOutline() {
  // Points for a flat-top hexagon fitting a 100x100 viewBox
  const points = '50,0 100,25 100,75 50,100 0,75 0,25';
  return (
    <svg
      className="hex-badge__outline-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points={points}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="3"
        strokeDasharray="6 4"
      />
    </svg>
  );
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
      <div className="hex-badge__hex-wrapper">
        {variant === 'empty' && <HexOutline />}
        <div className="hex-badge__hex">
          <span className="hex-badge__value">{value}</span>
        </div>
        {dm != null && (
          <span className="hex-badge__dm">{formatDM(dm)}</span>
        )}
      </div>
      {label && <span className="hex-badge__label">{label}</span>}
    </div>
  );
}
