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
  await Promise.allSettled(
    ids.map((id) => {
      const m = memory[id];
      return m ? saveConceptMemory(uid, m).catch((e) => console.error('saveConceptMemory', e)) : Promise.resolve();
    }),
  );
}

export const useConceptMemoryStore = create<ConceptMemoryState>()((set) => ({
  uid: null,
  memory: {},
  loaded: false,

  load: async (uid) => {
    set({ uid, loaded: false });
    try {
      const memory = await fetchAllConceptMemory(uid);
      set({ memory, loaded: true });
    } catch (e) {
      console.error('conceptMemory load failed', e);
      set({ memory: {}, loaded: true });
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
