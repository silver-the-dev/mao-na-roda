import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { ITEM_STATUS_LABELS, RENTAL_STATUS_LABELS } from '../constants';

/** Cores de cada status (fundo claro + texto escuro, contraste alto). */
const TONS = {
  solicitado: { bg: colors.warningSoft, fg: colors.warning },
  aprovado: { bg: colors.infoSoft, fg: colors.info },
  em_andamento: { bg: colors.primarySoft, fg: colors.primaryDark },
  devolvido: { bg: colors.infoSoft, fg: colors.info },
  concluido: { bg: colors.successSoft, fg: colors.success },
  recusado: { bg: colors.dangerSoft, fg: colors.danger },
  cancelado: { bg: colors.neutralSoft, fg: colors.neutral },
  disponivel: { bg: colors.successSoft, fg: colors.success },
  pausado: { bg: colors.neutralSoft, fg: colors.neutral },
  excluido: { bg: colors.dangerSoft, fg: colors.danger },
};

/**
 * Etiqueta colorida para status de aluguel ou de item.
 * @param {{ status: keyof typeof TONS }} props
 */
export default function StatusBadge({ status }) {
  const tom = TONS[status] ?? { bg: colors.neutralSoft, fg: colors.neutral };
  /** @type {Record<string, string>} */
  const rotulos = { ...ITEM_STATUS_LABELS, ...RENTAL_STATUS_LABELS };
  const rotulo = rotulos[status] ?? status;

  return (
    <View
      style={[styles.badge, { backgroundColor: tom.bg, borderColor: tom.fg }]}
      accessibilityLabel={`Status: ${rotulo}`}
    >
      <Text style={[styles.text, { color: tom.fg }]}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
});
