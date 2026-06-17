import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAdmin } from '../utils/api';

/**
 * Route guard that verifies admin role server-side before rendering.
 * Prevents client-side bypass — isAdmin() always checks Supabase directly.
 */
export default function AdminRoute({ children }) {
  const [authorized, setAuthorized] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    isAdmin().then((result) => {
      if (!cancelled) setAuthorized(result);
    });
    return () => { cancelled = true; };
  }, []);

  if (authorized === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
}
