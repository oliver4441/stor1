import { useLocation } from 'react-router-dom';
import Maintenance from '../pages/Maintenance';
import { shouldShowMaintenance } from '../config/maintenance';

/**
 * MaintenanceGate — application-level maintenance mode for the storefront.
 *
 * When maintenance mode is enabled (VITE_MAINTENANCE_MODE=true), every
 * PUBLIC route renders the branded <Maintenance /> transition experience
 * instead of the normal storefront — no shop UI, no product data, no
 * cart/checkout is mounted at all.
 *
 * Bypassed (always render normally):
 *   /admin/*  — staff dashboard (existing auth untouched)
 *   /login, /auth/* — staff sign-in + auth callbacks
 *   /api/*, /health — APIs, webhooks, health checks (never gated)
 *
 * To disable: set VITE_MAINTENANCE_MODE=false and redeploy/rebuild.
 * See docs/MAINTENANCE_MODE.md.
 */
export default function MaintenanceGate({ children }) {
  const location = useLocation();

  if (shouldShowMaintenance(location.pathname)) {
    return <Maintenance />;
  }

  return children;
}
