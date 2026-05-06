import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/" end className="navbar__brand">
        <span>List</span>
        <em>On.</em>
      </NavLink>

      <div className="navbar__links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
        >
          Home
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
        >
          Dashboard
        </NavLink>
      </div>

      <div className="navbar__actions">
        {isAuthenticated ? (
          <button className="navbar__logout" onClick={logout}>
            Sign out
          </button>
        ) : (
          <NavLink to="/login" className="navbar__login">
            Sign in
          </NavLink>
        )}
      </div>
    </nav>
  );
}
