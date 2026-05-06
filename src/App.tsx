import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ListingsPage } from './features/listings';
import { LoginPage } from './features/auth';
import Navbar from './shared/components/Navbar';
import NotFound from './shared/components/NotFound';
import ProtectedRoute from './shared/components/ProtectedRoute';
import RouteProgress from './shared/components/RouteProgress';
import Spinner from './shared/components/Spinner';
import './App.css';

const ListingDetail = lazy(() => import('./features/listings/pages/ListingDetail'));
const DashboardPage = lazy(() => import('./features/auth/pages/DashboardPage'));

export default function App() {
  return (
    <>
      <RouteProgress />
      <Navbar />
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<ListingsPage />} />
          <Route
            path="/listings/:id"
            element={
              <Suspense fallback={<Spinner />}>
                <ListingDetail />
              </Suspense>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<Spinner />}>
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
