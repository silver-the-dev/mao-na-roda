import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { formatDate } from '../utils/format';
import Avatar from './Avatar';
import StarRating from './StarRating';

/**
 * Uma avaliação: autor, nota, comentário e item alugado.
 * @param {{ avaliacao: import('../repositories/reviews').AvaliacaoDetalhada, mostrarItem?: boolean }} props
 */
export default function ReviewCard({ avaliacao, mostrarItem = true }) {
  const papel = avaliacao.papel_avaliado === 'dono' ? 'como dono' : 'como locatário';
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <Avatar nome={avaliacao.autor_nome} uri={avaliacao.autor_foto_uri} size={40} />
        <View style={styles.autor}>
          <Text style={typography.bodyStrong}>{avaliacao.autor_nome}</Text>
          <Text style={typography.small}>{formatDate(avaliacao.criado_em)}</Text>
        </View>
        <StarRating value={avaliacao.nota} size={16} />
      </View>
      {avaliacao.comentario ? <Text style={typography.body}>“{avaliacao.comentario}”</Text> : null}
      {mostrarItem ? (
        <Text style={typography.small}>
          Aluguel: {avaliacao.item_titulo} · avaliado {papel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autor: {
    flex: 1,
  },
});
