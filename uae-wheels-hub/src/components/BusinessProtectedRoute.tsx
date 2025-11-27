import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrmAuth } from '@/hooks/useCrmAuth';

interface BusinessProtectedRouteProps {
  children: ReactNode;
}

const BusinessProtectedRoute = ({ children }: BusinessProtectedRouteProps) => {
  const { user, loading } = useCrmAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/business');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default BusinessProtectedRoute;
