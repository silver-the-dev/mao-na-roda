import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  EmptyState,
  ErrorState,
  ItemCard,
  LoadingState,
  Notice,
  ReviewCard,
  Screen,
} from '../../src/components';
import ProfileHeader from '../../src/components/ProfileHeader';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { buscarItens } from '../../src/repositories/items';
import { listarAvaliacoesRecebidas } from '../../src/repositories/reviews';
import { buscarPerfilPublico } from '../../src/repositories/users';
import { useUsuarioId } from '../../src/store/session';
import { spacing, typography } from '../../src/theme';

export default function PerfilPublicoScreen() {
  const { id } = useLocalSearchParams();
  const perfilId = Number(id);
  const userId = useUsuarioId();

  const { dados, carregando, erro, recarregar } = useFocusQuery(
    useCallback(async () => {
      const [perfil, itens, avaliacoes] = await Promise.all([
        buscarPerfilPublico(perfilId),
        buscarItens({ donoId: perfilId }),
        listarAvaliacoesRecebidas(perfilId),
      ]);
      return { perfil, itens, avaliacoes };
    }, [perfilId]),
  );

  if (carregando) return <LoadingState />;
  if (erro) return <ErrorState message={erro} onRetry={recarregar} />;
  if (!dados?.perfil) return <ErrorState message="Usuário não encontrado." />;
  const { perfil, itens, avaliacoes } = dados;
  const primeiroNome = perfil.nome.split(' ')[0];

  return (
    <>
      <Stack.Screen options={{ title: perfil.nome }} />
      <Screen scroll>
        {perfilId === userId ? <Notice tipo="info">É assim que as outras pessoas veem o seu perfil.</Notice> : null}
        <ProfileHeader perfil={perfil} />

        <View style={styles.secao}>
          <Text style={typography.subtitle}>Itens de {primeiroNome}</Text>
          {itens.length === 0 ? (
            <EmptyState icon="pricetags-outline" title="Nenhum item disponível" />
          ) : (
            itens.map((item) => (
              <ItemCard key={item.id} item={item} onPress={() => router.push(`/item/${item.id}`)} />
            ))
          )}
        </View>

        <View style={styles.secao}>
          <Text style={typography.subtitle}>Avaliações recebidas</Text>
          {avaliacoes.length === 0 ? (
            <EmptyState
              icon="star-outline"
              title="Ainda sem avaliações"
              message="As avaliações aparecem depois de aluguéis concluídos."
            />
          ) : (
            avaliacoes.map((r) => <ReviewCard key={r.id} avaliacao={r} />)
          )}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
