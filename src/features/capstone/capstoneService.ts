import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { EvaluateCapstoneRequest, EvaluateCapstoneResponse } from '@/features/ai/aiClient';

export interface CapstoneRecord {
  input: EvaluateCapstoneRequest;
  report: EvaluateCapstoneResponse;
  updatedAt: number;
}

function capstoneDoc(uid: string) {
  return doc(db, 'users', uid, 'capstone', 'latest');
}

export async function fetchCapstone(uid: string): Promise<CapstoneRecord | null> {
  const snap = await getDoc(capstoneDoc(uid));
  return snap.exists() ? (snap.data() as CapstoneRecord) : null;
}

export async function saveCapstone(uid: string, record: CapstoneRecord): Promise<void> {
  await setDoc(capstoneDoc(uid), record, { merge: false });
}
