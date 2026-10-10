import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import Button from './Button';

/**
 * Estado de carregamento.
 * @param {{ message?: string }} props
 */
export function LoadingState({ message = 'Carregando...' }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

/**
 * Lista vazia ou nada encontrado.
 * @param {{
 *   title: string,
 *   message?: string,
 *   icon?: React.ComponentProps<typeof Ionicons>['name'],
 *   actionLabel?: string,
 *   onAction?: () => void,
 * }} props
 */
export function EmptyState({ title, message, icon = 'file-tray-outline', actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="outline" style={styles.action} />
      ) : null}
    </View>
  );
}

/**
 * Erro ao carregar ou salvar dados, com opção de tentar de novo.
 * @param {{ message?: string, onRetry?: () => void }} props
 */
export function ErrorState({ message = 'Não foi possível carregar os dados.', onRetry }) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={56} color={colors.danger} />
      <Text style={styles.title}>Algo deu errado</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button title="Tentar de novo" icon="refresh" onPress={onRetry} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
});
