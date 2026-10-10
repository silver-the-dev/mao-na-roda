import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CategoryGrid, EmptyState, ErrorState, ItemCard, LoadingState, SearchBar } from '../../src/components';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { buscarItens } from '../../src/repositories/items';
import { buscarUsuario } from '../../src/repositories/users';
import { useUsuarioId } from '../../src/store/session';
import { colors, spacing, typography } from '../../src/theme';

export default function InicioScreen() {
  const userId = useUsuarioId();
  const [texto, setTexto] = useState('');

  const { dados, carregando, atualizando, erro, recarregar } = useFocusQuery(
    useCallback(async () => {
      const [usuario, itens] = await Promise.all([
        buscarUsuario(userId),
        buscarItens({ excluirDonoId: userId, limite: 40 }),
      ]);
      // Itens da mesma cidade do usuário aparecem primeiro.
      const cidade = usuario?.cidade.toLowerCase();
      const ordenados = [...itens].sort(
        (a, b) => Number(b.cidade.toLowerCase() === cidade) - Number(a.cidade.toLowerCase() === cidade),
      );
      return { usuario, itens: ordenados };
    }, [userId]),
  );

  function buscar() {
    router.push({ pathname: '/busca', params: { texto: texto.trim() } });
  }

  if (carregando) return <LoadingState />;
  if (erro || !dados) return <ErrorState message={erro ?? undefined} onRetry={recarregar} />;

  const primeiroNome = dados.usuario?.nome.split(' ')[0] ?? '';

  return (
    <FlatList
      data={dados.itens}
      keyExtractor={(i) => String(i.id)}
      contentContainerStyle={styles.lista}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View>
            <Text style={typography.title}>Olá, {primeiroNome}!</Text>
            <Text style={styles.subtitulo}>Alugue por dia e economize: não precisa comprar.</Text>
          </View>
          <SearchBar value={texto} onChangeText={setTexto} onSubmit={buscar} />
          <Text style={typography.subtitle}>Categorias</Text>
          <CategoryGrid onSelect={(categoria) => router.push({ pathname: '/busca', params: { categoria } })} />
          <Text style={[typography.subtitle, styles.secao]}>Disponíveis para alugar</Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="search-outline"
          title="Nenhum item disponível agora"
          message="Volte mais tarde ou anuncie um item seu na aba Anunciar."
        />
      }
      renderItem={({ item }) => <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />}
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
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  subtitulo: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  secao: {
    marginTop: spacing.sm,
  },
});
