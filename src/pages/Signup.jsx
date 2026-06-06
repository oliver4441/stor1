import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../utils/api';
import { supabase } from '../utils/supabase';

function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { email, password, fullName } = e.target.elements;
    const result = await signUp({
      email: email.value,
      password: password.value,
      fullName: fullName.value,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-8 rounded-3xl inline-block mb-4">
          <h2 className="text-3xl font-black mb-2">Account created!</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 w-full" data-name="signup-page">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Start selling</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Create your seller account in seconds</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Social Login */}
      <button
        type="button"
        onClick={handleFacebookLogin}
        disabled={loading}
        className="w-full bg-[#1877F2] text-white font-bold py-3.5 rounded-xl hover:bg-[#166FE5] transition-all flex items-center justify-center gap-3 mb-6 disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Continue with Facebook
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
        <span className="text-xs text-zinc-400 font-medium uppercase">or</span>
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Full Name</label>
          <input required name="fullName" type="text" placeholder="e.g. Kiprono Yegon" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Email Address</label>
          <input required name="email" type="email" placeholder="you@example.com" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Password</label>
          <input required name="password" type="password" placeholder="Create a strong password" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-500 text-sm">
        Already have an account? <Link to="/login" className="text-[#ff385c] font-bold hover:underline">Log in</Link>
      </p>
    </div>
  );
}

export default Signup;
