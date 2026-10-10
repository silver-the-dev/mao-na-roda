import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { buscarUsuario } from '../repositories/users';

// Estado da sessão. Só o id do usuário logado fica salvo no aparelho
// (AsyncStorage); os dados do usuário são sempre lidos do banco.

const CHAVE = 'maonaroda:usuarioId';

/**
 * @typedef {Object} SessionState
 * @property {number | null} userId
 * @property {(userId: number) => Promise<void>} signIn
 * @property {() => Promise<void>} signOut
 * @property {() => Promise<void>} restaurar  lê o id salvo ao abrir o app
 */

export const useSession = create(
  /** @returns {SessionState} */
  (set) => ({
    userId: null,

    async signIn(userId) {
      await AsyncStorage.setItem(CHAVE, String(userId));
      set({ userId });
    },

    async signOut() {
      await AsyncStorage.removeItem(CHAVE);
      set({ userId: null });
    },

    async restaurar() {
      const salvo = await AsyncStorage.getItem(CHAVE);
      const id = salvo ? Number(salvo) : null;
      // A conta pode ter sido apagada ao restaurar os dados de demonstração.
      if (id && (await buscarUsuario(id))) {
        set({ userId: id });
      } else {
        await AsyncStorage.removeItem(CHAVE);
        set({ userId: null });
      }
    },
  }),
);

/**
 * Id do usuário logado, para telas que só existem com sessão ativa.
 * @returns {number}
 */
export function useUsuarioId() {
  const id = useSession((s) => s.userId);
  return id ?? 0;
}
