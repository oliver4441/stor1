import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Phone, Mail, MapPin, Clock, Shield, TrendingUp, Users, Star, Award, ChevronLeft, CheckCircle, Package, HeadphonesIcon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-zinc-800/60 rounded ${className}`} />
  );
}

function TrustBadge({ icon: Icon, label, value, subtext, color = 'text-emerald-400' }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/60">
      <div className={`p-2.5 rounded-lg bg-zinc-800 border border-zinc-700/60 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-white truncate">{value}</p>
        {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'text-blue-400' }) {
  return (
    <div className="flex flex-col items-center justify-center p-5 bg-zinc-800/30 border border-zinc-700/40 rounded-xl text-center">
      <div className={`p-2.5 rounded-full bg-zinc-800/60 mb-2 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-400 mt-1">{label}</p>
    </div>
  );
}

export default function SellerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const base = API_BASE || '';
        const res = await fetch(`${base}/api/store/profile`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('[SellerProfile] Fetch error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Banner skeleton */}
        <Skeleton className="h-48 md:h-64 w-full rounded-none" />

        <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
          {/* Logo + Name skeleton */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
            <Skeleton className="w-28 h-28 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2 pt-4 md:pt-0">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-3 w-96" />
            </div>
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>

          {/* Trust badges skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>

          {/* Contact skeleton */}
          <Skeleton className="h-48 rounded-xl mb-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Store className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Store Profile Unavailable</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const {
    store_name = 'Omix Store',
    tagline = '',
    description = '',
    logo_url,
    banner_url,
    phone = '+254 768 213 649',
    email = 'omixsystems@gmail.com',
    address = 'Kenya',
    whatsapp = '+254 768 213 649',
    total_orders = 0,
    satisfaction_rate = 0,
    member_since,
    response_time = 'Under 1 hour',
    is_verified = true,
  } = profile;

  const memberYear = member_since
    ? new Date(member_since).getFullYear()
    : '2024';

  const formatOrders = (count) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
    return count.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Banner ── */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden bg-gradient-to-r from-blue-900 via-purple-900 to-zinc-900">
        {banner_url ? (
          <img
            src={banner_url}
            alt={`${store_name} banner`}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
      </div>

      {/* ── Header Section ── */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
          {/* Logo */}
          <div className="w-28 h-28 shrink-0 rounded-2xl bg-zinc-800 border-2 border-zinc-700 overflow-hidden flex items-center justify-center shadow-xl">
            {logo_url ? (
              <img
                src={logo_url}
                alt={store_name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <Store className="w-12 h-12 text-zinc-500" />
            )}
          </div>

          {/* Name + Tagline */}
          <div className="flex-1 pt-4 md:pt-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {store_name}
              </h1>
              {is_verified && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>
            {tagline && (
              <p className="text-zinc-300 mt-1 text-sm md:text-base">{tagline}</p>
            )}
            {description && (
              <p className="text-zinc-500 mt-2 text-sm leading-relaxed max-w-2xl">{description}</p>
            )}
          </div>
        </div>

        {/* ── Trust Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={Package}
            label="Total Orders"
            value={formatOrders(total_orders)}
            color="text-blue-400"
          />
          <StatCard
            icon={Star}
            label="Satisfaction Rate"
            value={`${satisfaction_rate}%`}
            color="text-amber-400"
          />
          <StatCard
            icon={Clock}
            label="Response Time"
            value={response_time}
            color="text-emerald-400"
          />
          <StatCard
            icon={Award}
            label="Member Since"
            value={memberYear}
            color="text-violet-400"
          />
        </div>

        {/* ── Trust Badges Section ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Trust & Reliability</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TrustBadge
              icon={Shield}
              label="Buyer Protection"
              value="Secure Checkout"
              subtext="All payments processed securely via Paystack"
              color="text-emerald-400"
            />
            <TrustBadge
              icon={TrendingUp}
              label="Satisfaction Rate"
              value={`${satisfaction_rate}%`}
              subtext={`Based on ${formatOrders(total_orders)} completed orders`}
              color="text-amber-400"
            />
            <TrustBadge
              icon={Users}
              label="Happy Customers"
              value={formatOrders(total_orders)}
              subtext="Across Kenya"
              color="text-blue-400"
            />
            <TrustBadge
              icon={HeadphonesIcon}
              label="Response Time"
              value={response_time}
              subtext="Fast support, 6 days a week"
              color="text-violet-400"
            />
          </div>
        </div>

        {/* ── Contact Section ── */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
          <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60 text-blue-400 group-hover:text-blue-300 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">{phone}</p>
                  </div>
                </a>
              )}

              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">{email}</p>
                  </div>
                </a>
              )}

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">WhatsApp</p>
                    <p className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">{whatsapp}</p>
                  </div>
                </a>
              )}

              {address && (
                <div className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60 text-rose-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Address</p>
                    <p className="text-sm text-zinc-300 truncate">{address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
