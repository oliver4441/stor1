import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase v2: exchangeCodeForSession processes the OAuth callback
        // This reads the code from the URL hash/params and exchanges it for a session
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          console.error('Auth exchange error:', error.message);
          navigate('/login?error=oauth_failed');
          return;
        }

        // Now get the session (it should exist after exchange)
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (profile?.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/account');
            }
          } catch {
            navigate('/account');
          }
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err.message);
        navigate('/login?error=oauth_failed');
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
