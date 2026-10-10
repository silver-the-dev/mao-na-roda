// Conexão única com o SQLite e controle de acesso.
//
// Todo acesso ao banco passa por uma fila: uma operação por vez. Isso
// garante que uma transação nunca se misture com outra consulta feita
// ao mesmo tempo por outra tela. Usamos a conexão principal (e não
// withExclusiveTransactionAsync, que abre outra conexão) para que o
// PRAGMA foreign_keys valha também dentro das transações.

/**
 * Interface mínima do banco usada pelos repositórios. É a mesma do
 * SQLiteDatabase do expo-sqlite, o que permite trocar por outra
 * implementação nos testes.
 * @typedef {Object} Banco
 * @property {(sql: string) => Promise<void>} execAsync
 * @property {(sql: string, params: unknown[]) => Promise<{ lastInsertRowId: number, changes: number }>} runAsync
 * @property {(sql: string, params: unknown[]) => Promise<unknown>} getFirstAsync
 * @property {(sql: string, params: unknown[]) => Promise<unknown[]>} getAllAsync
 */

/** @type {Banco | null} */
let banco = null;

/** @type {Promise<unknown>} */
let fila = Promise.resolve();

/**
 * Define a conexão ativa (chamado na inicialização e nos testes).
 * @param {Banco | null} db
 */
export function definirBanco(db) {
  banco = db;
}

/** @returns {Banco} */
function obterBanco() {
  if (!banco) throw new Error('Banco de dados ainda não foi aberto.');
  return banco;
}

/**
 * Executa `tarefa` com acesso exclusivo ao banco.
 * @template T
 * @param {() => Promise<T>} tarefa
 * @returns {Promise<T>}
 */
export function exclusivo(tarefa) {
  const resultado = fila.then(tarefa);
  fila = resultado.catch(() => undefined);
  return resultado;
}

/**
 * Consulta ou escrita simples, sem transação.
 * @template T
 * @param {(db: Banco) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function comBanco(fn) {
  return exclusivo(() => fn(obterBanco()));
}

/**
 * Executa várias escritas atomicamente: ou todas são gravadas, ou nenhuma.
 * @template T
 * @param {(db: Banco) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function transacao(fn) {
  return exclusivo(() => transacaoSemFila(obterBanco(), fn));
}

/**
 * Transação para quem já está dentro da fila (inicialização e seed).
 * @template T
 * @param {Banco} db
 * @param {(db: Banco) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function transacaoSemFila(db, fn) {
  await db.execAsync('BEGIN IMMEDIATE');
  try {
    const r = await fn(db);
    await db.execAsync('COMMIT');
    return r;
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}
