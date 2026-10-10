import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

/**
 * Contêiner padrão de tela: fundo do tema, margens e rolagem opcional.
 * Telas com cabeçalho do Stack/Tabs não precisam da margem superior segura.
 * @param {{
 *   children: React.ReactNode,
 *   scroll?: boolean,
 *   padded?: boolean,
 *   safeTop?: boolean,
 *   footer?: React.ReactNode,
 *   refreshControl?: React.ReactElement<import('react-native').RefreshControlProps>,
 * }} props
 */
export default function Screen({ children, scroll = false, padded = true, safeTop = false, footer, refreshControl }) {
  const conteudo = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, padded && styles.padded]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded]}>{children}</View>
  );

  return (
    <SafeAreaView
      style={styles.safe}
      edges={[...(safeTop ? /** @type {const} */ (['top']) : []), 'left', 'right', ...(footer ? /** @type {const} */ (['bottom']) : [])]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {conteudo}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  padded: {
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
