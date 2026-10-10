/**
 * Erro de regra de negócio. A mensagem é escrita para o usuário final
 * e pode ser exibida diretamente na tela.
 */
export class RegraDeNegocioError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'RegraDeNegocioError';
  }
}

/**
 * Mensagem amigável para qualquer erro capturado nas telas.
 * @param {unknown} erro
 */
export function mensagemDeErro(erro) {
  if (erro instanceof RegraDeNegocioError) return erro.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
