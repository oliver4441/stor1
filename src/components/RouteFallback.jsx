import { useEffect, useState } from 'react';

export default function RouteFallback() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`marketplace-route-loader ${visible ? 'is-visible' : ''}`} role="status" aria-label="Loading page">
      <div className="marketplace-route-loader-card">
        <div className="marketplace-loader-mark"><span>O</span></div>
        <div className="marketplace-loader-copy">
          <strong>Loading your marketplace</strong>
          <span>Finding the good stuff for you</span>
        </div>
        <div className="marketplace-loader-progress" aria-hidden="true"><i /></div>
      </div>
    </div>
  );
}
