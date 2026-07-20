import React from 'react';

/**
 * FusionButton — clay (puffy) tactile button. min 48px touch target.
 * `chrome` prop promotes it to a premium chrome action (5% rule).
 */
export default function FusionButton({
  chrome = false,
  className = '',
  children,
  ...rest
}) {
  const base = chrome ? 'fusion-chrome fusion-clay-btn' : 'fusion-clay-btn';
  return (
    <button className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}
