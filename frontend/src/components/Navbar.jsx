import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiStar, FiTrendingUp,
  FiMessageSquare, FiUser, FiLogOut, FiMenu, FiX,
  FiSun, FiMoon
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

// Custom plate SVG for food log — not a generic library icon
const PlateIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
    <line x1="12" y1="8" x2="12" y2="5"/>
  </svg>
);

const NAV_ITEMS = [
  { to: '/dashboard',       icon: <FiHome size={18} />,         label: 'Dashboard' },
  { to: '/food-log',        icon: <PlateIcon size={18} />,      label: 'Food Log' },
  { to: '/recommendations', icon: <FiStar size={17} />,         label: 'Recommendations' },
  { to: '/progress',        icon: <FiTrendingUp size={18} />,   label: 'Progress' },
  { to: '/assistant',       icon: <FiMessageSquare size={17} />, label: 'Assistant' },
  { to: '/profile',         icon: <FiUser size={16} />,         label: 'Profile' },
  { to: '/about',           icon: null,                         label: 'About' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-wordmark">
            <span className="sw-nutri">Nutri</span><span className="sw-ai">AI</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{(user?.username || 'U')[0].toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">v0.9 beta</div>
            </div>
          </div>
          <div className="sidebar-footer-actions">
            <button
              className="icon-action-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <FiMoon size={15} /> : <FiSun size={15} />}
            </button>
            <button className="icon-action-btn" onClick={logout} title="Logout">
              <FiLogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-brand">
          <span className="sw-nutri">Nutri</span><span className="sw-ai">AI</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="mobile-icon-btn" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            <FiMenu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className="mobile-drawer-content">
            <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
              <FiX size={20} />
            </button>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
            <button className="nav-item logout-item" onClick={logout}>
              <span className="nav-icon"><FiLogOut /></span>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
