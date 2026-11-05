import { addDoc, collection, deleteDoc, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { expensesRef } from './expenses';
import { addDays, addMonths, todayIso } from './format';

export type Frequency = 'weekly' | 'monthly' | 'yearly';

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export interface RecurringInput {
  amount: number;
  description: string;
  categoryId: string;
  paymentMethod: string;
  frequency: Frequency;
  nextDate: string;
  active: boolean;
}

export interface Recurring extends RecurringInput {
  id: string;
}

export const recurringRef = (uid: string) => collection(db, 'users', uid, 'recurring');

export function addRecurring(uid: string, input: RecurringInput) {
  return addDoc(recurringRef(uid), input);
}

export function updateRecurring(uid: string, id: string, input: Partial<RecurringInput>) {
  return updateDoc(doc(recurringRef(uid), id), input);
}

export function deleteRecurring(uid: string, id: string) {
  return deleteDoc(doc(recurringRef(uid), id));
}

export function nextOccurrence(date: string, frequency: Frequency) {
  if (frequency === 'weekly') return addDays(date, 7);
  return addMonths(date, frequency === 'monthly' ? 1 : 12);
}

export function monthlyEquivalent(r: RecurringInput) {
  if (r.frequency === 'weekly') return (r.amount * 52) / 12;
  if (r.frequency === 'yearly') return r.amount / 12;
  return r.amount;
}

export const isDue = (r: RecurringInput) => r.active && r.nextDate <= todayIso();

// Transactions re-check the due date so a double click or two open tabs can't log the same payment twice.
export function logPayment(uid: string, id: string) {
  return runTransaction(db, async (tx) => {
    const ref = doc(recurringRef(uid), id);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const r = snap.data() as RecurringInput;
    if (!isDue(r)) return;
    tx.set(doc(expensesRef(uid)), {
      amount: r.amount,
      date: r.nextDate,
      categoryId: r.categoryId,
      description: r.description,
      paymentMethod: r.paymentMethod,
      notes: 'Recurring payment',
      createdAt: serverTimestamp(),
    });
    tx.update(ref, { nextDate: nextOccurrence(r.nextDate, r.frequency) });
  });
}

export function skipPayment(uid: string, id: string) {
  return runTransaction(db, async (tx) => {
    const ref = doc(recurringRef(uid), id);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const r = snap.data() as RecurringInput;
    if (!isDue(r)) return;
    tx.update(ref, { nextDate: nextOccurrence(r.nextDate, r.frequency) });
  });
}
