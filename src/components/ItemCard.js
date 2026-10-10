import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { CATEGORIAS } from '../constants';
import { formatBRL } from '../utils/format';
import StarRating from './StarRating';
import StatusBadge from './StatusBadge';

/**
 * @typedef {Object} ItemCardData
 * @property {number} id
 * @property {string} titulo
 * @property {string} categoria
 * @property {number} valor_diaria  centavos
 * @property {string} bairro
 * @property {string} cidade
 * @property {string | null} [foto_uri]
 * @property {import('../types').ItemStatus} [status]
 * @property {number} [dono_nota]
 * @property {number} [dono_avaliacoes]
 */

/**
 * Cartão de item para listas. Em "Meus itens" mostra também o status.
 * @param {{ item: ItemCardData, onPress?: () => void, showStatus?: boolean }} props
 */
export default function ItemCard({ item, onPress, showStatus = false }) {
  const icone = CATEGORIAS.find((c) => c.value === item.categoria)?.icon ?? 'cube';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.titulo}, ${formatBRL(item.valor_diaria)} por dia, ${item.bairro}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {item.foto_uri ? (
        <Image source={{ uri: item.foto_uri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Ionicons name={/** @type {'cube'} */ (icone)} size={40} color={colors.primary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.titulo}
        </Text>
        <Text style={styles.price}>
          {formatBRL(item.valor_diaria)}
          <Text style={styles.perDay}> /dia</Text>
        </Text>
        <View style={styles.location}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.bairro}, {item.cidade}
          </Text>
        </View>
        {item.dono_nota !== undefined ? (
          <StarRating value={item.dono_nota} count={item.dono_avaliacoes} size={15} />
        ) : null}
        {showStatus && item.status ? <StatusBadge status={item.status} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  pressed: {
    opacity: 0.85,
  },
  photo: {
    width: 116,
    minHeight: 116,
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  info: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
  },
  price: {
    ...typography.price,
  },
  perDay: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textMuted,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...typography.small,
    flexShrink: 1,
  },
});
