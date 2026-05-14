import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ListingsPage } from './features/listings';
import { LoginPage } from './features/auth';
import Navbar from './shared/components/Navbar';
import NotFound from './shared/components/NotFound';
import ProtectedRoute from './shared/components/ProtectedRoute';
import RouteProgress from './shared/components/RouteProgress';
import Spinner from './shared/components/Spinner';
import './App.css';

const HomePage           = lazy(() => import('./features/home/pages/HomePage'));
const ListingDetail      = lazy(() => import('./features/listings/pages/ListingDetail'));
const ExplorePage        = lazy(() => import('./features/listings/pages/ExplorePage'));
const DashboardPage      = lazy(() => import('./features/auth/pages/DashboardPage'));
const AddListingPage     = lazy(() => import('./features/listings/pages/AddListingPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const RegisterPage       = lazy(() => import('./features/auth/pages/RegisterPage'));
const ResetPasswordPage  = lazy(() => import('./features/auth/pages/ResetPasswordPage'));
const VerifyEmailPage    = lazy(() => import('./features/auth/pages/VerifyEmailPage'));
const AccountSettingsPage = lazy(() => import('./features/auth/pages/AccountSettingsPage'));

export default function App() {
  const { pathname } = useLocation();
  const useDashboardShell = pathname === '/dashboard';

  return (
    <>
      <RouteProgress />
      {!useDashboardShell && <Navbar />}
      <main className="app-shell">
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<Spinner />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route path="/listings" element={<ListingsPage />} />
          <Route
            path="/explore"
            element={
              <Suspense fallback={<Spinner />}>
                <ExplorePage />
              </Suspense>
            }
          />
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
            path="/register"
            element={
              <Suspense fallback={<Spinner />}>
                <RegisterPage />
              </Suspense>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Suspense fallback={<Spinner />}>
                <ForgotPasswordPage />
              </Suspense>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <Suspense fallback={<Spinner />}>
                <ResetPasswordPage />
              </Suspense>
            }
          />
          <Route
            path="/verify-email/:token"
            element={
              <Suspense fallback={<Spinner />}>
                <VerifyEmailPage />
              </Suspense>
            }
          />
          <Route
            path="/account-settings"
            element={
              <Suspense fallback={<Spinner />}>
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="/add-listing"
            element={
              <Suspense fallback={<Spinner />}>
                <ProtectedRoute>
                  <AddListingPage />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<Spinner />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
