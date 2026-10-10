import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoriaIcone } from '../constants';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { formatBRL, formatDate } from '../utils/format';
import StatusBadge from './StatusBadge';

/**
 * Cartão de aluguel para as listas "Aluguei" e "Emprestei".
 * @param {{
 *   aluguel: import('../repositories/rentals').AluguelResumo,
 *   papel: 'locatario' | 'dono',
 *   destaque?: string | null,
 *   onPress: () => void,
 * }} props
 */
export default function RentalCard({ aluguel, papel, destaque, onPress }) {
  const comQuem = papel === 'dono' ? `Para ${aluguel.outra_parte_nome}` : `De ${aluguel.outra_parte_nome}`;
  const periodo =
    aluguel.data_inicio === aluguel.data_fim
      ? formatDate(aluguel.data_inicio)
      : `${formatDate(aluguel.data_inicio)} a ${formatDate(aluguel.data_fim)}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${aluguel.item_titulo}, ${comQuem}, ${periodo}`}
      style={({ pressed }) => [styles.card, destaque && styles.cardDestaque, pressed && styles.pressed]}
    >
      <View style={styles.linha}>
        {aluguel.item_foto_uri ? (
          <Image source={{ uri: aluguel.item_foto_uri }} style={styles.foto} />
        ) : (
          <View style={[styles.foto, styles.fotoVazia]}>
            <Ionicons name={/** @type {'cube'} */ (categoriaIcone(aluguel.item_categoria))} size={28} color={colors.primary} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={typography.bodyStrong} numberOfLines={1}>
            {aluguel.item_titulo}
          </Text>
          <Text style={typography.small}>{comQuem}</Text>
          <Text style={typography.small}>{periodo}</Text>
          <View style={styles.rodape}>
            <Text style={styles.valor}>{formatBRL(aluguel.valor_total)}</Text>
            <StatusBadge status={aluguel.status} />
          </View>
        </View>
      </View>
      {destaque ? (
        <View style={styles.destaque}>
          <Ionicons name="hand-right-outline" size={18} color={colors.warning} />
          <Text style={styles.destaqueTexto}>{destaque}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  cardDestaque: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  linha: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  foto: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  fotoVazia: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  valor: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.warningSoft,
  },
  destaqueTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.warning,
  },
});
