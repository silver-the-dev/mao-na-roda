import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Screen } from '../../src/components';
import FormField from '../../src/components/FormField';
import Notice from '../../src/components/Notice';
import { mensagemDeErro } from '../../src/domain/errors';
import { cadastrarUsuario } from '../../src/repositories/users';
import { cadastroSchema } from '../../src/schemas/auth';
import { useSession } from '../../src/store/session';
import { typography } from '../../src/theme';

export default function CadastroScreen() {
  const signIn = useSession((s) => s.signIn);
  const [erro, setErro] = useState(/** @type {string | null} */ (null));

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { nome: '', email: '', senha: '', confirmarSenha: '', bairro: '', cidade: '' },
  });

  const cadastrar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      const usuario = await cadastrarUsuario(dados);
      await signIn(usuario.id);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  });

  return (
    <Screen scroll>
      <Text style={styles.intro}>Crie sua conta para alugar e anunciar itens.</Text>
      {erro ? <Notice tipo="erro">{erro}</Notice> : null}

      <FormField control={control} name="nome" label="Nome completo" autoComplete="name" autoCapitalize="words" />
      <FormField
        control={control}
        name="email"
        label="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
      />
      <FormField
        control={control}
        name="senha"
        label="Senha"
        hint="Pelo menos 6 caracteres."
        secureTextEntry
        autoComplete="new-password"
      />
      <FormField control={control} name="confirmarSenha" label="Repita a senha" secureTextEntry />
      <FormField control={control} name="bairro" label="Bairro" autoCapitalize="words" />
      <FormField control={control} name="cidade" label="Cidade" autoCapitalize="words" />

      <Button title="Criar conta" icon="person-add-outline" onPress={cadastrar} loading={isSubmitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.body,
  },
});
