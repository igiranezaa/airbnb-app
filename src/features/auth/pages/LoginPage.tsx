import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/LoginForm';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string) {
    await login(email, password);
    navigate('/dashboard');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-card__title">Welcome back</h1>
        <p className="login-card__subtitle">Sign in to your account</p>
        <LoginForm onLogin={handleLogin} />
      </div>
    </div>
  );
}
