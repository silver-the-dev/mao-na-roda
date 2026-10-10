import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  RentalCard,
  SegmentedControl,
} from '../../src/components';
import { acoesDisponiveis } from '../../src/domain/rentalStatus';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { listarAlugueis } from '../../src/repositories/rentals';
import { useUsuarioId } from '../../src/store/session';
import { spacing } from '../../src/theme';

/** @type {{ value: string, label: string, status?: import('../../src/types').RentalStatus[] }[]} */
const FILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pedidos', label: 'Pedidos', status: ['solicitado'] },
  { value: 'ativos', label: 'Em curso', status: ['aprovado', 'em_andamento', 'devolvido'] },
  { value: 'concluidos', label: 'Concluídos', status: ['concluido'] },
  { value: 'encerrados', label: 'Recusados e cancelados', status: ['recusado', 'cancelado'] },
];

/** O que o dono precisa fazer agora, para destacar o cartão. */
const PENDENCIAS = {
  aprovar: 'Responda este pedido',
  confirmarRetirada: 'Confirme quando entregar o item',
  confirmarDevolucao: 'Confirme quando receber o item de volta',
  finalizar: 'Confira o item e finalize o aluguel',
};

export default function AlugueisScreen() {
  const userId = useUsuarioId();
  const [papel, setPapel] = useState(/** @type {'locatario' | 'dono'} */ ('locatario'));
  const [filtro, setFiltro] = useState('todos');
  const status = FILTROS.find((f) => f.value === filtro)?.status;

  const { dados, carregando, atualizando, erro, recarregar } = useFocusQuery(
    useCallback(() => listarAlugueis(userId, papel, status), [userId, papel, status]),
  );

  const agora = new Date();

  /** @param {import('../../src/repositories/rentals').AluguelResumo} a */
  function pendencia(a) {
    const acao = acoesDisponiveis(a, userId, agora).find((x) => x !== 'cancelar' && x !== 'recusar');
    return acao ? PENDENCIAS[/** @type {keyof typeof PENDENCIAS} */ (acao)] : null;
  }

  const cabecalho = (
    <View style={styles.header}>
      <SegmentedControl
        options={[
          { value: 'locatario', label: 'Aluguei' },
          { value: 'dono', label: 'Emprestei' },
        ]}
        value={papel}
        onChange={setPapel}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTROS.map((f) => (
          <Chip key={f.value} label={f.label} selected={filtro === f.value} onPress={() => setFiltro(f.value)} />
        ))}
      </ScrollView>
    </View>
  );

  const vazio =
    papel === 'locatario'
      ? {
          title: filtro === 'todos' ? 'Você ainda não alugou nada' : 'Nenhum aluguel neste filtro',
          message: 'Procure um item na aba Início e faça seu primeiro pedido.',
        }
      : {
          title: filtro === 'todos' ? 'Ninguém alugou seus itens ainda' : 'Nenhum empréstimo neste filtro',
          message: 'Anuncie itens na aba Anunciar para receber pedidos.',
        };

  return (
    <FlatList
      data={dados ?? []}
      keyExtractor={(a) => String(a.id)}
      contentContainerStyle={styles.lista}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} />}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={
        carregando ? (
          <LoadingState />
        ) : erro ? (
          <ErrorState message={erro} onRetry={recarregar} />
        ) : (
          <EmptyState icon="swap-horizontal-outline" title={vazio.title} message={vazio.message} />
        )
      }
      renderItem={({ item }) => (
        <RentalCard
          aluguel={item}
          papel={papel}
          destaque={papel === 'dono' ? pendencia(item) : null}
          onPress={() => router.push(`/aluguel/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  chips: {
    gap: spacing.sm,
  },
});
