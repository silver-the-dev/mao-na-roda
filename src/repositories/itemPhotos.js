import { comBanco } from '../db/client';
import { MAX_FOTOS_ITEM } from '../constants';
import { RegraDeNegocioError } from '../domain/errors';

/**
 * Fotos de um item, na ordem de exibição.
 * @param {number} itemId
 * @returns {Promise<import('../types').ItemPhoto[]>}
 */
export function listarFotos(itemId) {
  return comBanco((db) => listarFotosNaTransacao(db, itemId));
}

/**
 * @param {import('../db/client').Banco} db
 * @param {number} itemId
 * @returns {Promise<import('../types').ItemPhoto[]>}
 */
export async function listarFotosNaTransacao(db, itemId) {
  const linhas = await db.getAllAsync(
    'SELECT id, item_id, uri, ordem FROM item_photos WHERE item_id = ? ORDER BY ordem, id',
    [itemId],
  );
  return /** @type {import('../types').ItemPhoto[]} */ (linhas);
}

/**
 * Substitui as fotos do item pela lista informada (a ordem da lista é a
 * ordem de exibição). Deve ser chamada dentro de uma transação.
 * @param {import('../db/client').Banco} db
 * @param {number} itemId
 * @param {string[]} uris
 * @returns {Promise<string[]>} URIs que deixaram de ser usadas
 */
export async function substituirFotosNaTransacao(db, itemId, uris) {
  if (uris.length > MAX_FOTOS_ITEM) {
    throw new RegraDeNegocioError(`Cada item pode ter no máximo ${MAX_FOTOS_ITEM} fotos.`);
  }
  const anteriores = await listarFotosNaTransacao(db, itemId);
  await db.runAsync('DELETE FROM item_photos WHERE item_id = ?', [itemId]);
  for (const [ordem, uri] of uris.entries()) {
    await db.runAsync('INSERT INTO item_photos (item_id, uri, ordem) VALUES (?, ?, ?)', [itemId, uri, ordem]);
  }
  return anteriores.map((f) => f.uri).filter((uri) => !uris.includes(uri));
}
