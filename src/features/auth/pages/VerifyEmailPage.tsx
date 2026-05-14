import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../../../lib/axios';
import './ForgotPasswordPage.css';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="fp-page">
      <div className="fp-left">
        <div className="fp-left__inner" style={{ textAlign: 'center', padding: '3rem 0' }}>
          {status === 'loading' && (
            <>
              <div style={{ fontSize: 48, color: '#ef4f38', marginBottom: 16 }}>⏳</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Verifying your email…</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <FaCheckCircle style={{ fontSize: 52, color: '#2e7d32', marginBottom: 16 }} />
              <h2 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 700, color: '#1a1f27' }}>Email Verified!</h2>
              <p style={{ color: '#7a808a', lineHeight: 1.6, marginBottom: 24 }}>
                Your email has been verified successfully. You can now log in to your account.
              </p>
              <Link
                to="/login"
                style={{ display: 'inline-block', padding: '12px 32px', background: '#ef4f38', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
              >
                Sign In
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <FaTimesCircle style={{ fontSize: 52, color: '#c62828', marginBottom: 16 }} />
              <h2 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 700, color: '#1a1f27' }}>Verification Failed</h2>
              <p style={{ color: '#7a808a', lineHeight: 1.6, marginBottom: 24 }}>
                This verification link is invalid or has already been used. Please register again or contact support.
              </p>
              <Link
                to="/register"
                style={{ display: 'inline-block', padding: '12px 32px', background: '#ef4f38', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
              >
                Back to Register
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="fp-right">
        <div className="fp-right__inner">
          <h2 className="fp-right__title">One last step.</h2>
          <p className="fp-right__subtitle">
            Email verification keeps your account secure and ensures we can reach you when it matters.
          </p>
        </div>
      </div>
    </div>
  );
}
