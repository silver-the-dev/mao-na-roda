import * as Crypto from 'expo-crypto';

/**
 * Hash SHA-256 da senha, em hexadecimal.
 * @param {string} senha
 */
export function hashSenha(senha) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, senha);
}
