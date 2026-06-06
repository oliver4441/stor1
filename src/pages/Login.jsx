import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { email, password } = e.target.elements;
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 w-full" data-name="login-page">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Welcome back</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Log in to manage your listings</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Email Address</label>
          <input required name="email" type="email" placeholder="you@example.com" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Password</label>
          <input required name="password" type="password" placeholder="••••••••" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20">
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-500 text-sm">
        Don't have a seller account? <Link to="/signup" className="text-[#ff385c] font-bold hover:underline">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;
