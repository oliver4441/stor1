import { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate, onExpired }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        onExpired?.();
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpired]);

  if (expired) return null;
  if (!timeLeft) return <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />;

  const pad = (n) => String(n).padStart(2, '0');

  // If more than 24h, show days
  if (timeLeft.days > 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-900/30 text-red-400 text-xs font-bold px-2 py-1 rounded-full">
        <span className="animate-pulse">⏱</span> {timeLeft.days}d {timeLeft.hours}h left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 bg-red-900/30 text-red-400 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
      <span>⏱</span> {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}
