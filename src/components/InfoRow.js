import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

/**
 * Linha "ícone · rótulo · valor" para telas de detalhe.
 * @param {{ icon: React.ComponentProps<typeof Ionicons>['name'], label: string, value: string, destaque?: boolean }} props
 */
export default function InfoRow({ icon, label, value, destaque = false }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, destaque && styles.destaque]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
  value: {
    ...typography.bodyStrong,
    flexShrink: 1,
    textAlign: 'right',
  },
  destaque: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});
