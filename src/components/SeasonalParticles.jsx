import { useMemo } from 'react';

/**
 * Lightweight CSS-only particle effects for seasonal themes.
 * Renders small divs with CSS animations — zero JS animation libraries.
 * 
 * Types:
 * - confetti: Colored rectangles falling with rotation (World Cup, celebrations)
 * - snow: White circles falling with drift (Christmas)
 * - hearts: Heart shapes floating upward (Valentine's)
 * - fireworks: Small circles bursting upward (New Year)
 */
export default function SeasonalParticles({ type, count = 20 }) {
  const particles = useMemo(() => {
    if (!type || type === 'none') return [];
    
    const items = [];
    const colors = {
      confetti: ['#FFD700', '#00843D', '#FFFFFF', '#C41E3A', '#1A1A2E', '#FF6B35'],
      snow: ['#FFFFFF'],
      hearts: ['#E91E63', '#FF5722', '#F44336', '#FF1744'],
      fireworks: ['#FFD700', '#FF6B35', '#FFFFFF', '#E91E63', '#00E676'],
    };
    
    const palette = colors[type] || colors.confetti;
    
    for (let i = 0; i < count; i++) {
      const color = palette[i % palette.length];
      const left = Math.random() * 100; // random horizontal position
      const delay = Math.random() * 8; // random start delay (0-8s)
      const duration = type === 'snow' 
        ? 8 + Math.random() * 12 // snow: 8-20s
        : type === 'hearts'
        ? 6 + Math.random() * 8 // hearts: 6-14s
        : type === 'fireworks'
        ? 1 + Math.random() * 2 // fireworks: 1-3s
        : 4 + Math.random() * 6; // confetti: 4-10s
      
      const size = type === 'snow' 
        ? 4 + Math.random() * 6 // snow: 4-10px
        : type === 'hearts'
        ? 10 + Math.random() * 10 // hearts: 10-20px
        : type === 'fireworks'
        ? 3 + Math.random() * 4 // fireworks: 3-7px
        : 6 + Math.random() * 6; // confetti: 6-12px
      
      items.push({
        id: i,
        color,
        left: `${left}%`,
        delay: `${delay}s`,
        duration: `${duration}s`,
        size: `${size}px`,
        // For confetti: random rotation speed
        swayDuration: `${2 + Math.random() * 3}s`,
      });
    }
    
    return items;
  }, [type, count]);

  if (!type || type === 'none' || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      {particles.map((p) => {
        if (type === 'hearts') {
          return (
            <div
              key={p.id}
              className="particle-heart"
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: p.size,
                height: p.size,
              }}
            >
              <svg viewBox="0 0 24 24" fill={p.color} width={p.size} height={p.size}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          );
        }
        
        if (type === 'fireworks') {
          // Create a burst of 6-8 particles from a random position
          const burstParticles = Array.from({ length: 8 }, (_, j) => ({
            angle: (j / 8) * 360,
            distance: 30 + Math.random() * 50,
            color: particles[(p.id + j) % particles.length]?.color || p.color,
          }));
          
          return (
            <div key={p.id}>
              {burstParticles.map((bp, j) => (
                <div
                  key={`${p.id}-${j}`}
                  className="particle-firework"
                  style={{
                    left: p.left,
                    bottom: `${10 + Math.random() * 30}%`,
                    backgroundColor: bp.color,
                    animationDelay: `${p.delay}`,
                    animationDuration: p.duration,
                    width: p.size,
                    height: p.size,
                    transform: `rotate(${bp.angle}deg) translateY(-${bp.distance}px)`,
                  }}
                />
              ))}
            </div>
          );
        }
        
        // confetti and snow
        return (
          <div
            key={p.id}
            className={type === 'snow' ? 'particle-snow' : 'particle-confetti'}
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
              backgroundColor: type === 'snow' ? undefined : p.color,
              borderRadius: type === 'snow' ? '50%' : '1px',
              animationName: type === 'snow' 
                ? 'snow-fall' 
                : 'confetti-fall, confetti-sway',
              animationDuration: type === 'snow' 
                ? p.duration 
                : `${p.duration}, ${p.swayDuration}`,
            }}
          />
        );
      })}
    </div>
  );
}
