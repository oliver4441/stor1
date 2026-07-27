import * as React from "react";
import { cn } from "@/lib/utils";

// ── PageTransition ──────────────────────────────────────────────
// Wraps page content with a fade-in + slight slide-up animation
// on mount. Lightweight — no Framer Motion needed.
const PageTransition = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
      const timer = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(timer);
    }, []);

    return (
      <div
        ref={ref}
        className={cn(
          "transition-all duration-300 ease-out",
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageTransition.displayName = "PageTransition";

export { PageTransition };
