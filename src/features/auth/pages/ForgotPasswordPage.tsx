import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import api from '../../../lib/axios';
import forgetPasswordImg from '../../../assets/forgetpassword.png';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fp-page">
      <div className="fp-left">
        <div className="fp-left__inner">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <FaCheckCircle style={{ fontSize: 48, color: '#2e7d32', marginBottom: 16 }} />
              <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: '#1a1f27' }}>Check your email</h2>
              <p style={{ color: '#7a808a', lineHeight: 1.6, marginBottom: 24 }}>
                We sent a password reset link to <strong>{email}</strong>. The link is valid for 30 minutes.
              </p>
              <Link to="/login" className="fp-submit" style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '12px', borderRadius: 8, background: '#ef4f38', color: '#fff', fontWeight: 700 }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="fp-heading">
                Password <em className="fp-heading__accent">Reset</em>
              </h1>
              <p className="fp-subheading">
                Enter your registered email and we'll send you a link to reset your password. Valid for 30 minutes.
              </p>

              <form className="fp-form" onSubmit={handleSubmit} noValidate>
                <div className="fp-field">
                  <input
                    id="fp-email"
                    className="fp-input"
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <label htmlFor="fp-email" className="fp-label">
                    <FaEnvelope style={{ marginRight: 4 }} />Email *
                  </label>
                </div>

                {error && <p style={{ color: '#c62828', fontSize: 13, margin: '0 0 8px' }}>{error}</p>}

                <button className="fp-submit" type="submit" disabled={loading || !email}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="fp-footer">
                Remember your password?{' '}
                <Link to="/login" className="fp-footer__link">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="fp-right">
        <div className="fp-right__inner">
          <h2 className="fp-right__title">Secure password recovery.</h2>
          <p className="fp-right__subtitle">
            We take your security seriously. Reset links expire after 30 minutes to keep your account safe.
          </p>
          <div className="fp-illustration">
            <img src={forgetPasswordImg} alt="Forgot password illustration" />
          </div>
        </div>
      </div>
    </div>
  );
}
