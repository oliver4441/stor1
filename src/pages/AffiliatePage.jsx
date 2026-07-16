import { Link } from 'react-router-dom';
import { DollarSign, Users, TrendingUp, Target, Gift, MousePointerClick, ChevronRight, Award, Shield, Clock, ExternalLink } from 'lucide-react';

const TIERS = [
  { name: 'Silver', rate: '5%', orders: '0', sales: 'KES 0', color: 'text-zinc-300', bar: 'bg-zinc-400' },
  { name: 'Gold', rate: '10%', orders: '30', sales: 'KES 0', color: 'text-amber-400', bar: 'bg-amber-400' },
];

const STEPS = [
  { icon: MousePointerClick, title: 'Apply Online', desc: 'Fill out the affiliate application form and agree to the terms.' },
  { icon: Users, title: 'Get Approved', desc: 'Our team reviews your application and activates your account.' },
  { icon: Gift, title: 'Receive Your Link', desc: 'Get your unique referral link to start sharing instantly.' },
  { icon: TrendingUp, title: 'Promote Products', desc: 'Share products from Omix Store across your channels.' },
  { icon: Target, title: 'Earn Commissions', desc: 'Earn up to 10% on every qualifying sale you refer.' },
  { icon: DollarSign, title: 'Get Paid', desc: 'Request payouts via M-Pesa once you reach KES 2,000.' },
];

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden border-b border-zinc-800 min-h-[75vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[url('/affiliate-hero-bg.jpg')] bg-cover bg-center bg-no-repeat" />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/60" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Award size={16} />
              <span>Earn commissions on every sale you refer</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Earn with{' '}
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Omix Store
              </span>{' '}
              Affiliate Program
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-8">
              Join our affiliate program and earn commissions by promoting products from Omix Store.
              With our 100-year cookie tracking, you get credit for every sale your referrals make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/affiliate/apply"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                Join the Affiliates
                <ChevronRight size={18} />
              </Link>
              <Link
                to="/affiliate/agreement"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition-all duration-200"
              >
                View Full Agreement
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-800/50 text-center">
              <p className="text-sm text-zinc-500">
                Already an affiliate?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Sign in to your dashboard
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Getting started as an Omix Store affiliate is simple. Follow these steps to begin earning.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((step, idx) => (
            <div
              key={step.title}
              className="group relative p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                {idx + 1}
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                <step.icon size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Commission Tiers ── */}
      <section className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Commission Tiers</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              The more you sell, the higher your commission rate. Tiers are calculated annually based on qualified orders and total sales volume.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-lg mx-auto">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="relative p-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <div className={`text-2xl font-bold mb-1 ${tier.color}`}>{tier.name}</div>
                <div className="text-3xl font-extrabold text-white mb-4">{tier.rate}</div>
                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex justify-between">
                    <span>Min Orders</span>
                    <span className="text-zinc-300 font-medium">{tier.orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Sales</span>
                    <span className="text-zinc-300 font-medium">{tier.sales}</span>
                  </div>
                </div>
                <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${tier.bar}`} style={{ width: `${(TIERS.indexOf(tier) + 1) * 25}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-500 text-sm mt-6">
            Commission calculated on total order value excluding shipping, taxes, and discounts.
            Only completed and delivered orders qualify.
          </p>
        </div>
      </section>

      {/* ── Pro Tips ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pro Tips for Success</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Maximize your earnings with these proven strategies from our top affiliates.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Share2Icon className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Share Your Link Everywhere</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Place your affiliate link in your social media bios, WhatsApp status, blog posts, and email signatures. The more visibility, the more potential sales.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
              <TargetIcon className="text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Focus on High-Value Products</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Prioritize promoting products with higher price points. A single high-value sale can earn you more commission than multiple small ones.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/10">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <CalendarIcon className="text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Promote During Peak Seasons</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Capitalize on holiday seasons, flash deals, and promotional events when customers are actively shopping and more likely to purchase.
            </p>
          </div>
        </div>

        {/* Pro Tip Callout */}
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-blue-600/5 via-blue-500/5 to-transparent border border-blue-500/10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1">10-Year Cookie Tracking</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Once someone clicks your referral link, a cookie is stored for 100 years. You earn commission on every qualifying purchase they make during that time, even if they visit the store directly later. It is the longest cookie duration in the industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Payout Info ── */}
      <section className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Payout Information</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              We make it easy to get paid. Here is everything you need to know about affiliate payouts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign size={28} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Minimum Payout</h3>
              <p className="text-2xl font-bold text-blue-400">KES 2,000</p>
              <p className="text-zinc-500 text-sm mt-2">Earn this minimum before requesting a payout</p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <PaymentIcon className="text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Payment Method</h3>
              <p className="text-2xl font-bold text-green-400">M-Pesa</p>
              <p className="text-zinc-500 text-sm mt-2">Paid directly to your registered M-Pesa number</p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock size={28} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Processing Time</h3>
              <p className="text-2xl font-bold text-amber-400">7-14 Days</p>
              <p className="text-zinc-500 text-sm mt-2">Business days after your payout request</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h2>
        <p className="text-zinc-400 max-w-xl mx-auto mb-8">
          Join hundreds of affiliates earning commissions by promoting Omix Store products. Apply now and start sharing your referral link today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/affiliate/apply"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Join the Affiliates
            <ChevronRight size={18} />
          </Link>
          <Link
            to="/affiliate/agreement"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition-all duration-200"
          >
            View Full Agreement
            <ExternalLink size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

// Inline icon components to avoid naming collisions
function Share2Icon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function TargetIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function CalendarIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PaymentIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
