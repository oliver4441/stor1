import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

// ── GooeyLoader ────────────────────────────────────────────────
// Uses the Spinner component inside a centered container
const GooeyLoader = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-12",
          className
        )}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <Spinner size="xl" />
      </div>
    );
  }
);
GooeyLoader.displayName = "GooeyLoader";

export { GooeyLoader };
