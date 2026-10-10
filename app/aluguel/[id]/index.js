import { useCallback, useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  InfoRow,
  LoadingState,
  Notice,
  ReviewCard,
  Screen,
  StatusBadge,
  Timeline,
} from '../../../src/components';
import { HORA_CORTE_RETIRADA, categoriaIcone } from '../../../src/constants';
import { mensagemDeErro } from '../../../src/domain/errors';
import { contarDiarias } from '../../../src/domain/pricing';
import { TRANSICOES, acoesDisponiveis, etapasLinhaDoTempo, prazoCancelamento } from '../../../src/domain/rentalStatus';
import { useFocusQuery } from '../../../src/hooks/useFocusQuery';
import {
  aprovarAluguel,
  buscarAluguel,
  cancelarAluguel,
  confirmarDevolucao,
  confirmarRetirada,
  finalizarAluguel,
  recusarAluguel,
} from '../../../src/repositories/rentals';
import { listarAvaliacoesDoAluguel } from '../../../src/repositories/reviews';
import { useUsuarioId } from '../../../src/store/session';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { formatBRL, formatDate, formatDateTime } from '../../../src/utils/format';
import Mensagens from '../../../src/components/Mensagens';

/** @typedef {import('../../../src/domain/rentalStatus').AcaoAluguel} AcaoAluguel */

/** @type {Record<AcaoAluguel, { executar: (id: number, usuario: number) => Promise<unknown>, pergunta: string, explicacao: string }>} */
const ACOES = {
  aprovar: {
    executar: aprovarAluguel,
    pergunta: 'Aprovar este pedido?',
    explicacao: 'As datas ficam reservadas para esta pessoa. Pedidos de outras pessoas nas mesmas datas serão recusados.',
  },
  recusar: { executar: recusarAluguel, pergunta: 'Recusar este pedido?', explicacao: 'A pessoa será avisada na lista de aluguéis dela.' },
  confirmarRetirada: {
    executar: confirmarRetirada,
    pergunta: 'Confirmar a retirada?',
    explicacao: 'Confirme apenas depois de entregar o item para a pessoa.',
  },
  confirmarDevolucao: {
    executar: confirmarDevolucao,
    pergunta: 'Confirmar a devolução?',
    explicacao: 'Confirme apenas depois de receber o item de volta.',
  },
  finalizar: {
    executar: finalizarAluguel,
    pergunta: 'Finalizar o aluguel?',
    explicacao: 'Confira se o item voltou em bom estado. Depois de finalizar, vocês dois poderão se avaliar.',
  },
  cancelar: { executar: cancelarAluguel, pergunta: 'Cancelar este aluguel?', explicacao: 'Esta ação não pode ser desfeita.' },
};

/**
 * Explica o que acontece agora, do ponto de vista de quem está vendo.
 * @param {import('../../../src/repositories/rentals').AluguelDetalhado} a
 * @param {boolean} souDono
 */
function proximoPasso(a, souDono) {
  switch (a.status) {
    case 'solicitado':
      return souDono ? 'Você recebeu um pedido. Aprove ou recuse.' : 'Aguardando o dono responder ao seu pedido.';
    case 'aprovado':
      return souDono
        ? 'Combine a entrega. Quando entregar o item, toque em "Confirmar retirada".'
        : 'Pedido aprovado! Combine a retirada com o dono.';
    case 'em_andamento':
      return souDono
        ? 'O item está com a outra pessoa. Quando receber de volta, toque em "Confirmar devolução".'
        : `O item está com você. Devolva até ${formatDate(a.data_fim)}.`;
    case 'devolvido':
      return souDono
        ? 'Confira o item e toque em "Finalizar aluguel" para liberar as avaliações.'
        : 'Item devolvido. Aguardando o dono conferir e finalizar.';
    case 'concluido':
      return 'Aluguel concluído. As avaliações ajudam a comunidade a confiar em vocês.';
    case 'recusado':
      return 'O pedido foi recusado.';
    default:
      return 'O aluguel foi cancelado.';
  }
}

export default function AluguelDetalheScreen() {
  const { id } = useLocalSearchParams();
  const aluguelId = Number(id);
  const userId = useUsuarioId();
  const [executando, setExecutando] = useState(/** @type {AcaoAluguel | null} */ (null));

  const { dados, carregando, erro, recarregar } = useFocusQuery(
    useCallback(async () => {
      const [aluguel, avaliacoes] = await Promise.all([
        buscarAluguel(aluguelId, userId),
        listarAvaliacoesDoAluguel(aluguelId),
      ]);
      return { aluguel, avaliacoes };
    }, [aluguelId, userId]),
  );

  if (carregando) return <LoadingState />;
  if (erro) return <ErrorState message={erro} onRetry={recarregar} />;
  const a = dados?.aluguel;
  if (!dados || !a) return <ErrorState message="Aluguel não encontrado." />;

  const souDono = a.dono_id === userId;
  const outro = souDono ? a.locatario : a.dono;
  const agora = new Date();
  const acoes = acoesDisponiveis(a, userId, agora);
  const minhaAvaliacao = dados.avaliacoes.find((r) => r.autor_id === userId);

  /** @param {AcaoAluguel} acao */
  function confirmar(acao) {
    const cfg = ACOES[acao];
    Alert.alert(cfg.pergunta, cfg.explicacao, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: rotulo(acao),
        style: acao === 'recusar' || acao === 'cancelar' ? 'destructive' : 'default',
        onPress: () => executar(acao),
      },
    ]);
  }

  /** @param {AcaoAluguel} acao */
  async function executar(acao) {
    setExecutando(acao);
    try {
      const r = await ACOES[acao].executar(aluguelId, userId);
      const recusados = /** @type {{ recusadosAutomaticamente?: number } | undefined} */ (r)?.recusadosAutomaticamente;
      if (recusados) {
        Alert.alert(
          'Pedido aprovado',
          recusados === 1
            ? 'Outro pedido para as mesmas datas foi recusado automaticamente.'
            : `${recusados} pedidos para as mesmas datas foram recusados automaticamente.`,
        );
      }
    } catch (e) {
      Alert.alert('Não foi possível concluir', mensagemDeErro(e));
    } finally {
      setExecutando(null);
      recarregar();
    }
  }

  /** @param {AcaoAluguel} acao */
  function rotulo(acao) {
    if (acao === 'cancelar' && a?.status === 'aprovado') return 'Cancelar aluguel';
    return TRANSICOES[acao].rotulo;
  }

  const prazo = prazoCancelamento(a);
  const diarias = contarDiarias(a.data_inicio, a.data_fim, a.retirada_apos_corte);
  const telefone = outro.telefone;

  return (
    <Screen scroll>
      <Pressable
        onPress={() => a.item.status !== 'excluido' && router.push(`/item/${a.item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Ver item ${a.item.titulo}`}
        style={styles.item}
      >
        {a.item.foto_uri ? (
          <Image source={{ uri: a.item.foto_uri }} style={styles.itemFoto} />
        ) : (
          <View style={[styles.itemFoto, styles.itemFotoVazia]}>
            <Ionicons name={/** @type {'cube'} */ (categoriaIcone(a.item.categoria))} size={32} color={colors.primary} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={typography.subtitle} numberOfLines={2}>
            {a.item.titulo}
          </Text>
          <StatusBadge status={a.status} />
        </View>
      </Pressable>

      <Notice tipo={a.status === 'recusado' || a.status === 'cancelado' ? 'aviso' : 'info'}>
        {proximoPasso(a, souDono)}
      </Notice>

      {acoes.length > 0 ? (
        <View style={styles.acoes}>
          {acoes.map((acao) => (
            <Button
              key={acao}
              title={rotulo(acao)}
              variant={acao === 'recusar' || acao === 'cancelar' ? 'danger' : 'primary'}
              icon={acao === 'recusar' || acao === 'cancelar' ? 'close-circle-outline' : 'checkmark-circle-outline'}
              loading={executando === acao}
              disabled={executando !== null && executando !== acao}
              onPress={() => confirmar(acao)}
            />
          ))}
        </View>
      ) : null}

      {!souDono && a.status === 'aprovado' ? (
        <Text style={styles.prazo}>
          {agora <= prazo
            ? `Você pode cancelar até ${formatDateTime(prazo.toISOString())}.`
            : 'O prazo para cancelar terminou (até 24 horas antes da retirada).'}
        </Text>
      ) : null}

      <Card title={souDono ? 'Quem está alugando' : 'Dono do item'}>
        <Pressable
          onPress={() => router.push(`/usuario/${outro.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${outro.nome}`}
          style={styles.pessoa}
        >
          <Avatar nome={outro.nome} uri={outro.foto_uri} size={48} />
          <Text style={[typography.bodyStrong, styles.pessoaNome]}>{outro.nome}</Text>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </Pressable>
        {telefone ? (
          <Button
            compact
            variant="outline"
            icon="call-outline"
            title={`Ligar: ${telefone}`}
            onPress={() => Linking.openURL(`tel:${telefone.replace(/\D/g, '')}`)}
          />
        ) : null}
      </Card>

      <Card title="Detalhes">
        <InfoRow
          icon="log-out-outline"
          label="Retirada"
          value={`${formatDate(a.data_inicio)} ${a.retirada_apos_corte ? `após ${HORA_CORTE_RETIRADA}h` : `antes das ${HORA_CORTE_RETIRADA}h`}`}
        />
        <InfoRow icon="log-in-outline" label="Devolução" value={formatDate(a.data_fim)} />
        <InfoRow icon="calendar-number-outline" label="Diárias" value={String(diarias)} />
        <InfoRow icon="cash-outline" label="Valor combinado" value={formatBRL(a.valor_total)} destaque />
        {a.item.caucao ? (
          <InfoRow icon="shield-checkmark-outline" label="Caução" value={formatBRL(a.item.caucao)} />
        ) : null}
        <Text style={typography.small}>O pagamento é combinado entre vocês, fora do app.</Text>
      </Card>

      <Card title="Andamento">
        <Timeline etapas={etapasLinhaDoTempo(a)} />
      </Card>

      {a.status === 'concluido' ? (
        <Card title="Avaliações">
          {!minhaAvaliacao ? (
            <Button
              title={`Avaliar ${outro.nome.split(' ')[0]}`}
              icon="star-outline"
              onPress={() => router.push(`/aluguel/${a.id}/avaliar`)}
            />
          ) : null}
          {dados.avaliacoes.length === 0 ? (
            <Text style={typography.small}>Ninguém avaliou ainda.</Text>
          ) : (
            dados.avaliacoes.map((r) => <ReviewCard key={r.id} avaliacao={r} mostrarItem={false} />)
          )}
        </Card>
      ) : null}


      <Mensagens aluguelId={a.id} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  itemFoto: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  itemFotoVazia: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  itemInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  acoes: {
    gap: spacing.sm,
  },
  prazo: {
    ...typography.small,
    textAlign: 'center',
  },
  pessoa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pessoaNome: {
    flex: 1,
  },
});
