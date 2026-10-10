import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { mensagemDeErro } from '../domain/errors';
import { atualizarPerfilComFoto } from '../repositories/users';
import { perfilSchema } from '../schemas/perfil';
import { spacing } from '../theme';
import Avatar from './Avatar';
import Button from './Button';
import FormField from './FormField';
import Notice from './Notice';
import Screen from './Screen';

/**
 * Formulário "Editar perfil": foto, nome, telefone, bairro e cidade.
 * @param {{ usuario: import('../types').User }} props
 */
export default function ProfileForm({ usuario }) {
  const [foto, setFoto] = useState(usuario.foto_uri);
  const [erro, setErro] = useState(/** @type {string | null} */ (null));

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: usuario.nome,
      telefone: usuario.telefone ?? '',
      bairro: usuario.bairro,
      cidade: usuario.cidade,
    },
  });

  const nome = useWatch({ control, name: 'nome' });

  async function escolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher sua foto de perfil.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!r.canceled) setFoto(r.assets[0].uri);
  }

  const salvar = handleSubmit(async (form) => {
    setErro(null);
    try {
      await atualizarPerfilComFoto(usuario.id, { ...form, telefone: form.telefone || null }, foto);
      router.back();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  });

  return (
    <Screen scroll>
      {erro ? <Notice tipo="erro">{erro}</Notice> : null}

      <View style={styles.foto}>
        <Avatar nome={nome || usuario.nome} uri={foto} size={120} />
        <View style={styles.fotoBotoes}>
          <Button compact variant="outline" icon="image-outline" title="Trocar foto" onPress={escolherFoto} />
          {foto ? (
            <Button compact variant="ghost" icon="trash-outline" title="Remover" onPress={() => setFoto(null)} />
          ) : null}
        </View>
      </View>

      <FormField control={control} name="nome" label="Nome" autoCapitalize="words" />
      <FormField
        control={control}
        name="telefone"
        label="Telefone (opcional)"
        placeholder="(11) 98765-4321"
        hint="Aparece só para quem tiver um aluguel com você."
        keyboardType="phone-pad"
      />
      <FormField control={control} name="bairro" label="Bairro" autoCapitalize="words" />
      <FormField control={control} name="cidade" label="Cidade" autoCapitalize="words" />

      <Button title="Salvar" icon="checkmark" onPress={salvar} loading={isSubmitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  foto: {
    alignItems: 'center',
    gap: spacing.md,
  },
  fotoBotoes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
