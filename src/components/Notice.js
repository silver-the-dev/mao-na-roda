import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

const TONS = {
  erro: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' },
  aviso: { bg: colors.warningSoft, fg: colors.warning, icon: 'warning' },
  info: { bg: colors.infoSoft, fg: colors.info, icon: 'information-circle' },
  sucesso: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' },
};

/**
 * Caixa de mensagem em destaque (erro de formulário, aviso, dica).
 * @param {{ tipo?: keyof typeof TONS, children: React.ReactNode }} props
 */
export default function Notice({ tipo = 'info', children }) {
  const t = TONS[tipo];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg, borderColor: t.fg }]}
      accessibilityRole={tipo === 'erro' ? 'alert' : undefined}
    >
      <Ionicons name={/** @type {'alert-circle'} */ (t.icon)} size={22} color={t.fg} />
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
