import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, ErrorState, LoadingState, Screen, StarRating } from '../../src/components';
import { restaurarDadosDemo } from '../../src/db';
import { mensagemDeErro } from '../../src/domain/errors';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { buscarPerfilPublico } from '../../src/repositories/users';
import { useSession } from '../../src/store/session';
import { colors, radius, spacing, typography } from '../../src/theme';

// Etapa 2: resumo do perfil vindo do banco + configurações.
// Edição de perfil e lista de avaliações entram na etapa 7.
export default function PerfilScreen() {
  const userId = useSession((s) => s.userId);
  const signOut = useSession((s) => s.signOut);
  const [restaurando, setRestaurando] = useState(false);

  const { dados: perfil, carregando, erro, recarregar } = useFocusQuery(
    useCallback(() => buscarPerfilPublico(/** @type {number} */ (userId)), [userId]),
  );

  function confirmarRestauracao() {
    Alert.alert(
      'Restaurar dados de demonstração?',
      'Todos os dados do app serão apagados, inclusive contas, itens e fotos criados por você. Os dados iniciais serão recriados e você sairá da conta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', style: 'destructive', onPress: restaurar },
      ],
    );
  }

  async function restaurar() {
    setRestaurando(true);
    try {
      await restaurarDadosDemo();
      signOut();
    } catch (e) {
      setRestaurando(false);
      Alert.alert('Não foi possível restaurar', mensagemDeErro(e));
    }
  }

  if (carregando) return <LoadingState />;
  if (erro || !perfil) return <ErrorState message={erro ?? 'Perfil não encontrado.'} onRetry={recarregar} />;

  return (
    <Screen scroll>
      <View style={styles.cabecalho}>
        <Avatar nome={perfil.nome} uri={perfil.foto_uri} size={88} />
        <Text style={typography.title}>{perfil.nome}</Text>
        <Text style={typography.small}>
          {perfil.bairro}, {perfil.cidade}
        </Text>
        <StarRating value={perfil.nota_media} count={perfil.total_avaliacoes} showValue size={22} />
      </View>

      <View style={styles.numeros}>
        <Numero valor={perfil.alugueis_concluidos} rotulo="aluguéis concluídos" />
        <Numero valor={perfil.itens_anunciados} rotulo="itens anunciados" />
      </View>

      <Text style={styles.aviso}>Edição do perfil e avaliações recebidas: etapa 7.</Text>

      <View style={styles.secao}>
        <Text style={typography.subtitle}>Configurações</Text>
        <Button
          title="Restaurar dados de demonstração"
          icon="refresh"
          variant="secondary"
          loading={restaurando}
          onPress={confirmarRestauracao}
        />
        <Button title="Sair" icon="log-out-outline" variant="outline" onPress={signOut} disabled={restaurando} />
      </View>
    </Screen>
  );
}

/** @param {{ valor: number, rotulo: string }} props */
function Numero({ valor, rotulo }) {
  return (
    <View style={styles.numero}>
      <Text style={styles.numeroValor}>{valor}</Text>
      <Text style={styles.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  numeros: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  numero: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  numeroValor: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  numeroRotulo: {
    ...typography.small,
    textAlign: 'center',
  },
  aviso: {
    ...typography.small,
    textAlign: 'center',
  },
  secao: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
