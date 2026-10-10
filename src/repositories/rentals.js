import { comBanco, transacao } from '../db/client';
import { encontrarConflito, intervalosSobrepoem, validarIntervalo } from '../domain/dateRanges';
import { RegraDeNegocioError } from '../domain/errors';
import { calcularValorTotal } from '../domain/pricing';
import { STATUS_QUE_BLOQUEIAM, TRANSICOES, garantirAcao } from '../domain/rentalStatus';
import { hojeISO, nowISO } from '../utils/format';

/**
 * Linha de aluguel como sai do banco (booleano ainda como 0/1).
 * @typedef {Omit<import('../types').Rental, 'retirada_apos_corte'> & {
 *   retirada_apos_corte: number,
 *   respondido_em: string | null,
 *   retirado_em: string | null,
 *   devolvido_em: string | null,
 *   concluido_em: string | null,
 *   cancelado_em: string | null,
 * }} LinhaAluguel
 */

/**
 * @typedef {Omit<LinhaAluguel, 'retirada_apos_corte'> & { retirada_apos_corte: boolean }} Aluguel
 */

/**
 * Aluguel para listas: com título e foto do item e nome da outra pessoa.
 * @typedef {Aluguel & {
 *   item_titulo: string,
 *   item_foto_uri: string | null,
 *   outra_parte_id: number,
 *   outra_parte_nome: string,
 * }} AluguelResumo
 */

/**
 * @typedef {{ id: number, nome: string, foto_uri: string | null, telefone: string | null }} Pessoa
 */

/**
 * Aluguel completo para a tela de detalhe.
 * @typedef {Aluguel & {
 *   item: { id: number, titulo: string, categoria: string, valor_diaria: number, caucao: number | null, status: string, foto_uri: string | null },
 *   dono: Pessoa,
 *   locatario: Pessoa,
 * }} AluguelDetalhado
 */

/**
 * @param {LinhaAluguel} linha
 * @returns {Aluguel}
 */
function converter(linha) {
  return { ...linha, retirada_apos_corte: linha.retirada_apos_corte === 1 };
}

const PLACEHOLDERS_BLOQUEIO = STATUS_QUE_BLOQUEIAM.map(() => '?').join(', ');

/**
 * Aluguéis que ocupam datas do item (aprovados ou em andamento).
 * @param {import('../db/client').Banco} db
 * @param {number} itemId
 * @param {number} [ignorarId]
 * @returns {Promise<{ id: number, inicio: string, fim: string }[]>}
 */
async function reservasDoItem(db, itemId, ignorarId = 0) {
  const linhas = await db.getAllAsync(
    `SELECT id, data_inicio AS inicio, data_fim AS fim FROM rentals
      WHERE item_id = ? AND id <> ? AND status IN (${PLACEHOLDERS_BLOQUEIO})`,
    [itemId, ignorarId, ...STATUS_QUE_BLOQUEIAM],
  );
  return /** @type {{ id: number, inicio: string, fim: string }[]} */ (linhas);
}

/**
 * @param {import('../db/client').Banco} db
 * @param {number} id
 */
async function buscarLinha(db, id) {
  const linha = /** @type {LinhaAluguel | null} */ (await db.getFirstAsync('SELECT * FROM rentals WHERE id = ?', [id]));
  if (!linha) throw new RegraDeNegocioError('Aluguel não encontrado.');
  return linha;
}

/**
 * Cria uma solicitação de aluguel. O valor total é calculado aqui, a partir
 * da diária gravada no banco, e fica registrado como valor combinado.
 * @param {{ itemId: number, locatarioId: number, dataInicio: string, dataFim: string, retiradaAposCorte: boolean }} dados
 * @returns {Promise<number>} id do aluguel
 */
export async function solicitarAluguel({ itemId, locatarioId, dataInicio, dataFim, retiradaAposCorte }) {
  const intervalo = { inicio: dataInicio, fim: dataFim };
  validarIntervalo(intervalo, hojeISO());

  return transacao(async (db) => {
    const item = /** @type {import('../types').Item | null} */ (
      await db.getFirstAsync('SELECT * FROM items WHERE id = ?', [itemId])
    );
    if (!item || item.status === 'excluido') throw new RegraDeNegocioError('Este item não está mais disponível.');
    if (item.dono_id === locatarioId) throw new RegraDeNegocioError('Você não pode alugar o seu próprio item.');
    if (item.status !== 'disponivel') {
      throw new RegraDeNegocioError('Este item está pausado pelo dono e não aceita pedidos no momento.');
    }

    if (encontrarConflito(intervalo, await reservasDoItem(db, itemId))) {
      throw new RegraDeNegocioError('Essas datas já estão reservadas para este item. Escolha outro período.');
    }

    const meusPendentes = /** @type {{ inicio: string, fim: string }[]} */ (
      await db.getAllAsync(
        `SELECT data_inicio AS inicio, data_fim AS fim FROM rentals
          WHERE item_id = ? AND locatario_id = ? AND status = 'solicitado'`,
        [itemId, locatarioId],
      )
    );
    if (encontrarConflito(intervalo, meusPendentes)) {
      throw new RegraDeNegocioError('Você já tem um pedido pendente para este item nessas datas.');
    }

    const valorTotal = calcularValorTotal(item.valor_diaria, dataInicio, dataFim, retiradaAposCorte);
    const r = await db.runAsync(
      `INSERT INTO rentals (item_id, dono_id, locatario_id, data_inicio, data_fim, retirada_apos_corte,
                            valor_total, status, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'solicitado', ?)`,
      [itemId, item.dono_id, locatarioId, dataInicio, dataFim, retiradaAposCorte ? 1 : 0, valorTotal, nowISO()],
    );
    return r.lastInsertRowId;
  });
}

/**
 * Aplica uma transição de status depois de checar papel, status e prazos.
 * @param {import('../db/client').Banco} db
 * @param {number} aluguelId
 * @param {number} usuarioId
 * @param {import('../domain/rentalStatus').AcaoAluguel} acao
 */
async function transicionar(db, aluguelId, usuarioId, acao) {
  const linha = await buscarLinha(db, aluguelId);
  garantirAcao(converter(linha), usuarioId, acao, new Date());
  const t = TRANSICOES[acao];
  // A condição no status evita aplicar a mesma transição duas vezes.
  const r = await db.runAsync(`UPDATE rentals SET status = ?, ${t.coluna} = ? WHERE id = ? AND status = ?`, [
    t.para,
    nowISO(),
    aluguelId,
    linha.status,
  ]);
  if (r.changes !== 1) throw new RegraDeNegocioError('O aluguel foi alterado por outra ação. Atualize a tela.');
  return linha;
}

/**
 * Dono aprova o pedido. Verifica de novo se as datas estão livres e recusa
 * automaticamente os outros pedidos pendentes que se sobrepõem.
 * @param {number} aluguelId
 * @param {number} donoId
 * @returns {Promise<{ recusadosAutomaticamente: number }>}
 */
export function aprovarAluguel(aluguelId, donoId) {
  return transacao(async (db) => {
    const linha = await buscarLinha(db, aluguelId);
    garantirAcao(converter(linha), donoId, 'aprovar', new Date());

    const item = /** @type {{ status: string }} */ (
      await db.getFirstAsync('SELECT status FROM items WHERE id = ?', [linha.item_id])
    );
    if (item.status === 'excluido') throw new RegraDeNegocioError('Este item foi excluído.');

    const intervalo = { inicio: linha.data_inicio, fim: linha.data_fim };
    if (encontrarConflito(intervalo, await reservasDoItem(db, linha.item_id, aluguelId))) {
      throw new RegraDeNegocioError('Já existe um aluguel aprovado para este item nessas datas.');
    }

    await transicionar(db, aluguelId, donoId, 'aprovar');

    const pendentes = /** @type {{ id: number, inicio: string, fim: string }[]} */ (
      await db.getAllAsync(
        `SELECT id, data_inicio AS inicio, data_fim AS fim FROM rentals
          WHERE item_id = ? AND id <> ? AND status = 'solicitado'`,
        [linha.item_id, aluguelId],
      )
    );
    const conflitantes = pendentes.filter((p) => intervalosSobrepoem(intervalo, p));
    for (const p of conflitantes) {
      await db.runAsync(`UPDATE rentals SET status = 'recusado', respondido_em = ? WHERE id = ?`, [nowISO(), p.id]);
    }
    return { recusadosAutomaticamente: conflitantes.length };
  });
}

/**
 * @param {number} aluguelId
 * @param {number} donoId
 */
export function recusarAluguel(aluguelId, donoId) {
  return comBanco((db) => transicionar(db, aluguelId, donoId, 'recusar'));
}

/**
 * Dono confirma que o locatário retirou o item.
 * @param {number} aluguelId
 * @param {number} donoId
 */
export function confirmarRetirada(aluguelId, donoId) {
  return comBanco((db) => transicionar(db, aluguelId, donoId, 'confirmarRetirada'));
}

/**
 * Dono confirma que recebeu o item de volta.
 * @param {number} aluguelId
 * @param {number} donoId
 */
export function confirmarDevolucao(aluguelId, donoId) {
  return comBanco((db) => transicionar(db, aluguelId, donoId, 'confirmarDevolucao'));
}

/**
 * Dono conferiu o item e encerra o aluguel. Libera as avaliações.
 * @param {number} aluguelId
 * @param {number} donoId
 */
export function finalizarAluguel(aluguelId, donoId) {
  return comBanco((db) => transicionar(db, aluguelId, donoId, 'finalizar'));
}

/**
 * Locatário cancela: pedido pendente a qualquer momento; aprovado até 24h
 * antes da retirada.
 * @param {number} aluguelId
 * @param {number} locatarioId
 */
export function cancelarAluguel(aluguelId, locatarioId) {
  return comBanco((db) => transicionar(db, aluguelId, locatarioId, 'cancelar'));
}

/**
 * Períodos ocupados do item a partir de hoje (para bloquear no calendário).
 * @param {number} itemId
 * @returns {Promise<{ id: number, inicio: string, fim: string }[]>}
 */
export function listarDatasOcupadas(itemId) {
  return comBanco(async (db) => {
    const hoje = hojeISO();
    return (await reservasDoItem(db, itemId)).filter((r) => r.fim >= hoje);
  });
}

/**
 * Detalhe do aluguel. Só os dois participantes podem ver.
 * @param {number} aluguelId
 * @param {number} usuarioId
 * @returns {Promise<AluguelDetalhado | null>}
 */
export function buscarAluguel(aluguelId, usuarioId) {
  return comBanco(async (db) => {
    const linha = /** @type {LinhaAluguel | null} */ (
      await db.getFirstAsync('SELECT * FROM rentals WHERE id = ? AND (dono_id = ? OR locatario_id = ?)', [
        aluguelId,
        usuarioId,
        usuarioId,
      ])
    );
    if (!linha) return null;

    const item = /** @type {AluguelDetalhado['item']} */ (
      await db.getFirstAsync(
        `SELECT i.id, i.titulo, i.categoria, i.valor_diaria, i.caucao, i.status,
                (SELECT uri FROM item_photos f WHERE f.item_id = i.id ORDER BY f.ordem, f.id LIMIT 1) AS foto_uri
           FROM items i WHERE i.id = ?`,
        [linha.item_id],
      )
    );
    const pessoa = async (/** @type {number} */ id) =>
      /** @type {Pessoa} */ (await db.getFirstAsync('SELECT id, nome, foto_uri, telefone FROM users WHERE id = ?', [id]));

    return {
      ...converter(linha),
      item,
      dono: await pessoa(linha.dono_id),
      locatario: await pessoa(linha.locatario_id),
    };
  });
}

/**
 * Aluguéis do usuário em um dos papéis: "aluguei" (locatário) ou
 * "emprestei" (dono). Em andamento primeiro, depois os mais recentes.
 * @param {number} usuarioId
 * @param {'locatario' | 'dono'} papel
 * @param {import('../types').RentalStatus[]} [status] filtra pelos status informados
 * @returns {Promise<AluguelResumo[]>}
 */
export function listarAlugueis(usuarioId, papel, status) {
  const colunaPapel = papel === 'dono' ? 'r.dono_id' : 'r.locatario_id';
  const colunaOutro = papel === 'dono' ? 'r.locatario_id' : 'r.dono_id';
  const filtroStatus = status?.length ? `AND r.status IN (${status.map(() => '?').join(', ')})` : '';

  return comBanco(async (db) => {
    const linhas = await db.getAllAsync(
      `SELECT r.*, i.titulo AS item_titulo,
              (SELECT uri FROM item_photos f WHERE f.item_id = i.id ORDER BY f.ordem, f.id LIMIT 1) AS item_foto_uri,
              u.id AS outra_parte_id, u.nome AS outra_parte_nome
         FROM rentals r
         JOIN items i ON i.id = r.item_id
         JOIN users u ON u.id = ${colunaOutro}
        WHERE ${colunaPapel} = ? ${filtroStatus}
        ORDER BY CASE r.status
                   WHEN 'em_andamento' THEN 0 WHEN 'solicitado' THEN 1 WHEN 'aprovado' THEN 2
                   WHEN 'devolvido' THEN 3 ELSE 4 END,
                 r.data_inicio DESC, r.id DESC`,
      [usuarioId, ...(status ?? [])],
    );
    return /** @type {(LinhaAluguel & AluguelResumo)[]} */ (linhas).map((l) => ({
      ...l,
      retirada_apos_corte: Number(l.retirada_apos_corte) === 1,
    }));
  });
}
