import { z } from 'zod';
import { CATEGORIAS, CONSERVACOES } from '../constants';
import { centavosParaCampo, parseBRL } from '../utils/format';

// No formulário os valores em dinheiro são texto ("15,00"); a conversão
// para centavos acontece em paraDadosItem.
export const itemSchema = z.object({
  titulo: z.string().trim().min(3, 'O título precisa ter pelo menos 3 letras.').max(80, 'Use no máximo 80 letras.'),
  descricao: z
    .string()
    .trim()
    .min(10, 'Descreva o item com pelo menos 10 letras.')
    .max(500, 'Use no máximo 500 letras.'),
  categoria: z.string().refine((v) => CATEGORIAS.some((c) => c.value === v), 'Escolha uma categoria.'),
  conservacao: z.string().refine((v) => CONSERVACOES.some((c) => c.value === v), 'Escolha o estado de conservação.'),
  valorDiaria: z
    .string()
    .refine((v) => (parseBRL(v) ?? 0) > 0, 'Informe o valor da diária. Exemplo: 15,00')
    .refine((v) => (parseBRL(v) ?? 0) <= 1000000, 'Valor muito alto.'),
  caucao: z.string().refine((v) => v.trim() === '' || parseBRL(v) !== null, 'Valor inválido. Exemplo: 100,00'),
  bairro: z.string().trim().min(2, 'Informe o bairro.'),
  cidade: z.string().trim().min(2, 'Informe a cidade.'),
});

/** @typedef {z.infer<typeof itemSchema>} ItemForm */

/**
 * Converte os valores do formulário para o formato do repositório.
 * @param {ItemForm} f
 * @returns {import('../repositories/items').DadosItem}
 */
export function paraDadosItem(f) {
  return {
    titulo: f.titulo,
    descricao: f.descricao,
    categoria: /** @type {import('../types').Categoria} */ (f.categoria),
    conservacao: /** @type {import('../types').Conservacao} */ (f.conservacao),
    valor_diaria: parseBRL(f.valorDiaria) ?? 0,
    caucao: f.caucao.trim() ? parseBRL(f.caucao) : null,
    bairro: f.bairro,
    cidade: f.cidade,
  };
}

/**
 * Valores iniciais do formulário a partir de um item existente.
 * @param {import('../types').Item} item
 * @returns {ItemForm}
 */
export function paraFormularioItem(item) {
  return {
    titulo: item.titulo,
    descricao: item.descricao,
    categoria: item.categoria,
    conservacao: item.conservacao,
    valorDiaria: centavosParaCampo(item.valor_diaria),
    caucao: centavosParaCampo(item.caucao),
    bairro: item.bairro,
    cidade: item.cidade,
  };
}
