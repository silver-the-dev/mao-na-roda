import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIAS } from '../constants';
import { colors, radius, spacing } from '../theme';

/**
 * Grade de categorias com ícones grandes.
 * @param {{ onSelect: (categoria: import('../types').Categoria) => void }} props
 */
export default function CategoryGrid({ onSelect }) {
  return (
    <View style={styles.grid}>
      {CATEGORIAS.map((c) => (
        <Pressable
          key={c.value}
          onPress={() => onSelect(c.value)}
          accessibilityRole="button"
          accessibilityLabel={`Categoria ${c.label}`}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <Ionicons name={/** @type {'cube'} */ (c.icon)} size={30} color={colors.primary} />
          <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
            {c.curto}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
