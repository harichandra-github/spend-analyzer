import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit card', 'Credit card', 'Net banking', 'Other'];

export interface ExpenseInput {
  amount: number;
  date: string;
  categoryId: string;
  description: string;
  paymentMethod: string;
  notes: string;
}

export interface Expense extends ExpenseInput {
  id: string;
}

export const expensesRef = (uid: string) => collection(db, 'users', uid, 'expenses');

export function addExpense(uid: string, input: ExpenseInput) {
  return addDoc(expensesRef(uid), { ...input, createdAt: serverTimestamp() });
}

export function updateExpense(uid: string, id: string, input: ExpenseInput) {
  return updateDoc(doc(expensesRef(uid), id), { ...input });
}

export function deleteExpense(uid: string, id: string) {
  return deleteDoc(doc(expensesRef(uid), id));
}

const BATCH_SIZE = 400;

export async function addExpensesBulk(uid: string, inputs: ExpenseInput[]) {
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const input of inputs.slice(i, i + BATCH_SIZE)) {
      batch.set(doc(expensesRef(uid)), { ...input, createdAt: serverTimestamp() });
    }
    await batch.commit();
  }
}

export function useExpenses(uid: string, start: string, end: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(expensesRef(uid), where('date', '>=', start), where('date', '<=', end), orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setExpenses(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              amount: data.amount,
              date: data.date,
              categoryId: data.categoryId,
              description: data.description,
              paymentMethod: data.paymentMethod ?? '',
              notes: data.notes ?? '',
            };
          }),
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [uid, start, end]);

  return { expenses, loading, error };
}
