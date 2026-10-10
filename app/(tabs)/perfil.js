import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InfoRow,
  LoadingState,
  ReviewCard,
  Screen,
} from '../../src/components';
import ProfileHeader from '../../src/components/ProfileHeader';
import { restaurarDadosDemo } from '../../src/db';
import { mensagemDeErro } from '../../src/domain/errors';
import { useFocusQuery } from '../../src/hooks/useFocusQuery';
import { listarAvaliacoesRecebidas } from '../../src/repositories/reviews';
import { buscarPerfilPublico } from '../../src/repositories/users';
import { useSession, useUsuarioId } from '../../src/store/session';
import { spacing, typography } from '../../src/theme';

export default function MeuPerfilScreen() {
  const userId = useUsuarioId();
  const signOut = useSession((s) => s.signOut);
  const [restaurando, setRestaurando] = useState(false);

  const { dados, carregando, erro, recarregar } = useFocusQuery(
    useCallback(async () => {
      const [perfil, avaliacoes] = await Promise.all([buscarPerfilPublico(userId), listarAvaliacoesRecebidas(userId)]);
      return { perfil, avaliacoes };
    }, [userId]),
  );

  function confirmarSaida() {
    Alert.alert('Sair da conta?', 'Você poderá entrar de novo com seu e-mail e senha.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  }

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
      await signOut();
    } catch (e) {
      setRestaurando(false);
      Alert.alert('Não foi possível restaurar', mensagemDeErro(e));
    }
  }

  if (carregando) return <LoadingState />;
  if (erro || !dados?.perfil) return <ErrorState message={erro ?? 'Perfil não encontrado.'} onRetry={recarregar} />;
  const { perfil, avaliacoes } = dados;

  return (
    <Screen scroll>
      <ProfileHeader perfil={perfil} />

      <Card title="Meus dados">
        <InfoRow icon="mail-outline" label="E-mail" value={perfil.email} />
        <InfoRow icon="call-outline" label="Telefone" value={perfil.telefone ?? 'Não informado'} />
        <InfoRow icon="location-outline" label="Local" value={`${perfil.bairro}, ${perfil.cidade}`} />
        <Button title="Editar perfil" icon="create-outline" variant="outline" onPress={() => router.push('/perfil/editar')} />
        <Button
          title="Ver meu perfil público"
          icon="eye-outline"
          variant="ghost"
          onPress={() => router.push(`/usuario/${userId}`)}
        />
      </Card>

      <View style={styles.secao}>
        <Text style={typography.subtitle}>Avaliações recebidas</Text>
        {avaliacoes.length === 0 ? (
          <EmptyState
            icon="star-outline"
            title="Você ainda não recebeu avaliações"
            message="Depois de cada aluguel concluído, a outra pessoa pode avaliar você."
          />
        ) : (
          avaliacoes.slice(0, 3).map((r) => <ReviewCard key={r.id} avaliacao={r} />)
        )}
        {avaliacoes.length > 3 ? (
          <Button
            compact
            variant="ghost"
            title={`Ver todas as ${avaliacoes.length} avaliações`}
            onPress={() => router.push(`/usuario/${userId}`)}
          />
        ) : null}
      </View>

      <Card title="Configurações">
        <Text style={typography.small}>
          Para a apresentação: apaga tudo o que foi criado e volta aos dados iniciais de demonstração.
        </Text>
        <Button
          title="Restaurar dados de demonstração"
          icon="refresh"
          variant="secondary"
          loading={restaurando}
          onPress={confirmarRestauracao}
        />
        <Button title="Sair da conta" icon="log-out-outline" variant="outline" onPress={confirmarSaida} disabled={restaurando} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: spacing.md,
  },
});
