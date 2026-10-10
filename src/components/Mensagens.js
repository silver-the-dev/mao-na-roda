import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mensagemDeErro } from '../domain/errors';
import { useFocusQuery } from '../hooks/useFocusQuery';
import { enviarMensagem, listarMensagens } from '../repositories/messages';
import { useUsuarioId } from '../store/session';
import { colors, radius, spacing, typography } from '../theme';
import { formatDateTime } from '../utils/format';
import Card from './Card';
import { ErrorState, LoadingState } from './StateViews';

/**
 * Conversa entre dono e locatário, vinculada ao aluguel.
 * @param {{ aluguelId: number }} props
 */
export default function Mensagens({ aluguelId }) {
  const userId = useUsuarioId();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { dados, carregando, erro, recarregar } = useFocusQuery(
    useCallback(() => listarMensagens(aluguelId, userId), [aluguelId, userId]),
  );

  async function enviar() {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await enviarMensagem(aluguelId, userId, texto);
      setTexto('');
      await recarregar();
    } catch (e) {
      Alert.alert('Mensagem não enviada', mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card title="Mensagens">
      {carregando ? <LoadingState /> : null}
      {erro ? <ErrorState message={erro} onRetry={recarregar} /> : null}
      {dados?.length === 0 ? (
        <Text style={typography.small}>Nenhuma mensagem ainda. Use este espaço para combinar a retirada e a devolução.</Text>
      ) : null}

      <View style={styles.lista}>
        {dados?.map((m) => {
          const minha = m.autor_id === userId;
          return (
            <View
              key={m.id}
              style={[styles.balao, minha ? styles.minha : styles.dele]}
              accessible
              accessibilityLabel={`${minha ? 'Você' : m.autor_nome} disse: ${m.texto}`}
            >
              {!minha ? <Text style={styles.autor}>{m.autor_nome.split(' ')[0]}</Text> : null}
              <Text style={[styles.texto, minha && styles.textoMinha]}>{m.texto}</Text>
              <Text style={[styles.hora, minha && styles.horaMinha]}>{formatDateTime(m.criado_em)}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.entrada}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Escreva uma mensagem"
          placeholderTextColor={colors.placeholder}
          multiline
          maxLength={1000}
          accessibilityLabel="Escreva uma mensagem"
          style={styles.input}
        />
        <Pressable
          onPress={enviar}
          disabled={!texto.trim() || enviando}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          style={({ pressed }) => [styles.enviar, (!texto.trim() || enviando) && styles.desativado, pressed && styles.pressed]}
        >
          <Ionicons name="send" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: spacing.sm,
  },
  balao: {
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: 2,
  },
  minha: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  dele: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderBottomLeftRadius: 4,
  },
  autor: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  texto: {
    fontSize: 17,
    color: colors.text,
  },
  textoMinha: {
    color: colors.onPrimary,
  },
  hora: {
    fontSize: 13,
    color: colors.textMuted,
  },
  horaMinha: {
    color: '#D7EEE5',
  },
  entrada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 54,
    maxHeight: 140,
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 17,
    color: colors.text,
  },
  enviar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  desativado: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
