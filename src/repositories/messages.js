import { comBanco } from '../db/client';
import { RegraDeNegocioError } from '../domain/errors';
import { nowISO } from '../utils/format';

/**
 * @typedef {import('../types').Message & { autor_nome: string }} MensagemComAutor
 */

const MAX_MENSAGEM = 1000;

/**
 * Confere se o usuário participa do aluguel.
 * @param {import('../db/client').Banco} db
 * @param {number} aluguelId
 * @param {number} usuarioId
 */
async function garantirParticipante(db, aluguelId, usuarioId) {
  const ok = await db.getFirstAsync('SELECT id FROM rentals WHERE id = ? AND (dono_id = ? OR locatario_id = ?)', [
    aluguelId,
    usuarioId,
    usuarioId,
  ]);
  if (!ok) throw new RegraDeNegocioError('Só os participantes do aluguel podem ver e enviar mensagens.');
}

/**
 * Mensagens do aluguel, da mais antiga para a mais nova.
 * @param {number} aluguelId
 * @param {number} usuarioId
 * @returns {Promise<MensagemComAutor[]>}
 */
export function listarMensagens(aluguelId, usuarioId) {
  return comBanco(async (db) => {
    await garantirParticipante(db, aluguelId, usuarioId);
    const linhas = await db.getAllAsync(
      `SELECT m.*, u.nome AS autor_nome FROM messages m JOIN users u ON u.id = m.autor_id
        WHERE m.rental_id = ? ORDER BY m.criado_em, m.id`,
      [aluguelId],
    );
    return /** @type {MensagemComAutor[]} */ (linhas);
  });
}

/**
 * @param {number} aluguelId
 * @param {number} autorId
 * @param {string} texto
 */
export async function enviarMensagem(aluguelId, autorId, texto) {
  const limpo = texto.trim();
  if (!limpo) throw new RegraDeNegocioError('Escreva uma mensagem.');
  if (limpo.length > MAX_MENSAGEM) {
    throw new RegraDeNegocioError(`A mensagem pode ter no máximo ${MAX_MENSAGEM} caracteres.`);
  }
  return comBanco(async (db) => {
    await garantirParticipante(db, aluguelId, autorId);
    const r = await db.runAsync('INSERT INTO messages (rental_id, autor_id, texto, criado_em) VALUES (?, ?, ?, ?)', [
      aluguelId,
      autorId,
      limpo,
      nowISO(),
    ]);
    return r.lastInsertRowId;
  });
}
