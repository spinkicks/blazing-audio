import { create } from 'zustand';
import { fetchAllConceptMemory, saveConceptMemory } from './conceptMemoryService';
import { newConceptMemory, review, type ConceptMemory } from './scheduler';

const SYNC_DELAY_MS = 600;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const dirty = new Set<string>();

interface ConceptMemoryState {
  uid: string | null;
  memory: Record<string, ConceptMemory>;
  loaded: boolean;
  load: (uid: string) => Promise<void>;
  reset: () => void;
  /** Record a retrieval outcome for every concept a problem exercises. */
  recordConceptReview: (conceptIds: string[], grade: 'pass' | 'fail') => void;
}

function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => void flushConceptMemory(), SYNC_DELAY_MS);
}

export async function flushConceptMemory(): Promise<void> {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  const { uid, memory } = useConceptMemoryStore.getState();
  if (!uid) return;
  const ids = [...dirty];
  dirty.clear();
  const results = await Promise.allSettled(
    ids.map((id) => {
      const m = memory[id];
      return m ? saveConceptMemory(uid, m) : Promise.resolve();
    }),
  );
  // Re-mark any id whose save failed so it retries on the next sync, instead of
  // dropping the review.
  let failed = false;
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error('saveConceptMemory', result.reason);
      dirty.add(ids[i]);
      failed = true;
    }
  });
  if (failed) scheduleSync();
}

export const useConceptMemoryStore = create<ConceptMemoryState>()((set) => ({
  uid: null,
  memory: {},
  loaded: false,

  load: async (uid) => {
    // Clear any prior user's memory up front so a slow/failed fetch can never
    // leave another account's data visible (fail-safe user isolation).
    set({ uid, memory: {}, loaded: false });
    try {
      const fetched = await fetchAllConceptMemory(uid);
      // Preserve any review recorded locally while the fetch was in flight: a
      // dirty (not-yet-synced) entry wins over the fetched copy, so answering a
      // problem during loading is never clobbered by the resolving load.
      set((state) => {
        const merged: Record<string, ConceptMemory> = { ...fetched };
        for (const id of dirty) {
          const local = state.memory[id];
          if (local) merged[id] = local;
        }
        return { memory: merged, loaded: true };
      });
    } catch (e) {
      console.error('conceptMemory load failed', e);
      set({ loaded: true });
    }
  },

  reset: () => {
    dirty.clear();
    set({ uid: null, memory: {}, loaded: false });
  },

  recordConceptReview: (conceptIds, grade) => {
    if (conceptIds.length === 0) return;
    const now = Date.now();
    set((state) => {
      const next = { ...state.memory };
      for (const id of conceptIds) {
        const prev = next[id] ?? newConceptMemory(id, now);
        next[id] = review(prev, grade, now);
      }
      return { memory: next };
    });
    // Track dirty ids and schedule outside the updater (updaters stay pure).
    for (const id of conceptIds) dirty.add(id);
    scheduleSync();
  },
}));
