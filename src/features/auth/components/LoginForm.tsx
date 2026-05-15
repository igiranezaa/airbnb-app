import { useState } from 'react';
import { FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
import './LoginForm.css';

interface Props {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  authError?: string | null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginForm({ onSubmit, authError }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailError = emailTouched && email.length > 0 && !isValidEmail(email);
  const emailEmpty = emailTouched && email.length === 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailTouched(true);
    if (!isValidEmail(email)) return;
    setLoading(true);
    try {
      await onSubmit('', email, password);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="lf" onSubmit={handleSubmit} noValidate>
      {/* Email */}
      <div className={`lf-field${emailError || emailEmpty ? ' lf-field--error' : ''}`}>
        <input
          id="lf-email"
          className="lf-input"
          type="email"
          placeholder=" "
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          autoComplete="email"
        />
        <label htmlFor="lf-email" className="lf-label">Enter Email *</label>
        {(emailError || emailEmpty) && (
          <span className="lf-error-icon" aria-hidden="true">
            <FaExclamationCircle />
          </span>
        )}
      </div>
      {(emailError || emailEmpty) && (
        <p className="lf-error-msg">Enter your valid email</p>
      )}

      {/* Password */}
      <div className="lf-field">
        <input
          id="lf-password"
          className="lf-input"
          type={showPassword ? 'text' : 'password'}
          placeholder=" "
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <label htmlFor="lf-password" className="lf-label">Password *</label>
        <button
          type="button"
          className="lf-eye-btn"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <FaEye /> : <FaEyeSlash />}
        </button>
      </div>

      {/* Remember me */}
      <label className="lf-remember">
        <span
          className={`lf-checkbox${rememberMe ? ' lf-checkbox--checked' : ''}`}
          onClick={() => setRememberMe((v) => !v)}
          role="checkbox"
          aria-checked={rememberMe}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setRememberMe((v) => !v)}
        >
          {rememberMe && (
            <svg viewBox="0 0 12 10" width="12" height="10" fill="none">
              <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="lf-remember__text">Remember me next time</span>
      </label>

      {authError && (
        <p className="lf-auth-error" role="alert">
          <FaExclamationCircle /> {authError}
        </p>
      )}

      {/* Submit */}
      <button className="lf-submit" type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
