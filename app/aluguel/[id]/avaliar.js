import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Avatar,
  Button,
  ErrorState,
  FormField,
  LoadingState,
  Notice,
  Screen,
  StarRating,
} from '../../../src/components';
import { mensagemDeErro } from '../../../src/domain/errors';
import { useFocusQuery } from '../../../src/hooks/useFocusQuery';
import { buscarAluguel } from '../../../src/repositories/rentals';
import { avaliar, listarAvaliacoesDoAluguel } from '../../../src/repositories/reviews';
import { avaliacaoSchema } from '../../../src/schemas/perfil';
import { useUsuarioId } from '../../../src/store/session';
import { colors, spacing, typography } from '../../../src/theme';

const DESCRICOES = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

export default function AvaliarScreen() {
  const { id } = useLocalSearchParams();
  const aluguelId = Number(id);
  const userId = useUsuarioId();
  const [erro, setErro] = useState(/** @type {string | null} */ (null));

  const { dados, carregando, erro: erroCarga, recarregar } = useFocusQuery(
    useCallback(async () => {
      const [aluguel, avaliacoes] = await Promise.all([
        buscarAluguel(aluguelId, userId),
        listarAvaliacoesDoAluguel(aluguelId),
      ]);
      return { aluguel, jaAvaliei: avaliacoes.some((r) => r.autor_id === userId) };
    }, [aluguelId, userId]),
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: { nota: 0, comentario: '' },
  });

  const enviar = handleSubmit(async (form) => {
    setErro(null);
    try {
      await avaliar({ aluguelId, autorId: userId, nota: form.nota, comentario: form.comentario });
      Alert.alert('Obrigado!', 'Sua avaliação foi registrada.');
      router.back();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  });

  if (carregando) return <LoadingState />;
  if (erroCarga) return <ErrorState message={erroCarga} onRetry={recarregar} />;
  const a = dados?.aluguel;
  if (!a) return <ErrorState message="Aluguel não encontrado." />;
  if (a.status !== 'concluido') return <ErrorState message="A avaliação fica disponível quando o aluguel for concluído." />;
  if (dados.jaAvaliei) return <ErrorState message="Você já avaliou este aluguel. Avaliações não podem ser editadas." />;

  const outro = a.dono_id === userId ? a.locatario : a.dono;

  return (
    <Screen scroll>
      <View style={styles.cabecalho}>
        <Avatar nome={outro.nome} uri={outro.foto_uri} size={80} />
        <Text style={[typography.title, styles.centro]}>Como foi alugar com {outro.nome.split(' ')[0]}?</Text>
        <Text style={[typography.small, styles.centro]}>Aluguel: {a.item.titulo}</Text>
      </View>

      {erro ? <Notice tipo="erro">{erro}</Notice> : null}

      <Controller
        control={control}
        name="nota"
        render={({ field: { value, onChange }, fieldState }) => (
          <View style={styles.estrelas}>
            <StarRating value={value} onChange={onChange} size={46} />
            <Text style={styles.descricao}>{DESCRICOES[value] || 'Toque nas estrelas'}</Text>
            {fieldState.error ? <Text style={styles.erro}>{fieldState.error.message}</Text> : null}
          </View>
        )}
      />

      <FormField
        control={control}
        name="comentario"
        label="Comentário (opcional)"
        placeholder="Conte como foi: pontualidade, cuidado com o item, atendimento..."
        multiline
        maxLength={500}
      />

      <Notice tipo="info">A avaliação aparece no perfil público e não pode ser editada depois.</Notice>
      <Button title="Enviar avaliação" icon="star" onPress={enviar} loading={isSubmitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  centro: {
    textAlign: 'center',
  },
  estrelas: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  descricao: {
    ...typography.subtitle,
    color: colors.primaryDark,
  },
  erro: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
});
