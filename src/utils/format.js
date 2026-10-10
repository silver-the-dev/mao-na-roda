// Formatação para exibição: moeda em BRL e datas em dd/MM/aaaa.
// Feita à mão para não depender dos dados de localidade do Intl no aparelho.

/**
 * Formata centavos como moeda brasileira. Ex.: 123456 -> "R$ 1.234,56".
 * @param {number} centavos
 */
export function formatBRL(centavos) {
  const negativo = centavos < 0;
  const abs = Math.abs(Math.round(centavos));
  const reais = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, '0');
  const milhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}R$ ${milhar},${cents}`;
}

/**
 * Converte texto digitado ("12,50", "R$ 1.200", "8") em centavos.
 * Retorna null quando o texto não é um valor válido.
 * @param {string} texto
 * @returns {number | null}
 */
export function parseBRL(texto) {
  const limpo = texto.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  if (limpo === '' || !/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  return Math.round(Number(limpo) * 100);
}

/**
 * Centavos para o texto de um campo editável. Ex.: 1250 -> "12,50".
 * @param {number | null | undefined} centavos
 */
export function centavosParaCampo(centavos) {
  if (centavos == null) return '';
  return (centavos / 100).toFixed(2).replace('.', ',');
}

const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');

/**
 * Data local no formato AAAA-MM-DD (usado para datas de aluguel).
 * @param {Date} data
 */
export function toISODate(data) {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

/**
 * Interpreta AAAA-MM-DD como data local (meia-noite), sem fuso UTC.
 * @param {string} iso
 */
export function parseISODate(iso) {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * Formata data ISO (AAAA-MM-DD ou data/hora completa) como dd/MM/aaaa.
 * @param {string} iso
 */
export function formatDate(iso) {
  const d = iso.length > 10 ? new Date(iso) : parseISODate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Formata data/hora ISO como "dd/MM/aaaa às HH:mm".
 * @param {string} iso
 */
export function formatDateTime(iso) {
  const d = new Date(iso);
  return `${formatDate(iso)} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Data/hora atual em ISO 8601 (UTC), para colunas criado_em. */
export function nowISO() {
  return new Date().toISOString();
}

/** Data local de hoje no formato AAAA-MM-DD. */
export function hojeISO() {
  return toISODate(new Date());
}

/**
 * Texto sem acentos e em minúsculas, para buscas ("Câmera" -> "camera").
 * @param {string} texto
 */
export function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
