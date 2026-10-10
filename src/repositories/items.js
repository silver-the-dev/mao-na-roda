import { comBanco, transacao } from '../db/client';
import { CATEGORIAS, CONSERVACOES } from '../constants';
import { RegraDeNegocioError } from '../domain/errors';
import { STATUS_ATIVOS } from '../domain/rentalStatus';
import { normalizarTexto, nowISO } from '../utils/format';
import { apagarFoto, salvarFotos } from '../utils/photos';
import { listarFotosNaTransacao, substituirFotosNaTransacao } from './itemPhotos';

/**
 * Dados editáveis de um item (valores em centavos).
 * @typedef {Object} DadosItem
 * @property {string} titulo
 * @property {string} descricao
 * @property {import('../types').Categoria} categoria
 * @property {number} valor_diaria
 * @property {number | null} caucao
 * @property {import('../types').Conservacao} conservacao
 * @property {string} bairro
 * @property {string} cidade
 */

/**
 * Item para listas: inclui a primeira foto e a nota do dono.
 * @typedef {import('../types').Item & {
 *   foto_uri: string | null,
 *   dono_nome: string,
 *   dono_nota: number,
 *   dono_avaliacoes: number,
 * }} ItemResumo
 */

/**
 * Item completo para a tela de detalhe.
 * @typedef {import('../types').Item & {
 *   fotos: import('../types').ItemPhoto[],
 *   dono: { id: number, nome: string, foto_uri: string | null, bairro: string, cidade: string, nota_media: number, total_avaliacoes: number },
 * }} ItemDetalhado
 */

// Colunas comuns às listagens de itens.
const SELECT_RESUMO = `
  SELECT i.*,
         (SELECT uri FROM item_photos f WHERE f.item_id = i.id ORDER BY f.ordem, f.id LIMIT 1) AS foto_uri,
         u.nome AS dono_nome,
         COALESCE((SELECT AVG(nota) FROM reviews r WHERE r.avaliado_id = i.dono_id), 0) AS dono_nota,
         (SELECT COUNT(*) FROM reviews r WHERE r.avaliado_id = i.dono_id) AS dono_avaliacoes
    FROM items i
    JOIN users u ON u.id = i.dono_id`;

/**
 * Valida e normaliza os dados do formulário de item.
 * @param {DadosItem} d
 * @returns {DadosItem}
 */
function validarDados(d) {
  const titulo = d.titulo.trim();
  const descricao = d.descricao.trim();
  const bairro = d.bairro.trim();
  const cidade = d.cidade.trim();
  if (titulo.length < 3) throw new RegraDeNegocioError('O título precisa ter pelo menos 3 letras.');
  if (descricao.length < 10) throw new RegraDeNegocioError('Descreva o item com pelo menos 10 letras.');
  if (!CATEGORIAS.some((c) => c.value === d.categoria)) throw new RegraDeNegocioError('Escolha uma categoria.');
  if (!CONSERVACOES.some((c) => c.value === d.conservacao)) {
    throw new RegraDeNegocioError('Escolha o estado de conservação.');
  }
  if (!Number.isInteger(d.valor_diaria) || d.valor_diaria <= 0) {
    throw new RegraDeNegocioError('Informe um valor de diária maior que zero.');
  }
  if (d.caucao !== null && (!Number.isInteger(d.caucao) || d.caucao < 0)) {
    throw new RegraDeNegocioError('O valor da caução é inválido.');
  }
  if (!bairro || !cidade) throw new RegraDeNegocioError('Informe o bairro e a cidade onde o item está.');
  return { ...d, titulo, descricao, bairro, cidade, caucao: d.caucao || null };
}

/** @param {DadosItem} d */
function textoBusca(d) {
  return normalizarTexto(`${d.titulo} ${d.descricao}`);
}

/**
 * Busca o item e confirma que pertence ao usuário e não foi excluído.
 * @param {import('../db/client').Banco} db
 * @param {number} itemId
 * @param {number} donoId
 */
async function itemDoDono(db, itemId, donoId) {
  const item = /** @type {import('../types').Item | null} */ (
    await db.getFirstAsync('SELECT * FROM items WHERE id = ?', [itemId])
  );
  if (!item || item.status === 'excluido') throw new RegraDeNegocioError('Item não encontrado.');
  if (item.dono_id !== donoId) throw new RegraDeNegocioError('Só o dono pode alterar este item.');
  return item;
}

/**
 * Cadastra um item com suas fotos (URIs já copiadas para a pasta do app).
 * @param {number} donoId
 * @param {DadosItem} dados
 * @param {string[]} fotos
 * @returns {Promise<number>} id do novo item
 */
export async function criarItem(donoId, dados, fotos) {
  const d = validarDados(dados);
  return transacao(async (db) => {
    const r = await db.runAsync(
      `INSERT INTO items (dono_id, titulo, descricao, categoria, valor_diaria, caucao, conservacao,
                          bairro, cidade, status, texto_busca, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponivel', ?, ?)`,
      [
        donoId,
        d.titulo,
        d.descricao,
        d.categoria,
        d.valor_diaria,
        d.caucao,
        d.conservacao,
        d.bairro,
        d.cidade,
        textoBusca(d),
        nowISO(),
      ],
    );
    await substituirFotosNaTransacao(db, r.lastInsertRowId, fotos);
    return r.lastInsertRowId;
  });
}

/**
 * Atualiza dados e fotos de um item. Fotos removidas são apagadas do aparelho.
 * @param {number} itemId
 * @param {number} donoId
 * @param {DadosItem} dados
 * @param {string[]} fotos
 */
export async function atualizarItem(itemId, donoId, dados, fotos) {
  const d = validarDados(dados);
  const removidas = await transacao(async (db) => {
    await itemDoDono(db, itemId, donoId);
    await db.runAsync(
      `UPDATE items
          SET titulo = ?, descricao = ?, categoria = ?, valor_diaria = ?, caucao = ?,
              conservacao = ?, bairro = ?, cidade = ?, texto_busca = ?
        WHERE id = ?`,
      [d.titulo, d.descricao, d.categoria, d.valor_diaria, d.caucao, d.conservacao, d.bairro, d.cidade, textoBusca(d), itemId],
    );
    return substituirFotosNaTransacao(db, itemId, fotos);
  });
  // Só depois do commit: se a transação falhar, as fotos antigas continuam valendo.
  removidas.forEach(apagarFoto);
}

/**
 * Pausa ou reativa um item. Item pausado não aparece na busca.
 * @param {number} itemId
 * @param {number} donoId
 * @param {'disponivel' | 'pausado'} status
 */
export function alterarStatusItem(itemId, donoId, status) {
  return comBanco(async (db) => {
    await itemDoDono(db, itemId, donoId);
    await db.runAsync('UPDATE items SET status = ? WHERE id = ?', [status, itemId]);
  });
}

/**
 * Exclui um item (exclusão lógica: o histórico de aluguéis continua
 * mostrando o item). Não é permitido com aluguel aprovado, em andamento ou
 * aguardando finalização. Solicitações pendentes são recusadas.
 * @param {number} itemId
 * @param {number} donoId
 */
export function excluirItem(itemId, donoId) {
  return transacao(async (db) => {
    await itemDoDono(db, itemId, donoId);
    const ativos = /** @type {{ total: number }} */ (
      await db.getFirstAsync(
        `SELECT COUNT(*) AS total FROM rentals
          WHERE item_id = ? AND status IN (${STATUS_ATIVOS.map(() => '?').join(', ')})`,
        [itemId, ...STATUS_ATIVOS],
      )
    );
    if (ativos.total > 0) {
      throw new RegraDeNegocioError(
        'Este item tem um aluguel aprovado ou em andamento. Ele só pode ser excluído depois que o aluguel for finalizado.',
      );
    }
    await db.runAsync(
      `UPDATE rentals SET status = 'recusado', respondido_em = ? WHERE item_id = ? AND status = 'solicitado'`,
      [nowISO(), itemId],
    );
    await db.runAsync(`UPDATE items SET status = 'excluido' WHERE id = ?`, [itemId]);
  });
}

/**
 * Item completo, com fotos e dados do dono. Retorna também itens
 * excluídos, para o histórico de aluguéis.
 * @param {number} itemId
 * @returns {Promise<ItemDetalhado | null>}
 */
export function buscarItem(itemId) {
  return comBanco(async (db) => {
    const item = /** @type {import('../types').Item | null} */ (
      await db.getFirstAsync('SELECT * FROM items WHERE id = ?', [itemId])
    );
    if (!item) return null;
    const dono = /** @type {ItemDetalhado['dono']} */ (
      await db.getFirstAsync(
        `SELECT u.id, u.nome, u.foto_uri, u.bairro, u.cidade,
                COALESCE((SELECT AVG(nota) FROM reviews r WHERE r.avaliado_id = u.id), 0) AS nota_media,
                (SELECT COUNT(*) FROM reviews r WHERE r.avaliado_id = u.id) AS total_avaliacoes
           FROM users u WHERE u.id = ?`,
        [item.dono_id],
      )
    );
    const fotos = await listarFotosNaTransacao(db, itemId);
    return { ...item, fotos, dono };
  });
}

/**
 * Itens do usuário (sem os excluídos), com o número de pedidos pendentes.
 * @param {number} donoId
 * @returns {Promise<(ItemResumo & { pedidos_pendentes: number })[]>}
 */
export function listarMeusItens(donoId) {
  return comBanco(async (db) => {
    const linhas = await db.getAllAsync(
      `SELECT * FROM (${SELECT_RESUMO}) x
         WHERE x.dono_id = ? AND x.status <> 'excluido'
       ORDER BY x.criado_em DESC, x.id DESC`,
      [donoId],
    );
    const pendentes = /** @type {{ item_id: number, total: number }[]} */ (
      await db.getAllAsync(
        `SELECT item_id, COUNT(*) AS total FROM rentals
          WHERE dono_id = ? AND status = 'solicitado' GROUP BY item_id`,
        [donoId],
      )
    );
    const porItem = new Map(pendentes.map((p) => [p.item_id, p.total]));
    return /** @type {ItemResumo[]} */ (linhas).map((i) => ({ ...i, pedidos_pendentes: porItem.get(i.id) ?? 0 }));
  });
}

/**
 * @typedef {Object} FiltrosBusca
 * @property {string} [texto]
 * @property {import('../types').Categoria} [categoria]
 * @property {number} [precoMin]  centavos
 * @property {number} [precoMax]  centavos
 * @property {string} [bairro]
 * @property {string} [cidade]
 * @property {number} [excluirDonoId]  esconde os itens do próprio usuário
 * @property {number} [donoId]         só itens deste dono (perfil público)
 * @property {number} [limite]
 */

/**
 * Busca itens disponíveis. O texto ignora acentos e maiúsculas.
 * @param {FiltrosBusca} filtros
 * @returns {Promise<ItemResumo[]>}
 */
export function buscarItens(filtros) {
  /** @type {string[]} */
  const condicoes = [`x.status = 'disponivel'`];
  /** @type {(string | number)[]} */
  const params = [];

  const termos = normalizarTexto(filtros.texto ?? '')
    .split(/\s+/)
    .filter(Boolean);
  for (const termo of termos) {
    condicoes.push(`x.texto_busca LIKE ? ESCAPE '\\'`);
    params.push(`%${termo.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  }
  if (filtros.categoria) {
    condicoes.push('x.categoria = ?');
    params.push(filtros.categoria);
  }
  if (filtros.precoMin != null) {
    condicoes.push('x.valor_diaria >= ?');
    params.push(filtros.precoMin);
  }
  if (filtros.precoMax != null) {
    condicoes.push('x.valor_diaria <= ?');
    params.push(filtros.precoMax);
  }
  if (filtros.bairro) {
    condicoes.push('x.bairro = ? COLLATE NOCASE');
    params.push(filtros.bairro.trim());
  }
  if (filtros.cidade) {
    condicoes.push('x.cidade = ? COLLATE NOCASE');
    params.push(filtros.cidade.trim());
  }
  if (filtros.donoId != null) {
    condicoes.push('x.dono_id = ?');
    params.push(filtros.donoId);
  }
  if (filtros.excluirDonoId != null) {
    condicoes.push('x.dono_id <> ?');
    params.push(filtros.excluirDonoId);
  }
  params.push(filtros.limite ?? 100);

  return comBanco(async (db) => {
    const linhas = await db.getAllAsync(
      `SELECT * FROM (${SELECT_RESUMO}) x
        WHERE ${condicoes.join(' AND ')}
        ORDER BY x.criado_em DESC, x.id DESC
        LIMIT ?`,
      params,
    );
    return /** @type {ItemResumo[]} */ (linhas);
  });
}

/**
 * Cidades e bairros que têm itens disponíveis (para os filtros).
 * @returns {Promise<{ cidade: string, bairro: string }[]>}
 */
export function listarLocalidades() {
  return comBanco(async (db) => {
    const linhas = await db.getAllAsync(
      `SELECT DISTINCT cidade, bairro FROM items WHERE status = 'disponivel' ORDER BY cidade, bairro`,
      [],
    );
    return /** @type {{ cidade: string, bairro: string }[]} */ (linhas);
  });
}

/**
 * Copia as fotos escolhidas para a pasta do app e cria o item. Se a
 * gravação falhar, as cópias feitas são apagadas.
 * @param {number} donoId
 * @param {DadosItem} dados
 * @param {string[]} fotosEscolhidas URIs da galeria (ou já salvas)
 * @returns {Promise<number>}
 */
export async function criarItemComFotos(donoId, dados, fotosEscolhidas) {
  const { uris, novas } = await salvarFotos(fotosEscolhidas);
  try {
    return await criarItem(donoId, dados, uris);
  } catch (e) {
    novas.forEach(apagarFoto);
    throw e;
  }
}

/**
 * Copia fotos novas e atualiza o item; as fotos removidas são apagadas.
 * @param {number} itemId
 * @param {number} donoId
 * @param {DadosItem} dados
 * @param {string[]} fotosEscolhidas
 */
export async function atualizarItemComFotos(itemId, donoId, dados, fotosEscolhidas) {
  const { uris, novas } = await salvarFotos(fotosEscolhidas);
  try {
    await atualizarItem(itemId, donoId, dados, uris);
  } catch (e) {
    novas.forEach(apagarFoto);
    throw e;
  }
}
