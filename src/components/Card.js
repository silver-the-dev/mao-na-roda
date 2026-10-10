import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Bloco com fundo branco e título opcional, para agrupar informações.
 * @param {{ title?: string, children: React.ReactNode, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props
 */
export default function Card({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={typography.subtitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
