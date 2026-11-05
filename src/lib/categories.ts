import { addDoc, collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { budgetsRef } from './budgets';

export interface Category {
  id: string;
  name: string;
  custom: boolean;
}

export const OTHER_ID = 'other';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', custom: false },
  { id: 'transport', name: 'Transport', custom: false },
  { id: 'shopping', name: 'Shopping', custom: false },
  { id: 'bills', name: 'Bills', custom: false },
  { id: 'entertainment', name: 'Entertainment', custom: false },
  { id: 'healthcare', name: 'Healthcare', custom: false },
  { id: 'education', name: 'Education', custom: false },
  { id: OTHER_ID, name: 'Other', custom: false },
];

export const categoriesRef = (uid: string) => collection(db, 'users', uid, 'categories');

export function addCategory(uid: string, name: string) {
  return addDoc(categoriesRef(uid), { name });
}

export function renameCategory(uid: string, id: string, name: string) {
  return updateDoc(doc(categoriesRef(uid), id), { name });
}

export function deleteCategory(uid: string, id: string) {
  const batch = writeBatch(db);
  batch.delete(doc(categoriesRef(uid), id));
  batch.delete(doc(budgetsRef(uid), id));
  return batch.commit();
}
