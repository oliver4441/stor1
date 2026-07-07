import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../utils/api';
import { useLang } from '../utils/lang';
import { supabase } from '../utils/supabase';
import { checkRateLimit, recordActionAttempt, clearRateLimit } from '../utils/rateLimit';
import { trackUserLogin, trackError } from '../utils/analytics';
import { sounds } from '../utils/sounds';

function Login() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Rate limit check
    const rl = checkRateLimit('login');
    if (!rl.allowed) {
      setError(`Too many login attempts. Please wait ${rl.retryAfter} seconds before trying again.`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      const { email, password } = e.target.elements;
      recordActionAttempt('login');
      const result = await signIn({ email: email.value, password: password.value });

      if (result.success) {
        clearRateLimit('login');
        sounds.login();
        trackUserLogin('email', result.user.id);
        try {
          const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', result.user.id).single();
          const ALLOWED_REDIRECTS = ['/account', '/admin', '/cart', '/checkout', '/listings', '/affiliate-dashboard', '/'];
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');
          if (redirect && ALLOWED_REDIRECTS.includes(redirect)) navigate(redirect);
          else if (profile?.role === 'admin') navigate('/admin');
          else if (profile?.role === 'affiliate') navigate('/affiliate-dashboard');
          else navigate('/');
        } catch {
          // Profile fetch failed, still navigate
          navigate('/');
        }
      } else {
        sounds.error();
        const msg = result.error || '';
        const emailErrors = ['confirm', 'verify', 'email not confirmed', 'email not verified'];
        if (emailErrors.some(k => msg.toLowerCase().includes(k))) {
          setNeedsVerification(true);
        }
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      trackError(err.message || 'Login failed', 'Login.handleLogin');
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      setError(err.message || 'Google login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
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
      setError(err.message || 'LinkedIn login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 w-full" data-name="login-page">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-2 text-white">{t('auth.welcomeBack') || 'Welcome Back'}</h1>
        <p className="text-zinc-400">{t('auth.loginSubtitle') || 'Sign in to your account'}</p>
      </div>

      {needsVerification && (
        <div className="bg-amber-900/20 border border-amber-900/50 text-amber-700 dark:text-amber-400 p-4 rounded-xl mb-4 text-sm">
          <p className="font-bold mb-1">{t('auth.emailNotVerified') || 'Email not verified'}</p>
          <p className="text-zinc-400 text-xs mb-2">{t('auth.emailNotVerifiedDesc') || 'Please check your email for a verification link.'}</p>
          <p className="text-xs text-zinc-400">{t('auth.emailNotVerifiedHelp') || 'Need help?'} <Link to="/signup" className="text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">{t('auth.createNewAccount') || 'Create new account'}</Link>.</p>
        </div>
      )}

      {error && !needsVerification && (
        <div className="bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">{error}</div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-300">{t('auth.email') || 'Email'}</label>
          <input required name="email" type="email" placeholder={t('auth.emailPlaceholder') || 'your@email.com'} className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-white transition-all shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-300">{t('auth.password') || 'Password'}</label>
          <input required name="password" type="password" placeholder={t('auth.passwordPlaceholder') || '••••••••'} className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-transparent focus:border-[var(--seasonal-primary,#1a5632)] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-white transition-all shadow-sm" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[var(--seasonal-primary,#1a5632)] text-white font-black py-4 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-all disabled:opacity-50 shadow-lg shadow-[var(--seasonal-primary,#1a5632)]/20">
          {loading ? (t('auth.loggingIn') || 'Signing in...') : (t('auth.login') || 'Sign In')}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-zinc-950 text-zinc-400">{t('auth.or') || 'or'}</span></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-800 font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 border border-zinc-300 shadow-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <button
          type="button"
          onClick={handleLinkedInLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#0077B5] hover:bg-[#006099] text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 border border-[#0077B5] shadow-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span>Continue with LinkedIn</span>
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-400 text-sm">
        {t('auth.noAccount') || "Don't have an account?"} <Link to="/signup" className="text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">{t('auth.signUp') || 'Sign Up'}</Link>
      </p>
    </div>
  );
}

export default Login;
