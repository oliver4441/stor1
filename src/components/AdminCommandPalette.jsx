import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Package, ShoppingBag, Users, Store, BarChart3, Settings,
  ShieldAlert, Tag, Bell, FileBarChart,
} from 'lucide-react';

const COMMANDS = [
  { id: 'order', label: 'Search order', path: '/admin/orders', icon: ShoppingBag },
  { id: 'customer', label: 'Search customer', path: '/admin/customers', icon: Users },
  { id: 'seller', label: 'Search seller', path: '/admin/sellers', icon: Store },
  { id: 'product', label: 'Search product', path: '/admin/products', icon: Package },
  { id: 'add-product', label: 'Add product', path: '/admin/products', icon: Package },
  { id: 'analytics', label: 'Open analytics', path: '/admin/analytics', icon: BarChart3 },
  { id: 'sellers', label: 'Review sellers', path: '/admin/sellers', icon: Store },
  { id: 'refunds', label: 'Review refunds', path: '/admin/orders', icon: ShoppingBag },
  { id: 'fraud', label: 'Open fraud queue', path: '/admin/fraud', icon: ShieldAlert },
  { id: 'reports', label: 'Open reports', path: '/admin/reports', icon: FileBarChart },
  { id: 'deals', label: 'Open deals', path: '/admin/deals', icon: Tag },
  { id: 'notifications', label: 'Open notifications', path: '/admin/notifications', icon: Bell },
  { id: 'settings', label: 'Open settings', path: '/admin/settings', icon: Settings },
];

export default function AdminCommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery('');
        setActive(0);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const run = (cmd) => {
    if (!cmd) return;
    setOpen(false);
    navigate(cmd.path);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Admin command palette">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close command palette" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
              if (e.key === 'Enter') run(results[active]);
            }}
            placeholder="Search orders, customers, sellers, products…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <kbd className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && <li className="px-4 py-6 text-sm text-zinc-500">No matching commands</li>}
          {results.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <li key={cmd.id}>
                <button
                  type="button"
                  onClick={() => run(cmd)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${index === active ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800/70'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {cmd.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
