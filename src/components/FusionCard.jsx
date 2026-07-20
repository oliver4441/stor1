import React from 'react';

/**
 * FusionCard — recessed (skeuomorphic) product surface with a frosted
 * (glass) overlay option. The blend lives in CSS, not props, so every
 * page gets the same identity.
 */
export default function FusionCard({ as: Tag = 'div', glass = false, className = '', children, ...rest }) {
  const base = glass ? 'fusion-glass' : 'fusion-recessed-card';
  return (
    <Tag className={`${base} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
