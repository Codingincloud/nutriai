import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import nepaliFood from '../assets/nepali_food.jpg';
import './Login.css';

const AuthLeftPanel = () => (
  <div className="auth-left">
    <div className="auth-brand">
      <div className="auth-wordmark">
        <span className="wm-nutri">Nutri</span><span className="wm-ai">AI</span>
      </div>
      <p className="auth-brand-tagline">
        Nutrition tracking built for Nepali dietary culture — 117 local foods, 
        XGBoost recommendations, AI assistant.
      </p>

      <div className="auth-stats">
        <div className="auth-stat-item">
          <div className="auth-stat-num">117</div>
          <div className="auth-stat-label">Nepali foods in NepaliNutriDB</div>
        </div>
        <div className="auth-stat-item">
          <div className="auth-stat-num">0.87</div>
          <div className="auth-stat-label">XGBoost R² on test set</div>
        </div>
        <div className="auth-stat-item">
          <div className="auth-stat-num">AI</div>
          <div className="auth-stat-label">Gemini assistant with profile context</div>
        </div>
      </div>
    </div>

    {/* Nepali food illustration */}
    <img
      src={nepaliFood}
      alt="Dal bhat, momos and tea — traditional Nepali food"
      style={{ width: '100%', borderRadius: 8, opacity: 0.85, marginTop: 'auto', display: 'block' }}
    />

    <div className="auth-left-footer">
      Khwopa Engineering College · 7th Semester<br />
      Purbanchal University · Computer Engineering · 2026
    </div>
  </div>
);

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthLeftPanel />

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Enter your credentials to continue</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                placeholder="username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required autoFocus autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required autoComplete="current-password"
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
