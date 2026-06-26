import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { ConceptMemory } from './scheduler';

function conceptMemoryCollection(uid: string) {
  return collection(db, 'users', uid, 'conceptMemory');
}

export async function fetchAllConceptMemory(uid: string): Promise<Record<string, ConceptMemory>> {
  const snap = await getDocs(conceptMemoryCollection(uid));
  const result: Record<string, ConceptMemory> = {};
  snap.forEach((d) => {
    result[d.id] = d.data() as ConceptMemory;
  });
  return result;
}

export async function saveConceptMemory(uid: string, memory: ConceptMemory): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'conceptMemory', memory.conceptId), memory, { merge: true });
}
