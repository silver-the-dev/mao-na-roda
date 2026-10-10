import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { mensagemDeErro } from '../domain/errors';

/**
 * Carrega dados sempre que a tela ganha foco, para refletir mudanças feitas
 * em outras telas. Também expõe `recarregar` (ex.: puxar para atualizar).
 *
 * Passe uma função memorizada com useCallback; quando ela muda (por exemplo,
 * porque um filtro mudou), os dados são carregados de novo.
 *
 * @example
 * const carregar = useCallback(() => buscarItens({ texto }), [texto]);
 * const { dados, carregando, erro, recarregar } = useFocusQuery(carregar);
 *
 * @template T
 * @param {() => Promise<T>} carregar
 * @returns {{ dados: T | null, carregando: boolean, atualizando: boolean, erro: string | null, recarregar: () => Promise<void> }}
 */
export function useFocusQuery(carregar) {
  const [estado, setEstado] = useState(
    /** @type {{ dados: T | null, erro: string | null, carregando: boolean, atualizando: boolean }} */ ({
      dados: null,
      erro: null,
      carregando: true,
      atualizando: false,
    }),
  );
  // Cada carga recebe um número; respostas de cargas antigas são ignoradas.
  const geracao = useRef(0);

  const executar = useCallback(async () => {
    const minha = ++geracao.current;
    try {
      const dados = await carregar();
      if (minha === geracao.current) setEstado({ dados, erro: null, carregando: false, atualizando: false });
    } catch (e) {
      console.warn(e);
      if (minha === geracao.current) {
        setEstado((s) => ({ ...s, erro: mensagemDeErro(e), carregando: false, atualizando: false }));
      }
    }
  }, [carregar]);

  useFocusEffect(
    useCallback(() => {
      executar();
      return () => {
        geracao.current++;
      };
    }, [executar]),
  );

  const recarregar = useCallback(async () => {
    setEstado((s) => ({ ...s, atualizando: true }));
    await executar();
  }, [executar]);

  return {
    dados: estado.dados,
    carregando: estado.carregando && estado.dados === null,
    atualizando: estado.atualizando,
    erro: estado.erro,
    recarregar,
  };
}
