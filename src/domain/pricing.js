// Cálculo do valor do aluguel.
//
// Regra das diárias: conta-se cada dia do calendário entre a retirada e a
// devolução, incluindo os dois. Se a retirada for a partir das 18h, o dia da
// retirada não é cobrado. O mínimo é sempre uma diária.
//   Retirada dia 10 antes das 18h, devolução dia 12 -> 3 diárias
//   Retirada dia 10 a partir das 18h, devolução dia 12 -> 2 diárias

import { parseISODate } from '../utils/format';
import { RegraDeNegocioError } from './errors';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Quantidade de dias do calendário entre duas datas, contando as duas.
 * @param {string} inicio AAAA-MM-DD
 * @param {string} fim    AAAA-MM-DD
 */
export function diasCorridos(inicio, fim) {
  // Math.round neutraliza a hora a mais/a menos de horário de verão.
  return Math.round((parseISODate(fim).getTime() - parseISODate(inicio).getTime()) / MS_POR_DIA) + 1;
}

/**
 * Número de diárias cobradas.
 * @param {string} inicio AAAA-MM-DD
 * @param {string} fim    AAAA-MM-DD
 * @param {boolean} retiradaAposCorte retirada a partir das 18h
 */
export function contarDiarias(inicio, fim, retiradaAposCorte) {
  if (fim < inicio) {
    throw new RegraDeNegocioError('A data de devolução deve ser igual ou posterior à data de retirada.');
  }
  const dias = diasCorridos(inicio, fim) - (retiradaAposCorte ? 1 : 0);
  return Math.max(1, dias);
}

/**
 * valor_total = número de diárias × valor da diária (tudo em centavos).
 * @param {number} valorDiaria centavos
 * @param {string} inicio AAAA-MM-DD
 * @param {string} fim    AAAA-MM-DD
 * @param {boolean} retiradaAposCorte
 */
export function calcularValorTotal(valorDiaria, inicio, fim, retiradaAposCorte) {
  if (!Number.isInteger(valorDiaria) || valorDiaria <= 0) {
    throw new RegraDeNegocioError('O valor da diária é inválido.');
  }
  return contarDiarias(inicio, fim, retiradaAposCorte) * valorDiaria;
}
