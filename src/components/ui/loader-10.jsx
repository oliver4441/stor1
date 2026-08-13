import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

// A calm, branded loader shared by data-heavy screens (admin, wallet and account).
const GooeyLoader = React.forwardRef(({ className, label = "Loading your workspace", ...props }, ref) => {
  return (
    <div ref={ref} className={cn("marketplace-inline-loader", className)} role="status" aria-label={label} {...props}>
      <span className="marketplace-inline-loader-orbit" aria-hidden="true"><Spinner size="lg" /></span>
      <span className="marketplace-inline-loader-label">{label}</span>
      <span className="marketplace-inline-loader-line" aria-hidden="true"><i /></span>
    </div>
  );
});
GooeyLoader.displayName = "GooeyLoader";

export { GooeyLoader };
