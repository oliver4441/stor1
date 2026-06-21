import { Shield, Truck, Lock, RefreshCw, Headphones } from 'lucide-react';

const BADGES = [
  { icon: Lock, label: 'Secure Payment', desc: '256-bit SSL encryption' },
  { icon: Truck, label: 'Fast Delivery', desc: 'Same day in Kericho CBD' },
  { icon: Shield, label: 'Buyer Protection', desc: '100% money-back guarantee' },
  { icon: RefreshCw, label: 'Easy Returns', desc: '7-day return policy' },
  { icon: Headphones, label: '24/7 Support', desc: 'Call or WhatsApp us anytime' },
];

export default function TrustBadges({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center justify-center gap-4 py-3 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
        {BADGES.slice(0, 3).map((badge) => {
          const Icon = badge.icon;
          return (
            <div key={badge.label} className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              <Icon className="w-3.5 h-3.5 text-[var(--seasonal-primary,#ff385c)]" />
              <span className="font-semibold">{badge.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-3 py-4">
      {BADGES.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.label}
            className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--seasonal-primary,#ff385c)]/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-[var(--seasonal-primary,#ff385c)]" />
            </div>
            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight">{badge.label}</span>
            <span className="text-[9px] text-zinc-400 leading-tight">{badge.desc}</span>
          </div>
        );
      })}
    </div>
  );
}
