import type { ComponentType, ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function withAuth<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  function WithAuth(props: P): ReactElement | null {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Component {...props} />;
  }
  WithAuth.displayName = `WithAuth(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WithAuth;
}
