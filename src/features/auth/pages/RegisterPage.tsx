import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import signupImg from '../../../assets/signup.png';
import './RegisterPage.css';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// FR-003: password strength rules
const PW_RULES = [
  { re: /.{8,}/, label: 'At least 8 characters' },
  { re: /[A-Z]/, label: 'One uppercase letter' },
  { re: /\d/, label: 'One number' },
  { re: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, label: 'One special character' },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = PW_RULES.map((r) => r.re.test(password));
  const score = passed.filter(Boolean).length;
  const colors = ['', '#c62828', '#f57f17', '#388e3c', '#2e7d32'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score] : '#e0e0e0', transition: 'background 0.2s' }} />
        ))}
      </div>
      {score > 0 && <p style={{ fontSize: 11, color: colors[score], fontWeight: 700, margin: 0 }}>{labels[score]}</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {PW_RULES.map((r, i) => (
          <li key={r.label} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, color: passed[i] ? '#2e7d32' : '#aaa' }}>
            {passed[i] ? <FaCheckCircle /> : <FaTimesCircle />} {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role')?.toUpperCase() || 'GUEST';
  const isHost = roleParam === 'HOST';

  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const emailError = emailTouched && email.length > 0 && !isValidEmail(email);
  const emailEmpty = emailTouched && email.length === 0;

  const allRulesPass = PW_RULES.every((r) => r.re.test(password));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailTouched(true);
    setAuthError(null);
    if (!isValidEmail(email)) return;
    if (!allRulesPass) { setAuthError('Password does not meet all strength requirements.'); return; }
    if (password !== confirmPassword) { setAuthError('Passwords do not match.'); return; }
    if (!agreeTerms) { setAuthError('Please agree to the terms of service.'); return; }
    setLoading(true);
    const ok = await register(name, email, username, password, roleParam);
    setLoading(false);
    if (ok) {
      setRegistered(true);
    } else {
      setAuthError('Could not create account. Email or username may already be taken.');
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setResendMsg('');
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResendMsg('A new verification link has been sent. Check your inbox and spam folder.');
    } catch {
      setResendMsg('Something went wrong. Please try again.');
    }
    setResendLoading(false);
  }

  // ── Email-sent success screen ──
  if (registered) {
    return (
      <div className="rp-page">
        <div className="rp-left">
          <div className="rp-left__inner" style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <h1 className="rp-heading" style={{ fontSize: 28 }}>
              Check your <em className="rp-heading__accent">inbox</em>
            </h1>
            <p className="rp-subheading">
              We sent a verification link to <strong>{email}</strong>.<br />
              Click the link in that email to activate your account.
            </p>
            <p className="rp-subheading" style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
              Can't find it? Check your <strong>spam / junk</strong> folder.
            </p>

            {resendMsg ? (
              <p style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#2e7d32', margin: '16px 0' }}>
                {resendMsg}
              </p>
            ) : (
              <button
                type="button"
                style={{ marginTop: 20, background: 'none', border: 'none', color: '#ef4f38', fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending…' : "Didn't receive it? Resend email"}
              </button>
            )}

            <p style={{ marginTop: 24, fontSize: 13, color: '#888' }}>
              Already verified?{' '}
              <Link to="/login" style={{ color: '#ef4f38', fontWeight: 700 }}>Sign in</Link>
            </p>
          </div>
        </div>
        <div className="rp-right">
          <div className="rp-right__inner">
            <h2 className="rp-right__title">Almost there!</h2>
            <p className="rp-right__subtitle">Verify your email to unlock full access to your account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-page">
      <div className="rp-left">
        <div className="rp-left__inner">
          <h1 className="rp-heading">
            {isHost ? (
              <>Start hosting with<br /><em className="rp-heading__accent">ListOn</em> today.</>
            ) : (
              <>Welcome! Please<br /><em className="rp-heading__accent">Sign up</em> to continue.</>
            )}
          </h1>
          <p className="rp-subheading">
            {isHost
              ? 'Create a host account and start listing your properties to thousands of guests worldwide.'
              : 'Unlock a world of exclusive content, enjoy special offers, and be the first to dive into exciting news and updates.'}
          </p>

          <div className="rp-socials">
            <button className="rp-social rp-social--apple" type="button">
              <svg className="rp-social__icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.27.06 2.15.72 2.93.74.97.02 1.94-.76 3.28-.72 1.64.06 2.87.73 3.67 1.84-3.33 2.06-2.79 6.49.56 7.77-.64 1.61-1.45 3.22-2.44 4.23zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Sign up with Apple
            </button>
            <button className="rp-social rp-social--google" type="button">
              <svg className="rp-social__icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </button>
          </div>

          <p className="rp-privacy">
            We won't post anything without your permission and your personal details are kept private
          </p>

          <div className="rp-divider">
            <span className="rp-divider__line" />
            <span className="rp-divider__text">Or</span>
            <span className="rp-divider__line" />
          </div>

          <form className="rp-form" onSubmit={handleSubmit} noValidate>
            <div className="rp-field">
              <input
                id="rp-name"
                className="rp-input"
                type="text"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
              <label htmlFor="rp-name" className="rp-label">Full Name *</label>
            </div>

            <div className="rp-field">
              <input
                id="rp-username"
                className="rp-input"
                type="text"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <label htmlFor="rp-username" className="rp-label">Username *</label>
            </div>

            <div className={`rp-field${emailError || emailEmpty ? ' rp-field--error' : ''}`}>
              <input
                id="rp-email"
                className="rp-input"
                type="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                autoComplete="email"
                required
              />
              <label htmlFor="rp-email" className="rp-label">Email *</label>
              {(emailError || emailEmpty) && (
                <span className="rp-error-icon" aria-hidden="true"><FaExclamationCircle /></span>
              )}
            </div>
            {(emailError || emailEmpty) && (
              <p className="rp-error-msg">Enter your valid email</p>
            )}

            <div className="rp-field">
              <input
                id="rp-password"
                className="rp-input"
                type={showPassword ? 'text' : 'password'}
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <label htmlFor="rp-password" className="rp-label">Password *</label>
              <button type="button" className="rp-eye-btn" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <PasswordStrength password={password} />

            <div className="rp-field">
              <input
                id="rp-confirm"
                className="rp-input"
                type={showConfirm ? 'text' : 'password'}
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <label htmlFor="rp-confirm" className="rp-label">Confirm Password *</label>
              <button type="button" className="rp-eye-btn" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            <label className="rp-terms">
              <span
                className={`rp-checkbox${agreeTerms ? ' rp-checkbox--checked' : ''}`}
                onClick={() => setAgreeTerms((v) => !v)}
                role="checkbox"
                aria-checked={agreeTerms}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setAgreeTerms((v) => !v)}
              >
                {agreeTerms && (
                  <svg viewBox="0 0 12 10" width="12" height="10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="rp-terms__text">
                By signing up, you agree to the{' '}
                <a href="#" className="rp-terms__link">terms of service</a>
              </span>
            </label>

            {authError && (
              <p className="rp-error-msg" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaExclamationCircle /> {authError}
              </p>
            )}

            <button className="rp-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : isHost ? 'Create Host Account' : 'Sign Up'}
            </button>
          </form>

          <p className="rp-footer">
            Already have an account?{' '}
            <Link to="/login" className="rp-footer__link">Sign In</Link>
          </p>
        </div>
      </div>

      <div className="rp-right">
        <div className="rp-right__inner">
          <h2 className="rp-right__title">
            {isHost ? 'List your space and start earning.' : 'Effortlessly organize your workspace with ease.'}
          </h2>
          <p className="rp-right__subtitle">
            {isHost
              ? 'Join thousands of hosts on ListOn and reach guests from around the world.'
              : 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'}
          </p>
          <div className="rp-illustration">
            <img src={signupImg} alt="Sign up illustration" />
          </div>
        </div>
      </div>
    </div>
  );
}
