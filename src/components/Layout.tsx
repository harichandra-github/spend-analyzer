import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  ChartColumn,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useTheme } from '../lib/theme';
import { useUser } from '../context/AuthContext';
import { ThemeToggle } from './Icons';
import ExpenseForm from './ExpenseForm';

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: ReceiptText },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden>
        <Wallet size={18} strokeWidth={2.25} />
      </span>
      Spend Analyzer
    </span>
  );
}

export default function Layout() {
  const user = useUser();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const location = useLocation();
  const initial = (user.email ?? '?').charAt(0).toUpperCase();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="app-shell">
      <header className="mobile-bar">
        <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Brand />
        <ThemeToggle theme={theme} onToggle={toggle} />
      </header>

      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} aria-hidden />}

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-head">
          <Brand />
          <button className="icon-btn close-menu" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="avatar" aria-hidden>{initial}</span>
          <span className="user-email" title={user.email ?? ''}>{user.email}</span>
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button className="icon-btn" onClick={() => signOut(auth)} aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="container">
          <Suspense fallback={<div className="spinner" role="status" aria-label="Loading" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <button className="fab" onClick={() => setAdding(true)} aria-label="Quick add expense">
        <Plus size={24} />
      </button>
      {adding && <ExpenseForm onClose={() => setAdding(false)} />}
    </div>
  );
}
