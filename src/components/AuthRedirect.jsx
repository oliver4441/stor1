import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../utils/api';

export default function AuthRedirect({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const profile = await getProfile(session.user.id);
      
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else if (profile?.role === 'affiliate') {
        navigate('/affiliate-dashboard');
      } else if (profile?.role === 'vendor') {
        navigate('/vendor-dashboard');
      }
    };

    checkRoleAndRedirect();
  }, [navigate]);

  return children;
}
