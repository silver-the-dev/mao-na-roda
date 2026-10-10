// Migrações do esquema, controladas por PRAGMA user_version.
// Cada migração roda uma única vez, dentro de uma transação, em ordem.
// Para mudar o esquema no futuro, acrescente um item ao final da lista;
// nunca altere uma migração que já foi publicada.
//
// Convenções:
// - datas: texto ISO 8601 (data/hora em UTC; datas de aluguel como AAAA-MM-DD)
// - dinheiro: inteiro em centavos
// - booleanos: inteiro 0/1

/** @type {{ versao: number, descricao: string, sql: string }[]} */
export const MIGRACOES = [
  {
    versao: 1,
    descricao: 'Esquema inicial',
    sql: `
      CREATE TABLE users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        nome        TEXT    NOT NULL,
        email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        senha_hash  TEXT    NOT NULL,
        foto_uri    TEXT,
        telefone    TEXT,
        bairro      TEXT    NOT NULL,
        cidade      TEXT    NOT NULL,
        criado_em   TEXT    NOT NULL
      );

      CREATE TABLE items (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        dono_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        titulo        TEXT    NOT NULL,
        descricao     TEXT    NOT NULL,
        categoria     TEXT    NOT NULL
                      CHECK (categoria IN ('ferramentas','eletronicos','instrumentos','cameras','utensilios','outros')),
        valor_diaria  INTEGER NOT NULL CHECK (valor_diaria > 0),
        caucao        INTEGER CHECK (caucao IS NULL OR caucao >= 0),
        conservacao   TEXT    NOT NULL CHECK (conservacao IN ('novo','otimo','bom','regular')),
        bairro        TEXT    NOT NULL,
        cidade        TEXT    NOT NULL,
        status        TEXT    NOT NULL DEFAULT 'disponivel'
                      CHECK (status IN ('disponivel','pausado','excluido')),
        texto_busca   TEXT    NOT NULL DEFAULT '',
        criado_em     TEXT    NOT NULL
      );
      CREATE INDEX idx_items_dono ON items(dono_id);
      CREATE INDEX idx_items_status ON items(status);

      CREATE TABLE item_photos (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id  INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        uri      TEXT    NOT NULL,
        ordem    INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_item_photos_item ON item_photos(item_id, ordem);

      CREATE TABLE rentals (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id              INTEGER NOT NULL REFERENCES items(id),
        dono_id              INTEGER NOT NULL REFERENCES users(id),
        locatario_id         INTEGER NOT NULL REFERENCES users(id),
        data_inicio          TEXT    NOT NULL,
        data_fim             TEXT    NOT NULL,
        retirada_apos_corte  INTEGER NOT NULL DEFAULT 0 CHECK (retirada_apos_corte IN (0, 1)),
        valor_total          INTEGER NOT NULL CHECK (valor_total > 0),
        status               TEXT    NOT NULL DEFAULT 'solicitado'
                             CHECK (status IN ('solicitado','aprovado','em_andamento','devolvido','concluido','recusado','cancelado')),
        criado_em            TEXT    NOT NULL,
        respondido_em        TEXT,
        retirado_em          TEXT,
        devolvido_em         TEXT,
        concluido_em         TEXT,
        cancelado_em         TEXT,
        CHECK (data_fim >= data_inicio),
        CHECK (dono_id <> locatario_id)
      );
      CREATE INDEX idx_rentals_item ON rentals(item_id, status);
      CREATE INDEX idx_rentals_dono ON rentals(dono_id);
      CREATE INDEX idx_rentals_locatario ON rentals(locatario_id);

      CREATE TABLE reviews (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        rental_id    INTEGER NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
        autor_id     INTEGER NOT NULL REFERENCES users(id),
        avaliado_id  INTEGER NOT NULL REFERENCES users(id),
        nota         INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
        comentario   TEXT,
        criado_em    TEXT    NOT NULL,
        UNIQUE (rental_id, autor_id),
        CHECK (autor_id <> avaliado_id)
      );
      CREATE INDEX idx_reviews_autor ON reviews(autor_id);
      CREATE INDEX idx_reviews_avaliado ON reviews(avaliado_id);

      CREATE TABLE messages (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        rental_id  INTEGER NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
        autor_id   INTEGER NOT NULL REFERENCES users(id),
        texto      TEXT    NOT NULL,
        criado_em  TEXT    NOT NULL
      );
      CREATE INDEX idx_messages_rental ON messages(rental_id, criado_em);
      CREATE INDEX idx_messages_autor ON messages(autor_id);
    `,
  },
];

export const VERSAO_ATUAL = MIGRACOES[MIGRACOES.length - 1].versao;

/**
 * Aplica as migrações pendentes.
 * @param {import('./client').Banco} db
 */
export async function migrar(db) {
  const linha = await db.getFirstAsync('PRAGMA user_version', []);
  const versaoAtual = /** @type {{ user_version: number } | null} */ (linha)?.user_version ?? 0;

  for (const m of MIGRACOES) {
    if (m.versao <= versaoAtual) continue;
    await db.execAsync('BEGIN');
    try {
      await db.execAsync(m.sql);
      // user_version faz parte da transação: se algo falhar, nada muda.
      await db.execAsync(`PRAGMA user_version = ${m.versao}`);
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  }
}
