import * as SQLite from 'expo-sqlite';
import { apagarTodasFotos } from '../utils/photos';
import { definirBanco, exclusivo } from './client';
import { migrar } from './migrations';
import { apagarTudo, popularDemo } from './seed';
import { copiarFotosDemo } from './seedPhotos';

const NOME_ARQUIVO = 'maonaroda.db';

/** @type {Promise<void> | null} */
let inicializacao = null;

/** @type {SQLite.SQLiteDatabase | null} */
let conexao = null;

/**
 * Abre o banco, aplica migrações e popula com dados de demonstração na
 * primeira execução. Pode ser chamada várias vezes: só roda uma vez.
 */
export function inicializarBanco() {
  if (!inicializacao) {
    inicializacao = exclusivo(async () => {
      const db = await SQLite.openDatabaseAsync(NOME_ARQUIVO);
      // foreign_keys vale por conexão e precisa ser ligado fora de transação.
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      await migrar(db);
      definirBanco(db);
      conexao = db;

      const r = /** @type {{ total: number }} */ (await db.getFirstAsync('SELECT COUNT(*) AS total FROM users', []));
      if (r.total === 0) {
        await popularDemo(db, await copiarFotosDemo());
      }
    }).catch((e) => {
      inicializacao = null; // permite tentar de novo
      throw e;
    });
  }
  return inicializacao;
}

/**
 * Apaga tudo (dados e fotos) e recria os dados de demonstração.
 */
export async function restaurarDadosDemo() {
  await inicializarBanco();
  await exclusivo(async () => {
    const db = /** @type {SQLite.SQLiteDatabase} */ (conexao);
    await apagarTudo(db);
    apagarTodasFotos();
    await popularDemo(db, await copiarFotosDemo());
  });
}
