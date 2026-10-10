import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, ErrorState, ItemCard, LoadingState } from '../../src/components';
import { mensagemDeErro } from '../../src/domain/errors';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { alterarStatusItem, excluirItem, listarMeusItens } from '../../src/repositories/items';
import { useUsuarioId } from '../../src/store/session';
import { colors, radius, spacing } from '../../src/theme';

export default function MeusItensScreen() {
  const userId = useUsuarioId();
  const { dados: itens, carregando, atualizando, erro, recarregar } = useFocusQuery(
    useCallback(() => listarMeusItens(userId), [userId]),
  );
  const [ocupado, setOcupado] = useState(/** @type {number | null} */ (null));

  /**
   * @param {number} itemId
   * @param {() => Promise<unknown>} acao
   */
  async function executar(itemId, acao) {
    setOcupado(itemId);
    try {
      await acao();
      await recarregar();
    } catch (e) {
      Alert.alert('Não foi possível concluir', mensagemDeErro(e));
    } finally {
      setOcupado(null);
    }
  }

  /** @param {{ id: number, titulo: string }} item */
  function confirmarExclusao(item) {
    Alert.alert(
      'Excluir anúncio?',
      `"${item.titulo}" deixará de aparecer no app. Pedidos pendentes serão recusados. O histórico de aluguéis continua guardado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => executar(item.id, () => excluirItem(item.id, userId)) },
      ],
    );
  }

  const novo = (
    <Button title="Anunciar novo item" icon="add-circle-outline" onPress={() => router.push('/item/novo')} />
  );

  if (carregando) return <LoadingState />;
  if (erro) return <ErrorState message={erro} onRetry={recarregar} />;

  return (
    <FlatList
      data={itens ?? []}
      keyExtractor={(i) => String(i.id)}
      contentContainerStyle={styles.lista}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} />}
      ListHeaderComponent={novo}
      ListEmptyComponent={
        <EmptyState
          icon="pricetags-outline"
          title="Você ainda não anunciou nada"
          message="Anuncie ferramentas, eletrônicos ou outros itens que ficam parados em casa e ganhe uma renda extra."
        />
      }
      renderItem={({ item }) => (
        <View style={styles.bloco}>
          <ItemCard item={item} showStatus onPress={() => router.push(`/item/${item.id}`)} />
          {item.pedidos_pendentes > 0 ? (
            <Text style={styles.pendentes}>
              {item.pedidos_pendentes === 1
                ? '1 pedido aguardando sua resposta'
                : `${item.pedidos_pendentes} pedidos aguardando sua resposta`}
            </Text>
          ) : null}
          <View style={styles.acoes}>
            <Button
              compact
              variant="outline"
              icon="create-outline"
              title="Editar"
              style={styles.acao}
              disabled={ocupado === item.id}
              onPress={() => router.push(`/item/${item.id}/editar`)}
            />
            <Button
              compact
              variant="secondary"
              icon={item.status === 'pausado' ? 'play-outline' : 'pause-outline'}
              title={item.status === 'pausado' ? 'Reativar' : 'Pausar'}
              style={styles.acao}
              loading={ocupado === item.id}
              onPress={() =>
                executar(item.id, () =>
                  alterarStatusItem(item.id, userId, item.status === 'pausado' ? 'disponivel' : 'pausado'),
                )
              }
            />
            <Button
              compact
              variant="ghost"
              icon="trash-outline"
              title="Excluir"
              style={styles.acao}
              disabled={ocupado === item.id}
              onPress={() => confirmarExclusao(item)}
            />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  bloco: {
    gap: spacing.sm,
  },
  pendentes: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.warningSoft,
    color: colors.warning,
    fontWeight: '700',
    fontSize: 15,
  },
  acoes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acao: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
});
