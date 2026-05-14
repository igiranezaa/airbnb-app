import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useFavorites } from '../../features/listings/hooks/useFavorites';
import { useTheme } from '../../context/ThemeContext';
import SavedListings from '../../features/listings/components/SavedListings';
import { FaBars, FaHeart, FaMoon, FaSun, FaExclamationCircle, FaTachometerAlt, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, userRole, emailVerified, userEmail, userName, logout } = useAuth();
  const { count } = useFavorites();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showSaved, setShowSaved] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const guestMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (guestMenuRef.current && !guestMenuRef.current.contains(e.target as Node)) {
        setShowGuestMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  }

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? '?';

  async function handleResend() {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: userEmail });
      setResendMsg('Sent! Check your inbox and spam folder.');
    } catch {
      setResendMsg('Failed to resend. Try again later.');
    }
    setResendLoading(false);
  }

  return (
    <>
    {isAuthenticated && !emailVerified && !bannerDismissed && (
      <div className="navbar-verify-banner">
        <FaExclamationCircle className="navbar-verify-banner__icon" />
        <span className="navbar-verify-banner__text">
          Please verify your email address to unlock all features.
        </span>
        {resendMsg ? (
          <span className="navbar-verify-banner__msg">{resendMsg}</span>
        ) : (
          <button className="navbar-verify-banner__btn" onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? 'Sending…' : 'Resend email'}
          </button>
        )}
        <button className="navbar-verify-banner__close" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
          ×
        </button>
      </div>
    )}
    <nav className="navbar">
      <NavLink to="/" end className="navbar__brand">
        <span>List</span>
        <em>On.</em>
      </NavLink>

      <div className="navbar__links">
        <NavLink to="/" end className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>
          Home
        </NavLink>
        <NavLink to="/listings" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>
          Explore
        </NavLink>
      </div>

      <div className="navbar__actions">
        <button className="navbar__icon-button" aria-label="Saved listings" onClick={() => setShowSaved((v) => !v)}>
          <FaHeart />
          <span className="navbar__notification">{count}</span>
        </button>

        {isAuthenticated ? (
          <div className="navbar__profile-wrap" ref={profileMenuRef}>
            <button
              className="navbar__avatar-btn"
              aria-label="Profile menu"
              onClick={() => setShowProfileMenu((v) => !v)}
            >
              {initials}
            </button>
            {showProfileMenu && (
              <div className="navbar__profile-menu">
                <div className="navbar__profile-menu__header">
                  <span className="navbar__profile-menu__name">{userName || 'User'}</span>
                  <span className="navbar__profile-menu__email">{userEmail}</span>
                  <span className="navbar__profile-menu__role">{userRole}</span>
                </div>
                <div className="navbar__profile-menu__divider" />
                <NavLink to="/dashboard" className="navbar__profile-menu__item" onClick={() => setShowProfileMenu(false)}>
                  <FaTachometerAlt /> Dashboard
                </NavLink>
                <div className="navbar__profile-menu__divider" />
                <button className="navbar__profile-menu__item navbar__profile-menu__item--danger" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="navbar__guest-wrap" ref={guestMenuRef}>
            <button className="navbar__icon-button" aria-label="Toggle dark mode" onClick={toggleTheme}>
              {dark ? <FaSun /> : <FaMoon />}
            </button>
            <button
              className="navbar__guest-btn"
              aria-label="Menu"
              onClick={() => setShowGuestMenu((v) => !v)}
            >
              <FaBars className="navbar__guest-bars" />
              <FaUserCircle className="navbar__guest-avatar" />
            </button>
            {showGuestMenu && (
              <div className="navbar__guest-menu">
                <Link to="/register?role=HOST" className="navbar__guest-menu__item navbar__guest-menu__item--bold" onClick={() => setShowGuestMenu(false)}>
                  <div>
                    <div>Become a host</div>
                    <div className="navbar__guest-menu__sub">It's easy to start hosting and earn extra income.</div>
                  </div>
                </Link>
                <div className="navbar__guest-menu__divider" />
                <Link to="/login" className="navbar__guest-menu__item" onClick={() => setShowGuestMenu(false)}>Log in or sign up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>

    <SavedListings open={showSaved} onClose={() => setShowSaved(false)} />
    </>
  );
}
