import * as React from "react";
import { cn } from "@/lib/utils";

// ── Butterfly Loader (by carlosepcc / WerlynDev) ─────────────────
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
          .omix-butterfly {
            --sizeLoader: 60px;
            --stepBtf: calc(var(--sizeLoader) / 10);
            display: flex;
            position: relative;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            width: var(--sizeLoader);
            height: var(--sizeLoader);
            background: radial-gradient(rgba(20,184,166,0.12) 0%, transparent 70%);
            border-radius: 50%;
            animation: omix-bfly-float 0.3s alternate ease-in-out infinite;
            filter: drop-shadow(0 8px 12px rgba(13,148,136,0.25));
          }
          .omix-bfly-wing-l {
            position: relative;
            height: 100%;
            left: 2%;
            transform-origin: center right;
            animation: omix-bfly-flap 0.2s ease-in-out infinite;
          }
          .omix-bfly-body {
            height: 50%;
          }
          .omix-bfly-wing-r {
            position: relative;
            height: 100%;
            left: -2%;
            transform-origin: center left;
            animation: omix-bfly-flap 0.25s ease-in-out infinite;
          }
          @keyframes omix-bfly-flap {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(70deg); }
            100% { transform: rotateY(0deg); }
          }
          @keyframes omix-bfly-float {
            from { transform: translateY(0px); }
            to { transform: translateY(var(--stepBtf)); }
          }
        `}</style>

        <div className="omix-butterfly">
          {/* Left wing */}
          <svg className="omix-bfly-wing-l" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bfly-grad-l" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#5eead4" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d="M38 30 C38 15 25 5 15 2 C10 1 5 2 2 5 C2 5 8 8 12 12 C18 18 22 25 22 30 C22 35 18 42 12 48 C8 52 2 55 2 55 C5 58 10 59 15 58 C25 55 38 45 38 30Z"
              fill="url(#bfly-grad-l)" opacity="0.85" />
            <path d="M30 30 C30 20 22 12 15 8 C18 12 20 18 20 22 C20 26 18 30 15 34 C12 38 10 42 10 48 C15 46 22 42 26 38 C28 36 30 33 30 30Z"
              fill="rgba(20,184,166,0.15)" />
          </svg>

          {/* Body */}
          <svg className="omix-bfly-body" viewBox="0 0 10 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="5" cy="15" rx="3" ry="14" fill="#0d9488" />
            <ellipse cx="5" cy="8" rx="3.5" ry="3.5" fill="#14b8a6" />
            <line x1="5" y1="4" x2="5" y2="2" stroke="#5eead4" strokeWidth="1" strokeLinecap="round" />
            <line x1="3" y1="5" x2="1.5" y2="4" stroke="#5eead4" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="7" y1="5" x2="8.5" y2="4" stroke="#5eead4" strokeWidth="0.8" strokeLinecap="round" />
          </svg>

          {/* Right wing */}
          <svg className="omix-bfly-wing-r" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bfly-grad-r" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#5eead4" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d="M2 30 C2 15 15 5 25 2 C30 1 35 2 38 5 C38 5 32 8 28 12 C22 18 18 25 18 30 C18 35 22 42 28 48 C32 52 38 55 38 55 C35 58 30 59 25 58 C15 55 2 45 2 30Z"
              fill="url(#bfly-grad-r)" opacity="0.85" />
            <path d="M10 30 C10 20 18 12 25 8 C22 12 20 18 20 22 C20 26 22 30 25 34 C28 38 30 42 30 48 C25 46 18 42 14 38 C12 36 10 33 10 30Z"
              fill="rgba(20,184,166,0.15)" />
          </svg>
        </div>
      </div>
    );
  }
);
GooeyLoader.displayName = "GooeyLoader";

export { GooeyLoader };
