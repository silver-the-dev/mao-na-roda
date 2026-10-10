import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Button, ErrorState, LoadingState, Screen } from '../../src/components';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { listarUsuarios } from '../../src/repositories/users';
import { useSession } from '../../src/store/session';
import { colors, radius, spacing, typography } from '../../src/theme';

// Etapa 2: login provisório escolhendo uma conta do banco.
// O login com e-mail e senha entra na etapa 3.
export default function LoginScreen() {
  const signIn = useSession((s) => s.signIn);
  const { dados: usuarios, carregando, erro, recarregar } = useFocusQuery(listarUsuarios);

  return (
    <Screen scroll safeTop>
      <View style={styles.header}>
        <Text style={styles.logo}>Mão na Roda</Text>
        <Text style={styles.tagline}>Alugue o que você precisa, por um preço justo.</Text>
      </View>

      <Text style={styles.note}>
        Login provisório: toque em uma conta para entrar. O login com e-mail e senha vem na etapa 3.
      </Text>

      {carregando ? <LoadingState /> : null}
      {erro ? <ErrorState message={erro} onRetry={recarregar} /> : null}
      {usuarios?.map((u) => (
        <Pressable
          key={u.id}
          onPress={() => signIn(u.id)}
          accessibilityRole="button"
          accessibilityLabel={`Entrar como ${u.nome}`}
          style={({ pressed }) => [styles.conta, pressed && styles.pressed]}
        >
          <Avatar nome={u.nome} uri={u.foto_uri} size={48} />
          <View style={styles.contaTexto}>
            <Text style={typography.bodyStrong}>{u.nome}</Text>
            <Text style={typography.small}>{u.email}</Text>
          </View>
        </Pressable>
      ))}

      <Button title="Criar conta" variant="outline" onPress={() => router.push('/cadastro')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
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
  conta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  contaTexto: {
    flex: 1,
  },
  pressed: {
    borderColor: colors.primary,
  },
});
