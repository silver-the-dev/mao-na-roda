import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { formatDateTime } from '../utils/format';

/**
 * Linha do tempo vertical das etapas do aluguel.
 * @param {{ etapas: import('../domain/rentalStatus').EtapaLinhaDoTempo[] }} props
 */
export default function Timeline({ etapas }) {
  return (
    <View>
      {etapas.map((e, i) => {
        const ultima = i === etapas.length - 1;
        const cor = e.estado === 'feito' ? colors.success : e.estado === 'negativo' ? colors.danger : colors.border;
        const icone = e.estado === 'feito' ? 'checkmark' : e.estado === 'negativo' ? 'close' : null;
        return (
          <View
            key={e.rotulo}
            style={styles.etapa}
            accessible
            accessibilityLabel={`${e.rotulo}: ${e.quando ? formatDateTime(e.quando) : 'ainda não aconteceu'}`}
          >
            <View style={styles.trilho}>
              <View
                style={[
                  styles.bolinha,
                  { borderColor: cor, backgroundColor: e.estado === 'pendente' ? colors.surface : cor },
                ]}
              >
                {icone ? <Ionicons name={icone} size={16} color={colors.onPrimary} /> : null}
              </View>
              {!ultima ? (
                <View style={[styles.linha, { backgroundColor: etapas[i + 1].estado === 'pendente' ? colors.border : cor }]} />
              ) : null}
            </View>
            <View style={[styles.texto, !ultima && styles.textoEspaco]}>
              <Text style={[typography.bodyStrong, e.estado === 'pendente' && styles.pendente]}>{e.rotulo}</Text>
              <Text style={typography.small}>{e.quando ? formatDateTime(e.quando) : 'Aguardando'}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  etapa: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  trilho: {
    alignItems: 'center',
    width: 28,
  },
  bolinha: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linha: {
    flex: 1,
    width: 3,
    minHeight: 18,
  },
  texto: {
    flex: 1,
    paddingTop: 2,
  },
  textoEspaco: {
    paddingBottom: spacing.lg,
  },
  pendente: {
    color: colors.textMuted,
  },
});
