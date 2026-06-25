import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

/** Ensures the caller is signed in and returns their uid. */
export function requireAuth(uid: string | undefined): string {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Please sign in to use the AI assistant.');
  }
  return uid;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Per-user daily cap on Claude calls to bound cost. Counts live in a private
 * doc written only by the Admin SDK (clients never see or edit it). Throws once
 * the limit is hit for the current day.
 */
export async function enforceDailyQuota(uid: string, limit: number): Promise<void> {
  const ref = getFirestore().doc(`users/${uid}/aiUsage/daily`);
  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const day = today();
    const count = data && data.day === day ? Number(data.count ?? 0) : 0;
    if (count >= limit) {
      throw new HttpsError(
        'resource-exhausted',
        `You have reached today's limit of ${limit} AI requests. Please try again tomorrow.`,
      );
    }
    tx.set(ref, { day, count: count + 1 }, { merge: true });
  });
}
