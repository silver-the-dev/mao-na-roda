import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, touch } from '../theme';

/**
 * Alternância entre duas ou mais opções (abas dentro da tela).
 * @template {string} V
 * @param {{ options: { value: V, label: string }[], value: V, onChange: (v: V) => void }} props
 */
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.box} accessibilityRole="tablist">
      {options.map((o) => {
        const ativo = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            style={[styles.opcao, ativo && styles.ativo]}
          >
            <Text style={[styles.texto, ativo && styles.textoAtivo]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  opcao: {
    flex: 1,
    minHeight: touch.minHeight - 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  ativo: {
    backgroundColor: colors.primary,
  },
  texto: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  textoAtivo: {
    color: colors.onPrimary,
  },
});
