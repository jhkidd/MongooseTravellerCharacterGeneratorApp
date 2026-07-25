import type { ReactNode } from 'react';

import './ChamferedHeader.css';

interface ChamferedHeaderProps {
  children: ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}

export function ChamferedHeader({
  children,
  level = 2,
  className = '',
}: ChamferedHeaderProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  const classes = ['chamfered-header', `chamfered-header--${level}`, className]
    .filter(Boolean)
    .join(' ');

  return <Tag className={classes}>{children}</Tag>;
}
