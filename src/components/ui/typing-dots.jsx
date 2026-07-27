import * as React from "react";

// ── TypingDots ──────────────────────────────────────────────────
// Bouncing animated dots for chat / loading states
const TypingDots = React.forwardRef(
  ({ className, color = "#14b8a6", size = "md", ...props }, ref) => {
    const sizeMap = { sm: "w-1.5 h-1.5", md: "w-2 h-2", lg: "w-2.5 h-2.5" };
    const dotSize = sizeMap[size] || sizeMap.md;

    return (
      <div
        ref={ref}
        className={`flex items-center gap-1 ${className || ""}`}
        role="status"
        aria-label="Typing"
        {...props}
      >
        <span
          className={`${dotSize} rounded-full animate-bounce`}
          style={{
            backgroundColor: color,
            animationDelay: "0ms",
            animationDuration: "0.6s",
          }}
        />
        <span
          className={`${dotSize} rounded-full animate-bounce`}
          style={{
            backgroundColor: color,
            animationDelay: "150ms",
            animationDuration: "0.6s",
          }}
        />
        <span
          className={`${dotSize} rounded-full animate-bounce`}
          style={{
            backgroundColor: color,
            animationDelay: "300ms",
            animationDuration: "0.6s",
          }}
        />
      </div>
    );
  }
);
TypingDots.displayName = "TypingDots";

export { TypingDots };
