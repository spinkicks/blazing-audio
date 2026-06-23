import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { LessonProgress, UserProfile } from './types';

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

function lessonProgressCollection(uid: string) {
  return collection(db, 'users', uid, 'lessonProgress');
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(userDoc(profile.uid), profile, { merge: true });
}

export async function fetchAllProgress(uid: string): Promise<Record<string, LessonProgress>> {
  const snap = await getDocs(lessonProgressCollection(uid));
  const result: Record<string, LessonProgress> = {};
  snap.forEach((document) => {
    result[document.id] = document.data() as LessonProgress;
  });
  return result;
}

export async function saveLessonProgress(
  uid: string,
  progress: LessonProgress,
): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'lessonProgress', progress.lessonId), progress, {
    merge: true,
  });
}
