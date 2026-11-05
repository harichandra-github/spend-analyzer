import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import RecurringPage from './pages/RecurringPage';

const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const Import = lazy(() => import('./pages/Import'));

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading"><div className="spinner" role="status" aria-label="Loading" /></div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        element={
          <DataProvider key={user.uid} uid={user.uid}>
            <Layout />
          </DataProvider>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="recurring" element={<RecurringPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="import" element={<Import />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="loading"><div className="spinner" role="status" aria-label="Loading" /></div>}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
