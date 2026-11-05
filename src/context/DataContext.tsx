import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { DEFAULT_CATEGORIES, OTHER_ID, categoriesRef, type Category } from '../lib/categories';
import { budgetsRef } from '../lib/budgets';
import { recurringRef, type Recurring, type RecurringInput } from '../lib/recurring';

interface DataState {
  categories: Category[];
  getCategory: (id: string) => Category;
  budgets: Map<string, number>;
  recurring: Recurring[];
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [custom, setCustom] = useState<Category[] | null>(null);
  const [budgets, setBudgets] = useState<Map<string, number> | null>(null);
  const [recurring, setRecurring] = useState<Recurring[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onError = (err: Error) => setError(err.message);
    const unsubs = [
      onSnapshot(
        categoriesRef(uid),
        (snap) =>
          setCustom(
            snap.docs
              .map((d) => ({ id: d.id, name: d.data().name as string, custom: true }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          ),
        onError,
      ),
      onSnapshot(budgetsRef(uid), (snap) => setBudgets(new Map(snap.docs.map((d) => [d.id, d.data().amount as number]))), onError),
      onSnapshot(
        recurringRef(uid),
        (snap) =>
          setRecurring(
            snap.docs
              .map((d) => ({ id: d.id, ...(d.data() as RecurringInput) }))
              .sort((a, b) => a.nextDate.localeCompare(b.nextDate)),
          ),
        onError,
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const categories = useMemo(() => {
    const other = DEFAULT_CATEGORIES.find((c) => c.id === OTHER_ID)!;
    return [...DEFAULT_CATEGORIES.filter((c) => c.id !== OTHER_ID), ...(custom ?? []), other];
  }, [custom]);

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const getCategory = useCallback((id: string) => byId.get(id) ?? byId.get(OTHER_ID)!, [byId]);

  if (error) return <p className="error page-message" role="alert">Could not load your data: {error}</p>;
  if (!custom || !budgets || !recurring) {
    return (
      <div className="loading">
        <div className="spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ categories, getCategory, budgets, recurring }}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
