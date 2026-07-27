import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  '': 'Home',
  'listing': 'Product',
  'cart': 'Cart',
  'checkout': 'Checkout',
  'account': 'My Account',
  'track-order': 'Track Order',
  'login': 'Log In',
  'signup': 'Sign Up',
  'about': 'About',
  'how-it-works': 'How It Works',
  'terms': 'Terms of Service',
  'privacy': 'Privacy Policy',
  'install': 'Install App',
  'order-success': 'Order Confirmed',
};

export default function Breadcrumb({ customLabel, showOnMobile = true }) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumb on home page
  if (pathnames.length === 0) return null;

  // Build breadcrumb items
  const items = [];
  let currentPath = '';

  // Always add home
  items.push({ label: 'Home', path: '', isLast: false });

  pathnames.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathnames.length - 1;

    // For dynamic routes like /listing/:id, use custom label or generic
    let label;
    if (segment === 'listing' && isLast) {
      label = customLabel || 'Product Details';
    } else if (ROUTE_LABELS[segment]) {
      label = ROUTE_LABELS[segment];
    } else {
      // Fallback: capitalize and replace hyphens
      label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }

    items.push({ label, path: currentPath, isLast });
  });

  // Update last item
  items[items.length - 1].isLast = true;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`bg-zinc-900/50 border-b border-zinc-800 ${showOnMobile ? '' : 'hidden md:block'}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <ol className="flex items-center gap-1.5 text-xs overflow-x-auto scrollbar-hide">
          {items.map((item, index) => (
            <li key={item.path} className="flex items-center gap-1.5 flex-shrink-0">
              {index > 0 && <ChevronRight className="w-3 h-3 text-zinc-400 flex-shrink-0" />}
              {item.isLast ? (
                <span className="font-semibold text-white truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={`/${item.path}`}
                  className="text-zinc-400 hover:text-[var(--seasonal-primary,#0d9488)] dark:hover:text-[var(--seasonal-primary,#0d9488)] transition-colors flex items-center gap-1"
                >
                  {index === 0 && <Home className="w-3 h-3" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
