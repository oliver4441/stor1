import { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Shield, Star, ArrowRight } from 'lucide-react';

export function WelcomeScreen({ onFinish }) {
  const [visible, setVisible] = useState(true);
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStep(1), 300);
    const t2 = setTimeout(() => setAnimStep(2), 800);
    const t3 = setTimeout(() => setAnimStep(3), 1300);
    const t4 = setTimeout(() => setAnimStep(4), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const handleContinue = () => {
    setVisible(false);
    onFinish?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--seasonal-primary,#ff385c)] via-[var(--seasonal-secondary,#e03150)] to-[var(--seasonal-hero-to,#c02040)]"></div>
      <div className="absolute top-[-80px] right-[-80px] w-[250px] h-[250px] rounded-full bg-white/5"></div>
      <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] rounded-full bg-white/5"></div>

      <div className="relative z-10 text-center px-6 max-w-sm mx-auto w-full">
        {/* Logo */}
        <div
          className={`w-24 h-24 rounded-3xl bg-white flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-black/30 transition-all duration-700 overflow-hidden ${
            animStep >= 1 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4'
          }`}
        >
          <img src="/logo.svg" alt="Omix" className="w-full h-full" />
        </div>

        <h1
          className={`text-3xl font-black text-white mb-2 tracking-tight transition-all duration-700 ${
            animStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Welcome to Omix!
        </h1>
        <p
          className={`text-white/80 text-sm mb-8 transition-all duration-700 ${
            animStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          You have successfully installed the app. Here is what you can do:
        </p>

        <div className="space-y-3 mb-8">
          {[
            { icon: ShoppingBag, text: 'Browse hundreds of products' },
            { icon: Truck, text: 'Fast delivery across Kericho' },
            { icon: Shield, text: 'Secure M-Pesa payments' },
            { icon: Star, text: 'Best prices, zero hassle' },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-left transition-all duration-500 ${
                animStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <item.icon className="w-5 h-5 text-white/90 flex-shrink-0" />
              <span className="text-white text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          className={`w-full bg-white text-[var(--seasonal-primary,#ff385c)] font-black py-4 rounded-2xl text-lg shadow-xl shadow-black/20 hover:shadow-black/30 active:scale-95 transition-all duration-500 flex items-center justify-center gap-2 ${
            animStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Start Shopping
          <ArrowRight className="w-5 h-5" />
        </button>

        <p
          className={`text-white/50 text-xs mt-4 transition-all duration-500 ${
            animStep >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Your Online Store in Kericho
        </p>
      </div>
    </div>
  );
}
