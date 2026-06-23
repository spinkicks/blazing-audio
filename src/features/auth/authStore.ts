import { create } from 'zustand';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/firebase/config';

interface AuthState {
  user: User | null;
  initializing: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  initializing: true,
  setUser: (user) => set({ user, initializing: false }),
}));

let listenerStarted = false;

/** Wires Firebase auth state into the store. Safe to call more than once. */
export function initAuthListener(): void {
  if (listenerStarted) return;
  listenerStarted = true;
  onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().setUser(user);
  });
}
