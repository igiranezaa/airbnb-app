import { FaBars, FaHome, FaMoon, FaSun } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import { useProfileAvatar } from '../../../shared/hooks/useProfileAvatar';

interface Props {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSwitchToGuest: () => void;
}

export default function DashboardTopbar({ isSidebarCollapsed, onToggleSidebar, onSwitchToGuest }: Props) {
  const { userRole, userName, userEmail } = useAuth();
  const { dark, toggle } = useTheme();
  const avatarSrc = useProfileAvatar(userEmail);

  const initials = userName
    ? userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="db-topbar">
      <button
        className="db-menu-button"
        type="button"
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggleSidebar}
      >
        <FaBars />
      </button>
      <div className="db-top-actions">
        <Link to="/" className="db-home-btn" aria-label="Go to home">
          <FaHome /> Home
        </Link>
        {userRole === 'HOST' && (
          <button className="db-hosting-switch" type="button" onClick={onSwitchToGuest}>
            Switch to guest
          </button>
        )}
        <button type="button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggle}>
          {dark ? <FaSun /> : <FaMoon />}
        </button>
        <div className="db-topbar-user">
          <div className="db-topbar-user__avatar">
            {avatarSrc ? <img src={avatarSrc} alt={userName ? `${userName} avatar` : 'User avatar'} /> : initials}
          </div>
          <div className="db-topbar-user__info">
            <span className="db-topbar-user__name">{userName ?? 'User'}</span>
            <span className="db-topbar-user__email">{userEmail ?? ''}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
