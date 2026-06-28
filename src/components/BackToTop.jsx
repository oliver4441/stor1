import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-20 left-4 z-50 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 shadow-lg flex items-center justify-center hover:bg-[var(--seasonal-primary,#1a5632)] hover:text-white hover:border-[var(--seasonal-primary,#1a5632)] transition-all duration-300 text-zinc-300"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
