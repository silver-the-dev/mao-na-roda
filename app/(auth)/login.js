import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '../../src/components';
import { useSession } from '../../src/store/session';
import { colors, spacing, typography } from '../../src/theme';

// Etapa 1: tela provisória. O login de verdade entra na etapa 3.
export default function LoginScreen() {
  const signIn = useSession((s) => s.signIn);

  return (
    <Screen scroll safeTop>
      <View style={styles.header}>
        <Text style={styles.logo}>Mão na Roda</Text>
        <Text style={styles.tagline}>Alugue o que você precisa, por um preço justo.</Text>
      </View>
      <Text style={styles.note}>Login e cadastro serão feitos na etapa 3.</Text>
      <Button title="Entrar (temporário)" icon="log-in-outline" onPress={() => signIn(1)} />
      <Button title="Criar conta" variant="outline" onPress={() => router.push('/cadastro')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
  },
  note: {
    ...typography.small,
  },
});
