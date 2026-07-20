import React from 'react';

/**
 * FusionChromeBadge — chrome accent badge (5% rule).
 * Used ONLY for premium markers: verified seller, top deal, gold tier.
 */
export default function FusionChromeBadge({ children, className = '' }) {
  return <span className={`fusion-chrome px-2 py-0.5 text-xs ${className}`}>{children}</span>;
}
