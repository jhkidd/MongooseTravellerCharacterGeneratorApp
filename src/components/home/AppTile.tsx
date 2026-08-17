import type { ReactNode } from 'react';
import './AppTile.css';

interface AppTileProps {
  href: string;
  icon: ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
}

export function AppTile({ href, icon, title, description, disabled = false }: AppTileProps) {
  const classes = ['app-tile', disabled ? 'app-tile--disabled' : ''].filter(Boolean).join(' ');

  return (
    <a
      className={classes}
      href={disabled ? undefined : href}
      aria-disabled={disabled}
      role="button"
    >
      <span className="app-tile__icon">{icon}</span>
      <span className="app-tile__title">{title}</span>
      {description && <span className="app-tile__description">{description}</span>}
      {disabled && <span className="app-tile__badge">Coming Soon</span>}
    </a>
  );
}
