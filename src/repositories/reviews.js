import { comBanco, transacao } from '../db/client';
import { RegraDeNegocioError } from '../domain/errors';
import { nowISO } from '../utils/format';

/**
 * Avaliação com dados de quem escreveu e do item alugado.
 * @typedef {import('../types').Review & {
 *   autor_nome: string,
 *   autor_foto_uri: string | null,
 *   item_titulo: string,
 *   papel_avaliado: 'dono' | 'locatario',
 * }} AvaliacaoDetalhada
 */

const MAX_COMENTARIO = 500;

/**
 * Registra a avaliação de um participante sobre o outro. Só em aluguel
 * concluído, uma por pessoa por aluguel, sem edição.
 * @param {{ aluguelId: number, autorId: number, nota: number, comentario?: string | null }} dados
 */
export async function avaliar({ aluguelId, autorId, nota, comentario }) {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    throw new RegraDeNegocioError('Escolha uma nota de 1 a 5 estrelas.');
  }
  const texto = comentario?.trim() || null;
  if (texto && texto.length > MAX_COMENTARIO) {
    throw new RegraDeNegocioError(`O comentário pode ter no máximo ${MAX_COMENTARIO} caracteres.`);
  }

  return transacao(async (db) => {
    const aluguel = /** @type {{ dono_id: number, locatario_id: number, status: string } | null} */ (
      await db.getFirstAsync('SELECT dono_id, locatario_id, status FROM rentals WHERE id = ?', [aluguelId])
    );
    if (!aluguel) throw new RegraDeNegocioError('Aluguel não encontrado.');
    if (autorId !== aluguel.dono_id && autorId !== aluguel.locatario_id) {
      throw new RegraDeNegocioError('Só quem participou do aluguel pode avaliar.');
    }
    if (aluguel.status !== 'concluido') {
      throw new RegraDeNegocioError('A avaliação fica disponível quando o aluguel for concluído.');
    }
    const jaAvaliou = await db.getFirstAsync('SELECT id FROM reviews WHERE rental_id = ? AND autor_id = ?', [
      aluguelId,
      autorId,
    ]);
    if (jaAvaliou) throw new RegraDeNegocioError('Você já avaliou este aluguel. Avaliações não podem ser editadas.');

    const avaliadoId = autorId === aluguel.dono_id ? aluguel.locatario_id : aluguel.dono_id;
    const r = await db.runAsync(
      `INSERT INTO reviews (rental_id, autor_id, avaliado_id, nota, comentario, criado_em) VALUES (?, ?, ?, ?, ?, ?)`,
      [aluguelId, autorId, avaliadoId, nota, texto, nowISO()],
    );
    return r.lastInsertRowId;
  });
}

/**
 * Nota média e número de avaliações recebidas (calculadas na consulta).
 * @param {number} usuarioId
 * @returns {Promise<{ media: number, total: number }>}
 */
export function resumoAvaliacoes(usuarioId) {
  return comBanco(async (db) => {
    const r = /** @type {{ media: number, total: number }} */ (
      await db.getFirstAsync(
        'SELECT COALESCE(AVG(nota), 0) AS media, COUNT(*) AS total FROM reviews WHERE avaliado_id = ?',
        [usuarioId],
      )
    );
    return r;
  });
}

const SELECT_DETALHADA = `
  SELECT rv.*, u.nome AS autor_nome, u.foto_uri AS autor_foto_uri, i.titulo AS item_titulo,
         CASE WHEN rv.avaliado_id = r.dono_id THEN 'dono' ELSE 'locatario' END AS papel_avaliado
    FROM reviews rv
    JOIN users u ON u.id = rv.autor_id
    JOIN rentals r ON r.id = rv.rental_id
    JOIN items i ON i.id = r.item_id`;

/**
 * Avaliações recebidas pelo usuário, mais recentes primeiro.
 * @param {number} usuarioId
 * @returns {Promise<AvaliacaoDetalhada[]>}
 */
export function listarAvaliacoesRecebidas(usuarioId) {
  return comBanco(async (db) => {
    const linhas = await db.getAllAsync(`${SELECT_DETALHADA} WHERE rv.avaliado_id = ? ORDER BY rv.criado_em DESC`, [
      usuarioId,
    ]);
    return /** @type {AvaliacaoDetalhada[]} */ (linhas);
  });
}

/**
 * Avaliações feitas em um aluguel (zero, uma ou duas).
 * @param {number} aluguelId
 * @returns {Promise<AvaliacaoDetalhada[]>}
 */
export function listarAvaliacoesDoAluguel(aluguelId) {
  return comBanco(async (db) => {
    const linhas = await db.getAllAsync(`${SELECT_DETALHADA} WHERE rv.rental_id = ? ORDER BY rv.criado_em`, [aluguelId]);
    return /** @type {AvaliacaoDetalhada[]} */ (linhas);
  });
}
