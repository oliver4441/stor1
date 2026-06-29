import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      try {
        // The Supabase client (with detectSessionInUrl: true) automatically
        // reads the hash fragment or exchanges the PKCE code on page load.
        // We just need to wait for the session and redirect.
        
        // First try: getSession() — works if the client already processed the URL
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          await redirectByRole(session.user.id);
          return;
        }

        // Second try: listen for SIGNED_IN event — works for async PKCE exchange
        // or if the client hasn't finished processing the URL yet
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
              subscription.unsubscribe();
              clearTimeout(timeout);
              redirectByRole(session.user.id);
            }
          }
        );

        // Timeout — if nothing happens in 8s, bail to login
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          navigate('/login?error=oauth_timeout', { replace: true });
        }, 8000);
      } catch (err) {
        console.error('Auth callback error:', err.message);
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    const redirectByRole = async (userId) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profile?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/account', { replace: true });
        }
      } catch {
        // Profile might not exist for new OAuth users — go to account anyway
        navigate('/account', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="inline-block w-8 h-8 border-4 border-[var(--seasonal-primary,#1a5632)] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-zinc-400">Signing you in...</p>
    </div>
  );
}
