import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import type { z } from 'zod';

/** Per-user daily cap on model calls, shared across every AI callable. */
export const DAILY_LIMIT = 40;

/** Ensures the caller is signed in and returns their uid. */
export function requireAuth(uid: string | undefined): string {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Please sign in to use the AI assistant.');
  }
  return uid;
}

/**
 * Validates request data against a schema and returns the typed value. On
 * failure it throws a CLIENT-readable `invalid-argument` error instead of
 * letting a raw ZodError bubble up as a generic "INTERNAL" (which is opaque to
 * the learner and hard to debug).
 */
export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
      .join('; ');
    throw new HttpsError('invalid-argument', `Invalid request - ${detail}`);
  }
  return result.data;
}

/**
 * Runs a callable's body and guarantees the client never receives a bare,
 * opaque "INTERNAL" - nor any raw internal error text. Our own `HttpsError`s
 * (auth, quota, validation, model issues) carry learner-safe messages and pass
 * through unchanged; any other unexpected error is logged in full server-side
 * for diagnosis but surfaced to the client as a fixed, generic message so we
 * never leak stack traces, provider errors, or other internals.
 */
export async function guardErrors<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error(`${label} failed`, err);
    throw new HttpsError(
      'internal',
      'The AI assistant hit an unexpected error. Please try again.',
    );
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Per-user daily cap on model calls to bound cost. Counts live in a private
 * doc written only by the Admin SDK (clients never see or edit it). Throws once
 * the limit is hit for the current day.
 *
 * Metering is best-effort: if the usage transaction itself fails (a Firestore
 * hiccup unrelated to the learner), we log and allow the request through rather
 * than blocking a paying feature on bookkeeping. A real limit hit still throws.
 */
export async function enforceDailyQuota(uid: string, limit: number): Promise<void> {
  const db = getFirestore();
  const ref = db.doc(`users/${uid}/aiUsage/daily`);
  try {
    await db.runTransaction(async (tx) => {
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
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error('enforceDailyQuota: usage tracking failed, allowing request', err);
  }
}
