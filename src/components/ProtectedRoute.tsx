// Protected route — allows authenticated users, or demo mode for dashboard/onboarding
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoMode } from '@/lib/integrations';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When true, demo mode can access without auth. */
  allowDemo?: boolean;
}

export function ProtectedRoute({ children, allowDemo = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated && !(allowDemo && isDemoMode())) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
