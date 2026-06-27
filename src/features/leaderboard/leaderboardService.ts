import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface LeaderboardEntry {
  uid: string;
  alias: string;
  xp: number;
  updatedAt: number;
}

function entryDoc(uid: string) {
  return doc(db, 'leaderboard', uid);
}

/** Owner upserts their own entry (alias + current all-time XP). */
export async function upsertLeaderboardEntry(uid: string, alias: string, xp: number): Promise<void> {
  await setDoc(entryDoc(uid), { alias, xp, updatedAt: Date.now() }, { merge: true });
}

export async function removeLeaderboardEntry(uid: string): Promise<void> {
  await deleteDoc(entryDoc(uid));
}

export async function fetchTopLeaderboard(max = 100): Promise<LeaderboardEntry[]> {
  const q = query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<LeaderboardEntry, 'uid'>) }));
}
