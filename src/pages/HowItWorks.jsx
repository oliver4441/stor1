import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, ShoppingCart, CreditCard, Truck, Shield, MessageCircle,
  ChevronDown, ChevronUp, Star, ArrowRight, HelpCircle, Smartphone
} from 'lucide-react';

function HowItWorks() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;

  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      icon: <Search className="w-7 h-7" />,
      title: 'Browse or Search',
      description: 'Explore products by category or search for exactly what you need. Use filters to narrow down by price or condition.',
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-zinc-900/20',
    },
    {
      icon: <ShoppingCart className="w-7 h-7" />,
      title: 'Add to Cart & Checkout',
      description: 'Found something you like? Add to cart, enter your details, and pay via M-Pesa STK push.',
      color: 'from-[var(--seasonal-primary,#007AFF)] to-[var(--seasonal-secondary,#0066CC)]',
      bg: 'bg-[var(--seasonal-primary,#007AFF)]/5 dark:bg-[var(--seasonal-primary,#007AFF)]/10',
    },
    {
      icon: <Truck className="w-7 h-7" />,
      title: 'Get Delivered',
      description: 'We deliver to your doorstep nationwide within 2-5 business days. Track your order in real-time.',
      color: 'from-[#007AFF] to-[#0066CC]',
      bg: 'bg-[#007AFF]/20',
    },
  ];

  const features = [
    {
      icon: <Smartphone className="w-6 h-6 text-[#25D366]" />,
      title: 'M-Pesa STK Push',
      description: 'Pay instantly via M-Pesa. Enter your phone at checkout and get an STK push — no cash needed.',
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-[#25D366]" />,
      title: 'WhatsApp Sharing',
      description: 'Share any product on WhatsApp with one tap. Perfect for showing friends and family.',
    },
    {
      icon: <Shield className="w-6 h-6 text-zinc-600" />,
      title: 'Secure & Simple',
      description: 'No complicated checkout. Just browse, add to cart, pay via M-Pesa, and get delivered.',
    },
    {
      icon: <Star className="w-6 h-6 text-amber-500" />,
      title: 'Free to Use',
      description: 'Omix is completely free. No listing fees, no commissions, no hidden charges.',
    },
  ];

  const faqs = [
    {
      question: 'Is Omix free to use?',
      answer: 'Yes, completely free. Browsing, ordering, tracking — everything costs nothing.',
    },
    {
      question: 'How do I pay for items?',
      answer: 'Pay via M-Pesa STK push at checkout. Enter your phone number, get the push, and confirm. You can also pay cash on delivery.',
    },
    {
      question: 'How long does delivery take?',
      answer: 'We deliver nationwide within 2-5 business days. You can track your order status anytime.',
    },
    {
      question: 'Do I need an account to order?',
      answer: 'Yes, you need to sign up to place an order. It takes less than a minute — just your name, email, and password.',
    },
    {
      question: 'How do I track my order?',
      answer: 'After placing an order, you get an order ID. Use the Track Order page or go to My Account to see real-time status.',
    },
    {
      question: 'Where can I get help?',
      answer: 'Click the pink message bubble in the bottom-right corner to contact us. We respond within 24 hours. Email: omixsystems@gmail.com.',
    },
  ];

  return (
    <div data-name="how-it-works-page">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#28303F] via-[#28303F] to-[#28303F]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,56,92,0.15),transparent_50%)]"></div>

        <div className="relative z-10 py-16 md:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-sm font-bold px-4 py-2 rounded-full mb-6">
              <HelpCircle className="w-4 h-4" />
              Guide
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              How Omix Works
            </h1>
            <p className="text-lg md:text-xl text-[#4A5771] max-w-2xl mx-auto mb-8">
              Shop online with Omix. Browse, add to cart, pay via M-Pesa, get delivered.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/" className="bg-[var(--seasonal-primary,#007AFF)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--seasonal-secondary,#0066CC)] transition-all flex items-center gap-2">
                <Search className="w-5 h-5" />
                Start Shopping
              </Link>
              <Link to="/signup" className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Steps */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[var(--seasonal-primary,#007AFF)] uppercase tracking-widest">3 Simple Steps</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-2">Shop with ease</h2>
            <p className="text-[#4A5771] mt-2 max-w-lg mx-auto">From browsing to delivery, it's that simple.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-[#28303F]">
                    <ArrowRight className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 text-[#8E9BB5] dark:text-[#353F54]" />
                  </div>
                )}
                <div className={`${step.bg} rounded-3xl p-8 h-full border border-[#353F54]`}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg`}>
                      {step.icon}
                    </div>
                    <span className="text-xs font-black text-[#4A5771] uppercase">Step {i + 1}</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                  <p className="text-[#4A5771] leading-relaxed text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[var(--seasonal-primary,#007AFF)] uppercase tracking-widest">Features</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-2">Everything you get</h2>
            <p className="text-[#4A5771] mt-2 max-w-lg mx-auto">Designed for how people shop in Kenya.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="fusion-recessed-card p-6 flex gap-4 hover:border-[#007AFF]/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#28303F] flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-[#4A5771]">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[var(--seasonal-primary,#007AFF)] uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-2">Common questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="fusion-recessed-card overflow-hidden">
                <button onClick={() => toggleFaq(i)} className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#323B4F]/50 transition-colors">
                  <span className="font-bold text-white pr-4">{faq.question}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-[#4A5771] flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#4A5771] flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-[#4A5771] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="bg-gradient-to-br from-[var(--seasonal-primary,#007AFF)] to-[var(--seasonal-secondary,#0066CC)] rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Ready to start shopping?</h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">Create your account in seconds and start browsing. Pay via M-Pesa, get delivered.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/signup" className="bg-[var(--seasonal-primary,#007AFF)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--seasonal-primary,#0066CC)] transition-all flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Create Account
              </Link>
              <Link to="/" className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2">
                <Search className="w-5 h-5" />
                Browse Products
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default HowItWorks;