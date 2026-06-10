import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../utils/api';
import { useLang } from '../utils/lang';
import { User, Mail, Lock, CheckCircle2, ShoppingBag, Chrome, Facebook } from 'lucide-react';
import { supabase } from '../utils/supabase';

function Signup() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google sign-up failed');
      setLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Facebook sign-up failed');
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreed) { setError('Please agree to the Terms of Service'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });

      if (result.success) {
        if (result.session) {
          setSuccess(true);
          setTimeout(() => navigate('/account'), 1500);
        } else {
          setNeedsVerification(true);
          setRegisteredEmail(formData.email);
          setLoading(false);
        }
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center" data-name="signup-verify">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 p-8 rounded-3xl mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-2xl font-black mb-2">Check Your Email</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            We sent a verification link to <strong className="text-zinc-700 dark:text-zinc-300">{registeredEmail}</strong>
          </p>
          <p className="text-sm text-zinc-400">Click the link to activate your account.</p>
        </div>
        <Link to="/login" className="text-[#ff385c] font-bold hover:underline">Go to Login</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-8 rounded-3xl inline-block mb-4">
          <h2 className="text-3xl font-black mb-2">Account Created!</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Redirecting to your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 w-full" data-name="signup-page">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[#ff385c]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-[#ff385c]" />
        </div>
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Create Your Account</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Sign up to start shopping on Omix.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={formData.fullName}
              onChange={e => updateField('fullName', e.target.value)}
              placeholder="e.g. Kiprono Yegon"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="email"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              required
              name="password"
              type="password"
              value={formData.password}
              onChange={e => updateField('password', e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group pt-2">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded-md border-2 border-zinc-300 dark:border-zinc-600 peer-checked:border-[#ff385c] peer-checked:bg-[#ff385c] transition-all flex items-center justify-center">
              {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            I agree to the <Link to="/terms" className="text-[#ff385c] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and <Link to="/privacy" className="text-[#ff385c] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
          </span>
        </label>

        <button type="submit" disabled={loading} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-zinc-950 text-zinc-500">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold py-3.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          <Chrome className="w-5 h-5" />
          Sign up with Google
        </button>

        <button
          type="button"
          onClick={handleFacebookSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white font-bold py-3.5 rounded-2xl hover:bg-[#166FE5] transition-all disabled:opacity-50 mt-3"
        >
          <Facebook className="w-5 h-5" />
          Sign up with Facebook
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-500 text-sm">
        Already have an account? <Link to="/login" className="text-[#ff385c] font-bold hover:underline">Log In</Link>
      </p>
    </div>
  );
}

export default Signup;
