import * as React from "react";
import { cn } from "@/lib/utils";

// ── Omix Concentric Ring Loader ─────────────────────────────────
const GooeyLoader = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative flex items-center justify-center", className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <style>{`
          .omix-loader-ring {
            position: absolute;
            border-radius: 50%;
            border-style: solid;
            animation: omix-spin var(--speed) linear infinite;
          }
          .omix-loader-ring:nth-child(1) {
            width: 56px;
            height: 56px;
            border-width: 4px;
            border-color: rgba(20,184,166,0.08);
            border-top-color: #14b8a6;
            --speed: 0.8s;
          }
          .omix-loader-ring:nth-child(2) {
            width: 44px;
            height: 44px;
            border-width: 3.5px;
            border-color: rgba(20,184,166,0.06);
            border-bottom-color: #0d9488;
            --speed: 1.1s;
            animation-direction: reverse;
          }
          .omix-loader-ring:nth-child(3) {
            width: 32px;
            height: 32px;
            border-width: 3px;
            border-color: rgba(94,234,212,0.05);
            border-left-color: #5eead4;
            --speed: 1.4s;
          }
          .omix-loader-core {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #5eead4, #14b8a6, #0d9488);
            animation: omix-pulse 1.2s ease-in-out infinite;
            z-index: 1;
            filter: drop-shadow(0 0 6px rgba(20,184,166,0.5));
          }
          @keyframes omix-spin {
            to { transform: rotate(360deg); }
          }
          @keyframes omix-pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.4); opacity: 1; }
          }
        `}</style>

        <div className="omix-loader-ring" />
        <div className="omix-loader-ring" />
        <div className="omix-loader-ring" />
        <div className="omix-loader-core" />
      </div>
    );
  }
);
GooeyLoader.displayName = "GooeyLoader";

export { GooeyLoader };
