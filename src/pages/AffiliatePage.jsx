import { Link } from 'react-router-dom';
import { DollarSign, Users, TrendingUp, Target, Gift, MousePointerClick, ChevronRight, Award, Shield, Clock, ExternalLink, Share2, Calendar, CreditCard } from 'lucide-react';

const TIERS = [
  { name: 'Silver', rate: '5%', orders: '0', sales: 'KES 0', color: 'text-[#8E9BB5]', bar: 'bg-zinc-400' },
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
    <div className="min-h-screen bg-[#242C3B] text-zinc-100">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden border-b border-[#353F54] min-h-[75vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[url('/affiliate-hero-bg.jpg')] bg-cover bg-center bg-no-repeat" />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/60" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 text-sm font-medium mb-6">
              <Award size={16} />
              <span>Earn commissions on every sale you refer</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Earn with{' '}
              <span className="bg-gradient-to-r from-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                Omix Store
              </span>{' '}
              Affiliate Program
            </h1>
            <p className="text-lg md:text-xl text-[#4A5771] leading-relaxed mb-8">
              Join our affiliate program and earn commissions by promoting products from Omix Store.
              With our 100-year cookie tracking, you get credit for every sale your referrals make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/affiliate/apply"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-zinc-600 to-zinc-500 hover:from-zinc-600 hover:to-zinc-400 transition-all duration-200 shadow-lg shadow-zinc-500/20"
              >
                Join the Affiliates
                <ChevronRight size={18} />
              </Link>
              <Link
                to="/affiliate/agreement"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[#8E9BB5] border border-[#353F54] hover:bg-[#28303F] transition-all duration-200"
              >
                View Full Agreement
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t border-[#353F54]/50 text-center">
              <p className="text-sm text-[#4A5771]">
                Already an affiliate?{' '}
                <Link to="/login" className="text-zinc-500 hover:text-zinc-400 font-medium transition-colors">
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
          <p className="text-[#4A5771] max-w-2xl mx-auto">
            Getting started as an Omix Store affiliate is simple. Follow these steps to begin earning.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((step, idx) => (
            <div
              key={step.title}
              className="group relative p-6 rounded-xl bg-[#28303F]/50 border border-[#353F54] hover:border-zinc-500/30 transition-all duration-300"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                {idx + 1}
              </div>
              <div className="w-12 h-12 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center mb-4 group-hover:bg-zinc-500/20 transition-colors">
                <step.icon size={24} className="text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-[#4A5771] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Commission Tiers ── */}
      <section className="border-t border-[#353F54] bg-[#28303F]/30">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Commission Tiers</h2>
            <p className="text-[#4A5771] max-w-2xl mx-auto">
              The more you sell, the higher your commission rate. Tiers are calculated annually based on qualified orders and total sales volume.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-lg mx-auto">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="relative p-6 rounded-xl bg-[#28303F] border border-[#353F54] hover:border-[#353F54] transition-all"
              >
                <div className={`text-2xl font-bold mb-1 ${tier.color}`}>{tier.name}</div>
                <div className="text-3xl font-extrabold text-white mb-4">{tier.rate}</div>
                <div className="space-y-2 text-sm text-[#4A5771]">
                  <div className="flex justify-between">
                    <span>Min Orders</span>
                    <span className="text-[#8E9BB5] font-medium">{tier.orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Sales</span>
                    <span className="text-[#8E9BB5] font-medium">{tier.sales}</span>
                  </div>
                </div>
                <div className="mt-4 h-1.5 bg-[#28303F] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${tier.bar}`} style={{ width: `${(TIERS.indexOf(tier) + 1) * 25}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[#4A5771] text-sm mt-6">
            Commission calculated on total order value excluding shipping, taxes, and discounts.
            Only completed and delivered orders qualify.
          </p>
        </div>
      </section>

      {/* ── Pro Tips ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pro Tips for Success</h2>
          <p className="text-[#4A5771] max-w-2xl mx-auto">
            Maximize your earnings with these proven strategies from our top affiliates.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-gradient-to-br from-zinc-600/5 to-transparent border border-zinc-600/10">
            <div className="w-12 h-12 rounded-lg bg-zinc-500/10 flex items-center justify-center mb-4">
              <Share2 className="text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Share Your Link Everywhere</h3>
            <p className="text-[#4A5771] text-sm leading-relaxed">
              Place your affiliate link in your social media bios, WhatsApp status, blog posts, and email signatures. The more visibility, the more potential sales.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
              <Target className="text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Focus on High-Value Products</h3>
            <p className="text-[#4A5771] text-sm leading-relaxed">
              Prioritize promoting products with higher price points. A single high-value sale can earn you more commission than multiple small ones.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-[#71717a]/5 to-transparent border border-[#71717a]/10">
            <div className="w-12 h-12 rounded-lg bg-[#71717a]/10 flex items-center justify-center mb-4">
              <Calendar className="text-[#71717a]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Promote During Peak Seasons</h3>
            <p className="text-[#4A5771] text-sm leading-relaxed">
              Capitalize on holiday seasons, flash deals, and promotional events when customers are actively shopping and more likely to purchase.
            </p>
          </div>
        </div>

        {/* Pro Tip Callout */}
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-zinc-700/5 via-zinc-600/5 to-transparent border border-zinc-600/10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={20} className="text-zinc-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1">10-Year Cookie Tracking</h3>
              <p className="text-[#4A5771] text-sm leading-relaxed">
                Once someone clicks your referral link, a cookie is stored for 100 years. You earn commission on every qualifying purchase they make during that time, even if they visit the store directly later. It is the longest cookie duration in the industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Payout Info ── */}
      <section className="border-t border-[#353F54] bg-[#28303F]/30">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Payout Information</h2>
            <p className="text-[#4A5771] max-w-2xl mx-auto">
              We make it easy to get paid. Here is everything you need to know about affiliate payouts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#28303F] border border-[#353F54] text-center">
              <div className="w-14 h-14 rounded-full bg-zinc-500/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign size={28} className="text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Minimum Payout</h3>
              <p className="text-2xl font-bold text-zinc-500">KES 2,000</p>
              <p className="text-[#4A5771] text-sm mt-2">Earn this minimum before requesting a payout</p>
            </div>
            <div className="p-6 rounded-xl bg-[#28303F] border border-[#353F54] text-center">
              <div className="w-14 h-14 rounded-full bg-[#71717a]/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="text-[#71717a]" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Payment Method</h3>
              <p className="text-2xl font-bold text-[#71717a]">M-Pesa</p>
              <p className="text-[#4A5771] text-sm mt-2">Paid directly to your registered M-Pesa number</p>
            </div>
            <div className="p-6 rounded-xl bg-[#28303F] border border-[#353F54] text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock size={28} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Processing Time</h3>
              <p className="text-2xl font-bold text-amber-400">7-14 Days</p>
              <p className="text-[#4A5771] text-sm mt-2">Business days after your payout request</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h2>
        <p className="text-[#4A5771] max-w-xl mx-auto mb-8">
          Join hundreds of affiliates earning commissions by promoting Omix Store products. Apply now and start sharing your referral link today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/affiliate/apply"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-zinc-600 to-zinc-500 hover:from-zinc-600 hover:to-zinc-400 transition-all duration-200 shadow-lg shadow-zinc-500/20"
          >
            Join the Affiliates
            <ChevronRight size={18} />
          </Link>
          <Link
            to="/affiliate/agreement"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[#8E9BB5] border border-[#353F54] hover:bg-[#28303F] transition-all duration-200"
          >
            View Full Agreement
            <ExternalLink size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

