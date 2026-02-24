import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import { loadSession, clearSession } from './api.js';
import './index.css';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Theme helpers ─────────────────────────────────────────────
const THEME_KEY = 'aegis_theme';
const getSavedTheme = () => localStorage.getItem(THEME_KEY) || 'dark';
const applyTheme = (theme) => {
  document.body.classList.toggle('light', theme === 'light');
};

function App() {
  const savedUser = loadSession();
  const [screen, setScreen] = useState(savedUser ? 'dashboard' : 'login');
  const [user, setUser] = useState(savedUser);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const t = getSavedTheme();
    applyTheme(t);   // apply immediately (no flash)
    return t;
  });

  // Sync class whenever theme changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleLoginSuccess = (u) => { setUser(u); setScreen('dashboard'); };
  const handleSignupSuccess = (u) => { setUser(u); setScreen('dashboard'); };
  const handleLogout = () => { clearSession(); setUser(null); setScreen('login'); };

  if (screen === 'login')
    return <Login onLoginSuccess={handleLoginSuccess} onGoSignup={() => setScreen('signup')} />;

  if (screen === 'signup')
    return <Signup onSignupSuccess={handleSignupSuccess} onGoLogin={() => setScreen('login')} />;

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Left: brand */}
          <div className="navbar-left">
            <div className="navbar-logo">🛡️</div>
            <div className="navbar-brand-group">
              <span className="navbar-brand">Aegis HCL</span>
              <span className="navbar-tagline">Ticket Resolution</span>
            </div>
          </div>

          {/* Center: nav links */}
          <div className="navbar-links">
            {isAdmin ? (
              <>
                <a className="nav-link nav-link-active" href="#">Admin Dashboard</a>
              </>
            ) : (
              <>
                <a className="nav-link nav-link-active" href="#">Employee Portal</a>
              </>
            )}
          </div>

          {/* Right: theme toggle + role + avatar */}
          <div className="navbar-right">
            {/* ── Theme toggle ── */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Role badge */}
            <span className={`role-badge ${isAdmin ? 'role-badge-admin' : 'role-badge-user'}`}>
              {isAdmin ? '🛡️ Admin' : '👤 User'}
            </span>

            {/* Avatar dropdown */}
            <div className="avatar-wrap">
              <button
                className="avatar-btn"
                onClick={() => setMobileOpen(o => !o)}
                title={user?.name}
              >
                <span className="avatar-initials">{getInitials(user?.name)}</span>
              </button>

              {mobileOpen && (
                <div className="avatar-dropdown">
                  <div className="avatar-dropdown-header">
                    <p className="avatar-dropdown-name">{user?.name}</p>
                    <p className="avatar-dropdown-email">{user?.email}</p>
                  </div>
                  <div className="avatar-dropdown-divider" />
                  <button className="avatar-dropdown-item" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page ────────────────────────────────────────────── */}
      <div className="page-content" onClick={() => setMobileOpen(false)}>
        {isAdmin ? <AdminDashboard /> : <UserDashboard />}
      </div>
    </div>
  );
}

export default App;