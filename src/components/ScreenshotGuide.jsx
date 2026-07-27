import { ShoppingCart, Search, CreditCard, Truck, User, CheckCircle, Package, MapPin } from 'lucide-react';

// Reusable guide step component
export default function ScreenshotGuide({ steps }) {
  return (
    <div className="space-y-8 my-6">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          {/* Step number + icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--seasonal-primary,#0d9488)] to-[var(--seasonal-secondary,#14b8a6)] flex items-center justify-center text-white font-bold text-lg">
              {index + 1}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{step.desc}</p>
            
            {/* SVG Illustration */}
            {step.svg && (
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 overflow-hidden">
                <div className="max-w-lg mx-auto" dangerouslySetInnerHTML={{ __html: step.svg }} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}