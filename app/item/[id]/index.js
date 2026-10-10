import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  InfoRow,
  LoadingState,
  Notice,
  PhotoCarousel,
  Screen,
  StarRating,
  StatusBadge,
} from '../../../src/components';
import { categoriaIcone, categoriaLabel, conservacaoLabel } from '../../../src/constants';
import { useFocusQuery } from '../../../src/hooks/useFocusQuery';
import { buscarItem } from '../../../src/repositories/items';
import { listarDatasOcupadas } from '../../../src/repositories/rentals';
import { useUsuarioId } from '../../../src/store/session';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { formatBRL, formatDate } from '../../../src/utils/format';

export default function ItemDetalheScreen() {
  const { id } = useLocalSearchParams();
  const itemId = Number(id);
  const userId = useUsuarioId();

  const { dados, carregando, erro, recarregar } = useFocusQuery(
    useCallback(async () => {
      const [item, ocupadas] = await Promise.all([buscarItem(itemId), listarDatasOcupadas(itemId)]);
      return { item, ocupadas };
    }, [itemId]),
  );

  if (carregando) return <LoadingState />;
  if (erro) return <ErrorState message={erro} onRetry={recarregar} />;
  const item = dados?.item;
  if (!item || item.status === 'excluido') {
    return <ErrorState message="Este item não existe mais ou foi removido pelo dono." />;
  }

  const meu = item.dono_id === userId;
  const icone = categoriaIcone(item.categoria);

  let rodape;
  if (meu) {
    rodape = (
      <Button
        title="Editar meu anúncio"
        icon="create-outline"
        variant="outline"
        onPress={() => router.push(`/item/${item.id}/editar`)}
      />
    );
  } else if (item.status === 'disponivel') {
    rodape = (
      <View style={styles.rodape}>
        <View>
          <Text style={styles.rodapePreco}>{formatBRL(item.valor_diaria)}</Text>
          <Text style={typography.small}>por dia</Text>
        </View>
        <Button
          title="Quero alugar"
          icon="calendar-outline"
          style={styles.rodapeBotao}
          onPress={() => router.push(`/item/${item.id}/alugar`)}
        />
      </View>
    );
  } else {
    rodape = <Notice tipo="aviso">O dono pausou este anúncio. Ele não aceita pedidos no momento.</Notice>;
  }

  return (
    <>
      <Stack.Screen options={{ title: item.titulo }} />
      <Screen scroll padded={false} footer={rodape}>
        <PhotoCarousel uris={item.fotos.map((f) => f.uri)} icone={icone} />

        <View style={styles.conteudo}>
          <View style={styles.titulo}>
            <Text style={typography.title}>{item.titulo}</Text>
            {item.status !== 'disponivel' ? <StatusBadge status={item.status} /> : null}
            {meu ? <Notice tipo="info">Este anúncio é seu.</Notice> : null}
          </View>

          <Card>
            <InfoRow icon="cash-outline" label="Diária" value={formatBRL(item.valor_diaria)} destaque />
            <InfoRow
              icon="shield-checkmark-outline"
              label="Caução"
              value={item.caucao ? formatBRL(item.caucao) : 'Não cobra'}
            />
            <InfoRow icon="pricetag-outline" label="Categoria" value={categoriaLabel(item.categoria)} />
            <InfoRow icon="sparkles-outline" label="Conservação" value={conservacaoLabel(item.conservacao)} />
            <InfoRow icon="location-outline" label="Local" value={`${item.bairro}, ${item.cidade}`} />
          </Card>

          <Card title="Descrição">
            <Text style={styles.descricao}>{item.descricao}</Text>
          </Card>

          <Pressable
            onPress={() => router.push(`/usuario/${item.dono.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${item.dono.nome}`}
            style={({ pressed }) => [styles.dono, pressed && styles.pressed]}
          >
            <Avatar nome={item.dono.nome} uri={item.dono.foto_uri} size={56} />
            <View style={styles.donoInfo}>
              <Text style={typography.small}>Anunciado por</Text>
              <Text style={typography.bodyStrong}>{item.dono.nome}</Text>
              <StarRating value={item.dono.nota_media} count={item.dono.total_avaliacoes} showValue size={16} />
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </Pressable>

          {dados.ocupadas.length > 0 ? (
            <Card title="Datas já reservadas">
              {dados.ocupadas.map((r) => (
                <Text key={r.id} style={typography.body}>
                  • {formatDate(r.inicio)} a {formatDate(r.fim)}
                </Text>
              ))}
            </Card>
          ) : null}

          <Text style={styles.nota}>
            O pagamento não é feito pelo app. O valor fica registrado e é combinado entre vocês na retirada.
          </Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  titulo: {
    gap: spacing.sm,
  },
  descricao: {
    ...typography.body,
    lineHeight: 25,
  },
  dono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  donoInfo: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    borderColor: colors.primary,
  },
  nota: {
    ...typography.small,
    textAlign: 'center',
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  rodapePreco: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  rodapeBotao: {
    flex: 1,
  },
});
