import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
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
    <img
      src={nepaliFood}
      alt="Dal bhat, momos and tea"
      style={{ width: '100%', borderRadius: 8, opacity: 0.85 }}
    />
    <div className="auth-left-footer">
      Khwopa Engineering College · 7th Semester<br />
      Purbanchal University · Computer Engineering · 2026
    </div>
  </div>
);

const Register = () => {
  const navigate   = useNavigate();
  const { login }  = useAuth();
  const [form, setForm]       = useState({ username: '', email: '', password: '', password2: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/users/register/', form);
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      const msg  = data ? Object.values(data).flat().join(' ') : 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthLeftPanel />

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Fill in your details to get started</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                placeholder="pick a username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required autoFocus autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="Create password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={form.password2}
                  onChange={e => setForm({ ...form, password2: e.target.value })}
                  required autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
