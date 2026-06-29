import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's a code parameter (PKCE flow)
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = params.get('code') || hashParams.get('code');

        if (code) {
          // PKCE flow: exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('PKCE exchange error:', error.message);
            navigate('/login?error=oauth_failed');
            return;
          }
        }

        // Wait a tick for session to persist, then check
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError.message);
          navigate('/login?error=oauth_failed');
          return;
        }

        if (session) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (profile?.role === 'admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/account', { replace: true });
            }
          } catch {
            navigate('/account', { replace: true });
          }
        } else {
          // No session found — listen for it (implicit flow can be async)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              subscription.unsubscribe();
              supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()
                .then(({ data: profile }) => {
                  if (profile?.role === 'admin') {
                    navigate('/admin', { replace: true });
                  } else {
                    navigate('/account', { replace: true });
                  }
                })
                .catch(() => navigate('/account', { replace: true }));
            }
          });

          // Timeout fallback — if no session appears within 5s, go to login
          setTimeout(() => {
            subscription.unsubscribe();
            navigate('/login?error=oauth_timeout', { replace: true });
          }, 5000);
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
