import { create } from 'zustand';

// Estado da sessão. Na etapa 3 o id passa a ser salvo no AsyncStorage
// e restaurado ao abrir o app.

/**
 * @typedef {Object} SessionState
 * @property {number | null} userId
 * @property {(userId: number) => void} signIn
 * @property {() => void} signOut
 */

export const useSession = create(
  /** @returns {SessionState} */
  (set) => ({
    userId: null,
    signIn: (userId) => set({ userId }),
    signOut: () => set({ userId: null }),
  }),
);
