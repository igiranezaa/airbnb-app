import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../../../store/StoreContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const { logout } = useAuth();
  const { state } = useStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1 className="dashboard-card__title">Dashboard</h1>
        <p className="dashboard-card__welcome">Welcome back! You are signed in.</p>

        <div className="dashboard-stat">
          <span className="dashboard-stat__value">{state.saved.length}</span>
          <span className="dashboard-stat__label">
            {state.saved.length === 1 ? 'listing saved' : 'listings saved'}
          </span>
        </div>

        <button className="dashboard-logout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
