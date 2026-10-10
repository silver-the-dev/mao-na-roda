// Banco SQLite em memória para testes, usando o módulo nativo do Node
// (node:sqlite) com a mesma interface assíncrona do expo-sqlite.

import { DatabaseSync } from 'node:sqlite';
import { definirBanco } from '../../../db/client';
import { migrar } from '../../../db/migrations';
import { ITENS_DEMO, popularDemo } from '../../../db/seed';

/** @param {unknown[]} params */
const normalizar = (params) =>
  params.map((v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v));

/** @returns {import('../../../db/client').Banco} */
export function criarBancoMemoria() {
  const db = new DatabaseSync(':memory:');
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, params) {
      const r = db.prepare(sql).run(.../** @type {[]} */ (normalizar(params)));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getFirstAsync(sql, params) {
      const linha = db.prepare(sql).get(.../** @type {[]} */ (normalizar(params)));
      return linha ? { ...linha } : null;
    },
    async getAllAsync(sql, params) {
      return db.prepare(sql).all(.../** @type {[]} */ (normalizar(params))).map((l) => ({ ...l }));
    },
  };
}

/**
 * Cria um banco migrado e com os dados de demonstração, e o torna o banco ativo.
 * IDs resultantes: usuários 1 Ana, 2 Bruno, 3 Carla, 4 Diego; itens 1 a 15
 * na ordem de ITENS_DEMO; aluguéis 1 a 14 na ordem de ALUGUEIS_DEMO.
 */
export async function prepararBancoDemo() {
  const db = criarBancoMemoria();
  await db.execAsync('PRAGMA foreign_keys = ON');
  await migrar(db);
  /** @type {Record<string, string>} */
  const fotos = {};
  for (const it of ITENS_DEMO) fotos[it.foto] = `file:///docs/fotos/${it.foto}.jpg`;
  await popularDemo(db, fotos);
  definirBanco(db);
  return db;
}
