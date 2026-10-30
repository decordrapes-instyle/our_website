import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'employee' | 'customer' | 'editor' | 'viewer' | 'production';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen text="Verifying session..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'admin') {
    if (requiredRole === 'employee' && (currentUser.role === 'editor' || currentUser.role === 'employee' || currentUser.role === 'production')) {
      return <>{children}</>;
    }
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
