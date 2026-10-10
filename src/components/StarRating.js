import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

/**
 * Estrelas de avaliação. Somente leitura por padrão; com `onChange`
 * vira um seletor de nota de 1 a 5.
 * @param {{
 *   value: number,
 *   size?: number,
 *   onChange?: (nota: number) => void,
 *   count?: number,
 *   showValue?: boolean,
 * }} props
 */
export default function StarRating({ value, size = 18, onChange, count, showValue = false }) {
  const estrelas = [1, 2, 3, 4, 5].map((n) => {
    /** @type {'star' | 'star-half' | 'star-outline'} */
    let icone = 'star-outline';
    if (value >= n) icone = 'star';
    else if (value >= n - 0.5) icone = 'star-half';
    const cor = icone === 'star-outline' ? colors.starEmpty : colors.star;

    if (onChange) {
      return (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Nota ${n} de 5`}
          accessibilityState={{ selected: value === n }}
        >
          <Ionicons name={icone} size={size} color={cor} />
        </Pressable>
      );
    }
    return <Ionicons key={n} name={icone} size={size} color={cor} />;
  });

  const descricao =
    count === 0 ? 'Sem avaliações' : `Nota ${value.toFixed(1).replace('.', ',')} de 5`;

  return (
    <View
      style={styles.row}
      accessible={!onChange}
      accessibilityLabel={onChange ? undefined : descricao}
    >
      <View style={[styles.stars, onChange && styles.starsInteractive]}>{estrelas}</View>
      {showValue && count !== 0 ? (
        <Text style={[styles.value, { fontSize: Math.max(14, size - 2) }]}>
          {value.toFixed(1).replace('.', ',')}
        </Text>
      ) : null}
      {count !== undefined ? (
        <Text style={[styles.count, { fontSize: Math.max(14, size - 3) }]}>
          {count === 0 ? 'Sem avaliações' : `(${count})`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  starsInteractive: {
    gap: spacing.md,
  },
  value: {
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    color: colors.textMuted,
  },
});
