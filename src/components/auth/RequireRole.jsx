import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const RequireRole = ({ role, children }) => {
  const { user, userRole, loading } = useAuth() || {};
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center">Loading authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && userRole !== role && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireRole;
