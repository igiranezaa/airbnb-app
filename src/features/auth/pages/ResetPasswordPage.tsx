import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../../../lib/axios';
import './ForgotPasswordPage.css';

const RULES = [
  { re: /.{8,}/, label: 'At least 8 characters' },
  { re: /[A-Z]/, label: 'One uppercase letter' },
  { re: /\d/, label: 'One number' },
  { re: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, label: 'One special character' },
];

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rulesPass = RULES.map((r) => r.re.test(password));
  const allRulesPass = rulesPass.every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!allRulesPass) { setError('Password does not meet all requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }
    setError(null);
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Invalid or expired reset link. Please request a new one.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fp-page">
        <div className="fp-left">
          <div className="fp-left__inner" style={{ textAlign: 'center', padding: '3rem 0' }}>
            <FaCheckCircle style={{ fontSize: 52, color: '#2e7d32', marginBottom: 16 }} />
            <h2 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 700 }}>Password updated!</h2>
            <p style={{ color: '#7a808a' }}>Redirecting you to sign in…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fp-page">
      <div className="fp-left">
        <div className="fp-left__inner">
          <h1 className="fp-heading">
            New <em className="fp-heading__accent">Password</em>
          </h1>
          <p className="fp-subheading">Choose a strong password to secure your account.</p>

          <form className="fp-form" onSubmit={handleSubmit} noValidate>
            <div className="fp-field">
              <input
                id="rp-password"
                className="fp-input"
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <label htmlFor="rp-password" className="fp-label">New Password *</label>
              <button type="button" className="fp-eye-btn" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            {/* FR-003 strength checklist */}
            {password.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: '0 0 0 2px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {RULES.map((r, i) => (
                  <li key={r.label} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: rulesPass[i] ? '#2e7d32' : '#888' }}>
                    {rulesPass[i] ? <FaCheckCircle /> : <FaTimesCircle />} {r.label}
                  </li>
                ))}
              </ul>
            )}

            <div className="fp-field">
              <input
                id="rp-confirm"
                className="fp-input"
                type={showConfirm ? 'text' : 'password'}
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <label htmlFor="rp-confirm" className="fp-label">Confirm Password *</label>
              <button type="button" className="fp-eye-btn" onClick={() => setShowConfirm((v) => !v)}>
                {showConfirm ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p style={{ fontSize: 12, marginBottom: 8, color: passwordsMatch ? '#2e7d32' : '#c62828', display: 'flex', alignItems: 'center', gap: 4 }}>
                {passwordsMatch ? <FaCheckCircle /> : <FaTimesCircle />}
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}

            {error && <p style={{ color: '#c62828', fontSize: 13, margin: '0 0 8px' }}>{error}</p>}

            <button className="fp-submit" type="submit" disabled={loading || !allRulesPass || !passwordsMatch}>
              {loading ? 'Updating…' : 'Set New Password'}
            </button>
          </form>

          <p className="fp-footer">
            Link expired?{' '}
            <Link to="/forgot-password" className="fp-footer__link">Request a new one</Link>
          </p>
        </div>
      </div>

      <div className="fp-right">
        <div className="fp-right__inner">
          <h2 className="fp-right__title">Create a strong password.</h2>
          <p className="fp-right__subtitle">
            Use a mix of uppercase letters, numbers, and special characters to keep your account secure.
          </p>
        </div>
      </div>
    </div>
  );
}
