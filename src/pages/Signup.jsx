import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../utils/api';
import { useLang } from '../utils/lang';
import { User, Mail, Lock, CheckCircle2, ShoppingBag } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { checkRateLimit, recordActionAttempt, clearRateLimit } from '../utils/rateLimit';
import { trackUserSignup, trackError } from '../utils/analytics';
import { sounds } from '../utils/sounds';

function Signup() {
  const { t } = useLang();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', referralCode: '' });
  const [showReferralInput, setShowReferralInput] = useState(false);
  const successTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreed) { setError('Please agree to the Terms of Service'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }

    // Rate limit check
    const rl = checkRateLimit('signup');
    if (!rl.allowed) {
      setError(`Too many signup attempts. Please wait ${rl.retryAfter} seconds before trying again.`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const refCodeToUse = formData.referralCode?.trim() || refCode;
      recordActionAttempt('signup');
      const result = await signUp({ email: formData.email, password: formData.password, fullName: formData.fullName, refCode: refCodeToUse });
      if (result.success) {
        clearRateLimit('signup');
        sounds.signup();
        trackUserSignup('email', result.user.id);

        // Send welcome email (fire and forget)
        try {
          const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';
          const apiKey = import.meta.env.VITE_OMIX_API_KEY;
          if (apiKey) {
            fetch(`${API_BASE}/api/email/welcome`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
              body: JSON.stringify({ to: formData.email, name: formData.fullName }),
            }).catch(() => {});
          }
        } catch {}

        if (result.session) { setSuccess(true); successTimer.current = setTimeout(() => navigate('/account'), 1500); }
        else { setNeedsVerification(true); setRegisteredEmail(formData.email); setLoading(false); }
      } else { setError(result.error); setLoading(false); }
    } catch (err) { 
      trackError(err.message || 'Signup failed', 'Signup.handleSignup');
      setError(err.message || 'Something went wrong. Please try again.'); 
      setLoading(false); 
    }
  };

  if (needsVerification) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center" data-name="signup-verify">
        <div className="bg-blue-900/20 text-blue-600 p-8 rounded-3xl mb-6">
          <div className="w-16 h-16 bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-black text-blue-500">@</span></div>
          <h2 className="text-2xl font-black mb-2">Check Your Email</h2>
          <p className="text-zinc-400 mb-2">We sent a verification link to <strong className="text-zinc-300">{registeredEmail}</strong></p>
          <p className="text-sm text-zinc-400">Click the link to activate your account.</p>
        </div>
        <Link to="/login" className="text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">Go to Login</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-green-900/20 text-green-600 p-8 rounded-3xl inline-block mb-4">
          <h2 className="text-3xl font-black mb-2">Account Created!</h2>
          <p className="text-zinc-400">Redirecting to your account...</p>
        </div>
      </div>
    );
  }

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err) {
      setError(err.message || 'Google sign up failed.');
      setLoading(false);
    }
  };

  const handleLinkedInSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err) {
      setError(err.message || 'LinkedIn sign up failed.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 w-full" data-name="signup-page">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[var(--seasonal-primary,#1a5632)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShoppingBag className="w-8 h-8 text-[var(--seasonal-primary,#1a5632)]" /></div>
        <h1 className="text-3xl font-black mb-2 text-white">Create Your Account</h1>
        <p className="text-zinc-400">Sign up to start shopping on Omix.</p>
      </div>

      {error && <div className="bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">{error}</div>}

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-300">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input type="text" value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="e.g. Kiprono Yegon" required minLength={2} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-white transition-all shadow-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="you@example.com" required className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-white transition-all shadow-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-300">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input required name="password" type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} placeholder="Minimum 6 characters" minLength={6} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-white transition-all shadow-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-300">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input required name="confirmPassword" type="password" value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} placeholder="Repeat your password" minLength={6} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-white transition-all shadow-sm" />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-2 text-zinc-300">
            Referral Code
            <button
              type="button"
              onClick={() => setShowReferralInput(prev => !prev)}
              className="text-[var(--seasonal-primary,#1a5632)] text-xs font-semibold hover:underline"
            >
              {showReferralInput ? '(hide)' : '(optional)'}
            </button>
          </label>
          {showReferralInput && (
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">🎁</div>
              <input
                type="text"
                value={formData.referralCode}
                onChange={e => updateField('referralCode', e.target.value.toUpperCase())}
                placeholder="Enter referral code (e.g. ABC12345)"
                maxLength={12}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-zinc-900 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-white transition-all shadow-sm font-mono uppercase tracking-wider"
              />
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer group pt-2">
          <div className="relative mt-0.5">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only peer" />
            <div className="w-5 h-5 rounded-md border-2 border-zinc-300 dark:border-zinc-600 peer-checked:border-[var(--seasonal-primary,#1a5632)] peer-checked:bg-[var(--seasonal-primary,#1a5632)] transition-all flex items-center justify-center">
              {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
          <span className="text-sm text-zinc-400 leading-relaxed">
            I agree to the <Link to="/terms" className="text-[var(--seasonal-primary,#1a5632)] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and <Link to="/privacy" className="text-[var(--seasonal-primary,#1a5632)] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
          </span>
        </label>

        <button type="submit" disabled={loading} className="w-full bg-[var(--seasonal-primary,#1a5632)] text-white font-black py-4 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-all disabled:opacity-50 shadow-lg shadow-[var(--seasonal-primary,#1a5632)]/20">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-zinc-950 text-zinc-400">{t('auth.or') || 'or'}</span></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 border border-zinc-300 shadow-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Sign up with Google</span>
        </button>

        <button
          type="button"
          onClick={handleLinkedInSignUp}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#0077B5] hover:bg-[#006099] text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 border border-[#0077B5] shadow-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span>Sign up with LinkedIn</span>
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-400 text-sm">
        Already have an account? <Link to="/login" className="text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">Log In</Link>
      </p>
    </div>
  );
}

export default Signup;
