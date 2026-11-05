import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { ChartColumn, PiggyBank, Repeat, ShieldCheck } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useTheme } from '../lib/theme';
import { Brand } from '../components/Layout';
import { ThemeToggle } from '../components/Icons';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

const FEATURES = [
  { icon: ChartColumn, text: 'See where your money goes' },
  { icon: PiggyBank, text: 'Set budgets and get alerts' },
  { icon: Repeat, text: 'Track subscriptions and bills' },
  { icon: ShieldCheck, text: 'Private to you, free forever' },
];

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignup && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setError(ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div>
          <h2>Take control of your spending.</h2>
          <p>Track every rupee, stay within budget, and understand your habits with clear, simple insights.</p>
        </div>
        <ul className="auth-features">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text}>
              <span aria-hidden><Icon size={18} /></span>
              {text}
            </li>
          ))}
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-theme">
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
        <form className="auth-card" onSubmit={handleSubmit}>
          <Brand />
          <div>
            <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              {isSignup ? 'Start tracking your expenses in under a minute.' : 'Log in to see your spending.'}
            </p>
          </div>

          <label>
            Email
            <input type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={6}
              placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {isSignup && (
            <label>
              Confirm password
              <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
          )}

          {error && <p className="error-banner" role="alert">{error}</p>}

          <button className="btn primary block" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
          </button>

          <p className="muted center small">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Sign up'}</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
