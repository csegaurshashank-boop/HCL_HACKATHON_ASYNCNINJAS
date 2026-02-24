import React, { useState } from 'react';
import { loginUser } from '../api.js';

export default function Login({ onLoginSuccess, onGoSignup }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginUser(form.email.trim(), form.password);
      // Expected: { user: { name, email, role }, token }
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-accent" />
        <div className="auth-card-body">

          {/* Brand */}
          <div className="auth-brand">
            <div className="auth-brand-icon">🛡️</div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Aegis HCL — Hackathon 2026</p>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Sign in to your account</span>
            <div className="auth-divider-line" />
          </div>

          {/* Error */}
          {error && (
            <div className="alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                className={`form-input${error ? ' error' : ''}`}
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className={`form-input${error ? ' error' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading && <span className="btn-spinner" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Switch to signup */}
          <div className="auth-footer">
            Don't have an account?{' '}
            <button className="auth-link" onClick={onGoSignup}>
              Create one
            </button>
          </div>
          <p className="auth-legal">AsyncNinjas · HCL Hackathon 2026</p>
        </div>
      </div>
    </div>
  );
}
