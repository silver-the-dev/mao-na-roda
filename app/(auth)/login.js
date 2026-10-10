import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Chip, Screen } from '../../src/components';
import FormField from '../../src/components/FormField';
import Notice from '../../src/components/Notice';
import { SENHA_DEMO, USUARIOS_DEMO } from '../../src/db/seed';
import { mensagemDeErro } from '../../src/domain/errors';
import { autenticar } from '../../src/repositories/users';
import { loginSchema } from '../../src/schemas/auth';
import { useSession } from '../../src/store/session';
import { colors, radius, spacing, typography } from '../../src/theme';

export default function LoginScreen() {
  const signIn = useSession((s) => s.signIn);
  const [erro, setErro] = useState(/** @type {string | null} */ (null));

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  const entrar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      const usuario = await autenticar(dados.email, dados.senha);
      await signIn(usuario.id);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  });

  /** @param {string} email */
  function preencherDemo(email) {
    setValue('email', email, { shouldValidate: true });
    setValue('senha', SENHA_DEMO, { shouldValidate: true });
    setErro(null);
  }

  return (
    <Screen scroll safeTop>
      <View style={styles.header}>
        <Text style={styles.logo}>Mão na Roda</Text>
        <Text style={styles.tagline}>Alugue o que você precisa, por um preço justo.</Text>
      </View>

      {erro ? <Notice tipo="erro">{erro}</Notice> : null}

      <FormField
        control={control}
        name="email"
        label="E-mail"
        placeholder="seuemail@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        returnKeyType="next"
      />
      <FormField
        control={control}
        name="senha"
        label="Senha"
        placeholder="Sua senha"
        secureTextEntry
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={entrar}
      />

      <Button title="Entrar" icon="log-in-outline" onPress={entrar} loading={isSubmitting} />
      <Button title="Criar conta" variant="outline" onPress={() => router.push('/cadastro')} />

      <View style={styles.demo}>
        <Text style={typography.label}>Contas de demonstração</Text>
        <Text style={typography.small}>Toque em um nome para preencher. Senha de todas: {SENHA_DEMO}</Text>
        <View style={styles.demoChips}>
          {USUARIOS_DEMO.map((u) => (
            <Chip key={u.email} label={u.nome.split(' ')[0]} icon="person" onPress={() => preencherDemo(u.email)} />
          ))}
        </View>
      </View>
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
  demo: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.md,
  },
  demoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
