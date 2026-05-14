import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/LoginForm';
import signinImg from '../../../assets/signin.png';
import './LoginPage.css';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleLogin(_name: string, email: string, password: string) {
    setAuthError(null);
    setIsLocked(false);
    const result = await login(email, password);
    if (result === true) {
      navigate('/', { replace: true });
    } else {
      setIsLocked(result.locked ?? false);
      setAuthError(result.message);
    }
  }

  return (
    <div className="login-page">
      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="login-left__inner">
          <h1 className="login-heading">
            Welcome back! Please<br />
            <em className="login-heading__accent">Sign in</em> to continue.
          </h1>
          <p className="login-subheading">
            Unlock a world of exclusive content, enjoy special offers, and be the
            first to dive into exciting news and updates by joining our community!
          </p>

          {/* FR-005: account locked banner */}
          {isLocked && (
            <div style={{ background: '#fce4ec', border: '1px solid #e91e63', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#880e4f', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaLock /> {authError}
              {' '}<Link to="/forgot-password" style={{ color: '#880e4f', fontWeight: 700, textDecoration: 'underline' }}>Reset password</Link>
            </div>
          )}

          {/* Form */}
          <LoginForm onSubmit={handleLogin} authError={isLocked ? null : authError} />

          {/* Footer */}
          <p className="login-footer">
            Don't have an account?{' '}
            <Link to="/register" className="login-footer__link">Sign Up</Link>
          </p>
          <p className="login-footer">
            Remind{' '}
            <Link to="/forgot-password" className="login-footer__link login-footer__link--underline">Password</Link>
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right">
        <div className="login-right__inner">
          <h2 className="login-right__title">
            Effortlessly organize your<br />workspace with ease.
          </h2>
          <p className="login-right__subtitle">
            It is a long established fact that a reader will be distracted by the
            readable content of a page when looking at its layout.
          </p>
          <div className="login-illustration">
            <img src={signinImg} alt="Sign in illustration" />
          </div>
        </div>
      </div>
    </div>
  );
}
