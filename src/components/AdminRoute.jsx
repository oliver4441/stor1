import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { isAdmin } from '../utils/api';
import { GooeyLoader } from '@/components/ui/loader-10';

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'granted' | 'denied'

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setStatus('denied');
          return;
        }
        const admin = await isAdmin();
        if (!cancelled) setStatus(admin ? 'granted' : 'denied');
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') {
    return (
      <div className="admin-loading-screen">
        <GooeyLoader label="Checking admin access" />
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/account" replace />;
  }

  return children;
}
