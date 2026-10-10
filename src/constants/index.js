// Listas fixas usadas em formulários, filtros e etiquetas.

/** @type {{ value: import('../types').Categoria, label: string, icon: string }[]} */
export const CATEGORIAS = [
  { value: 'ferramentas', label: 'Ferramentas', icon: 'construct' },
  { value: 'eletronicos', label: 'Eletrônicos', icon: 'laptop' },
  { value: 'instrumentos', label: 'Instrumentos musicais', icon: 'musical-notes' },
  { value: 'cameras', label: 'Câmeras', icon: 'camera' },
  { value: 'utensilios', label: 'Utensílios', icon: 'restaurant' },
  { value: 'outros', label: 'Outros', icon: 'cube' },
];

/** @type {{ value: import('../types').Conservacao, label: string }[]} */
export const CONSERVACOES = [
  { value: 'novo', label: 'Novo' },
  { value: 'otimo', label: 'Ótimo' },
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
];

/** Rótulos dos status de aluguel, na ordem do fluxo. */
export const RENTAL_STATUS_LABELS = {
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  em_andamento: 'Em andamento',
  devolvido: 'Devolvido',
  concluido: 'Concluído',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
};

export const ITEM_STATUS_LABELS = {
  disponivel: 'Disponível',
  pausado: 'Pausado',
  excluido: 'Excluído',
};

export const MAX_FOTOS_ITEM = 5;

// Hora de corte da retirada: retirar a partir deste horário não cobra o primeiro dia.
export const HORA_CORTE_RETIRADA = 18;

/** @param {string} value */
export function categoriaLabel(value) {
  return CATEGORIAS.find((c) => c.value === value)?.label ?? value;
}

/** @param {string} value */
export function conservacaoLabel(value) {
  return CONSERVACOES.find((c) => c.value === value)?.label ?? value;
}
