import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  Chip,
  DateRangePicker,
  ErrorState,
  InfoRow,
  LoadingState,
  Notice,
  Screen,
} from '../../../src/components';
import { HORA_CORTE_RETIRADA } from '../../../src/constants';
import { diasBloqueados } from '../../../src/domain/dateRanges';
import { mensagemDeErro } from '../../../src/domain/errors';
import { calcularValorTotal, contarDiarias } from '../../../src/domain/pricing';
import { useFocusQuery } from '../../../src/hooks/useFocusQuery';
import { buscarItem } from '../../../src/repositories/items';
import { listarDatasOcupadas, solicitarAluguel } from '../../../src/repositories/rentals';
import { useUsuarioId } from '../../../src/store/session';
import { spacing, typography } from '../../../src/theme';
import { formatBRL, formatDate, hojeISO } from '../../../src/utils/format';

export default function AlugarScreen() {
  const { id } = useLocalSearchParams();
  const itemId = Number(id);
  const userId = useUsuarioId();

  const [selecao, setSelecao] = useState(
    /** @type {import('../../../src/components/DateRangePicker').Selecao} */ ({ inicio: null, fim: null }),
  );
  const [aposCorte, setAposCorte] = useState(false);
  const [aviso, setAviso] = useState(/** @type {string | null} */ (null));
  const [enviando, setEnviando] = useState(false);

  const { dados, carregando, erro, recarregar } = useFocusQuery(
    useCallback(async () => {
      const [item, ocupadas] = await Promise.all([buscarItem(itemId), listarDatasOcupadas(itemId)]);
      return { item, ocupadas };
    }, [itemId]),
  );

  const bloqueados = useMemo(() => diasBloqueados(dados?.ocupadas ?? []), [dados]);

  if (carregando) return <LoadingState />;
  if (erro) return <ErrorState message={erro} onRetry={recarregar} />;
  const item = dados?.item;
  if (!item || item.status !== 'disponivel') {
    return <ErrorState message="Este item não está disponível para aluguel no momento." />;
  }
  if (item.dono_id === userId) return <ErrorState message="Você não pode alugar o seu próprio item." />;

  const completo = selecao.inicio !== null && selecao.fim !== null;
  const diarias = completo ? contarDiarias(/** @type {string} */ (selecao.inicio), /** @type {string} */ (selecao.fim), aposCorte) : 0;
  const total = completo
    ? calcularValorTotal(item.valor_diaria, /** @type {string} */ (selecao.inicio), /** @type {string} */ (selecao.fim), aposCorte)
    : 0;

  async function enviar() {
    if (!selecao.inicio || !selecao.fim) return;
    setEnviando(true);
    try {
      const aluguelId = await solicitarAluguel({
        itemId,
        locatarioId: userId,
        dataInicio: selecao.inicio,
        dataFim: selecao.fim,
        retiradaAposCorte: aposCorte,
      });
      Alert.alert('Pedido enviado!', 'Agora é só aguardar a resposta do dono. Acompanhe na aba Aluguéis.');
      router.replace(`/aluguel/${aluguelId}`);
    } catch (e) {
      setEnviando(false);
      Alert.alert('Não foi possível enviar o pedido', mensagemDeErro(e));
      recarregar();
    }
  }

  const instrucao = !selecao.inicio
    ? 'Toque no dia da retirada.'
    : !selecao.fim
      ? 'Agora toque no dia da devolução (ou no mesmo dia, para um dia só).'
      : 'Período escolhido. Toque em outro dia para recomeçar.';

  return (
    <Screen
      scroll
      footer={
        <Button
          title={completo ? `Enviar pedido · ${formatBRL(total)}` : 'Escolha as datas'}
          icon="paper-plane-outline"
          disabled={!completo}
          loading={enviando}
          onPress={enviar}
        />
      }
    >
      <View style={styles.cabecalho}>
        <Text style={typography.subtitle}>{item.titulo}</Text>
        <Text style={typography.body}>{formatBRL(item.valor_diaria)} por dia</Text>
      </View>

      <Text style={typography.bodyStrong}>{instrucao}</Text>
      {aviso ? <Notice tipo="aviso">{aviso}</Notice> : null}

      <DateRangePicker
        value={selecao}
        onChange={(s) => {
          setSelecao(s);
          if (s.fim) setAviso(null);
        }}
        bloqueados={bloqueados}
        minDate={hojeISO()}
        onAviso={setAviso}
      />

      <View style={styles.horario}>
        <Text style={typography.label}>Horário da retirada</Text>
        <View style={styles.chips}>
          <Chip
            label={`Antes das ${HORA_CORTE_RETIRADA}h`}
            icon="sunny-outline"
            selected={!aposCorte}
            onPress={() => setAposCorte(false)}
          />
          <Chip
            label={`A partir das ${HORA_CORTE_RETIRADA}h`}
            icon="moon-outline"
            selected={aposCorte}
            onPress={() => setAposCorte(true)}
          />
        </View>
        <Text style={typography.small}>
          Retirando a partir das {HORA_CORTE_RETIRADA}h, o dia da retirada não é cobrado.
        </Text>
      </View>

      {completo ? (
        <Card title="Resumo">
          <InfoRow
            icon="log-out-outline"
            label="Retirada"
            value={`${formatDate(/** @type {string} */ (selecao.inicio))} ${aposCorte ? `após ${HORA_CORTE_RETIRADA}h` : `antes das ${HORA_CORTE_RETIRADA}h`}`}
          />
          <InfoRow icon="log-in-outline" label="Devolução" value={formatDate(/** @type {string} */ (selecao.fim))} />
          <InfoRow
            icon="calendar-number-outline"
            label="Diárias"
            value={`${diarias} × ${formatBRL(item.valor_diaria)}`}
          />
          <InfoRow icon="cash-outline" label="Total" value={formatBRL(total)} destaque />
          {item.caucao ? (
            <InfoRow icon="shield-checkmark-outline" label="Caução (devolvida)" value={formatBRL(item.caucao)} />
          ) : null}
        </Card>
      ) : null}

      <Notice tipo="info">
        O dono precisa aprovar o pedido. O pagamento não é feito pelo app: o valor fica registrado e vocês combinam na
        retirada.
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    gap: spacing.xs,
  },
  horario: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
