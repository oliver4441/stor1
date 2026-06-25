import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function HelpLayout({ title, children, backLabel = 'Back to Help Center' }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
          <Link to="/help" className="hover:text-[#ff385c] transition-colors">
            Help Center
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-600 dark:text-zinc-300 font-medium">{title}</span>
        </div>

        {/* Content card */}
        <div className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-6">
            {title}
          </h1>
          <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 space-y-4">
            {children}
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            to="/help"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-[#ff385c] transition-colors font-medium"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
