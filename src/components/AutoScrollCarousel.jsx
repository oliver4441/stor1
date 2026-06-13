import { useRef, useEffect, useState } from 'react';

/**
 * Auto-scrolling horizontal carousel.
 * Scrolls continuously from right to left (like a news ticker).
 * Duplicates children to create seamless infinite scroll.
 * 
 * Props:
 *   children - the items to scroll
 *   speed - pixels per second (default 50)
 *   gap - gap between items in px (default 16)
 *   className - extra classes for the wrapper
 *   itemMinWidth - minimum width of each item (default 260)
 */
export default function AutoScrollCarousel({
  children,
  speed = 40,
  gap = 16,
  className = '',
  itemMinWidth = 260,
}) {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  // Duplicate children for seamless loop
  const childArray = Array.isArray(children) ? children : [children];
  const duplicatedChildren = [...childArray, ...childArray];

  useEffect(() => {
    if (scrollRef.current) {
      // Measure the width of the original content (half of total)
      const fullWidth = scrollRef.current.scrollWidth;
      setContentWidth(fullWidth / 2);
    }
  }, [children]);

  // CSS animation duration based on content width and speed
  const duration = contentWidth > 0 ? contentWidth / speed : 20;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Scrolling container */}
      <div
        ref={scrollRef}
        className="flex"
        style={{
          gap: `${gap}px`,
          width: 'max-content',
          animation: contentWidth > 0
            ? `carousel-scroll ${duration}s linear infinite`
            : 'none',
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {duplicatedChildren.map((child, i) => (
          <div
            key={i}
            className="flex-shrink-0"
            style={{ minWidth: `${itemMinWidth}px`, maxWidth: `${itemMinWidth}px` }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent pointer-events-none z-10" />
    </div>
  );
}

// CSS injection helper - add this to your index.css:
// @keyframes carousel-scroll {
//   0% { transform: translateX(0); }
//   100% { transform: translateX(-50%); }
// }
