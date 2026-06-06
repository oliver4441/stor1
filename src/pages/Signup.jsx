import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

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
    
    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: fullName.value,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Create a profile record (optional if using triggers, but good for explicit flow)
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName.value,
          email: email.value,
          role: 'seller'
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // We don't block the flow if profile insert fails as Auth succeeded
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-8 rounded-3xl inline-block mb-4">
          <h2 className="text-3xl font-black mb-2">Check your email!</h2>
          <p className="text-zinc-500 dark:text-zinc-400">We've sent you a confirmation link to complete your registration.</p>
        </div>
        <p className="mt-6">
          <Link to="/login" className="text-[#ff385c] font-bold hover:underline">Back to Login</Link>
        </p>
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
