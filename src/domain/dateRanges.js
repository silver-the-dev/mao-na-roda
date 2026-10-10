// Intervalos de datas de aluguel (AAAA-MM-DD, inclusivos nas duas pontas).
// Datas ISO podem ser comparadas como texto, o que deixa as regras simples.

import { parseISODate, toISODate } from '../utils/format';
import { RegraDeNegocioError } from './errors';

/**
 * @typedef {{ inicio: string, fim: string }} Intervalo
 */

/**
 * Dois intervalos se sobrepõem quando compartilham pelo menos um dia.
 * O dia da devolução conta como ocupado.
 * @param {Intervalo} a
 * @param {Intervalo} b
 */
export function intervalosSobrepoem(a, b) {
  return a.inicio <= b.fim && b.inicio <= a.fim;
}

/**
 * Primeiro intervalo existente que conflita com o novo, ou null.
 * @template {Intervalo} T
 * @param {Intervalo} novo
 * @param {T[]} existentes
 * @returns {T | null}
 */
export function encontrarConflito(novo, existentes) {
  return existentes.find((e) => intervalosSobrepoem(novo, e)) ?? null;
}

/**
 * Todos os dias de um intervalo, em ordem.
 * @param {string} inicio
 * @param {string} fim
 * @returns {string[]}
 */
export function listarDias(inicio, fim) {
  const dias = [];
  const d = parseISODate(inicio);
  const ultimo = parseISODate(fim);
  while (d <= ultimo) {
    dias.push(toISODate(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

/**
 * Conjunto de dias ocupados por uma lista de intervalos (para o calendário).
 * @param {Intervalo[]} intervalos
 * @returns {Set<string>}
 */
export function diasBloqueados(intervalos) {
  const dias = new Set();
  for (const i of intervalos) {
    for (const d of listarDias(i.inicio, i.fim)) dias.add(d);
  }
  return dias;
}

/**
 * Valida um intervalo escolhido para uma nova solicitação.
 * @param {Intervalo} intervalo
 * @param {string} hoje AAAA-MM-DD
 */
export function validarIntervalo(intervalo, hoje) {
  const formato = /^\d{4}-\d{2}-\d{2}$/;
  if (!formato.test(intervalo.inicio) || !formato.test(intervalo.fim)) {
    throw new RegraDeNegocioError('Escolha as datas de retirada e devolução.');
  }
  if (intervalo.inicio < hoje) {
    throw new RegraDeNegocioError('A data de retirada não pode estar no passado.');
  }
  if (intervalo.fim < intervalo.inicio) {
    throw new RegraDeNegocioError('A data de devolução deve ser igual ou posterior à data de retirada.');
  }
}
