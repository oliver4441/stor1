import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSellerProfile, registerSeller } from '../utils/api';
import { Store, Loader2, CheckCircle2, ArrowRight, AlertTriangle, Clock } from 'lucide-react';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SellerRegistration() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [checkingSeller, setCheckingSeller] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [form, setForm] = useState({
    shopName: '',
    shopSlug: '',
    description: '',
    phone: '',
    email: '',
    address: '',
  });

  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/seller/register', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Check if user is already a seller
  const [existingSeller, setExistingSeller] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const result = await getSellerProfile(user.id);
        if (cancelled) return;
        if (result?.seller) {
          const s = result.seller;
          if (s.status === 'approved' && s.is_active) {
            navigate('/seller/dashboard', { replace: true });
            return;
          }
          // Pending or rejected — show status page instead of redirecting
          setExistingSeller(s);
          setCheckingSeller(false);
          return;
        }
      } catch {
        // Not a seller yet — that's fine
      }
      if (!cancelled) setCheckingSeller(false);
    })();

    return () => { cancelled = true; };
  }, [user, navigate]);

  const updateField = useCallback((field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from shop name unless slug was manually edited
      if (field === 'shopName' && !slugManuallyEdited) {
        next.shopSlug = slugify(value);
      }
      return next;
    });
  }, [slugManuallyEdited]);

  const handleSlugChange = useCallback((value) => {
    setSlugManuallyEdited(true);
    setForm(prev => ({ ...prev, shopSlug: slugify(value) }));
  }, []);

  const validate = () => {
    if (!form.shopName.trim()) {
      setError('Shop name is required.');
      return false;
    }
    if (!form.shopSlug.trim()) {
      setError('Shop slug is required.');
      return false;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.shopSlug)) {
      setError('Shop slug must be lowercase with hyphens only (e.g. "my-shop-name").');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await registerSeller({
        userId: user.id,
        shopName: form.shopName.trim(),
        shopSlug: form.shopSlug.trim(),
        description: form.description.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });

      if (result?.success || result?.seller) {
        setSuccess(true);
      } else {
        setError(result?.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state while checking auth / seller status
  if (authLoading || checkingSeller) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Checking account...</span>
        </div>
      </div>
    );
  }

  // Success state — show pending approval
  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-5">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Pending Approval</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Your seller account is under review. You will be notified once approved.
          </p>
          <Link
            to="/seller/dashboard"
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Go to Seller Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Existing non-approved seller state
  if (existingSeller) {
    const s = existingSeller;
    if (s.status === 'pending') {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-5">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Application Pending</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Your seller account is under review. You will be notified once approved.
            </p>
            <Link
              to="/seller/dashboard"
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Go to Seller Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      );
    }
    if (s.status === 'rejected') {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-5">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Application Not Approved</h1>
            <p className="text-zinc-400 text-sm mb-4">
              Your application was not approved.
            </p>
            {s.rejection_reason && (
              <div className="bg-red-900/10 border border-red-800/30 rounded-xl px-4 py-3 mb-6 text-left">
                <p className="text-xs font-semibold text-red-400 mb-1">Reason:</p>
                <p className="text-sm text-zinc-300">{s.rejection_reason}</p>
              </div>
            )}
            <Link
              to="/seller/dashboard"
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Go to Seller Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      );
    }
    // Fallback — show generic
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center">
          <Store className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Seller Account</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Your account status: {s.status || 'unknown'}
          </p>
          <Link
            to="/seller/dashboard"
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Go to Seller Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 mb-4">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Become a Seller</h1>
          <p className="text-zinc-400 text-sm mt-1">Set up your shop on Omix Store</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-5"
        >
          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Shop Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.shopName}
              onChange={(e) => updateField('shopName', e.target.value)}
              placeholder="My Awesome Shop"
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Shop Slug */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Shop Slug <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
                /store/
              </span>
              <input
                type="text"
                value={form.shopSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-awesome-shop"
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-16 pr-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              URL-friendly name. Auto-generated from shop name, but you can edit it.
            </p>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Short Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Tell customers about your shop..."
              rows={3}
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="shop@example.com"
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Physical Address */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Physical Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Nairobi, Kenya"
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Store className="w-4 h-4" />
                Register as Seller
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          Already a seller?{' '}
          <Link to="/seller/dashboard" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
            Go to your dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
