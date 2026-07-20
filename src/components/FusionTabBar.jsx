import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * FusionTabBar — floating frosted bottom nav (one-handed mobile).
 * Replaces MobileBottomNav's plain bar with the glass identity.
 * `items`: [{ to, icon: LucideIcon, label }]
 */
export default function FusionTabBar({ items }) {
  const { pathname } = useLocation();
  return (
    <nav className="fusion-tabbar" aria-label="Primary">
      {items.map(({ to, icon: Icon, label }) => {
        const active = pathname === to || (to !== '/' && pathname.startsWith(to));
        return (
          <Link key={to} to={to} className="fusion-tab" data-active={active} aria-current={active ? 'page' : undefined}>
            <Icon size={22} strokeWidth={2} aria-hidden />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
