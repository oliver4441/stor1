import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, PlusCircle, MessageCircle, Heart, Shield, Smartphone,
  ChevronDown, ChevronUp, Package, Share2, CreditCard, Star,
  ArrowRight, HelpCircle
} from 'lucide-react';

function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      icon: <Search className="w-7 h-7" />,
      title: 'Browse or Search',
      description: 'Explore listings by category or search for exactly what you need. Use filters to narrow down by location, price, or condition.',
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600',
    },
    {
      icon: <MessageCircle className="w-7 h-7" />,
      title: 'Contact the Seller',
      description: 'Found something you like? Reach out via in-app chat, WhatsApp, or phone. Ask questions, negotiate, and arrange a meetup.',
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Meet & Pay Safely',
      description: 'Meet in person at a public place. Pay via M-Pesa Buy Goods (Till: 9315501) for safe transactions. Never pay in advance.',
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600',
    },
  ];

  const sellerSteps = [
    {
      icon: <PlusCircle className="w-7 h-7" />,
      title: 'Post Your Listing',
      description: 'Click "Sell", add photos, set your price, and describe your item. Your listing goes live instantly — no approval needed.',
      color: 'from-[#ff385c] to-[#e03150]',
      bg: 'bg-[#ff385c]/5 dark:bg-[#ff385c]/10',
      iconColor: 'text-[#ff385c]',
    },
    {
      icon: <Share2 className="w-7 h-7" />,
      title: 'Share Everywhere',
      description: 'Share your listings on WhatsApp, Facebook, or anywhere. More shares = more views = faster sales.',
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
    },
    {
      icon: <MessageCircle className="w-7 h-7" />,
      title: 'Chat & Close the Deal',
      description: 'Buyers will reach out via chat or WhatsApp. Agree on price and meeting point. Simple as that.',
      color: 'from-teal-500 to-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600',
    },
  ];

  const features = [
    {
      icon: <Heart className="w-6 h-6 text-[#ff385c]" />,
      title: 'Wishes Board',
      description: 'Can\'t find what you need? Post a wish and let sellers come to you. Tell the community what you\'re looking for.',
      link: '/wishes',
      linkText: 'Browse Wishes',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#25D366]" />,
      title: 'WhatsApp Sharing',
      description: 'Every listing has a WhatsApp share button. One tap sends details to any contact or group — perfect for spreading the word.',
      link: null,
    },
    {
      icon: <Package className="w-6 h-6 text-blue-500" />,
      title: 'Seller Dashboard',
      description: 'Track all your listings, inquiries, and sales in one place. Your personal command center.',
      link: '/dashboard',
      linkText: 'Open Dashboard',
    },
    {
      icon: <Star className="w-6 h-6 text-amber-500" />,
      title: 'No Fees, No Catch',
      description: 'Omix is completely free. Post unlimited listings, message unlimited buyers. We\'re here to grow with Kericho.',
      link: null,
    },
  ];

  const faqs = [
    {
      question: 'Is Omix free to use?',
      answer: 'Yes, completely free. Posting listings, messaging buyers, browsing — everything costs nothing. We believe local commerce should be accessible to everyone.',
    },
    {
      question: 'How do I pay for items?',
      answer: 'We recommend paying via M-Pesa Buy Goods (Till Number: 9315501) when you meet the seller in person. Never send money before seeing the item. Always meet in a public place.',
    },
    {
      question: 'How do I contact a seller?',
      answer: 'On any listing, you can click "Chat on WhatsApp" to message the seller directly, or use the in-app chat. You can also click the floating contact button (bottom-right) to message the Omix team.',
    },
    {
      question: 'What is the Wishes Board?',
      answer: 'The Wishes Board lets you post what you\'re looking for. If you can\'t find a listing, post a wish — sellers who have that item can reach out to you directly.',
    },
    {
      question: 'Do I need an account to browse?',
      answer: 'No! Anyone can browse listings and post wishes without signing up. You only need an account to post listings and manage your dashboard.',
    },
    {
      question: 'How do I share a listing on WhatsApp?',
      answer: 'Every listing card has a green share icon (appears on hover). On the listing detail page, there\'s a full "Share" button. One tap opens WhatsApp with the listing details pre-filled.',
    },
    {
      question: 'Where can I get help?',
      answer: 'Click the pink message bubble in the bottom-right corner of any page to contact the Omix team. We\'ll respond within 24 hours. You can also email us at omixsystems@gmail.com.',
    },
  ];

  return (
    <div data-name="how-it-works-page">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900"></div>
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
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
              Everything you need to know to start buying and selling in Kericho. From your first search to closing the deal.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/" className="bg-[#ff385c] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e03150] transition-all flex items-center gap-2">
                <Search className="w-5 h-5" />
                Start Browsing
              </Link>
              <Link to="/sell" className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* For Buyers */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#ff385c] uppercase tracking-widest">For Buyers</span>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mt-2">Find what you need</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">Three simple steps to your next great find in Kericho.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-zinc-200 dark:bg-zinc-800">
                    <ArrowRight className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-700" />
                  </div>
                )}

                <div className={`${step.bg} rounded-3xl p-8 h-full border border-zinc-100 dark:border-zinc-800`}>
                  {/* Step number + icon */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg`}>
                      {step.icon}
                    </div>
                    <span className="text-xs font-black text-zinc-400 uppercase">Step {i + 1}</span>
                  </div>

                  <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* For Sellers */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#ff385c] uppercase tracking-widest">For Sellers</span>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mt-2">Start selling today</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">No approval process. No fees. List it and it's live.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {sellerSteps.map((step, i) => (
              <div key={i} className="relative">
                {i < sellerSteps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-zinc-200 dark:bg-zinc-800">
                    <ArrowRight className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-700" />
                  </div>
                )}

                <div className={`${step.bg} rounded-3xl p-8 h-full border border-zinc-100 dark:border-zinc-800`}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg`}>
                      {step.icon}
                    </div>
                    <span className="text-xs font-black text-zinc-400 uppercase">Step {i + 1}</span>
                  </div>

                  <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#ff385c] uppercase tracking-widest">Features</span>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mt-2">Everything you get</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">Tools designed for how people actually buy and sell in Kenya.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex gap-4 hover:border-[#ff385c]/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-zinc-900 dark:text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{feature.description}</p>
                  {feature.link && (
                    <Link to={feature.link} className="text-sm font-bold text-[#ff385c] hover:underline inline-flex items-center gap-1">
                      {feature.linkText} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#ff385c] uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mt-2">Common questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="font-bold text-zinc-900 dark:text-white pr-4">{faq.question}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="bg-gradient-to-br from-[#ff385c] to-[#e03150] rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Ready to get started?</h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">Join the fastest growing marketplace in Kericho. Whether you're buying or selling, it takes less than a minute.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/" className="bg-white text-[#ff385c] px-6 py-3 rounded-xl font-bold hover:bg-zinc-100 transition-all flex items-center gap-2">
                <Search className="w-5 h-5" />
                Browse Listings
              </Link>
              <Link to="/sell" className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Post a Listing
              </Link>
              <Link to="/wishes" className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2">
                <Heart className="w-5 h-5" />
                View Wishes
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default HowItWorks;
