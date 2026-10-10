// Definições de tipos em JSDoc. O projeto é JavaScript puro; estes
// comentários documentam o formato dos dados e dão autocompletar no editor.

/**
 * @typedef {'ferramentas' | 'eletronicos' | 'instrumentos' | 'cameras' | 'utensilios' | 'outros'} Categoria
 * @typedef {'novo' | 'otimo' | 'bom' | 'regular'} Conservacao
 * @typedef {'disponivel' | 'pausado' | 'excluido'} ItemStatus
 * @typedef {'solicitado' | 'aprovado' | 'em_andamento' | 'devolvido' | 'concluido' | 'recusado' | 'cancelado'} RentalStatus
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} nome
 * @property {string} email
 * @property {string | null} foto_uri
 * @property {string | null} telefone
 * @property {string} bairro
 * @property {string} cidade
 * @property {string} criado_em   ISO 8601
 */

/**
 * @typedef {Object} Item
 * @property {number} id
 * @property {number} dono_id
 * @property {string} titulo
 * @property {string} descricao
 * @property {Categoria} categoria
 * @property {number} valor_diaria   em centavos
 * @property {number | null} caucao  em centavos
 * @property {Conservacao} conservacao
 * @property {string} bairro
 * @property {string} cidade
 * @property {ItemStatus} status
 * @property {string} criado_em
 */

/**
 * @typedef {Object} ItemPhoto
 * @property {number} id
 * @property {number} item_id
 * @property {string} uri
 * @property {number} ordem
 */

/**
 * @typedef {Object} Rental
 * @property {number} id
 * @property {number} item_id
 * @property {number} dono_id
 * @property {number} locatario_id
 * @property {string} data_inicio    AAAA-MM-DD
 * @property {string} data_fim       AAAA-MM-DD
 * @property {boolean} retirada_apos_corte  retirada a partir das 18h
 * @property {number} valor_total    em centavos
 * @property {RentalStatus} status
 * @property {string} criado_em
 */

/**
 * @typedef {Object} Review
 * @property {number} id
 * @property {number} rental_id
 * @property {number} autor_id
 * @property {number} avaliado_id
 * @property {number} nota  1 a 5
 * @property {string | null} comentario
 * @property {string} criado_em
 */

/**
 * @typedef {Object} Message
 * @property {number} id
 * @property {number} rental_id
 * @property {number} autor_id
 * @property {string} texto
 * @property {string} criado_em
 */

export {};
