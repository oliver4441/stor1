import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../utils/api';
import { useLang } from '../utils/lang';
import { supabase } from '../utils/supabase';
import { checkRateLimit, recordActionAttempt, clearRateLimit } from '../utils/rateLimit';
import { Chrome } from 'lucide-react';

function Login() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

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
        try {
          const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', result.user.id).single();
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');
          if (redirect) navigate(redirect);
          else if (profile?.role === 'admin') navigate('/admin');
          else navigate('/account');
        } catch {
          // Profile fetch failed, still navigate
          navigate('/account');
        }
      } else {
        const msg = result.error || '';
        const emailErrors = ['confirm', 'verify', 'email not confirmed', 'email not verified'];
        if (emailErrors.some(k => msg.toLowerCase().includes(k))) {
          setNeedsVerification(true);
        }
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 w-full" data-name="login-page">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">{t('auth.welcomeBack') || 'Welcome Back'}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{t('auth.loginSubtitle') || 'Sign in to your account'}</p>
      </div>

      {needsVerification && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 p-4 rounded-xl mb-4 text-sm">
          <p className="font-bold mb-1">{t('auth.emailNotVerified') || 'Email not verified'}</p>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-2">{t('auth.emailNotVerifiedDesc') || 'Please check your email for a verification link.'}</p>
          <p className="text-xs text-zinc-400">{t('auth.emailNotVerifiedHelp') || 'Need help?'} <Link to="/signup" className="text-[#ff385c] font-bold hover:underline">{t('auth.createNewAccount') || 'Create new account'}</Link>.</p>
        </div>
      )}

      {error && !needsVerification && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">{error}</div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('auth.email') || 'Email'}</label>
          <input required name="email" type="email" placeholder={t('auth.emailPlaceholder') || 'your@email.com'} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('auth.password') || 'Password'}</label>
          <input required name="password" type="password" placeholder={t('auth.passwordPlaceholder') || '••••••••'} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20">
          {loading ? (t('auth.loggingIn') || 'Signing in...') : (t('auth.login') || 'Sign In')}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-700"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-zinc-950 text-zinc-500">{t('auth.or') || 'or'}</span></div>
        </div>

        <button type="button" onClick={handleGoogleLogin} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold py-3.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">
          <Chrome className="w-5 h-5" />
          {t('auth.signInWithGoogle') || 'Sign in with Google'}
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-500 text-sm">
        {t('auth.noAccount') || "Don't have an account?"} <Link to="/signup" className="text-[#ff385c] font-bold hover:underline">{t('auth.signUp') || 'Sign Up'}</Link>
      </p>
    </div>
  );
}

export default Login;
