import { lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../../../shared/components/Spinner';

const GuestDashboard = lazy(() => import('./GuestDashboard'));
const HostDashboard = lazy(() => import('./HostDashboard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));

export default function DashboardPage() {
  const { userRole } = useAuth();

  return (
    <Suspense fallback={<Spinner />}>
      {userRole === 'ADMIN' ? <AdminDashboard /> :
       userRole === 'HOST'  ? <HostDashboard />  :
                              <GuestDashboard />}
    </Suspense>
  );
}
