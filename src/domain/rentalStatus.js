// Ciclo de vida do aluguel e quem pode fazer o quê.
//
//   solicitado → aprovado → em_andamento → devolvido → concluido
//        ↘ recusado (dono)
//        ↘ cancelado (locatário: pendente, ou aprovado até 24h antes da retirada)

import { HORA_CORTE_RETIRADA } from '../constants';
import { parseISODate } from '../utils/format';
import { RegraDeNegocioError } from './errors';

/** Status que ocupam as datas do item (bloqueiam outro aluguel). */
export const STATUS_QUE_BLOQUEIAM = /** @type {const} */ (['aprovado', 'em_andamento']);

/** Status de aluguel ainda não encerrado com o item comprometido. */
export const STATUS_ATIVOS = /** @type {const} */ (['aprovado', 'em_andamento', 'devolvido']);

/** Status finais: nada mais acontece no aluguel. */
export const STATUS_FINAIS = /** @type {const} */ (['concluido', 'recusado', 'cancelado']);

/**
 * @typedef {'aprovar' | 'recusar' | 'confirmarRetirada' | 'confirmarDevolucao' | 'finalizar' | 'cancelar'} AcaoAluguel
 */

/**
 * @type {Record<AcaoAluguel, {
 *   de: import('../types').RentalStatus[],
 *   para: import('../types').RentalStatus,
 *   papel: 'dono' | 'locatario',
 *   coluna: string,
 *   rotulo: string,
 * }>}
 */
export const TRANSICOES = {
  aprovar: { de: ['solicitado'], para: 'aprovado', papel: 'dono', coluna: 'respondido_em', rotulo: 'Aprovar' },
  recusar: { de: ['solicitado'], para: 'recusado', papel: 'dono', coluna: 'respondido_em', rotulo: 'Recusar' },
  confirmarRetirada: {
    de: ['aprovado'],
    para: 'em_andamento',
    papel: 'dono',
    coluna: 'retirado_em',
    rotulo: 'Confirmar retirada',
  },
  confirmarDevolucao: {
    de: ['em_andamento'],
    para: 'devolvido',
    papel: 'dono',
    coluna: 'devolvido_em',
    rotulo: 'Confirmar devolução',
  },
  finalizar: { de: ['devolvido'], para: 'concluido', papel: 'dono', coluna: 'concluido_em', rotulo: 'Finalizar aluguel' },
  cancelar: {
    de: ['solicitado', 'aprovado'],
    para: 'cancelado',
    papel: 'locatario',
    coluna: 'cancelado_em',
    rotulo: 'Cancelar solicitação',
  },
};

/**
 * @typedef {Object} AluguelParaRegras
 * @property {number} dono_id
 * @property {number} locatario_id
 * @property {import('../types').RentalStatus} status
 * @property {string} data_inicio
 * @property {boolean | number} retirada_apos_corte
 */

/**
 * Momento previsto da retirada: 0h do dia de início, ou 18h se a retirada
 * for a partir do horário de corte.
 * @param {string} dataInicio AAAA-MM-DD
 * @param {boolean | number} retiradaAposCorte
 */
export function momentoRetirada(dataInicio, retiradaAposCorte) {
  const d = parseISODate(dataInicio);
  if (retiradaAposCorte) d.setHours(HORA_CORTE_RETIRADA);
  return d;
}

/**
 * Último instante em que o locatário pode cancelar um aluguel aprovado
 * (24 horas antes da retirada prevista).
 * @param {AluguelParaRegras} aluguel
 */
export function prazoCancelamento(aluguel) {
  const d = momentoRetirada(aluguel.data_inicio, aluguel.retirada_apos_corte);
  d.setHours(d.getHours() - 24);
  return d;
}

/**
 * Motivo pelo qual a ação não é permitida, ou null se for permitida.
 * @param {AluguelParaRegras} aluguel
 * @param {number} usuarioId
 * @param {AcaoAluguel} acao
 * @param {Date} agora
 * @returns {string | null}
 */
export function motivoBloqueio(aluguel, usuarioId, acao, agora) {
  const t = TRANSICOES[acao];
  const idDoPapel = t.papel === 'dono' ? aluguel.dono_id : aluguel.locatario_id;

  if (usuarioId !== idDoPapel) {
    return t.papel === 'dono'
      ? 'Só o dono do item pode fazer isso.'
      : 'Só quem pediu o aluguel pode cancelar a solicitação.';
  }
  if (!t.de.includes(aluguel.status)) {
    return 'Esta ação não está disponível no status atual do aluguel.';
  }
  if (acao === 'cancelar' && aluguel.status === 'aprovado' && agora > prazoCancelamento(aluguel)) {
    return 'O prazo para cancelar terminou: o cancelamento de um aluguel aprovado precisa ser feito até 24 horas antes da retirada.';
  }
  return null;
}

/**
 * Lança erro se a ação não for permitida.
 * @param {AluguelParaRegras} aluguel
 * @param {number} usuarioId
 * @param {AcaoAluguel} acao
 * @param {Date} agora
 */
export function garantirAcao(aluguel, usuarioId, acao, agora) {
  const motivo = motivoBloqueio(aluguel, usuarioId, acao, agora);
  if (motivo) throw new RegraDeNegocioError(motivo);
}

/**
 * Ações que o usuário pode fazer agora neste aluguel.
 * @param {AluguelParaRegras} aluguel
 * @param {number} usuarioId
 * @param {Date} agora
 * @returns {AcaoAluguel[]}
 */
export function acoesDisponiveis(aluguel, usuarioId, agora) {
  return /** @type {AcaoAluguel[]} */ (Object.keys(TRANSICOES)).filter(
    (acao) => motivoBloqueio(aluguel, usuarioId, acao, agora) === null,
  );
}

/**
 * @typedef {Object} EtapaLinhaDoTempo
 * @property {string} rotulo
 * @property {string | null} quando  data/hora ISO em que aconteceu
 * @property {'feito' | 'pendente' | 'negativo'} estado
 */

/**
 * Etapas para a linha do tempo do aluguel, na ordem em que acontecem.
 * @param {{ status: import('../types').RentalStatus, criado_em: string, respondido_em: string | null,
 *           retirado_em: string | null, devolvido_em: string | null, concluido_em: string | null,
 *           cancelado_em: string | null }} a
 * @returns {EtapaLinhaDoTempo[]}
 */
export function etapasLinhaDoTempo(a) {
  /** @type {EtapaLinhaDoTempo[]} */
  const etapas = [{ rotulo: 'Pedido enviado', quando: a.criado_em, estado: 'feito' }];

  if (a.status === 'recusado') {
    etapas.push({ rotulo: 'Pedido recusado', quando: a.respondido_em, estado: 'negativo' });
    return etapas;
  }
  if (a.status === 'cancelado') {
    if (a.respondido_em) etapas.push({ rotulo: 'Pedido aprovado', quando: a.respondido_em, estado: 'feito' });
    etapas.push({ rotulo: 'Aluguel cancelado', quando: a.cancelado_em, estado: 'negativo' });
    return etapas;
  }

  /** @type {[string, string | null][]} */
  const fluxo = [
    ['Pedido aprovado', a.respondido_em],
    ['Item retirado', a.retirado_em],
    ['Item devolvido', a.devolvido_em],
    ['Aluguel concluído', a.concluido_em],
  ];
  for (const [rotulo, quando] of fluxo) {
    etapas.push({ rotulo, quando, estado: quando ? 'feito' : 'pendente' });
  }
  return etapas;
}
