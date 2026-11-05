import { collection, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const OVERALL_BUDGET = '__overall';

export const budgetsRef = (uid: string) => collection(db, 'users', uid, 'budgets');

export function setBudget(uid: string, key: string, amount: number | null) {
  const ref = doc(budgetsRef(uid), key);
  return amount === null ? deleteDoc(ref) : setDoc(ref, { amount });
}

export type BudgetStatus = 'ok' | 'warning' | 'over';

export function budgetStatus(spent: number, budget: number): BudgetStatus {
  if (spent > budget) return 'over';
  if (spent >= budget * 0.8) return 'warning';
  return 'ok';
}
